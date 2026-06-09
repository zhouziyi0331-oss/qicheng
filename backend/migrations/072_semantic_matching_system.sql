-- ============================================
-- 语义匹配系统
-- Migration: 072
-- 描述: 实现AI驱动的供需语义匹配引擎
-- ============================================

-- 1. 启用pgvector扩展（如果尚未启用）
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 学生能力画像表
CREATE TABLE IF NOT EXISTS student_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) UNIQUE,

  -- 能力画像摘要（自然语言描述，200字左右）
  profile_summary TEXT,

  -- 能力向量（使用BGE-large-zh-v1.5，1024维）
  profile_vector vector(1024),

  -- 技能熟练度矩阵（JSON）
  skills JSONB NOT NULL DEFAULT '{}',

  -- 学习轨迹
  tasks_completed INTEGER DEFAULT 0,
  avg_task_quality DECIMAL(3,2) CHECK (avg_task_quality BETWEEN 0 AND 1),
  avg_client_satisfaction DECIMAL(3,2) CHECK (avg_client_satisfaction BETWEEN 0 AND 1),
  on_time_delivery_rate DECIMAL(3,2) CHECK (on_time_delivery_rate BETWEEN 0 AND 1),
  avg_response_time_hours DECIMAL(10,2),

  -- 成长速度
  quality_trend VARCHAR(50),
  growth_rate DECIMAL(3,2),
  skill_acquisition_rate DECIMAL(3,2),

  -- 工作偏好
  preferred_task_types TEXT[],
  work_style JSONB,
  max_hours_per_week INTEGER,

  -- OPC测评结果
  opc_openness INTEGER,
  opc_persistence INTEGER,
  opc_creativity INTEGER,
  personality_style VARCHAR(50),

  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  vector_updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_student_capabilities_student
ON student_capabilities(student_id);

CREATE INDEX IF NOT EXISTS idx_student_capabilities_vector
ON student_capabilities USING ivfflat (profile_vector vector_cosine_ops)
WITH (lists = 100);

-- 3. 任务学生匹配记录表
CREATE TABLE IF NOT EXISTS task_student_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 匹配分数（6个维度）
  overall_score DECIMAL(3,2) NOT NULL CHECK (overall_score BETWEEN 0 AND 1),
  skill_match_score DECIMAL(3,2) CHECK (skill_match_score BETWEEN 0 AND 1),
  difficulty_match_score DECIMAL(3,2) CHECK (difficulty_match_score BETWEEN 0 AND 1),
  domain_match_score DECIMAL(3,2) CHECK (domain_match_score BETWEEN 0 AND 1),
  growth_potential_score DECIMAL(3,2) CHECK (growth_potential_score BETWEEN 0 AND 1),
  reliability_score DECIMAL(3,2) CHECK (reliability_score BETWEEN 0 AND 1),
  preference_score DECIMAL(3,2) CHECK (preference_score BETWEEN 0 AND 1),

  -- 匹配详情（JSON）
  match_breakdown JSONB,

  -- 推送状态
  is_pushed BOOLEAN DEFAULT false,
  pushed_at TIMESTAMPTZ,
  student_viewed BOOLEAN DEFAULT false,
  viewed_at TIMESTAMPTZ,
  student_accepted BOOLEAN DEFAULT false,
  accepted_at TIMESTAMPTZ,

  -- 排名
  rank_in_task INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(task_id, student_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_matches_task
ON task_student_matches(task_id, overall_score DESC);

CREATE INDEX IF NOT EXISTS idx_matches_student
ON task_student_matches(student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_matches_pushed
ON task_student_matches(task_id, is_pushed, overall_score DESC);

-- 4. 任务翻译表（启程老师）
CREATE TABLE IF NOT EXISTS task_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE UNIQUE,

  -- 任务拆解
  functional_modules JSONB NOT NULL DEFAULT '[]',

  -- 学生友好描述
  student_friendly_title VARCHAR(200),
  student_friendly_description TEXT,
  what_you_will_do TEXT,
  what_you_will_learn TEXT,
  estimated_hours INTEGER,

  -- 技能要求（结构化）
  required_skills JSONB NOT NULL DEFAULT '[]',

  -- 难度评估
  difficulty_technical DECIMAL(3,1) CHECK (difficulty_technical BETWEEN 1 AND 10),
  difficulty_cognitive DECIMAL(3,1) CHECK (difficulty_cognitive BETWEEN 1 AND 10),
  difficulty_execution DECIMAL(3,1) CHECK (difficulty_execution BETWEEN 1 AND 10),
  difficulty_communication DECIMAL(3,1) CHECK (difficulty_communication BETWEEN 1 AND 10),
  difficulty_overall DECIMAL(3,1) CHECK (difficulty_overall BETWEEN 1 AND 10),

  -- 成长价值
  learning_value DECIMAL(3,2) CHECK (learning_value BETWEEN 0 AND 1),
  career_impact DECIMAL(3,2) CHECK (career_impact BETWEEN 0 AND 1),

  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_task_translations_task
ON task_translations(task_id);

-- 5. 扩展tasks表（添加匹配相关字段）
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS requirement_vector vector(1024),
ADD COLUMN IF NOT EXISTS matching_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS matched_students_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS top_match_score DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS matching_completed_at TIMESTAMPTZ;

-- 为requirement_vector创建索引
CREATE INDEX IF NOT EXISTS idx_tasks_requirement_vector
ON tasks USING ivfflat (requirement_vector vector_cosine_ops)
WITH (lists = 100);

-- 6. 为现有学生初始化能力画像（空记录，等待向量生成）
INSERT INTO student_capabilities (student_id, skills)
SELECT id, '{}'::jsonb
FROM users
WHERE role = 'student'
ON CONFLICT (student_id) DO NOTHING;

-- ============================================
-- Migration 完成
-- ============================================
