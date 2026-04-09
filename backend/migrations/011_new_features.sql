-- ============================================================
-- Migration 011: 新增功能表
-- 创建时间: 2026-04-09
-- 说明: 为跳级挑战、学生标签等新功能添加数据库表
-- ============================================================

-- ============================================================
-- 1. 跳级挑战记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS level_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  old_level INT NOT NULL CHECK (old_level >= 0 AND old_level <= 10),
  new_level INT NOT NULL CHECK (new_level >= 0 AND new_level <= 10),
  score INT NOT NULL CHECK (score >= 0 AND score <= 100),
  passed BOOLEAN NOT NULL DEFAULT false,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  feedback TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_level_challenges_user_id ON level_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_level_challenges_created_at ON level_challenges(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_level_challenges_passed ON level_challenges(passed) WHERE passed = true;

-- 注释
COMMENT ON TABLE level_challenges IS '跳级挑战记录表';
COMMENT ON COLUMN level_challenges.user_id IS '学生用户ID';
COMMENT ON COLUMN level_challenges.old_level IS '挑战前等级';
COMMENT ON COLUMN level_challenges.new_level IS '挑战后等级';
COMMENT ON COLUMN level_challenges.score IS '挑战得分(0-100)';
COMMENT ON COLUMN level_challenges.passed IS '是否通过';
COMMENT ON COLUMN level_challenges.answers IS '答题内容(JSON)';
COMMENT ON COLUMN level_challenges.feedback IS 'AI评估反馈';

-- ============================================================
-- 2. 学生能力标签表
-- ============================================================
CREATE TABLE IF NOT EXISTS student_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tag_name VARCHAR(50) NOT NULL,
  tag_type VARCHAR(20) NOT NULL DEFAULT 'skill', -- skill, interest, achievement
  source VARCHAR(20) NOT NULL DEFAULT 'system', -- system, ai, manual
  confidence DECIMAL(3,2) DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_student_tags_user_id ON student_tags(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_student_tags_tag_name ON student_tags(tag_name) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_student_tags_tag_type ON student_tags(tag_type) WHERE deleted_at IS NULL;

-- 唯一约束：同一用户不能有重复标签
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_tags_unique
  ON student_tags(user_id, tag_name)
  WHERE deleted_at IS NULL;

-- 注释
COMMENT ON TABLE student_tags IS '学生能力标签表';
COMMENT ON COLUMN student_tags.user_id IS '学生用户ID';
COMMENT ON COLUMN student_tags.tag_name IS '标签名称';
COMMENT ON COLUMN student_tags.tag_type IS '标签类型: skill(技能), interest(兴趣), achievement(成就)';
COMMENT ON COLUMN student_tags.source IS '标签来源: system(系统), ai(AI生成), manual(手动添加)';
COMMENT ON COLUMN student_tags.confidence IS '标签置信度(0-1)';

-- ============================================================
-- 3. 任务步骤表（如果不存在）
-- ============================================================
CREATE TABLE IF NOT EXISTS task_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  step_num INT NOT NULL CHECK (step_num > 0),
  step_title VARCHAR(200) NOT NULL,
  step_desc TEXT,
  tool_hint VARCHAR(100),
  est_minutes INT DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, in_progress, completed
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_task_steps_task_student ON task_steps(task_id, student_id);
CREATE INDEX IF NOT EXISTS idx_task_steps_status ON task_steps(status);

-- 唯一约束：同一任务同一学生的步骤编号唯一
CREATE UNIQUE INDEX IF NOT EXISTS idx_task_steps_unique
  ON task_steps(task_id, student_id, step_num);

-- 注释
COMMENT ON TABLE task_steps IS '任务执行步骤表';
COMMENT ON COLUMN task_steps.task_id IS '任务ID';
COMMENT ON COLUMN task_steps.student_id IS '学生ID';
COMMENT ON COLUMN task_steps.step_num IS '步骤编号';
COMMENT ON COLUMN task_steps.step_title IS '步骤标题';
COMMENT ON COLUMN task_steps.step_desc IS '步骤描述';
COMMENT ON COLUMN task_steps.tool_hint IS '推荐工具提示';
COMMENT ON COLUMN task_steps.est_minutes IS '预计耗时(分钟)';
COMMENT ON COLUMN task_steps.status IS '步骤状态';

-- ============================================================
-- 4. 更新现有表（如果需要）
-- ============================================================

-- 确保 student_profiles 表有 six_dim_scores 字段
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'student_profiles' AND column_name = 'six_dim_scores'
  ) THEN
    ALTER TABLE student_profiles
    ADD COLUMN six_dim_scores JSONB DEFAULT '{"d1":0,"d2":0,"d3":0,"d4":0,"d5":0,"d6":0}'::jsonb;

    COMMENT ON COLUMN student_profiles.six_dim_scores IS '六维能力分数: d1(学习力), d2(执行力), d3(沟通力), d4(创新力), d5(协作力), d6(抗压力)';
  END IF;
END $$;

-- 确保 tasks 表有必要的字段
DO $$
BEGIN
  -- 添加 task_type 字段（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'task_type'
  ) THEN
    ALTER TABLE tasks
    ADD COLUMN task_type VARCHAR(20) DEFAULT 'normal';

    COMMENT ON COLUMN tasks.task_type IS '任务类型: normal(普通), invitation(邀请)';
  END IF;
END $$;

-- ============================================================
-- 5. 触发器：自动更新 updated_at
-- ============================================================

-- level_challenges 表触发器
CREATE OR REPLACE FUNCTION update_level_challenges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_level_challenges_updated_at ON level_challenges;
CREATE TRIGGER trigger_level_challenges_updated_at
  BEFORE UPDATE ON level_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_level_challenges_updated_at();

-- student_tags 表触发器
CREATE OR REPLACE FUNCTION update_student_tags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_student_tags_updated_at ON student_tags;
CREATE TRIGGER trigger_student_tags_updated_at
  BEFORE UPDATE ON student_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_student_tags_updated_at();

-- task_steps 表触发器
CREATE OR REPLACE FUNCTION update_task_steps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_task_steps_updated_at ON task_steps;
CREATE TRIGGER trigger_task_steps_updated_at
  BEFORE UPDATE ON task_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_task_steps_updated_at();

-- ============================================================
-- 6. 初始数据（可选）
-- ============================================================

-- 为现有学生添加一些默认标签（基于OPC标签）
INSERT INTO student_tags (user_id, tag_name, tag_type, source)
SELECT
  sp.user_id,
  CASE
    WHEN sp.opc_label LIKE '%探索%' THEN 'AI探索者'
    WHEN sp.opc_label LIKE '%实践%' THEN 'AI实践者'
    WHEN sp.opc_label LIKE '%创作%' THEN '内容创作'
    ELSE 'AI学习者'
  END,
  'skill',
  'system'
FROM student_profiles sp
WHERE sp.opc_label IS NOT NULL
ON CONFLICT (user_id, tag_name) DO NOTHING;

-- ============================================================
-- 完成
-- ============================================================

-- 验证表创建
DO $$
DECLARE
  table_count INT;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_name IN ('level_challenges', 'student_tags', 'task_steps')
    AND table_schema = 'public';

  IF table_count = 3 THEN
    RAISE NOTICE '✅ Migration 011 completed successfully. All tables created.';
  ELSE
    RAISE WARNING '⚠️  Migration 011 incomplete. Expected 3 tables, found %', table_count;
  END IF;
END $$;
