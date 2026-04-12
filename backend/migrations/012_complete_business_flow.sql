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
  id INT PRIMARY KEY AUTO_INCREMENT,
  task_id INT NOT NULL COMMENT '任务ID',
  student_id INT NOT NULL COMMENT '学生ID',
  match_score DECIMAL(5, 2) COMMENT '匹配度分数（0-100）',
  match_reason TEXT COMMENT 'AI匹配理由',
  is_selected_by_company BOOLEAN DEFAULT FALSE COMMENT '是否被企业选中（10选5）',
  is_invited BOOLEAN DEFAULT FALSE COMMENT '是否已发送邀请',
  invitation_status ENUM('pending', 'accepted', 'rejected', 'expired') DEFAULT 'pending' COMMENT '邀请状态',
  responded_at TIMESTAMP COMMENT '学生响应时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_task_id (task_id),
  INDEX idx_student_id (student_id),
  INDEX idx_invitation_status (invitation_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI匹配记录表';

-- ============================================
-- 4. 任务进度记录表
-- ============================================
CREATE TABLE IF NOT EXISTS task_progress (
  id INT PRIMARY KEY AUTO_INCREMENT,
  task_id INT NOT NULL COMMENT '任务ID',
  student_id INT NOT NULL COMMENT '学生ID',
  progress_percentage INT DEFAULT 0 COMMENT '进度百分比（0-100）',
  progress_description TEXT COMMENT '进度描述',
  milestone VARCHAR(200) COMMENT '里程碑',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_task_id (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='任务进度记录表';

-- ============================================
-- 5. 任务交付物表
-- ============================================
CREATE TABLE IF NOT EXISTS task_deliverables (
  id INT PRIMARY KEY AUTO_INCREMENT,
  task_id INT NOT NULL COMMENT '任务ID',
  student_id INT NOT NULL COMMENT '学生ID',
  file_type ENUM('image', 'video', 'document', 'code', 'link', 'other') NOT NULL COMMENT '文件类型',
  file_url VARCHAR(500) NOT NULL COMMENT '文件URL',
  file_name VARCHAR(200) COMMENT '文件名',
  file_size INT COMMENT '文件大小（字节）',
  description TEXT COMMENT '描述',
  ai_review_status ENUM('pending', 'passed', 'failed') DEFAULT 'pending' COMMENT 'AI审核状态',
  ai_review_result TEXT COMMENT 'AI审核结果',
  ai_reviewed_at TIMESTAMP COMMENT 'AI审核时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_task_id (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='任务交付物表';

-- ============================================
-- 6. 需求补充记录表
-- ============================================
CREATE TABLE IF NOT EXISTS requirement_supplements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  task_id INT NOT NULL COMMENT '任务ID',
  company_id INT NOT NULL COMMENT '企业ID',
  content TEXT NOT NULL COMMENT '补充内容',
  estimated_days INT COMMENT '预计延长天数',
  old_deadline TIMESTAMP COMMENT '原截止日期',
  new_deadline TIMESTAMP COMMENT '新截止日期',
  student_acknowledged BOOLEAN DEFAULT FALSE COMMENT '学生是否已确认',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_task_id (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='需求补充记录表';

-- ============================================
-- 7. 通知表
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  user_type ENUM('student', 'company', 'admin') NOT NULL COMMENT '用户类型',
  type VARCHAR(50) NOT NULL COMMENT '通知类型',
  title VARCHAR(200) NOT NULL COMMENT '通知标题',
  content TEXT NOT NULL COMMENT '通知内容',
  related_task_id INT COMMENT '关联任务ID',
  is_read BOOLEAN DEFAULT FALSE COMMENT '是否已读',
  read_at TIMESTAMP COMMENT '阅读时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通知表';

-- ============================================
-- 8. 合作关系表（用于追踪连续合作次数）
-- ============================================
CREATE TABLE IF NOT EXISTS collaborations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  company_id INT NOT NULL COMMENT '企业ID',
  student_id INT NOT NULL COMMENT '学生ID',
  collaboration_count INT DEFAULT 0 COMMENT '合作次数',
  wechat_exchanged BOOLEAN DEFAULT FALSE COMMENT '是否已交换微信',
  company_wechat VARCHAR(100) COMMENT '企业微信号',
  student_wechat VARCHAR(100) COMMENT '学生微信号',
  first_collaboration_at TIMESTAMP COMMENT '首次合作时间',
  last_collaboration_at TIMESTAMP COMMENT '最近合作时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_collaboration (company_id, student_id),
  INDEX idx_company_id (company_id),
  INDEX idx_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='合作关系表';

-- ============================================
-- 9. 邮件发送记录表
-- ============================================
CREATE TABLE IF NOT EXISTS email_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  recipient_email VARCHAR(200) NOT NULL COMMENT '收件人邮箱',
  recipient_id INT COMMENT '收件人ID',
  subject VARCHAR(200) NOT NULL COMMENT '邮件主题',
  content TEXT NOT NULL COMMENT '邮件内容',
  email_type VARCHAR(50) NOT NULL COMMENT '邮件类型',
  related_task_id INT COMMENT '关联任务ID',
  status ENUM('pending', 'sent', 'failed') DEFAULT 'pending' COMMENT '发送状态',
  sent_at TIMESTAMP COMMENT '发送时间',
  error_message TEXT COMMENT '错误信息',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_recipient_id (recipient_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='邮件发送记录表';

-- ============================================
-- 10. 用户表增强（添加微信号字段）
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS wechat_id VARCHAR(100) COMMENT '微信号';
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(200) COMMENT '邮箱';

-- ============================================
-- 插入测试数据
-- ============================================

-- 测试企业用户
INSERT INTO users (username, email, password, role, wechat_id, created_at) VALUES
('测试企业A', 'company_a@test.com', 'hashed_password', 'company', 'wechat_company_a', NOW()),
('测试企业B', 'company_b@test.com', 'hashed_password', 'company', 'wechat_company_b', NOW())
ON DUPLICATE KEY UPDATE email=VALUES(email);

-- 测试学生用户
INSERT INTO users (username, email, password, role, wechat_id, created_at) VALUES
('学生张三', 'student1@test.com', 'hashed_password', 'student', 'wechat_student1', NOW()),
('学生李四', 'student2@test.com', 'hashed_password', 'student', 'wechat_student2', NOW()),
('学生王五', 'student3@test.com', 'hashed_password', 'student', 'wechat_student3', NOW()),
('学生赵六', 'student4@test.com', 'hashed_password', 'student', 'wechat_student4', NOW()),
('学生孙七', 'student5@test.com', 'hashed_password', 'student', 'wechat_student5', NOW())
ON DUPLICATE KEY UPDATE email=VALUES(email);

COMMIT;
