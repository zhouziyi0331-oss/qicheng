-- ============================================
-- 任务草稿箱和追加需求系统
-- ============================================

-- 1. 任务草稿表
CREATE TABLE IF NOT EXISTS task_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 任务基本信息
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  deliverables TEXT,

  -- 任务分类
  category VARCHAR(100),
  tags TEXT[],

  -- 价格和时间
  budget_min DECIMAL(10, 2),
  budget_max DECIMAL(10, 2),
  deadline DATE,
  estimated_hours INTEGER,

  -- 能力要求
  required_abilities JSONB DEFAULT '[]',
  difficulty_level VARCHAR(50), -- beginner, intermediate, advanced, expert

  -- 附件
  attachments JSONB DEFAULT '[]',

  -- 草稿状态
  draft_status VARCHAR(50) DEFAULT 'editing', -- editing, ready_to_publish, archived
  completion_percentage INTEGER DEFAULT 0, -- 0-100，草稿完成度

  -- AI辅助信息
  ai_suggestions JSONB, -- AI给出的改进建议
  ai_pricing_suggestion JSONB, -- AI定价建议
  last_ai_review_at TIMESTAMP,

  -- 版本控制
  version INTEGER DEFAULT 1,
  parent_draft_id UUID REFERENCES task_drafts(id), -- 如果是从其他草稿复制的

  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP, -- 发布为正式任务的时间
  published_task_id UUID REFERENCES tasks(id) -- 发布后的任务ID
);

CREATE INDEX idx_task_drafts_company ON task_drafts(company_id);
CREATE INDEX idx_task_drafts_status ON task_drafts(draft_status);
CREATE INDEX idx_task_drafts_created ON task_drafts(created_at DESC);

-- 2. 任务追加需求表
CREATE TABLE IF NOT EXISTS task_amendments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES users(id),
  student_id UUID NOT NULL REFERENCES users(id),

  -- 追加内容
  amendment_type VARCHAR(50) NOT NULL, -- requirement_change, scope_expansion, deadline_extension, other
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  original_requirement TEXT, -- 原需求（如果是修改）
  new_requirement TEXT, -- 新需求

  -- 价格调整
  price_adjustment DECIMAL(10, 2) DEFAULT 0, -- 正数表示增加，负数表示减少
  adjustment_reason TEXT,

  -- 时间调整
  deadline_extension_days INTEGER DEFAULT 0,
  new_deadline DATE,

  -- 状态流转
  status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, rejected, negotiating, completed

  -- 学生响应
  student_response TEXT,
  student_counter_offer DECIMAL(10, 2), -- 学生的还价
  student_responded_at TIMESTAMP,

  -- 企业确认
  company_final_decision VARCHAR(50), -- accept_student_offer, insist_original, cancel
  company_final_comment TEXT,

  -- 协商历史
  negotiation_history JSONB DEFAULT '[]', -- [{actor, message, offer, timestamp}]

  -- AI辅助
  ai_fairness_score INTEGER, -- 0-100，AI评估追加需求的合理性
  ai_suggested_price DECIMAL(10, 2),
  ai_analysis TEXT,

  -- 完成情况
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,

  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_amendments_task ON task_amendments(task_id);
CREATE INDEX idx_amendments_company ON task_amendments(company_id);
CREATE INDEX idx_amendments_student ON task_amendments(student_id);
CREATE INDEX idx_amendments_status ON task_amendments(status);

-- 3. 草稿自动保存历史表（用于版本恢复）
CREATE TABLE IF NOT EXISTS task_draft_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID NOT NULL REFERENCES task_drafts(id) ON DELETE CASCADE,

  -- 快照内容
  snapshot JSONB NOT NULL, -- 完整的草稿内容快照

  -- 变更信息
  change_summary TEXT,
  changed_fields TEXT[],

  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_draft_history_draft ON task_draft_history(draft_id);
CREATE INDEX idx_draft_history_created ON task_draft_history(created_at DESC);

