-- 通知系统数据库表

-- 通知表
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- task_matched, task_submitted, payment_success等
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  data JSONB DEFAULT '{}', -- 额外数据（任务ID、金额等）
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- 通知发送日志表
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel VARCHAR(20) NOT NULL, -- sms, email, wechat
  phone VARCHAR(20),
  email VARCHAR(100),
  wechat_openid VARCHAR(100),
  content TEXT,
  status VARCHAR(20) DEFAULT 'sent', -- sent, failed
  error_message TEXT,
  sent_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_channel ON notification_logs(channel);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at DESC);

-- 为users表添加notification_preferences字段（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'notification_preferences'
  ) THEN
    ALTER TABLE users ADD COLUMN notification_preferences JSONB DEFAULT '{
      "in_app": true,
      "sms": {
        "task_matched": true,
        "task_approved": true,
        "payment_success": true,
        "withdrawal_approved": true
      },
      "email": {
        "task_rejected": true,
        "dispute_resolved": true,
        "system_announcement": true
      },
      "wechat": {
        "task_matched": true,
        "task_submitted": true,
        "payment_success": true
      }
    }'::jsonb;
  END IF;
END $$;

-- 为users表添加wechat_openid字段（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'wechat_openid'
  ) THEN
    ALTER TABLE users ADD COLUMN wechat_openid VARCHAR(100);
  END IF;
END $$;

-- 为users表添加email字段（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'email'
  ) THEN
    ALTER TABLE users ADD COLUMN email VARCHAR(100);
  END IF;
END $$;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_wechat_openid ON users(wechat_openid);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

COMMENT ON TABLE notifications IS '站内通知表';
COMMENT ON TABLE notification_logs IS '通知发送日志表（短信/邮件/微信）';
COMMENT ON COLUMN users.notification_preferences IS '用户通知偏好设置';
COMMENT ON COLUMN users.wechat_openid IS '微信OpenID（用于发送模板消息）';
