-- 任务分级系统数据库迁移（修复版）
-- 创建时间: 2026-04-13
-- 功能：实现两条赛道（AI内容创作/AI工具开发）和五级任务等级系统
-- 修复：使用UUID类型匹配现有users表

-- ============================================
-- 1. 任务表增强（添加缺失字段）
-- ============================================
-- tasks表已有track字段，只添加缺失的字段
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS required_openness INTEGER CHECK (required_openness >= 0 AND required_openness <= 100);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS required_persistence INTEGER CHECK (required_persistence >= 0 AND required_persistence <= 100);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS required_creativity INTEGER CHECK (required_creativity >= 0 AND required_creativity <= 100);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS budget_range VARCHAR(50);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS duration VARCHAR(50);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deliverables JSONB;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS company_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_stretch_project BOOLEAN DEFAULT FALSE;

-- ============================================
-- 2. 学生能力画像表
-- ============================================
CREATE TABLE IF NOT EXISTS student_abilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

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

  -- 成长值
  total_growth_points INTEGER DEFAULT 0,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. 成长历史记录表
-- ============================================
CREATE TABLE IF NOT EXISTS growth_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

  -- 任务信息
  task_track VARCHAR(20) NOT NULL,
  task_level INTEGER NOT NULL,

  -- 能力变化
  openness_change INTEGER DEFAULT 0,
  persistence_change INTEGER DEFAULT 0,
  creativity_change INTEGER DEFAULT 0,

  -- 成长值
  growth_points INTEGER NOT NULL,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. 跳级挑战表
-- ============================================
CREATE TABLE IF NOT EXISTS level_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_level INTEGER NOT NULL,
  to_level INTEGER NOT NULL,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

  -- 挑战状态
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'passed', 'failed')),

  -- 结果
  passed BOOLEAN,
  feedback TEXT,

  -- 时间戳
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- 冷却期（失败后30天内不能再次挑战同一等级）
  cooldown_until TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- 5. 任务匹配记录表
-- ============================================
CREATE TABLE IF NOT EXISTS task_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 匹配度评分
  match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),

  -- 匹配详情
  match_reason TEXT,
  difficulty_assessment VARCHAR(20) CHECK (difficulty_assessment IN ('easy', 'moderate', 'challenging')),
  estimated_growth_points INTEGER,

  -- 能力匹配度
  openness_match INTEGER,
  persistence_match INTEGER,
  creativity_match INTEGER,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(task_id, student_id)
);

-- ============================================
-- 6. 创建索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_student_abilities_user_id ON student_abilities(user_id);
CREATE INDEX IF NOT EXISTS idx_growth_history_student_id ON growth_history(student_id);
CREATE INDEX IF NOT EXISTS idx_growth_history_task_id ON growth_history(task_id);
CREATE INDEX IF NOT EXISTS idx_level_challenges_student_id ON level_challenges(student_id);
CREATE INDEX IF NOT EXISTS idx_level_challenges_status ON level_challenges(status);
CREATE INDEX IF NOT EXISTS idx_task_matches_task_id ON task_matches(task_id);
CREATE INDEX IF NOT EXISTS idx_task_matches_student_id ON task_matches(student_id);
CREATE INDEX IF NOT EXISTS idx_task_matches_score ON task_matches(match_score DESC);
