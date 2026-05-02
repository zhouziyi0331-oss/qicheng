-- OPC能力画像测试系统 v2.0 数据库迁移
-- 创建时间: 2026-04-14
-- 功能: 实现六维能力画像测试、人格标签判定、推荐赛道
-- 版本: v2.0 (替代旧的三维度OPC系统)

-- ============================================
-- 1. 测试题目表
-- ============================================
CREATE TABLE IF NOT EXISTS opc_v2_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 题目信息
  question_number INTEGER NOT NULL, -- 1-38
  question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('definition', 'choice')),

  -- 题目内容
  question_text TEXT NOT NULL,
  prompt_text TEXT, -- 提示文案

  -- 选择题选项 (JSON数组)
  options JSONB, -- [{"label": "A", "text": "...", "scoring": {"dimension": "info_processing", "value": 3, "direction": "analytical"}}]

  -- 维度归属 (仅选择题)
  dimension VARCHAR(30) CHECK (dimension IN ('info_processing', 'creation_drive', 'tool_learning', 'task_execution', 'collaboration', 'risk_attitude')),

  -- 定义题配置
  max_length INTEGER, -- 字符限制
  input_type VARCHAR(20) CHECK (input_type IN ('short_text', 'multi_line', 'three_phrases')),

  -- 状态
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. 测试会话表
-- ============================================
CREATE TABLE IF NOT EXISTS opc_v2_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 测试进度
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  current_question INTEGER DEFAULT 1,
  total_questions INTEGER DEFAULT 38,

  -- 前置定义题答案
  self_defined_identity TEXT[], -- 三个词/短语
  self_defined_awesome TEXT, -- 自我定义的"厉害"

  -- 时间戳
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- 唯一约束: 每个学生同时只能有一个进行中的测试
  UNIQUE(student_id, status)
);

-- ============================================
-- 3. 答题记录表
-- ============================================
CREATE TABLE IF NOT EXISTS opc_v2_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES opc_v2_assessments(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES opc_v2_questions(id) ON DELETE CASCADE,

  -- 答案内容
  answer_text TEXT, -- 定义题答案
  selected_option VARCHAR(10), -- 选择题选项 (A/B/C/D)

  -- 计分信息 (选择题)
  dimension VARCHAR(30),
  score_value INTEGER, -- 该题在该维度的得分 (0-3)
  score_direction VARCHAR(20), -- 得分方向 (analytical/integrative, visual/logical等)

  -- 时间戳
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- 唯一约束
  UNIQUE(assessment_id, question_id)
);

-- ============================================
-- 4. 测试结果表
-- ============================================
CREATE TABLE IF NOT EXISTS opc_v2_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL UNIQUE REFERENCES opc_v2_assessments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 六个维度原始分 (0-18)
  info_processing_raw INTEGER CHECK (info_processing_raw >= 0 AND info_processing_raw <= 18),
  creation_drive_raw INTEGER CHECK (creation_drive_raw >= 0 AND creation_drive_raw <= 18),
  tool_learning_raw INTEGER CHECK (tool_learning_raw >= 0 AND tool_learning_raw <= 18),
  task_execution_raw INTEGER CHECK (task_execution_raw >= 0 AND task_execution_raw <= 18),
  collaboration_raw INTEGER CHECK (collaboration_raw >= 0 AND collaboration_raw <= 18),
  risk_attitude_raw INTEGER CHECK (risk_attitude_raw >= 0 AND risk_attitude_raw <= 18),

  -- 六个维度归一化分 (0-100)
  info_processing_score INTEGER CHECK (info_processing_score >= 0 AND info_processing_score <= 100),
  creation_drive_score INTEGER CHECK (creation_drive_score >= 0 AND creation_drive_score <= 100),
  tool_learning_score INTEGER CHECK (tool_learning_score >= 0 AND tool_learning_score <= 100),
  task_execution_score INTEGER CHECK (task_execution_score >= 0 AND task_execution_score <= 100),
  collaboration_score INTEGER CHECK (collaboration_score >= 0 AND collaboration_score <= 100),
  risk_attitude_score INTEGER CHECK (risk_attitude_score >= 0 AND risk_attitude_score <= 100),

  -- 维度倾向标签
  info_processing_tendency VARCHAR(20), -- analytical/integrative
  creation_drive_tendency VARCHAR(20), -- visual/logical
  tool_learning_tendency VARCHAR(20), -- exploratory/manual
  task_execution_tendency VARCHAR(20), -- planning/iterative
  collaboration_tendency VARCHAR(20), -- independent/collaborative
  risk_attitude_tendency VARCHAR(20), -- conservative/adventurous

  -- 人格标签
  personality_label VARCHAR(50) NOT NULL, -- 视觉叙事者/系统构建者/创意执行者等

  -- 推荐信息
  recommended_track VARCHAR(20), -- content/tool
  recommended_first_task TEXT,

  -- 维度描述 (AI生成或模板)
  dimension_descriptions JSONB, -- {"info_processing": "你倾向于...", ...}

  -- 自我认知分析
  self_awareness_analysis TEXT, -- 自我认知与行为数据的对比分析
  self_awareness_consistency VARCHAR(20), -- high/medium/low

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. 人格标签定义表
-- ============================================
CREATE TABLE IF NOT EXISTS opc_v2_personality_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 标签信息
  label_name VARCHAR(50) NOT NULL UNIQUE,
  label_description TEXT NOT NULL,

  -- 判定规则 (JSON)
  matching_rules JSONB NOT NULL,
  -- 例: {"info_processing": {"min": 55, "max": 100}, "creation_drive": {"min": 65, "max": 100}}

  -- 推荐配置
  recommended_track VARCHAR(20),
  recommended_first_task TEXT,

  -- 优先级 (用于多标签冲突时选择)
  priority INTEGER DEFAULT 0,

  -- 状态
  is_active BOOLEAN DEFAULT TRUE,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. 创建索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_opc_v2_questions_type ON opc_v2_questions(question_type);
