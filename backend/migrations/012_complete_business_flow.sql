-- 完整业务流程数据库迁移 (PostgreSQL) - 兼容现有数据库
-- 创建时间: 2026-04-11
-- 修改时间: 2026-04-14

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
-- 2. 支付记录表 - 添加缺失列到现有表
-- ============================================
DO $$
BEGIN
  -- 检查并添加缺失的列
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='payer_type') THEN
    ALTER TABLE payments ADD COLUMN payer_type VARCHAR(20) CHECK (payer_type IN ('company', 'platform'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='receiver_type') THEN
    ALTER TABLE payments ADD COLUMN receiver_type VARCHAR(20) CHECK (receiver_type IN ('platform', 'student'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='payment_type') THEN
    ALTER TABLE payments ADD COLUMN payment_type VARCHAR(30) CHECK (payment_type IN ('deposit', 'final', 'platform_to_student'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='payment_method') THEN
    ALTER TABLE payments ADD COLUMN payment_method VARCHAR(50);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='transaction_id') THEN
    ALTER TABLE payments ADD COLUMN transaction_id VARCHAR(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='paid_at') THEN
    ALTER TABLE payments ADD COLUMN paid_at TIMESTAMP;
  END IF;
END $$;

-- 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_payments_task_id ON payments(task_id);
CREATE INDEX IF NOT EXISTS idx_payments_payer ON payments(payer);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- 添加注释
COMMENT ON TABLE payments IS '支付记录表';

-- 创建或替换触发器函数
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器（如果表有updated_at列）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='updated_at') THEN
    DROP TRIGGER IF EXISTS trigger_update_payments_updated_at ON payments;
    CREATE TRIGGER trigger_update_payments_updated_at
      BEFORE UPDATE ON payments
      FOR EACH ROW
      EXECUTE FUNCTION update_payments_updated_at();
  END IF;
END $$;

-- ============================================
-- 3. AI匹配记录表 - 添加缺失列到现有表
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_matches' AND column_name='match_score') THEN
    ALTER TABLE ai_matches ADD COLUMN match_score DECIMAL(5, 2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_matches' AND column_name='match_reason') THEN
    ALTER TABLE ai_matches ADD COLUMN match_reason TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_matches' AND column_name='is_selected_by_company') THEN
    ALTER TABLE ai_matches ADD COLUMN is_selected_by_company BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_matches' AND column_name='is_invited') THEN
    ALTER TABLE ai_matches ADD COLUMN is_invited BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_matches' AND column_name='invitation_status') THEN
    ALTER TABLE ai_matches ADD COLUMN invitation_status VARCHAR(20) DEFAULT 'pending' CHECK (invitation_status IN ('pending', 'accepted', 'rejected', 'expired'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_matches' AND column_name='responded_at') THEN
    ALTER TABLE ai_matches ADD COLUMN responded_at TIMESTAMP;
  END IF;
END $$;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ai_matches_task_id ON ai_matches(task_id);
CREATE INDEX IF NOT EXISTS idx_ai_matches_student_id ON ai_matches(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_matches_invitation_status ON ai_matches(invitation_status);

-- 添加注释
COMMENT ON TABLE ai_matches IS 'AI匹配记录表';
COMMENT ON COLUMN ai_matches.match_score IS '匹配度分数（0-100）';
COMMENT ON COLUMN ai_matches.match_reason IS 'AI匹配理由';
COMMENT ON COLUMN ai_matches.is_selected_by_company IS '是否被企业选中（10选5）';
COMMENT ON COLUMN ai_matches.is_invited IS '是否已发送邀请';
COMMENT ON COLUMN ai_matches.invitation_status IS '邀请状态';
COMMENT ON COLUMN ai_matches.responded_at IS '学生响应时间';

-- 创建或替换触发器函数
CREATE OR REPLACE FUNCTION update_ai_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_matches' AND column_name='updated_at') THEN
    DROP TRIGGER IF EXISTS trigger_update_ai_matches_updated_at ON ai_matches;
    CREATE TRIGGER trigger_update_ai_matches_updated_at
      BEFORE UPDATE ON ai_matches
      FOR EACH ROW
      EXECUTE FUNCTION update_ai_matches_updated_at();
  END IF;
END $$;

-- ============================================
-- 4. 任务进度记录表 - 添加缺失列到现有表
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='task_progress' AND column_name='progress_percentage') THEN
    ALTER TABLE task_progress ADD COLUMN progress_percentage INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='task_progress' AND column_name='progress_description') THEN
    ALTER TABLE task_progress ADD COLUMN progress_description TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='task_progress' AND column_name='milestone') THEN
    ALTER TABLE task_progress ADD COLUMN milestone VARCHAR(200);
  END IF;
END $$;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_task_progress_task_id ON task_progress(task_id);

-- 添加注释
COMMENT ON TABLE task_progress IS '任务进度记录表';
COMMENT ON COLUMN task_progress.progress_percentage IS '进度百分比（0-100）';
COMMENT ON COLUMN task_progress.progress_description IS '进度描述';
COMMENT ON COLUMN task_progress.milestone IS '里程碑';

-- ============================================
-- 5. 任务交付物表 - 添加缺失列到现有表
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='task_deliverables' AND column_name='file_type') THEN
    ALTER TABLE task_deliverables ADD COLUMN file_type VARCHAR(20) CHECK (file_type IN ('image', 'video', 'document', 'code', 'link', 'other'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='task_deliverables' AND column_name='file_url') THEN
    ALTER TABLE task_deliverables ADD COLUMN file_url VARCHAR(500);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='task_deliverables' AND column_name='file_name') THEN
    ALTER TABLE task_deliverables ADD COLUMN file_name VARCHAR(200);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='task_deliverables' AND column_name='file_size') THEN
    ALTER TABLE task_deliverables ADD COLUMN file_size INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='task_deliverables' AND column_name='description') THEN
    ALTER TABLE task_deliverables ADD COLUMN description TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='task_deliverables' AND column_name='ai_review_status') THEN
    ALTER TABLE task_deliverables ADD COLUMN ai_review_status VARCHAR(20) DEFAULT 'pending' CHECK (ai_review_status IN ('pending', 'passed', 'failed'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='task_deliverables' AND column_name='ai_review_result') THEN
    ALTER TABLE task_deliverables ADD COLUMN ai_review_result TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='task_deliverables' AND column_name='ai_reviewed_at') THEN
    ALTER TABLE task_deliverables ADD COLUMN ai_reviewed_at TIMESTAMP;
  END IF;
