-- 完整业务流程数据库迁移 (PostgreSQL)
-- 创建时间: 2026-04-11

-- ============================================
-- 1. 任务表增强（添加价格相关字段）
-- ============================================
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS ai_price_min DECIMAL(10, 2);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS ai_price_max DECIMAL(10, 2);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS company_price DECIMAL(10, 2);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS student_price DECIMAL(10, 2);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10, 2);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10, 2);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS final_amount DECIMAL(10, 2);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deposit_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS final_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS accepted_student_id INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS verification_deadline TIMESTAMP;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS auto_confirmed BOOLEAN DEFAULT FALSE;

-- 添加注释
COMMENT ON COLUMN tasks.ai_price_min IS 'AI建议最低价格';
COMMENT ON COLUMN tasks.ai_price_max IS 'AI建议最高价格';
COMMENT ON COLUMN tasks.company_price IS '企业定价（100%）';
COMMENT ON COLUMN tasks.student_price IS '学生看到的价格（85%）';
COMMENT ON COLUMN tasks.platform_fee IS '平台抽成（15%）';
COMMENT ON COLUMN tasks.deposit_amount IS '定金金额（30%）';
COMMENT ON COLUMN tasks.final_amount IS '尾款金额（70%）';
COMMENT ON COLUMN tasks.deposit_paid IS '定金是否已支付';
COMMENT ON COLUMN tasks.final_paid IS '尾款是否已支付';
COMMENT ON COLUMN tasks.accepted_student_id IS '接单的学生ID';
COMMENT ON COLUMN tasks.verification_deadline IS '验收截止时间（7天）';
COMMENT ON COLUMN tasks.auto_confirmed IS '是否自动确认';

-- ============================================
-- 2. 支付记录表
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL,
  payer_id INTEGER NOT NULL,
  payer_type VARCHAR(20) NOT NULL CHECK (payer_type IN ('company', 'platform')),
  receiver_id INTEGER NOT NULL,
  receiver_type VARCHAR(20) NOT NULL CHECK (receiver_type IN ('platform', 'student')),
  amount DECIMAL(10, 2) NOT NULL,
  payment_type VARCHAR(30) NOT NULL CHECK (payment_type IN ('deposit', 'final', 'platform_to_student')),
  payment_method VARCHAR(50),
  transaction_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_task_id ON payments(task_id);
CREATE INDEX IF NOT EXISTS idx_payments_payer ON payments(payer_id, payer_type);
CREATE INDEX IF NOT EXISTS idx_payments_receiver ON payments(receiver_id, receiver_type);

COMMENT ON TABLE payments IS '支付记录表';

