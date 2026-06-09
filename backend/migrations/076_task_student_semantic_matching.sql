-- ============================================================
-- 任务-学生语义匹配系统
-- Task-Student Semantic Matching System
-- ============================================================

-- 1. 学生能力画像表
CREATE TABLE IF NOT EXISTS student_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) UNIQUE,

  -- 能力向量（使用BGE-large-zh-v1.5，1024维）
  skill_vector vector(1024),              -- 技能向量
  trajectory_vector vector(512),          -- 学习轨迹向量
  quality_vector vector(512),             -- 质量向量
  preference_vector vector(512),          -- 偏好向量
  combined_vector vector(1024),           -- 组合向量（用于快速检索）

  -- 技能熟练度矩阵（JSON）
  skills JSONB NOT NULL DEFAULT '{}',
  -- 示例: {"React": {"proficiency": 0.8, "confidence": 0.9, "lastPracticed": "2024-01-15"}}

  -- 学习轨迹
  tasks_completed INTEGER DEFAULT 0,
  avg_task_quality DECIMAL(3,2) CHECK (avg_task_quality BETWEEN 0 AND 1),
  avg_client_satisfaction DECIMAL(3,2) CHECK (avg_client_satisfaction BETWEEN 0 AND 1),
  on_time_delivery_rate DECIMAL(3,2) CHECK (on_time_delivery_rate BETWEEN 0 AND 1),
  avg_response_time_hours DECIMAL(10,2),

  -- 成长速度
  quality_trend VARCHAR(50),              -- 'improving', 'stable', 'declining'
  growth_rate DECIMAL(3,2),
  skill_acquisition_rate DECIMAL(3,2),

  -- 工作偏好
  preferred_task_types TEXT[],
  work_style JSONB,
  max_hours_per_week INTEGER,

  -- OPC测评结果（关联到已有的OPC系统）
  opc_openness INTEGER,
  opc_persistence INTEGER,
  opc_creativity INTEGER,
  personality_style VARCHAR(50),

  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  vector_updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_student_capabilities_student ON student_capabilities(student_id);
CREATE INDEX idx_student_capabilities_vector ON student_capabilities
  USING ivfflat (combined_vector vector_cosine_ops) WITH (lists = 100);

-- 2. 任务-学生匹配记录表
CREATE TABLE IF NOT EXISTS task_student_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),
  student_id UUID NOT NULL REFERENCES users(id),

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
  rank_in_task INTEGER,                  -- 在该任务中的排名

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(task_id, student_id)
);

CREATE INDEX idx_matches_task ON task_student_matches(task_id, overall_score DESC);
CREATE INDEX idx_matches_student ON task_student_matches(student_id, created_at DESC);
CREATE INDEX idx_matches_pushed ON task_student_matches(task_id, is_pushed, overall_score DESC);

-- 3. 任务翻译表（启程老师）
CREATE TABLE IF NOT EXISTS task_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) UNIQUE,

  -- 任务拆解
  functional_modules JSONB NOT NULL,
  -- 示例: [{"module": "用户登录", "description": "实现用户注册和登录功能", "skills": ["React", "JWT"], "difficulty": 3}]

  -- 学生友好描述
  student_friendly_title VARCHAR(200),
  student_friendly_description TEXT,
  what_you_will_do TEXT,                 -- "你需要做什么"
  what_you_will_learn TEXT,              -- "你会学到什么"
  estimated_hours INTEGER,

  -- 技能要求（结构化）
  required_skills JSONB NOT NULL,
  -- 示例: [{"skill": "React", "proficiency": 0.7, "weight": 0.4, "why": "需要构建用户界面"}]

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

CREATE INDEX idx_task_translations_task ON task_translations(task_id);

-- 4. 扩展tasks表（添加匹配相关字段）
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS matching_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS matched_students_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS top_match_score DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS matching_completed_at TIMESTAMPTZ;

-- 5. 为tasks表的embedding字段添加索引（如果还没有）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'tasks' AND indexname = 'idx_tasks_combined_embedding'
  ) THEN
    CREATE INDEX idx_tasks_combined_embedding ON tasks
      USING ivfflat (combined_embedding vector_cosine_ops) WITH (lists = 100);
  END IF;
END $$;

-- 6. 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_student_capabilities_updated_at
  BEFORE UPDATE ON student_capabilities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_translations_updated_at
  BEFORE UPDATE ON task_translations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. 添加注释
COMMENT ON TABLE student_capabilities IS '学生能力画像表，存储学生的技能向量和能力数据';
COMMENT ON TABLE task_student_matches IS '任务-学生匹配记录表，存储匹配分数和推送状态';
COMMENT ON TABLE task_translations IS '任务翻译表，存储启程老师对任务的分析和翻译';
COMMENT ON COLUMN student_capabilities.combined_vector IS '组合向量，用于快速检索最匹配的学生';
COMMENT ON COLUMN task_student_matches.overall_score IS '综合匹配分数，6个维度的加权平均';
COMMENT ON COLUMN task_translations.functional_modules IS '任务功能模块拆解，帮助学生理解任务结构';
