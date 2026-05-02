-- ══════════════════════════════════════════════════════════════
-- OPC能力画像测试系统 - 数据库表
-- 版本：2.0 - 36题六维测试系统
-- ══════════════════════════════════════════════════════════════

-- OPC测试题库表
CREATE TABLE IF NOT EXISTS opc_test_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_number INTEGER NOT NULL UNIQUE, -- 题号 1-36
  dimension VARCHAR(50) NOT NULL, -- 维度：information_processing, creation_drive, tool_learning, task_execution, collaboration, risk_attitude
  question_text TEXT NOT NULL, -- 题目文本
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  -- 每个选项对应的维度取向值（0-3分）
  score_a INTEGER NOT NULL CHECK (score_a >= 0 AND score_a <= 3),
  score_b INTEGER NOT NULL CHECK (score_b >= 0 AND score_b <= 3),
  score_c INTEGER NOT NULL CHECK (score_c >= 0 AND score_c <= 3),
  score_d INTEGER NOT NULL CHECK (score_d >= 0 AND score_d <= 3),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_question_dimension ON opc_test_questions(dimension);
CREATE INDEX IF NOT EXISTS idx_question_number ON opc_test_questions(question_number);

COMMENT ON TABLE opc_test_questions IS 'OPC能力画像测试题库 - 36题六维测试';
COMMENT ON COLUMN opc_test_questions.dimension IS '六个维度：information_processing=信息处理, creation_drive=创作驱动, tool_learning=工具学习, task_execution=任务执行, collaboration=协作倾向, risk_attitude=风险态度';

-- 用户OPC测试结果表
CREATE TABLE IF NOT EXISTS user_opc_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_version VARCHAR(20) DEFAULT '2.0', -- 测试版本

  -- 六维原始得分（0-18分）
  information_processing_score INTEGER NOT NULL,
  creation_drive_score INTEGER NOT NULL,
  tool_learning_score INTEGER NOT NULL,
  task_execution_score INTEGER NOT NULL,
  collaboration_score INTEGER NOT NULL,
  risk_attitude_score INTEGER NOT NULL,

  -- 六维归一化得分（0-100分）
  information_processing_normalized INTEGER NOT NULL,
  creation_drive_normalized INTEGER NOT NULL,
  tool_learning_normalized INTEGER NOT NULL,
  task_execution_normalized INTEGER NOT NULL,
  collaboration_normalized INTEGER NOT NULL,
  risk_attitude_normalized INTEGER NOT NULL,

  -- 人格标签
  personality_tag VARCHAR(100) NOT NULL, -- 如：视觉叙事者、系统构建者等
  personality_description TEXT NOT NULL, -- 人格描述

  -- 维度解读
  dimension_interpretations JSONB NOT NULL, -- 每个维度的详细解读

  -- 推荐信息
  recommended_track VARCHAR(100), -- 推荐赛道
  recommended_level VARCHAR(50), -- 推荐等级
  recommended_first_task TEXT, -- 推荐首单类型

  -- 答题记录
  answers JSONB NOT NULL, -- 36道题的答案记录 [{question_id, answer, score}]

  completed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_opc ON user_opc_results(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_personality_tag ON user_opc_results(personality_tag);

COMMENT ON TABLE user_opc_results IS '用户OPC测试结果记录';
COMMENT ON COLUMN user_opc_results.answers IS '答题记录JSON格式：[{question_number: 1, answer: "A", score: 3}, ...]';

-- 导师观察表（新增字段以支持"使命是河"理念）
CREATE TABLE IF NOT EXISTS mentor_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  observation_type VARCHAR(50) NOT NULL, -- 'stuck_point', 'breakthrough', 'habit_formed', 'work_style_shift'
  observation_content TEXT NOT NULL, -- 观察内容描述
  observation_data JSONB, -- 结构化数据
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_observation_student ON mentor_observations(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_observation_type ON mentor_observations(observation_type, created_at DESC);

COMMENT ON TABLE mentor_observations IS 'AI导师观察记录 - 记录学生的卡点、突破、习惯形成等';
COMMENT ON COLUMN mentor_observations.observation_type IS '观察类型：stuck_point=卡点, breakthrough=突破, habit_formed=习惯形成, work_style_shift=工作风格转变';

-- 用户表新增OPC相关字段（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='opc_personality_tag') THEN
    ALTER TABLE users ADD COLUMN opc_personality_tag VARCHAR(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='opc_completed_at') THEN
    ALTER TABLE users ADD COLUMN opc_completed_at TIMESTAMP;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='opc_test_version') THEN
    ALTER TABLE users ADD COLUMN opc_test_version VARCHAR(20);
  END IF;
END $$;

COMMENT ON COLUMN users.opc_personality_tag IS 'OPC人格标签：视觉叙事者、系统构建者等';
COMMENT ON COLUMN users.opc_completed_at IS 'OPC测试完成时间';
COMMENT ON COLUMN users.opc_test_version IS 'OPC测试版本号';

-- 任务表新增字段（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='required_personality_style') THEN
    ALTER TABLE tasks ADD COLUMN required_personality_style VARCHAR(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='is_stretch_project') THEN
    ALTER TABLE tasks ADD COLUMN is_stretch_project BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

COMMENT ON COLUMN tasks.required_personality_style IS '项目需要的工作风格，用于匹配OPC人格标签';
COMMENT ON COLUMN tasks.is_stretch_project IS '是否为冒险项目（略高于学生当前等级）';