-- ============================================
-- 3. AI匹配记录表
-- ============================================
CREATE TABLE IF NOT EXISTS ai_matches (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  match_score DECIMAL(5, 2),
  match_reason TEXT,
  is_selected_by_company BOOLEAN DEFAULT FALSE,
  is_invited BOOLEAN DEFAULT FALSE,
  invitation_status VARCHAR(20) DEFAULT 'pending' CHECK (invitation_status IN ('pending', 'accepted', 'rejected', 'expired')),
  responded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_matches_task_id ON ai_matches(task_id);
CREATE INDEX IF NOT EXISTS idx_ai_matches_student_id ON ai_matches(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_matches_invitation_status ON ai_matches(invitation_status);

COMMENT ON TABLE ai_matches IS 'AI匹配记录表';
COMMENT ON COLUMN ai_matches.match_score IS '匹配度分数（0-100）';
COMMENT ON COLUMN ai_matches.is_selected_by_company IS '是否被企业选中（10选5）';

-- ============================================
-- 4. 任务进度记录表
-- ============================================
CREATE TABLE IF NOT EXISTS task_progress (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  progress_description TEXT,
  milestone VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_task_progress_task_id ON task_progress(task_id);

COMMENT ON TABLE task_progress IS '任务进度记录表';

-- ============================================
-- 5. 任务交付物表
-- ============================================
CREATE TABLE IF NOT EXISTS task_deliverables (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  file_type VARCHAR(20) NOT NULL CHECK (file_type IN ('image', 'video', 'document', 'code', 'link', 'other')),
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(200),
  file_size INTEGER,
  description TEXT,
  ai_review_status VARCHAR(20) DEFAULT 'pending' CHECK (ai_review_status IN ('pending', 'passed', 'failed')),
  ai_review_result TEXT,
  ai_reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_task_deliverables_task_id ON task_deliverables(task_id);

COMMENT ON TABLE task_deliverables IS '任务交付物表';

-- ============================================
-- 6. 需求补充记录表
-- ============================================
CREATE TABLE IF NOT EXISTS requirement_supplements (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL,
  company_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  estimated_days INTEGER,
  old_deadline TIMESTAMP,
  new_deadline TIMESTAMP,
  student_acknowledged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_requirement_supplements_task_id ON requirement_supplements(task_id);

COMMENT ON TABLE requirement_supplements IS '需求补充记录表';

-- ============================================
-- 7. 通知表
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('student', 'company', 'admin')),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  related_task_id INTEGER,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

COMMENT ON TABLE notifications IS '通知表';

-- ============================================
-- 8. 合作关系表（用于追踪连续合作次数）
-- ============================================
CREATE TABLE IF NOT EXISTS collaborations (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  collaboration_count INTEGER DEFAULT 0,
  wechat_exchanged BOOLEAN DEFAULT FALSE,
  company_wechat VARCHAR(100),
  student_wechat VARCHAR(100),
  first_collaboration_at TIMESTAMP,
  last_collaboration_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_collaborations_company_id ON collaborations(company_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_student_id ON collaborations(student_id);

COMMENT ON TABLE collaborations IS '合作关系表';
COMMENT ON COLUMN collaborations.collaboration_count IS '合作次数';
COMMENT ON COLUMN collaborations.wechat_exchanged IS '是否已交换微信';

-- ============================================
-- 9. 邮件发送记录表
-- ============================================
CREATE TABLE IF NOT EXISTS email_logs (
  id SERIAL PRIMARY KEY,
  recipient_email VARCHAR(200) NOT NULL,
  recipient_id INTEGER,
  subject VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  email_type VARCHAR(50) NOT NULL,
  related_task_id INTEGER,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_id ON email_logs(recipient_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);

COMMENT ON TABLE email_logs IS '邮件发送记录表';

-- ============================================
-- 10. 用户表增强（添加微信号字段）
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS wechat_id VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(200);

COMMENT ON COLUMN users.wechat_id IS '微信号';
COMMENT ON COLUMN users.email IS '邮箱';

-- ============================================
-- 插入测试数据
-- ============================================

-- 测试企业用户
INSERT INTO users (username, email, password, role, wechat_id, created_at) VALUES
('测试企业A', 'company_a@test.com', 'hashed_password', 'company', 'wechat_company_a', NOW()),
('测试企业B', 'company_b@test.com', 'hashed_password', 'company', 'wechat_company_b', NOW())
ON CONFLICT (username) DO UPDATE SET email = EXCLUDED.email;

-- 测试学生用户
INSERT INTO users (username, email, password, role, wechat_id, created_at) VALUES
('学生张三', 'student1@test.com', 'hashed_password', 'student', 'wechat_student1', NOW()),
('学生李四', 'student2@test.com', 'hashed_password', 'student', 'wechat_student2', NOW()),
('学生王五', 'student3@test.com', 'hashed_password', 'student', 'wechat_student3', NOW()),
('学生赵六', 'student4@test.com', 'hashed_password', 'student', 'wechat_student4', NOW()),
('学生孙七', 'student5@test.com', 'hashed_password', 'student', 'wechat_student5', NOW())
ON CONFLICT (username) DO UPDATE SET email = EXCLUDED.email;

COMMIT;
