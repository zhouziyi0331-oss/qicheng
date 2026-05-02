-- 任务分级系统数据库迁移
-- 创建时间: 2026-04-13
-- 功能：实现两条赛道（AI内容创作/AI工具开发）和五级任务等级系统

-- ============================================
-- 1. 任务表增强（添加赛道和等级字段）
-- ============================================
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS track VARCHAR(20) CHECK (track IN ('content', 'tool'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS level INTEGER CHECK (level >= 0 AND level <= 4);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS required_openness INTEGER CHECK (required_openness >= 0 AND required_openness <= 100);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS required_persistence INTEGER CHECK (required_persistence >= 0 AND required_persistence <= 100);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS required_creativity INTEGER CHECK (required_creativity >= 0 AND required_creativity <= 100);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS budget_range VARCHAR(50);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS duration VARCHAR(50);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deliverables JSONB;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS company_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_stretch_project BOOLEAN DEFAULT FALSE;

-- ============================================
-- 2. 学生能力画像表（已存在，跳过）
-- student_abilities 表已存在，使用 user_id 列
-- ============================================

-- ============================================
-- 3. 成长轨迹表（已存在，跳过）
-- growth_history 表已存在，使用 student_id 列
-- ============================================

-- ============================================
-- 4. 任务匹配结果表（增强）
-- ============================================
ALTER TABLE ai_matches ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('easy', 'moderate', 'challenging', 'stretch'));
ALTER TABLE ai_matches ADD COLUMN IF NOT EXISTS estimated_growth_openness INTEGER;
ALTER TABLE ai_matches ADD COLUMN IF NOT EXISTS estimated_growth_persistence INTEGER;
ALTER TABLE ai_matches ADD COLUMN IF NOT EXISTS estimated_growth_creativity INTEGER;

-- ============================================
-- 5. 等级挑战表
-- ============================================
CREATE TABLE IF NOT EXISTS level_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_level INTEGER NOT NULL CHECK (from_level >= 0 AND from_level <= 3),
  to_level INTEGER NOT NULL CHECK (to_level >= 1 AND to_level <= 4),
  track VARCHAR(20) NOT NULL CHECK (track IN ('content', 'tool')),
  
  -- 挑战任务
  challenge_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  challenge_type VARCHAR(20) DEFAULT 'standard' CHECK (challenge_type IN ('standard', 'stretch')),
  
  -- 状态
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'passed', 'failed')),
  
  -- 评估结果
  openness_score INTEGER CHECK (openness_score >= 0 AND openness_score <= 100),
  persistence_score INTEGER CHECK (persistence_score >= 0 AND persistence_score <= 100),
  creativity_score INTEGER CHECK (creativity_score >= 0 AND creativity_score <= 100),
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  
  -- AI评估
  ai_feedback TEXT,
  mentor_feedback TEXT,
  
  -- 时间戳
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_level_challenges_student_id ON level_challenges(student_id);
CREATE INDEX IF NOT EXISTS idx_level_challenges_status ON level_challenges(status);

-- ============================================
-- 6. 学生标签表
-- ============================================
CREATE TABLE IF NOT EXISTS student_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tag_name VARCHAR(50) NOT NULL,
  tag_category VARCHAR(20) CHECK (tag_category IN ('skill', 'interest', 'achievement')),
  confidence_score INTEGER DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, tag_name)
);

CREATE INDEX IF NOT EXISTS idx_student_tags_student_id ON student_tags(student_id);
CREATE INDEX IF NOT EXISTS idx_student_tags_category ON student_tags(tag_category);

-- ============================================
-- 7. 首单保障表
-- ============================================
CREATE TABLE IF NOT EXISTS first_task_guarantee (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  guarantee_used BOOLEAN DEFAULT FALSE,
  guarantee_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_first_task_guarantee_student_id ON first_task_guarantee(student_id);

-- ============================================
-- 8. 触发器：自动更新 student_abilities.updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_student_abilities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS student_abilities_updated_at_trigger ON student_abilities;
CREATE TRIGGER student_abilities_updated_at_trigger
BEFORE UPDATE ON student_abilities
FOR EACH ROW
EXECUTE FUNCTION update_student_abilities_updated_at();

-- ============================================
-- 9. 触发器：任务完成后更新能力值
-- ============================================
CREATE OR REPLACE FUNCTION update_abilities_on_task_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- 这里可以添加能力值更新逻辑
    -- 实际逻辑在应用层处理
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS task_completion_ability_update ON tasks;
CREATE TRIGGER task_completion_ability_update
AFTER UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_abilities_on_task_completion();

-- ============================================
-- 10. 触发器：等级挑战完成后更新等级
-- ============================================
CREATE OR REPLACE FUNCTION update_level_on_challenge_pass()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'passed' AND OLD.status != 'passed' THEN
    -- 这里可以添加等级更新逻辑
    -- 实际逻辑在应用层处理
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS challenge_pass_level_update ON level_challenges;
CREATE TRIGGER challenge_pass_level_update
AFTER UPDATE ON level_challenges
FOR EACH ROW
EXECUTE FUNCTION update_level_on_challenge_pass();
