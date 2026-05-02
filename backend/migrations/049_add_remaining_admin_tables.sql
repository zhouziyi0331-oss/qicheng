-- 添加管理端所需的剩余表
-- 创建时间：2026-04-17

-- ============================================
-- 1. 公告表 (announcements)
-- ============================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(50) CHECK (type IN ('system', 'maintenance', 'feature', 'event')),
  target_audience VARCHAR(20) DEFAULT 'all' CHECK (target_audience IN ('all', 'student', 'company')),

  -- 状态
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),

  -- 发布信息
  published_at TIMESTAMP WITH TIME ZONE,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_target_audience ON announcements(target_audience);
CREATE INDEX IF NOT EXISTS idx_announcements_published_at ON announcements(published_at DESC);

COMMENT ON TABLE announcements IS '系统公告表';

-- ============================================
-- 2. AI Prompt模板表
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
-- 3. 导师档案表 (如果不存在)
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
-- 4. 导师咨询会话表
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
-- 5. 确保 admin_roles 表存在
-- ============================================
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB, -- 权限配置

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE admin_roles IS '管理员角色表';

-- 插入默认角色
INSERT INTO admin_roles (name, description, permissions) VALUES
  ('super', '超级管理员', '{"all": true}'::jsonb),
  ('ops', '运营管理员', '{"students": true, "companies": true, "tasks": true, "content": true}'::jsonb),
  ('finance', '财务管理员', '{"finance": true, "withdrawals": true}'::jsonb),
  ('cs', '客服', '{"support": true, "students": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 6. 更新 admin_users 表，添加 role_id 外键（如果还没有）
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
-- 7. 纠纷消息表（如果不存在）
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

-- ============================================
-- 8. 添加 task_disputes 表的 admin_note 字段（如果不存在）
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
