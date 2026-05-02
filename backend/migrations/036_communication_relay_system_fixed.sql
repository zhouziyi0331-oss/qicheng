-- 沟通中转系统数据库迁移（修复版）
-- 创建时间: 2026-04-13
-- 功能：实现任务沟通、AI问答、联系方式屏蔽
-- 修复：使用UUID类型匹配现有users表

-- ============================================
-- 1. 任务沟通记录表
-- ============================================
CREATE TABLE IF NOT EXISTS task_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('student', 'company')),

  -- 消息内容
  message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('clarification', 'question', 'answer')),
  content TEXT NOT NULL,
  filtered_content TEXT, -- 过滤后的内容（屏蔽联系方式）

  -- AI处理
  is_ai_response BOOLEAN DEFAULT FALSE,
  ai_confidence DECIMAL(3,2), -- AI回复的置信度

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. AI自动回复记录表
-- ============================================
CREATE TABLE IF NOT EXISTS ai_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  communication_id UUID NOT NULL REFERENCES task_communications(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

  -- 问题和回答
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,

  -- 是否需要人工介入
  needs_human_review BOOLEAN DEFAULT FALSE,
  review_reason TEXT,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. 联系方式申请表
-- ============================================
CREATE TABLE IF NOT EXISTS contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requester_role VARCHAR(20) NOT NULL CHECK (requester_role IN ('student', 'company')),

  -- 申请理由
  reason TEXT NOT NULL,

  -- 状态
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

  -- 审批信息
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reject_reason TEXT,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. 沟通模板表
-- ============================================
CREATE TABLE IF NOT EXISTS communication_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type VARCHAR(20) NOT NULL CHECK (template_type IN ('clarification', 'question', 'answer')),
  role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'company')),

  -- 模板内容
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,

  -- 使用统计
  usage_count INTEGER DEFAULT 0,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. 创建索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_task_communications_task_id ON task_communications(task_id);
CREATE INDEX IF NOT EXISTS idx_task_communications_sender_id ON task_communications(sender_id);
CREATE INDEX IF NOT EXISTS idx_task_communications_created_at ON task_communications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_responses_task_id ON ai_responses(task_id);
CREATE INDEX IF NOT EXISTS idx_ai_responses_communication_id ON ai_responses(communication_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_task_id ON contact_requests(task_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_requester_id ON contact_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON contact_requests(status);

-- ============================================
-- 6. 添加注释
-- ============================================
COMMENT ON TABLE task_communications IS '任务沟通记录表';
COMMENT ON TABLE ai_responses IS 'AI自动回复记录表';
COMMENT ON TABLE contact_requests IS '联系方式申请表';
COMMENT ON TABLE communication_templates IS '沟通模板表';
