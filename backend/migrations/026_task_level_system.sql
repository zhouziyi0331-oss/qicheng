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

-- 添加注释
COMMENT ON COLUMN tasks.track IS '任务赛道：content=AI内容创作, tool=AI工具开发';
COMMENT ON COLUMN tasks.level IS '任务等级：0=入门, 1=初级, 2=中级, 3=高级, 4=专家';
COMMENT ON COLUMN tasks.required_openness IS '所需开放性能力（0-100）';
COMMENT ON COLUMN tasks.required_persistence IS '所需坚持性能力（0-100）';
COMMENT ON COLUMN tasks.required_creativity IS '所需创造性能力（0-100）';
COMMENT ON COLUMN tasks.budget_range IS '预算区间显示（如"200-800元"）';
COMMENT ON COLUMN tasks.duration IS '预计时长（如"2-3天"）';
COMMENT ON COLUMN tasks.deliverables IS '交付物清单（JSON数组）';
COMMENT ON COLUMN tasks.company_verified IS '是否为线下验证的真实企业';
COMMENT ON COLUMN tasks.is_stretch_project IS '是否为探索项目（跨赛道尝试）';

-- ============================================
-- 2. 学生能力画像表
-- ============================================
CREATE TABLE IF NOT EXISTS student_abilities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- OPC六维能力
  openness INTEGER DEFAULT 50 CHECK (openness >= 0 AND openness <= 100),
  persistence INTEGER DEFAULT 50 CHECK (persistence >= 0 AND persistence <= 100),
  creativity INTEGER DEFAULT 50 CHECK (creativity >= 0 AND creativity <= 100),

  -- 当前赛道和等级
  primary_track VARCHAR(20) DEFAULT 'content' CHECK (primary_track IN ('content', 'tool')),
  current_level INTEGER DEFAULT 0 CHECK (current_level >= 0 AND current_level <= 4),

  -- 完成任务统计
  total_completed_tasks INTEGER DEFAULT 0,
  level_0_completed INTEGER DEFAULT 0,
  level_1_completed INTEGER DEFAULT 0,
  level_2_completed INTEGER DEFAULT 0,
  level_3_completed INTEGER DEFAULT 0,
  level_4_completed INTEGER DEFAULT 0,
  content_track_completed INTEGER DEFAULT 0,
  tool_track_completed INTEGER DEFAULT 0,

  -- 技能标签（JSON数组）
  skills JSONB DEFAULT '[]'::jsonb,

  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_student_abilities_user_id ON student_abilities(user_id);
CREATE INDEX IF NOT EXISTS idx_student_abilities_level ON student_abilities(current_level);
CREATE INDEX IF NOT EXISTS idx_student_abilities_track ON student_abilities(primary_track);

COMMENT ON TABLE student_abilities IS '学生能力画像表（六维能力+赛道等级）';
COMMENT ON COLUMN student_abilities.openness IS '开放性能力（0-100）';
COMMENT ON COLUMN student_abilities.persistence IS '坚持性能力（0-100）';
COMMENT ON COLUMN student_abilities.creativity IS '创造性能力（0-100）';
COMMENT ON COLUMN student_abilities.primary_track IS '主赛道：content或tool';
COMMENT ON COLUMN student_abilities.current_level IS '当前等级：0-4';

-- ============================================
-- 3. 成长轨迹表
-- ============================================
CREATE TABLE IF NOT EXISTS growth_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level >= 0 AND level <= 4),
  track VARCHAR(20) NOT NULL CHECK (track IN ('content', 'tool')),
  milestone VARCHAR(200) NOT NULL,
  task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_growth_history_user_id ON growth_history(user_id);
CREATE INDEX IF NOT EXISTS idx_growth_history_created_at ON growth_history(created_at);

COMMENT ON TABLE growth_history IS '学生成长轨迹记录';

-- ============================================
-- 4. 任务匹配结果表（增强）
-- ============================================
ALTER TABLE ai_matches ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('easy', 'moderate', 'challenging', 'stretch'));
ALTER TABLE ai_matches ADD COLUMN IF NOT EXISTS estimated_growth_openness INTEGER;
ALTER TABLE ai_matches ADD COLUMN IF NOT EXISTS estimated_growth_persistence INTEGER;
ALTER TABLE ai_matches ADD COLUMN IF NOT EXISTS estimated_growth_creativity INTEGER;
ALTER TABLE ai_matches ADD COLUMN IF NOT EXISTS match_reasons JSONB;

