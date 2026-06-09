-- OPC v2.0 测试系统数据库表
-- 迁移文件：073_opc_v2_system.sql

-- 1. OPC v2.0 测试记录表
CREATE TABLE opc_v2_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),

  -- 测试状态
  status VARCHAR(50) NOT NULL DEFAULT 'in_progress',
  -- 'in_progress', 'completed', 'abandoned'

  -- 进度追踪
  current_step VARCHAR(50) DEFAULT 'pre_questions',
  -- 'pre_questions', 'choice_questions', 'analyzing', 'completed'

  pre_questions_completed BOOLEAN DEFAULT false,
  choice_questions_completed BOOLEAN DEFAULT false,

  -- 时间戳
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_opc_v2_assessments_user ON opc_v2_assessments(user_id);
CREATE INDEX idx_opc_v2_assessments_status ON opc_v2_assessments(status);

-- 2. OPC v2.0 答案记录表
CREATE TABLE opc_v2_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES opc_v2_assessments(id) ON DELETE CASCADE,

  -- 问题信息
  question_id VARCHAR(50) NOT NULL,
  question_type VARCHAR(50) NOT NULL,
  -- 'definition' (前置定义题), 'choice' (选择题)

  -- 答案内容
  answer_text TEXT,  -- 前置定义题的文字答案
  selected_option VARCHAR(10),  -- 选择题的选项 (A/B/C/D)

  -- 时间戳
  answered_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(assessment_id, question_id)
);

CREATE INDEX idx_opc_v2_answers_assessment ON opc_v2_answers(assessment_id);

-- 3. OPC v2.0 测试结果表
CREATE TABLE opc_v2_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES opc_v2_assessments(id) UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id),

  -- 六维能力分数 (0-100)
  openness_score INTEGER CHECK (openness_score BETWEEN 0 AND 100),
  persistence_score INTEGER CHECK (persistence_score BETWEEN 0 AND 100),
  creativity_score INTEGER CHECK (creativity_score BETWEEN 0 AND 100),
  learning_score INTEGER CHECK (learning_score BETWEEN 0 AND 100),
  collaboration_score INTEGER CHECK (collaboration_score BETWEEN 0 AND 100),
  resilience_score INTEGER CHECK (resilience_score BETWEEN 0 AND 100),

  -- 六维能力描述 (AI生成)
  openness_description TEXT,
  persistence_description TEXT,
  creativity_description TEXT,
  learning_description TEXT,
  collaboration_description TEXT,
  resilience_description TEXT,

  -- 人格标签 (JSON数组)
  personality_tags JSONB NOT NULL DEFAULT '[]',
  -- [
  --   {name: "视觉叙事者", description: "...", color: "#8B5CF6"},
  --   {name: "探索整合者", description: "...", color: "#EC4899"}
  -- ]

  -- 自我认知对比
  self_perception_words TEXT[],  -- 用户写的三个词
  ai_analysis TEXT,  -- AI对用户的分析
  perception_gap TEXT,  -- 认知差距分析

  -- 赛道推荐
  recommended_track VARCHAR(100),  -- 'AI内容创作', 'AI工具开发'
  track_match_score INTEGER CHECK (track_match_score BETWEEN 0 AND 100),
  track_reason TEXT,  -- 推荐理由
  first_task_suggestion TEXT,  -- 首单建议

  -- AI生成的完整分析报告
  full_analysis JSONB,

  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_opc_v2_results_user ON opc_v2_results(user_id);
CREATE INDEX idx_opc_v2_results_assessment ON opc_v2_results(assessment_id);

-- 4. 更新users表，添加最新OPC结果引用
ALTER TABLE users
ADD COLUMN IF NOT EXISTS latest_opc_v2_result_id UUID REFERENCES opc_v2_results(id);

CREATE INDEX idx_users_latest_opc_v2 ON users(latest_opc_v2_result_id);

-- 5. 创建触发器：自动更新updated_at
CREATE OR REPLACE FUNCTION update_opc_v2_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER opc_v2_assessments_updated_at
  BEFORE UPDATE ON opc_v2_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_opc_v2_updated_at();

CREATE TRIGGER opc_v2_results_updated_at
  BEFORE UPDATE ON opc_v2_results
  FOR EACH ROW
  EXECUTE FUNCTION update_opc_v2_updated_at();

-- 6. 添加注释
COMMENT ON TABLE opc_v2_assessments IS 'OPC v2.0测试记录表';
COMMENT ON TABLE opc_v2_answers IS 'OPC v2.0答案记录表';
COMMENT ON TABLE opc_v2_results IS 'OPC v2.0测试结果表';
COMMENT ON COLUMN opc_v2_results.personality_tags IS 'AI生成的人格标签（JSON数组）';
COMMENT ON COLUMN opc_v2_results.full_analysis IS 'AI生成的完整分析报告（JSON）';