-- 4. 追加需求通知表（扩展现有notifications）
-- 为notifications表添加amendment相关字段
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS amendment_id UUID REFERENCES task_amendments(id);

-- 5. 任务表扩展（支持追加需求）
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS has_amendments BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS total_amendments INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS amendment_price_adjustment DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS original_deadline DATE;

-- 6. 创建函数：计算草稿完成度
CREATE OR REPLACE FUNCTION calculate_draft_completion(draft_id UUID)
RETURNS INTEGER AS $$
DECLARE
  completion INTEGER := 0;
  draft RECORD;
BEGIN
  SELECT * INTO draft FROM task_drafts WHERE id = draft_id;

  IF draft IS NULL THEN
    RETURN 0;
  END IF;

  -- 必填字段检查（每项10分）
  IF draft.title IS NOT NULL AND LENGTH(draft.title) > 0 THEN
    completion := completion + 10;
  END IF;

  IF draft.description IS NOT NULL AND LENGTH(draft.description) >= 50 THEN
    completion := completion + 15;
  END IF;

  IF draft.requirements IS NOT NULL AND LENGTH(draft.requirements) >= 30 THEN
    completion := completion + 15;
  END IF;

  IF draft.deliverables IS NOT NULL AND LENGTH(draft.deliverables) >= 20 THEN
    completion := completion + 15;
  END IF;

  IF draft.budget_min IS NOT NULL AND draft.budget_max IS NOT NULL THEN
    completion := completion + 10;
  END IF;

  IF draft.deadline IS NOT NULL THEN
    completion := completion + 10;
  END IF;

  IF draft.category IS NOT NULL THEN
    completion := completion + 5;
  END IF;

  IF draft.difficulty_level IS NOT NULL THEN
    completion := completion + 5;
  END IF;

  IF draft.required_abilities IS NOT NULL AND jsonb_array_length(draft.required_abilities) > 0 THEN
    completion := completion + 10;
  END IF;

  IF draft.tags IS NOT NULL AND array_length(draft.tags, 1) > 0 THEN
    completion := completion + 5;
  END IF;

  RETURN completion;
END;
$$ LANGUAGE plpgsql;

-- 7. 创建触发器：自动更新草稿完成度
CREATE OR REPLACE FUNCTION update_draft_completion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.completion_percentage := calculate_draft_completion(NEW.id);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_draft_completion
BEFORE UPDATE ON task_drafts
FOR EACH ROW
EXECUTE FUNCTION update_draft_completion();

