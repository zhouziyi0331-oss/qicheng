-- 修复tasks表并添加缺失的表
-- 创建时间：2026-04-16

-- ============================================
-- 1. 修复tasks表 - 添加缺失的时间字段
-- ============================================
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;

-- 添加注释
COMMENT ON COLUMN tasks.accepted_at IS '学生接单时间';
COMMENT ON COLUMN tasks.submitted_at IS '学生提交作品时间';
COMMENT ON COLUMN tasks.completed_at IS '任务完成时间';
COMMENT ON COLUMN tasks.cancelled_at IS '任务取消时间';

-- ============================================
-- 2. 任务纠纷表
-- ============================================
CREATE TABLE IF NOT EXISTS task_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  initiator_id UUID NOT NULL REFERENCES users(id),
  initiator_type VARCHAR(20) NOT NULL CHECK (initiator_type IN ('student', 'company')),

  -- 纠纷信息
  dispute_type VARCHAR(50) NOT NULL CHECK (dispute_type IN ('quality', 'deadline', 'payment', 'requirement', 'other')),
  description TEXT NOT NULL,
  evidence_urls TEXT[], -- 证据图片/文件URL数组

  -- 状态
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'closed')),

  -- 处理信息
  handler_id UUID REFERENCES admin_users(id),
  resolution TEXT, -- 处理结果
  resolved_at TIMESTAMP WITH TIME ZONE,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_task_disputes_task_id ON task_disputes(task_id);
CREATE INDEX idx_task_disputes_status ON task_disputes(status);
CREATE INDEX idx_task_disputes_created_at ON task_disputes(created_at DESC);

COMMENT ON TABLE task_disputes IS '任务纠纷表';

-- ============================================
-- 3. 纠纷沟通记录表
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

CREATE INDEX idx_dispute_messages_dispute_id ON dispute_messages(dispute_id);
CREATE INDEX idx_dispute_messages_created_at ON dispute_messages(created_at);

COMMENT ON TABLE dispute_messages IS '纠纷沟通记录表';

-- ============================================
-- 4. Banner轮播图表
-- ============================================
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  image_url TEXT NOT NULL,
  link_type VARCHAR(20) CHECK (link_type IN ('none', 'url', 'miniprogram', 'article')),
  link_value TEXT, -- URL或小程序路径或文章ID

  -- 展示位置
  position VARCHAR(50) DEFAULT 'home' CHECK (position IN ('home', 'task_hall', 'student_center', 'company_center')),
  target_audience VARCHAR(20) DEFAULT 'all' CHECK (target_audience IN ('all', 'student', 'company')),

  -- 排序和状态
  order_index INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),

  -- 展示时间
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,

  -- 统计
  view_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,

  -- 时间戳
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_banners_position ON banners(position);
CREATE INDEX idx_banners_status ON banners(status);
CREATE INDEX idx_banners_target_audience ON banners(target_audience);
CREATE INDEX idx_banners_order_index ON banners(order_index);

COMMENT ON TABLE banners IS 'Banner轮播图表';

-- ============================================
-- 5. 文章表（OPC故事墙等内容）
-- ============================================
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  subtitle VARCHAR(200),
  cover_image TEXT,
  content TEXT NOT NULL,

  -- 分类
  category VARCHAR(50) NOT NULL CHECK (category IN ('opc_story', 'news', 'guide', 'case_study')),
  tags TEXT[],

  -- 关联
  author_id UUID REFERENCES users(id), -- 如果是学生故事，关联学生
  task_id UUID REFERENCES tasks(id), -- 如果是项目案例，关联任务

  -- 状态
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured BOOLEAN DEFAULT false, -- 是否精选

  -- 统计
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,

  -- 发布信息
  published_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES admin_users(id),

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_author_id ON articles(author_id);
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX idx_articles_is_featured ON articles(is_featured);

COMMENT ON TABLE articles IS '文章表（OPC故事墙、新闻、指南等）';

-- ============================================
-- 6. 操作日志表（已存在，添加缺失的列）
-- ============================================
ALTER TABLE admin_operation_logs
ADD COLUMN IF NOT EXISTS admin_username VARCHAR(50),
ADD COLUMN IF NOT EXISTS module VARCHAR(50),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS request_method VARCHAR(10),
ADD COLUMN IF NOT EXISTS request_url TEXT,
ADD COLUMN IF NOT EXISTS request_params JSONB,
ADD COLUMN IF NOT EXISTS response_status INTEGER;

CREATE INDEX IF NOT EXISTS idx_admin_operation_logs_admin_id ON admin_operation_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_operation_logs_module ON admin_operation_logs(module);
CREATE INDEX IF NOT EXISTS idx_admin_operation_logs_action ON admin_operation_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_operation_logs_created_at ON admin_operation_logs(created_at DESC);

-- ============================================
-- 7. 系统通知表（给学生/企业的通知）
-- ============================================
CREATE TABLE IF NOT EXISTS system_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 通知内容
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('system', 'task', 'payment', 'announcement')),

  -- 关联
  related_type VARCHAR(50), -- task/order/announcement等
  related_id UUID,

  -- 状态
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_notifications_user_id ON system_notifications(user_id);
CREATE INDEX idx_system_notifications_is_read ON system_notifications(is_read);
CREATE INDEX idx_system_notifications_created_at ON system_notifications(created_at DESC);

COMMENT ON TABLE system_notifications IS '系统通知表';