COMMENT ON COLUMN ai_matches.difficulty_level IS '难度评估：easy=简单, moderate=适中, challenging=有挑战, stretch=探索';
COMMENT ON COLUMN ai_matches.estimated_growth_openness IS '预期开放性成长值';
COMMENT ON COLUMN ai_matches.estimated_growth_persistence IS '预期坚持性成长值';
COMMENT ON COLUMN ai_matches.estimated_growth_creativity IS '预期创造性成长值';
COMMENT ON COLUMN ai_matches.match_reasons IS '匹配理由（JSON数组）';

-- ============================================
-- 5. 跳级挑战表
-- ============================================
CREATE TABLE IF NOT EXISTS level_challenges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_level INTEGER NOT NULL CHECK (current_level >= 0 AND current_level <= 3),
  target_level INTEGER NOT NULL CHECK (target_level >= 1 AND target_level <= 4),
  track VARCHAR(20) NOT NULL CHECK (track IN ('content', 'tool')),

  -- 挑战任务（标准化测试任务，非真实企业任务）
  challenge_task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,

  -- 状态
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'passed', 'failed', 'expired')),

  -- 结果
  score INTEGER CHECK (score >= 0 AND score <= 100),
  feedback TEXT,
  reviewer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

  -- 冷却期
  can_retry_after TIMESTAMP,
  retry_count INTEGER DEFAULT 0,

  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_level_challenges_user_id ON level_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_level_challenges_status ON level_challenges(status);

COMMENT ON TABLE level_challenges IS '跳级挑战记录表';
COMMENT ON COLUMN level_challenges.can_retry_after IS '冷却期结束时间（需完成2个原级别任务）';

-- ============================================
-- 6. 自动打标签系统表
-- ============================================
CREATE TABLE IF NOT EXISTS student_tags (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tag_category VARCHAR(50) NOT NULL CHECK (tag_category IN ('skill', 'behavior', 'domain', 'style', 'growth', 'risk')),
  tag_name VARCHAR(100) NOT NULL,
  confidence_score DECIMAL(5, 2) DEFAULT 0.0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  source VARCHAR(50), -- 标签来源：task_completion, test_result, behavior_analysis等
  metadata JSONB, -- 额外信息
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, tag_name)
);

CREATE INDEX IF NOT EXISTS idx_student_tags_user_id ON student_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_student_tags_category ON student_tags(tag_category);
CREATE INDEX IF NOT EXISTS idx_student_tags_confidence ON student_tags(confidence_score);

COMMENT ON TABLE student_tags IS '学生能力标签表（自动生成和更新）';
COMMENT ON COLUMN student_tags.tag_category IS '标签分类：skill=技能, behavior=行为, domain=领域, style=风格, growth=成长, risk=风险';
COMMENT ON COLUMN student_tags.confidence_score IS '置信度分数（0-100）';

-- ============================================
-- 7. 新用户首单保障表
-- ============================================
CREATE TABLE IF NOT EXISTS first_task_guarantee (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  guaranteed_task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'completed', 'expired')),
  assigned_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_first_task_guarantee_user_id ON first_task_guarantee(user_id);
CREATE INDEX IF NOT EXISTS idx_first_task_guarantee_status ON first_task_guarantee(status);

COMMENT ON TABLE first_task_guarantee IS '新用户首单保障记录';

-- ============================================
-- 8. 初始化现有用户的能力画像
-- ============================================
INSERT INTO student_abilities (user_id, openness, persistence, creativity, primary_track, current_level)
SELECT
  id,
  50, -- 默认开放性
  50, -- 默认坚持性
  50, -- 默认创造性
  'content', -- 默认赛道
  0 -- 默认等级
FROM users
WHERE role = 'student'
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- 9. 创建触发器：自动更新 updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_student_abilities_updated_at
  BEFORE UPDATE ON student_abilities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_level_challenges_updated_at
  BEFORE UPDATE ON level_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_tags_updated_at
  BEFORE UPDATE ON student_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