END $$;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_task_deliverables_task_id ON task_deliverables(task_id);

-- 添加注释
COMMENT ON TABLE task_deliverables IS '任务交付物表';
COMMENT ON COLUMN task_deliverables.file_type IS '文件类型';
COMMENT ON COLUMN task_deliverables.file_url IS '文件URL';
COMMENT ON COLUMN task_deliverables.file_name IS '文件名';
COMMENT ON COLUMN task_deliverables.file_size IS '文件大小（字节）';
COMMENT ON COLUMN task_deliverables.description IS '描述';
COMMENT ON COLUMN task_deliverables.ai_review_status IS 'AI审核状态';
COMMENT ON COLUMN task_deliverables.ai_review_result IS 'AI审核结果';
COMMENT ON COLUMN task_deliverables.ai_reviewed_at IS 'AI审核时间';

-- ============================================
-- 6. 任务评价表 - 新建表
-- ============================================
CREATE TABLE IF NOT EXISTS task_reviews (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL,
  reviewer_id INTEGER NOT NULL,
  reviewer_type VARCHAR(20) NOT NULL CHECK (reviewer_type IN ('company', 'student')),
  reviewee_id INTEGER NOT NULL,
  reviewee_type VARCHAR(20) NOT NULL CHECK (reviewee_type IN ('company', 'student')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_task_reviews_task_id ON task_reviews(task_id);
CREATE INDEX IF NOT EXISTS idx_task_reviews_reviewer ON task_reviews(reviewer_id, reviewer_type);
CREATE INDEX IF NOT EXISTS idx_task_reviews_reviewee ON task_reviews(reviewee_id, reviewee_type);

-- 添加注释
COMMENT ON TABLE task_reviews IS '任务评价表';
COMMENT ON COLUMN task_reviews.id IS '主键ID';
COMMENT ON COLUMN task_reviews.task_id IS '任务ID';
COMMENT ON COLUMN task_reviews.reviewer_id IS '评价人ID';
COMMENT ON COLUMN task_reviews.reviewer_type IS '评价人类型';
COMMENT ON COLUMN task_reviews.reviewee_id IS '被评价人ID';
COMMENT ON COLUMN task_reviews.reviewee_type IS '被评价人类型';
COMMENT ON COLUMN task_reviews.rating IS '评分（1-5星）';
COMMENT ON COLUMN task_reviews.comment IS '评价内容';
COMMENT ON COLUMN task_reviews.created_at IS '创建时间';

-- ============================================
-- 7. 需求补充记录表
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

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_requirement_supplements_task_id ON requirement_supplements(task_id);

-- 添加注释
COMMENT ON TABLE requirement_supplements IS '需求补充记录表';
COMMENT ON COLUMN requirement_supplements.id IS '主键ID';
COMMENT ON COLUMN requirement_supplements.task_id IS '任务ID';
COMMENT ON COLUMN requirement_supplements.company_id IS '企业ID';
COMMENT ON COLUMN requirement_supplements.content IS '补充内容';
COMMENT ON COLUMN requirement_supplements.estimated_days IS '预计延长天数';
COMMENT ON COLUMN requirement_supplements.old_deadline IS '原截止日期';
COMMENT ON COLUMN requirement_supplements.new_deadline IS '新截止日期';
COMMENT ON COLUMN requirement_supplements.student_acknowledged IS '学生是否已确认';
COMMENT ON COLUMN requirement_supplements.created_at IS '创建时间';

-- ============================================
-- 8. 通知表 - 添加缺失列到现有表
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='related_task_id') THEN
    ALTER TABLE notifications ADD COLUMN related_task_id UUID;
  END IF;
END $$;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- 添加注释（只对现有列）
COMMENT ON TABLE notifications IS '通知表';
COMMENT ON COLUMN notifications.id IS '主键ID';
COMMENT ON COLUMN notifications.user_id IS '用户ID';
COMMENT ON COLUMN notifications.type IS '通知类型';
COMMENT ON COLUMN notifications.title IS '通知标题';
COMMENT ON COLUMN notifications.content IS '通知内容';
COMMENT ON COLUMN notifications.is_read IS '是否已读';
COMMENT ON COLUMN notifications.read_at IS '阅读时间';
COMMENT ON COLUMN notifications.created_at IS '创建时间';

-- ============================================
-- 9. 合作关系表 - 添加缺失列到现有表
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborations' AND column_name='collaboration_count') THEN
    ALTER TABLE collaborations ADD COLUMN collaboration_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborations' AND column_name='wechat_exchanged') THEN
    ALTER TABLE collaborations ADD COLUMN wechat_exchanged BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborations' AND column_name='company_wechat') THEN
    ALTER TABLE collaborations ADD COLUMN company_wechat VARCHAR(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborations' AND column_name='student_wechat') THEN
    ALTER TABLE collaborations ADD COLUMN student_wechat VARCHAR(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborations' AND column_name='first_collaboration_at') THEN
    ALTER TABLE collaborations ADD COLUMN first_collaboration_at TIMESTAMP;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborations' AND column_name='last_collaboration_at') THEN
    ALTER TABLE collaborations ADD COLUMN last_collaboration_at TIMESTAMP;
  END IF;
END $$;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_collaborations_company_id ON collaborations(company_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_student_id ON collaborations(student_id);

-- 添加注释
COMMENT ON TABLE collaborations IS '合作关系表';
COMMENT ON COLUMN collaborations.collaboration_count IS '合作次数';
COMMENT ON COLUMN collaborations.wechat_exchanged IS '是否已交换微信';
COMMENT ON COLUMN collaborations.company_wechat IS '企业微信号';
COMMENT ON COLUMN collaborations.student_wechat IS '学生微信号';
COMMENT ON COLUMN collaborations.first_collaboration_at IS '首次合作时间';
COMMENT ON COLUMN collaborations.last_collaboration_at IS '最近合作时间';

-- 创建或替换触发器函数
CREATE OR REPLACE FUNCTION update_collaborations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborations' AND column_name='updated_at') THEN
    DROP TRIGGER IF EXISTS trigger_update_collaborations_updated_at ON collaborations;
    CREATE TRIGGER trigger_update_collaborations_updated_at
      BEFORE UPDATE ON collaborations
      FOR EACH ROW
      EXECUTE FUNCTION update_collaborations_updated_at();
  END IF;
END $$;

-- ============================================
-- 10. 邮件发送记录表
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

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_id ON email_logs(recipient_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);

-- 添加注释
COMMENT ON TABLE email_logs IS '邮件发送记录表';
COMMENT ON COLUMN email_logs.id IS '主键ID';
COMMENT ON COLUMN email_logs.recipient_email IS '收件人邮箱';
COMMENT ON COLUMN email_logs.recipient_id IS '收件人ID';
COMMENT ON COLUMN email_logs.subject IS '邮件主题';
COMMENT ON COLUMN email_logs.content IS '邮件内容';
COMMENT ON COLUMN email_logs.email_type IS '邮件类型';
COMMENT ON COLUMN email_logs.related_task_id IS '关联任务ID';
COMMENT ON COLUMN email_logs.status IS '发送状态';
COMMENT ON COLUMN email_logs.sent_at IS '发送时间';
COMMENT ON COLUMN email_logs.error_message IS '错误信息';
COMMENT ON COLUMN email_logs.created_at IS '创建时间';

-- ============================================
-- 11. 用户表增强（添加微信号和邮箱字段）
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS wechat_id VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(200);

COMMENT ON COLUMN users.wechat_id IS '微信号';
COMMENT ON COLUMN users.email IS '邮箱';

-- ============================================
-- 完成
-- ============================================
