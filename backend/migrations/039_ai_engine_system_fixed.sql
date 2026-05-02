-- AI引擎系统数据库迁移（修复版）
-- 创建时间: 2026-04-13
-- 功能：实现AI需求确认、任务拆解、审核、问答
-- 修复：使用UUID类型匹配现有users表

-- ============================================
-- 1. AI需求对话表
-- ============================================
CREATE TABLE IF NOT EXISTS ai_requirement_dialogues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,

  -- 对话内容
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,

  -- AI处理信息
  model VARCHAR(50),
  tokens_used INTEGER,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. AI任务拆解记录表
-- ============================================
CREATE TABLE IF NOT EXISTS ai_task_breakdowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,

  -- 原始需求
  original_requirement TEXT NOT NULL,

  -- 拆解结果
  breakdown_result JSONB NOT NULL, -- 包含多个子任务的JSON数组

  -- AI分析
  complexity_score INTEGER CHECK (complexity_score >= 1 AND complexity_score <= 10),
  estimated_total_budget DECIMAL(10,2),
  estimated_total_days INTEGER,
  recommended_track VARCHAR(20) CHECK (recommended_track IN ('content', 'tool')),
  recommended_level INTEGER CHECK (recommended_level >= 0 AND recommended_level <= 4),

  -- 状态
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'published')),

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. AI任务审核记录表
-- ============================================
CREATE TABLE IF NOT EXISTS ai_task_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

  -- 审核维度
  clarity_score INTEGER CHECK (clarity_score >= 1 AND clarity_score <= 10),
  feasibility_score INTEGER CHECK (feasibility_score >= 1 AND feasibility_score <= 10),
  budget_reasonability_score INTEGER CHECK (budget_reasonability_score >= 1 AND budget_reasonability_score <= 10),

  -- 审核结果
  overall_score INTEGER CHECK (overall_score >= 1 AND overall_score <= 10),
  pass_threshold INTEGER DEFAULT 7,
  passed BOOLEAN NOT NULL,

  -- AI建议
  suggestions TEXT,
  risk_warnings TEXT,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. AI问答记录表
-- ============================================
CREATE TABLE IF NOT EXISTS ai_qa_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_role VARCHAR(20) NOT NULL CHECK (user_role IN ('student', 'company')),

  -- 问答内容
  question TEXT NOT NULL,
  answer TEXT NOT NULL,

  -- AI信息
  model VARCHAR(50),
  confidence DECIMAL(3,2),
  tokens_used INTEGER,

  -- 反馈
  helpful BOOLEAN,
  feedback TEXT,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. AI模型使用统计表
-- ============================================
CREATE TABLE IF NOT EXISTS ai_usage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- 使用统计
  dialogue_count INTEGER DEFAULT 0,
  breakdown_count INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  qa_count INTEGER DEFAULT 0,

  -- Token统计
  total_tokens_used INTEGER DEFAULT 0,
  total_cost DECIMAL(10,4) DEFAULT 0,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, date)
);

-- ============================================
-- 6. 创建索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_ai_requirement_dialogues_company_id ON ai_requirement_dialogues(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_requirement_dialogues_session_id ON ai_requirement_dialogues(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_task_breakdowns_company_id ON ai_task_breakdowns(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_task_breakdowns_session_id ON ai_task_breakdowns(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_task_breakdowns_status ON ai_task_breakdowns(status);
CREATE INDEX IF NOT EXISTS idx_ai_task_reviews_task_id ON ai_task_reviews(task_id);
CREATE INDEX IF NOT EXISTS idx_ai_qa_records_task_id ON ai_qa_records(task_id);
CREATE INDEX IF NOT EXISTS idx_ai_qa_records_user_id ON ai_qa_records(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_stats_user_date ON ai_usage_stats(user_id, date);

-- ============================================
-- 7. 添加注释
-- ============================================
COMMENT ON TABLE ai_requirement_dialogues IS 'AI需求对话表';
COMMENT ON TABLE ai_task_breakdowns IS 'AI任务拆解记录表';
COMMENT ON TABLE ai_task_reviews IS 'AI任务审核记录表';
COMMENT ON TABLE ai_qa_records IS 'AI问答记录表';
COMMENT ON TABLE ai_usage_stats IS 'AI模型使用统计表';