CREATE INDEX IF NOT EXISTS idx_opc_v2_questions_dimension ON opc_v2_questions(dimension);
CREATE INDEX IF NOT EXISTS idx_opc_v2_questions_active ON opc_v2_questions(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_opc_v2_assessments_student_id ON opc_v2_assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_opc_v2_assessments_status ON opc_v2_assessments(status);
CREATE INDEX IF NOT EXISTS idx_opc_v2_answers_assessment_id ON opc_v2_answers(assessment_id);
CREATE INDEX IF NOT EXISTS idx_opc_v2_results_student_id ON opc_v2_results(student_id);
CREATE INDEX IF NOT EXISTS idx_opc_v2_results_personality_label ON opc_v2_results(personality_label);

-- ============================================
-- 7. 添加注释
-- ============================================
COMMENT ON TABLE opc_v2_questions IS 'OPC能力画像测试题目表 v2.0';
COMMENT ON TABLE opc_v2_assessments IS 'OPC测试会话表';
COMMENT ON TABLE opc_v2_answers IS 'OPC答题记录表';
COMMENT ON TABLE opc_v2_results IS 'OPC测试结果表';
COMMENT ON TABLE opc_v2_personality_labels IS 'OPC人格标签定义表';

-- ============================================
-- 8. 插入人格标签定义
-- ============================================
INSERT INTO opc_v2_personality_labels (label_name, label_description, matching_rules, recommended_track, recommended_first_task, priority) VALUES
('视觉叙事者', '擅长通过视觉元素讲述故事，适合内容创作赛道',
 '{"creation_drive": {"min": 65}, "info_processing": {"min": 55}}'::jsonb,
 'content', 'AI图文/短视频制作', 1),

('系统构建者', '擅长逻辑思维和系统设计，适合AI工具开发赛道',
 '{"creation_drive": {"max": 45}, "info_processing": {"min": 60}, "tool_learning": {"max": 45}}'::jsonb,
 'tool', 'AI工作流/简单Agent搭建', 1),

('创意执行者', '富有创意且执行力强，适合创意向内容创作',
 '{"creation_drive": {"min": 60}, "task_execution": {"max": 45}, "risk_attitude": {"min": 55}}'::jsonb,
 'content', '社交媒体内容制作', 2),

('逻辑拆解者', '擅长拆解问题和独立工作，适合数据分析和代码实现',
 '{"info_processing": {"max": 45}, "creation_drive": {"max": 45}, "collaboration": {"max": 45}}'::jsonb,
 'tool', 'AI辅助数据处理/简单程序开发', 2),

('稳健交付者', '注重计划和质量保障，适合有明确流程的项目',
 '{"task_execution": {"min": 60}, "risk_attitude": {"max": 45}, "collaboration": {"max": 45}}'::jsonb,
 'content', '有明确流程的任务', 3),

('探索整合者', '喜欢探索新工具并整合资源，适合探索性项目',
 '{"tool_learning": {"min": 60}, "info_processing": {"min": 55}, "risk_attitude": {"min": 55}}'::jsonb,
 'tool', '探索性小项目', 3),

('混合型', '能力均衡，可根据兴趣选择赛道',
 '{}'::jsonb,
 'content', '根据兴趣选择入门任务', 4);
