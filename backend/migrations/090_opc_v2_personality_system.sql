-- 迁移090: OPC v2.0 能力画像诊断系统
-- 创建日期: 2026-06-09

-- 1. OPC题库表
CREATE TABLE IF NOT EXISTS opc_v2_test_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_number INTEGER NOT NULL,
  dimension VARCHAR(50) NOT NULL, -- 'ai_tools', 'creative_preference', 'work_style', 'interest_direction'
  question_text TEXT NOT NULL,
  question_type VARCHAR(20) NOT NULL, -- 'single_choice', 'multiple_choice', 'text_input'
  options JSONB, -- 选项数组 [{"value": "A", "text": "..."}]
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT opc_v2_test_questions_dimension_check
    CHECK (dimension IN ('ai_tools', 'creative_preference', 'work_style', 'interest_direction')),
  CONSTRAINT opc_v2_test_questions_type_check
    CHECK (question_type IN ('single_choice', 'multiple_choice', 'text_input'))
);

CREATE INDEX idx_opc_v2_test_questions_active ON opc_v2_test_questions(is_active, display_order);
CREATE INDEX idx_opc_v2_test_questions_dimension ON opc_v2_test_questions(dimension);

COMMENT ON TABLE opc_v2_test_questions IS 'OPC v2.0测试题库（25题，用于能力画像诊断）';
COMMENT ON COLUMN opc_v2_test_questions.dimension IS 'AI工具使用/创作偏好/工作风格/兴趣方向';
COMMENT ON COLUMN opc_v2_test_questions.question_type IS '单选/多选/文本输入';

-- 2. 用户答案表
CREATE TABLE IF NOT EXISTS opc_v2_user_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES opc_v2_test_questions(id) ON DELETE CASCADE,
  answer_value JSONB NOT NULL, -- 单选: {"value": "A"}, 多选: {"values": ["A", "B"]}, 文本: {"text": "..."}
  answered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  test_session_id UUID NOT NULL, -- 每次完整测试有唯一session_id

  CONSTRAINT opc_v2_user_answers_unique UNIQUE (user_id, question_id, test_session_id)
);

CREATE INDEX idx_opc_v2_user_answers_user ON opc_v2_user_answers(user_id);
CREATE INDEX idx_opc_v2_user_answers_session ON opc_v2_user_answers(test_session_id);

COMMENT ON TABLE opc_v2_user_answers IS '用户OPC测试答案记录';
COMMENT ON COLUMN opc_v2_user_answers.test_session_id IS '测试会话ID，每次完整测试生成唯一ID';

-- 3. 分析结果表
CREATE TABLE IF NOT EXISTS opc_v2_user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_session_id UUID NOT NULL,

  -- 人格标签
  personality_type VARCHAR(50) NOT NULL, -- 'visual_storyteller', 'system_builder', 'creative_executor', 'data_translator', 'tool_integrator', 'dialogue_designer'
  initial_level INTEGER NOT NULL DEFAULT 1,
  level_reason TEXT NOT NULL,

  -- 赛道推荐
  track_recommendation VARCHAR(50) NOT NULL, -- 'ai_content_creation', 'ai_tool_development', 'dual_track'
  track_reason TEXT NOT NULL,

  -- 优势与gap
  three_strengths JSONB NOT NULL, -- ["优势1", "优势2", "优势3"]
  two_gaps JSONB NOT NULL, -- ["gap1", "gap2"]

  -- 专属宣言
  declaration TEXT NOT NULL,

  -- AI原始分析结果
  raw_ai_response JSONB,

  -- 元数据
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT opc_v2_user_profiles_personality_check
    CHECK (personality_type IN ('visual_storyteller', 'system_builder', 'creative_executor', 'data_translator', 'tool_integrator', 'dialogue_designer')),
  CONSTRAINT opc_v2_user_profiles_track_check
    CHECK (track_recommendation IN ('ai_content_creation', 'ai_tool_development', 'dual_track')),
  CONSTRAINT opc_v2_user_profiles_unique UNIQUE (user_id, test_session_id)
);

CREATE INDEX idx_opc_v2_user_profiles_user ON opc_v2_user_profiles(user_id);
CREATE INDEX idx_opc_v2_user_profiles_personality ON opc_v2_user_profiles(personality_type);
CREATE INDEX idx_opc_v2_user_profiles_created ON opc_v2_user_profiles(created_at DESC);

COMMENT ON TABLE opc_v2_user_profiles IS 'OPC v2.0用户能力画像分析结果';
COMMENT ON COLUMN opc_v2_user_profiles.personality_type IS '6种人格标签：视觉叙事者/系统构建者/创意执行者/数据翻译官/工具整合师/对话设计师';
COMMENT ON COLUMN opc_v2_user_profiles.declaration IS '专属宣言："你是一个擅长XX的人..."';

-- 4. 身份卡片分享追踪表
CREATE TABLE IF NOT EXISTS opc_v2_card_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sharer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_image_url TEXT NOT NULL,
  share_platform VARCHAR(50), -- 'wechat', 'weibo', 'xiaohongshu', 'other'
  shared_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  -- 追踪数据
  scan_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0, -- 有多少人扫码后完成测试

  CONSTRAINT opc_v2_card_shares_platform_check
    CHECK (share_platform IN ('wechat', 'weibo', 'xiaohongshu', 'other'))
);

CREATE INDEX idx_opc_v2_card_shares_sharer ON opc_v2_card_shares(sharer_id);
CREATE INDEX idx_opc_v2_card_shares_shared_at ON opc_v2_card_shares(shared_at DESC);

COMMENT ON TABLE opc_v2_card_shares IS '身份卡片分享追踪';
COMMENT ON COLUMN opc_v2_card_shares.conversion_count IS '扫码后完成测试的人数';

-- 5. 更新users表，添加OPC相关字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_opc_personality VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_opc_level INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_opc_test_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS latest_opc_test_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_opc_personality ON users(current_opc_personality);

COMMENT ON COLUMN users.current_opc_personality IS '当前OPC人格标签';
COMMENT ON COLUMN users.current_opc_level IS '当前OPC等级（用户成长后可能变化）';

-- 6. 触发器：更新updated_at
CREATE OR REPLACE FUNCTION update_opc_v2_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER opc_v2_test_questions_updated_at
  BEFORE UPDATE ON opc_v2_test_questions
  FOR EACH ROW EXECUTE FUNCTION update_opc_v2_updated_at();

CREATE TRIGGER opc_v2_user_profiles_updated_at
  BEFORE UPDATE ON opc_v2_user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_opc_v2_updated_at();
