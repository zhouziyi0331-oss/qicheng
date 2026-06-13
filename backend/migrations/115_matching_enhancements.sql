-- E-05a: 试稿机制
-- E-05b: 学生对比视图
-- E-05c: 手动搜索和筛选
-- E-05d: 匹配拒绝反馈

-- 试稿邀请表
CREATE TABLE trial_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),
  student_id UUID NOT NULL REFERENCES users(id),
  company_id UUID NOT NULL REFERENCES users(id),

  -- 试稿要求
  trial_requirement TEXT NOT NULL,
  trial_deadline TIMESTAMPTZ NOT NULL,
  trial_budget DECIMAL(10,2),  -- 试稿费用（可选）

  -- 学生响应
  student_status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'accepted', 'rejected', 'submitted'
  student_response TEXT,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,

  -- 试稿提交
  trial_submission TEXT,
  trial_files JSONB DEFAULT '[]',
  submitted_at TIMESTAMPTZ,

  -- 企业评估
  company_evaluation TEXT,
  evaluation_score DECIMAL(3,2),  -- 0-1
  is_approved BOOLEAN DEFAULT false,
  evaluated_at TIMESTAMPTZ,

  -- 转正
  converted_to_formal BOOLEAN DEFAULT false,
  formal_task_id UUID REFERENCES tasks(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(task_id, student_id)
);

-- 学生对比记录表
CREATE TABLE student_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES users(id),
  task_id UUID REFERENCES tasks(id),

  -- 对比的学生列表
  student_ids UUID[] NOT NULL,

  -- 对比维度
  comparison_dimensions JSONB,
  -- {
  --   "skill_match": true,
  --   "price": true,
  --   "response_time": true,
  --   "quality_history": true,
  --   "growth_potential": true
  -- }

  -- 对比结果
  comparison_result JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 手动搜索筛选记录表
CREATE TABLE manual_search_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES users(id),
  task_id UUID REFERENCES tasks(id),

  -- 筛选条件
  filter_conditions JSONB NOT NULL,
  -- {
  --   "student_level_min": 3,
  --   "student_level_max": 7,
  --   "required_skills": ["React", "TypeScript"],
  --   "min_rating": 4.0,
  --   "min_completed_tasks": 5,
  --   "max_response_hours": 24,
  --   "location": "北京",
  --   "availability": "full_time"
  -- }

  -- 搜索结果
  matched_students_count INTEGER,
  search_results JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 匹配拒绝反馈表
CREATE TABLE match_rejection_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),
  student_id UUID NOT NULL REFERENCES users(id),
  company_id UUID NOT NULL REFERENCES users(id),

  -- 拒绝原因
  rejection_reason VARCHAR(50) NOT NULL,
  -- 'skill_mismatch', 'level_too_low', 'level_too_high',
  -- 'price_too_high', 'poor_history', 'location_issue', 'other'

  rejection_detail TEXT,

  -- AI分析
  ai_analysis JSONB,
  -- {
  --   "reason_category": "skill_gap",
  --   "missing_skills": ["Vue.js", "GraphQL"],
  --   "improvement_suggestion": "建议学习Vue.js框架"
  -- }

  -- 用于优化匹配算法
  used_for_optimization BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(task_id, student_id)
);

-- 学生可见度控制表（扩展）
CREATE TABLE student_visibility_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) UNIQUE,

  -- 可见性设置
  is_discoverable BOOLEAN DEFAULT true,  -- 是否允许企业主动发现
  allow_manual_search BOOLEAN DEFAULT true,  -- 是否出现在搜索结果
  allow_trial_invitations BOOLEAN DEFAULT true,  -- 是否接受试稿邀请

  -- 屏蔽企业列表
  blocked_companies UUID[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_trial_invitations_task ON trial_invitations(task_id, student_status);
CREATE INDEX idx_trial_invitations_student ON trial_invitations(student_id, student_status);
CREATE INDEX idx_trial_invitations_company ON trial_invitations(company_id, created_at DESC);
CREATE INDEX idx_student_comparisons_company ON student_comparisons(company_id, created_at DESC);
CREATE INDEX idx_manual_search_filters_company ON manual_search_filters(company_id, created_at DESC);
CREATE INDEX idx_match_rejection_company ON match_rejection_feedback(company_id, created_at DESC);
CREATE INDEX idx_match_rejection_student ON match_rejection_feedback(student_id, created_at DESC);
CREATE INDEX idx_visibility_settings_student ON student_visibility_settings(student_id);

-- 试稿统计
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_invitations_sent INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_invitations_received INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_pass_rate DECIMAL(3,2);

-- 更新企业试稿统计
CREATE OR REPLACE FUNCTION update_company_trial_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users SET trial_invitations_sent = trial_invitations_sent + 1
    WHERE id = NEW.company_id;

    UPDATE users SET trial_invitations_received = trial_invitations_received + 1
    WHERE id = NEW.student_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.is_approved = true AND OLD.is_approved = false THEN
    -- 更新学生试稿通过率
    WITH stats AS (
      SELECT
        COUNT(*) FILTER (WHERE is_approved = true) as passed,
        COUNT(*) FILTER (WHERE student_status = 'submitted') as total
      FROM trial_invitations
      WHERE student_id = NEW.student_id
    )
    UPDATE users
    SET trial_pass_rate = (SELECT passed::DECIMAL / NULLIF(total, 0) FROM stats)
    WHERE id = NEW.student_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_company_trial_stats
AFTER INSERT OR UPDATE ON trial_invitations
FOR EACH ROW
EXECUTE FUNCTION update_company_trial_stats();

COMMENT ON TABLE trial_invitations IS 'E-05a: 试稿机制，企业邀请学生提交试稿';
COMMENT ON TABLE student_comparisons IS 'E-05b: 学生对比视图，企业对比多个学生';
COMMENT ON TABLE manual_search_filters IS 'E-05c: 手动搜索和筛选，企业自定义筛选条件';
COMMENT ON TABLE match_rejection_feedback IS 'E-05d: 匹配拒绝反馈，收集拒绝原因优化匹配';
COMMENT ON TABLE student_visibility_settings IS '学生可见度控制';
