-- 只创建缺失的表
-- 创建时间：2026-04-17

-- ============================================
-- 1. AI Prompt模板表
-- ============================================
CREATE TABLE IF NOT EXISTS ai_prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  template TEXT NOT NULL,
  variables JSONB, -- 模板变量定义

  -- 状态
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_prompt_templates_category ON ai_prompt_templates(category);
CREATE INDEX IF NOT EXISTS idx_ai_prompt_templates_status ON ai_prompt_templates(status);

COMMENT ON TABLE ai_prompt_templates IS 'AI Prompt模板表';

-- ============================================
-- 2. 导师档案表
-- ============================================
CREATE TABLE IF NOT EXISTS mentor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 导师信息
  expertise TEXT[], -- 专长领域
  bio TEXT, -- 个人简介

  -- 统计
  rating_avg DECIMAL(3,2) DEFAULT 0.00,
  session_count INTEGER DEFAULT 0,

  -- 状态
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_mentor_profiles_user_id ON mentor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_status ON mentor_profiles(status);

COMMENT ON TABLE mentor_profiles IS '导师档案表';

-- ============================================
-- 3. 导师咨询会话表
-- ============================================
CREATE TABLE IF NOT EXISTS mentor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES users(id),
  student_id UUID NOT NULL REFERENCES users(id),

  -- 会话信息
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  duration_minutes INTEGER,

  -- 评价
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mentor_sessions_mentor_id ON mentor_sessions(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_sessions_student_id ON mentor_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_mentor_sessions_status ON mentor_sessions(status);
CREATE INDEX IF NOT EXISTS idx_mentor_sessions_created_at ON mentor_sessions(created_at DESC);

COMMENT ON TABLE mentor_sessions IS '导师咨询会话表';

-- ============================================
-- 4. 更新 admin_users 表，添加 role_id 外键（如果还没有）
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_users' AND column_name = 'role_id'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN role_id UUID REFERENCES admin_roles(id);

    -- 为现有管理员设置默认角色
    UPDATE admin_users SET role_id = (SELECT id FROM admin_roles WHERE name = 'super' LIMIT 1)
    WHERE role_id IS NULL;
  END IF;
END $$;

-- ============================================
-- 5. 添加 task_disputes 表的 admin_note 字段（如果不存在）
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'task_disputes' AND column_name = 'admin_note'
  ) THEN
    ALTER TABLE task_disputes ADD COLUMN admin_note TEXT;
  END IF;
END $$;

COMMENT ON COLUMN task_disputes.admin_note IS '管理员处理备注';

-- ============================================
-- 6. 确保 dispute_messages 表存在
-- ============================================
CREATE TABLE IF NOT EXISTS dispute_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES task_disputes(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('student', 'company', 'admin')),

  -- 消息内容
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  content TEXT NOT NULL,
  attachment_urls TEXT[],

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dispute_messages_dispute_id ON dispute_messages(dispute_id);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_created_at ON dispute_messages(created_at);

COMMENT ON TABLE dispute_messages IS '纠纷沟通记录表';