-- 8. 创建触发器：草稿更新时自动保存历史
CREATE OR REPLACE FUNCTION save_draft_history()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- 检测哪些字段发生了变化
  IF OLD.title IS DISTINCT FROM NEW.title THEN
    changed_fields := array_append(changed_fields, 'title');
  END IF;

  IF OLD.description IS DISTINCT FROM NEW.description THEN
    changed_fields := array_append(changed_fields, 'description');
  END IF;

  IF OLD.requirements IS DISTINCT FROM NEW.requirements THEN
    changed_fields := array_append(changed_fields, 'requirements');
  END IF;

  IF OLD.budget_min IS DISTINCT FROM NEW.budget_min OR OLD.budget_max IS DISTINCT FROM NEW.budget_max THEN
    changed_fields := array_append(changed_fields, 'budget');
  END IF;

  -- 只有当有实质性变化时才保存历史
  IF array_length(changed_fields, 1) > 0 THEN
    INSERT INTO task_draft_history (draft_id, snapshot, changed_fields)
    VALUES (
      NEW.id,
      row_to_json(NEW)::jsonb,
      changed_fields
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_save_draft_history
AFTER UPDATE ON task_drafts
FOR EACH ROW
EXECUTE FUNCTION save_draft_history();

-- 9. 创建函数：发布草稿为正式任务
CREATE OR REPLACE FUNCTION publish_draft_to_task(draft_id UUID)
RETURNS UUID AS $$
DECLARE
  draft RECORD;
  new_task_id UUID;
BEGIN
  -- 获取草稿
  SELECT * INTO draft FROM task_drafts WHERE id = draft_id;

  IF draft IS NULL THEN
    RAISE EXCEPTION 'Draft not found';
  END IF;

  -- 检查完成度
  IF draft.completion_percentage < 80 THEN
    RAISE EXCEPTION 'Draft completion must be at least 80%';
  END IF;

  -- 创建正式任务
  INSERT INTO tasks (
    company_id,
    title,
    description,
    requirements,
    deliverables,
    category,
    tags,
    budget_min,
    budget_max,
    deadline,
    estimated_hours,
    required_abilities,
    difficulty_level,
    attachments,
    status,
    original_deadline
  ) VALUES (
    draft.company_id,
    draft.title,
    draft.description,
    draft.requirements,
    draft.deliverables,
    draft.category,
    draft.tags,
    draft.budget_min,
    draft.budget_max,
    draft.deadline,
    draft.estimated_hours,
    draft.required_abilities,
    draft.difficulty_level,
    draft.attachments,
    'open',
    draft.deadline
  ) RETURNING id INTO new_task_id;

  -- 更新草稿状态
  UPDATE task_drafts
  SET published_at = NOW(),
      published_task_id = new_task_id,
      draft_status = 'archived'
  WHERE id = draft_id;

  RETURN new_task_id;
END;
$$ LANGUAGE plpgsql;

-- 10. 创建函数：更新任务的追加需求统计
CREATE OR REPLACE FUNCTION update_task_amendments_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE tasks
    SET has_amendments = true,
        total_amendments = (
          SELECT COUNT(*) FROM task_amendments WHERE task_id = NEW.task_id
        ),
        amendment_price_adjustment = (
          SELECT COALESCE(SUM(price_adjustment), 0)
          FROM task_amendments
          WHERE task_id = NEW.task_id AND status = 'accepted'
        )
    WHERE id = NEW.task_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_task_amendments_stats
AFTER INSERT OR UPDATE ON task_amendments
FOR EACH ROW
EXECUTE FUNCTION update_task_amendments_stats();

-- 11. 创建视图：草稿统计
CREATE OR REPLACE VIEW draft_statistics AS
SELECT
  company_id,
  COUNT(*) as total_drafts,
  COUNT(*) FILTER (WHERE draft_status = 'editing') as editing_drafts,
  COUNT(*) FILTER (WHERE draft_status = 'ready_to_publish') as ready_drafts,
  COUNT(*) FILTER (WHERE published_task_id IS NOT NULL) as published_drafts,
  AVG(completion_percentage) as avg_completion,
  MAX(updated_at) as last_updated
FROM task_drafts
GROUP BY company_id;

-- 12. 创建视图：追加需求统计
CREATE OR REPLACE VIEW amendment_statistics AS
SELECT
  task_id,
  COUNT(*) as total_amendments,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_amendments,
  COUNT(*) FILTER (WHERE status = 'accepted') as accepted_amendments,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_amendments,
  SUM(price_adjustment) FILTER (WHERE status = 'accepted') as total_price_adjustment,
  SUM(deadline_extension_days) FILTER (WHERE status = 'accepted') as total_deadline_extension,
  AVG(ai_fairness_score) as avg_fairness_score
FROM task_amendments
GROUP BY task_id;

COMMENT ON TABLE task_drafts IS '任务草稿箱 - 企业可以保存未完成的任务草稿';
COMMENT ON TABLE task_amendments IS '任务追加需求 - 任务进行中企业提出的需求变更';
COMMENT ON TABLE task_draft_history IS '草稿历史记录 - 用于版本恢复';
COMMENT ON FUNCTION calculate_draft_completion IS '计算草稿完成度（0-100）';
COMMENT ON FUNCTION publish_draft_to_task IS '将草稿发布为正式任务';
