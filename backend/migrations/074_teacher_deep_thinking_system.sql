-- ============================================
-- 启程老师深度思考系统
-- Migration: 074
-- 描述: 建立观察、思考、记忆系统
-- ============================================

-- 1. 学生行为观察表
CREATE TABLE IF NOT EXISTS teacher_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- 行为类型
  behavior_type VARCHAR(50) NOT NULL,
  -- 'task_start', 'task_pause', 'seek_help', 'submit_work',
  -- 'revise_work', 'task_complete', 'view_feedback'

  -- 上下文
  context JSONB NOT NULL DEFAULT '{}',
  -- {
  --   taskId, taskDescription, duration, attemptNumber,
  --   previousAttempts, timeElapsed, etc.
  -- }

  -- 推断的情绪状态
  emotional_state JSONB,
  -- {
  --   confidence: 0-1,
  --   frustration: 0-1,
  --   engagement: 0-1
  -- }

  -- 工作模式
  work_pattern JSONB,
  -- {
  --   timeOfDay, sessionLength, breakFrequency
  -- }

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_teacher_observations_student ON teacher_observations(student_id, timestamp DESC);
CREATE INDEX idx_teacher_observations_type ON teacher_observations(behavior_type, timestamp DESC);

-- 2. 企业反馈观察表
CREATE TABLE IF NOT EXISTS teacher_company_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES users(id),
  student_id UUID NOT NULL REFERENCES users(id),
  task_id UUID NOT NULL REFERENCES tasks(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- 反馈类型
  feedback_type VARCHAR(50) NOT NULL,
  -- 'accept', 'reject', 'request_revision', 'comment'

  -- 企业原话
  original_words TEXT,

  -- 推断的语气
  tone VARCHAR(50),
  -- 'satisfied', 'disappointed', 'frustrated', 'confused'

  -- 推断的偏好
  preferences JSONB,
  -- {
  --   communicationStyle, qualityStandard, responseSpeed
  -- }

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_teacher_company_observations_company ON teacher_company_observations(company_id, timestamp DESC);
CREATE INDEX idx_teacher_company_observations_student ON teacher_company_observations(student_id, timestamp DESC);

-- 3. 启程老师的思考记录表
CREATE TABLE IF NOT EXISTS teacher_thinking_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- 思考的问题
  question TEXT NOT NULL,

  -- 回忆的信息
  recall JSONB NOT NULL DEFAULT '{}',
  -- {
  --   studentHistory: [...],
  --   similarCases: [...],
  --   relevantPatterns: [...]
  -- }

  -- 形成的假设
  hypotheses JSONB NOT NULL DEFAULT '[]',
  -- [
  --   {hypothesis, evidence, confidence},
  --   ...
  -- ]

  -- 推理过程
  reasoning JSONB NOT NULL DEFAULT '{}',
  -- {
  --   mainHypothesis,
  --   reasoning,
  --   counterEvidence
  -- }

  -- 形成的洞察
  insight JSONB NOT NULL DEFAULT '{}',
  -- {
  --   understanding,
  --   rootCause,
  --   actionable
  -- }

  -- 最终回复
  response TEXT,

  -- 结果反馈
  outcome TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_teacher_thinking_student ON teacher_thinking_records(student_id, timestamp DESC);

-- 4. 启程老师的长期记忆表
CREATE TABLE IF NOT EXISTS teacher_long_term_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) UNIQUE,

  -- 对学生的理解
  core_strengths TEXT[] DEFAULT '{}',
  growth_areas TEXT[] DEFAULT '{}',
  working_style TEXT,
  learning_pattern TEXT,
  emotional_triggers TEXT[] DEFAULT '{}',

  -- 深度洞察（自然语言）
  deep_understanding TEXT,

  -- 元数据
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  confidence_level DECIMAL(3,2) DEFAULT 0.5,
  -- 对这个理解的信心（随着观察增多而提高）

  observation_count INTEGER DEFAULT 0,
  -- 观察次数

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_teacher_long_term_memory_student ON teacher_long_term_memory(student_id);

-- 5. 启程老师的短期记忆表
CREATE TABLE IF NOT EXISTS teacher_short_term_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- 互动记录
  context JSONB NOT NULL,
  student_state TEXT,
  teacher_response TEXT,
  outcome TEXT,

  -- 是否已巩固到长期记忆
  consolidated BOOLEAN DEFAULT false,
  consolidated_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_teacher_short_term_memory_student ON teacher_short_term_memory(student_id, timestamp DESC);
CREATE INDEX idx_teacher_short_term_memory_unconsolidated ON teacher_short_term_memory(student_id, consolidated) WHERE consolidated = false;

-- 6. 启程老师识别的关键时刻表
CREATE TABLE IF NOT EXISTS teacher_key_moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- 事件类型
  event_type VARCHAR(100) NOT NULL,
  -- 'first_rejection', 'first_help_request', 'three_consecutive_passes',
  -- 'work_pattern_change', 'breakthrough', 'setback'

  -- 事件描述
  event_description TEXT NOT NULL,

  -- 对学生的影响
  impact TEXT,

  -- 老师的洞察
  teacher_insight TEXT,

  -- 重要程度
  importance INTEGER DEFAULT 5,
  -- 1-10，用于排序

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_teacher_key_moments_student ON teacher_key_moments(student_id, timestamp DESC);
CREATE INDEX idx_teacher_key_moments_importance ON teacher_key_moments(student_id, importance DESC);

-- 7. 为现有学生初始化长期记忆
INSERT INTO teacher_long_term_memory (student_id, deep_understanding)
SELECT id, '新学生，尚未建立深度理解'
FROM users
WHERE role = 'student'
ON CONFLICT (student_id) DO NOTHING;

-- ============================================
-- Migration 完成
-- ============================================
