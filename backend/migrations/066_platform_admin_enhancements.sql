-- ============================================
-- 平台端增强功能数据库设计
-- ============================================

-- 1. 提现审核增强表（基于新的escrow系统）
CREATE TABLE IF NOT EXISTS admin_withdrawal_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  withdrawal_id UUID NOT NULL REFERENCES withdrawal_requests(id),
  reviewer_id UUID NOT NULL REFERENCES admin_users(id),
  review_action VARCHAR(50) NOT NULL, -- approved, rejected, flagged
  review_reason TEXT,
  risk_level VARCHAR(20), -- low, medium, high
  risk_factors JSONB, -- 风险因素分析
  reviewed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_admin_withdrawal_reviews_withdrawal ON admin_withdrawal_reviews(withdrawal_id);
CREATE INDEX idx_admin_withdrawal_reviews_reviewer ON admin_withdrawal_reviews(reviewer_id);

-- 2. 评价管理表
CREATE TABLE IF NOT EXISTS admin_rating_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_id UUID NOT NULL REFERENCES ratings(id),
  reviewer_id UUID NOT NULL REFERENCES admin_users(id),
  action VARCHAR(50) NOT NULL, -- approved, hidden, deleted
  reason TEXT,
  reviewed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_admin_rating_reviews_rating ON admin_rating_reviews(rating_id);

-- 3. 用户认证审核表
CREATE TABLE IF NOT EXISTS admin_user_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  verification_type VARCHAR(50) NOT NULL, -- identity, company, bank_account
  submitted_data JSONB NOT NULL, -- 提交的认证资料
  reviewer_id UUID REFERENCES admin_users(id),
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  review_note TEXT,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_admin_user_verifications_user ON admin_user_verifications(user_id);
CREATE INDEX idx_admin_user_verifications_status ON admin_user_verifications(status);

-- 4. 任务审核表
CREATE TABLE IF NOT EXISTS admin_task_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),
  reviewer_id UUID NOT NULL REFERENCES admin_users(id),
  review_type VARCHAR(50) NOT NULL, -- content_check, price_check, quality_check
  status VARCHAR(50) NOT NULL, -- approved, rejected, flagged
  issues JSONB, -- 发现的问题
  review_note TEXT,
  reviewed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_admin_task_reviews_task ON admin_task_reviews(task_id);
CREATE INDEX idx_admin_task_reviews_status ON admin_task_reviews(status);

-- 5. 系统配置表
CREATE TABLE IF NOT EXISTS system_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  config_type VARCHAR(50) NOT NULL, -- platform_fee, withdrawal_limit, task_rules, etc.
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_system_configs_key ON system_configs(config_key);
CREATE INDEX idx_system_configs_type ON system_configs(config_type);

-- 6. 数据导出记录表
CREATE TABLE IF NOT EXISTS admin_export_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admin_users(id),
  export_type VARCHAR(50) NOT NULL, -- users, tasks, transactions, ratings, etc.
  filters JSONB, -- 导出时使用的筛选条件
  file_path VARCHAR(500),
  file_size BIGINT,
  record_count INTEGER,
  status VARCHAR(50) DEFAULT 'processing', -- processing, completed, failed
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_admin_export_logs_admin ON admin_export_logs(admin_id);
CREATE INDEX idx_admin_export_logs_created ON admin_export_logs(created_at DESC);

-- 7. 平台运营指标表
CREATE TABLE IF NOT EXISTS platform_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL,
  metric_type VARCHAR(50) NOT NULL, -- daily, weekly, monthly

  -- 用户指标
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  student_count INTEGER DEFAULT 0,
  company_count INTEGER DEFAULT 0,

  -- 任务指标
  total_tasks INTEGER DEFAULT 0,
  new_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  cancelled_tasks INTEGER DEFAULT 0,

  -- 财务指标
  total_gmv DECIMAL(12, 2) DEFAULT 0, -- 总交易额
  platform_revenue DECIMAL(12, 2) DEFAULT 0, -- 平台收入
  total_withdrawals DECIMAL(12, 2) DEFAULT 0, -- 总提现额

  -- 质量指标
  avg_rating DECIMAL(3, 2),
  dispute_count INTEGER DEFAULT 0,
  dispute_rate DECIMAL(5, 2),

  -- AI指标
  ai_calls INTEGER DEFAULT 0,
  ai_cost DECIMAL(10, 4) DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_platform_metrics_date_type ON platform_metrics(metric_date, metric_type);

-- 8. 风险预警表
CREATE TABLE IF NOT EXISTS risk_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(50) NOT NULL, -- fraud, abuse, quality, financial
  severity VARCHAR(20) NOT NULL, -- low, medium, high, critical
  entity_type VARCHAR(50) NOT NULL, -- user, task, transaction
  entity_id UUID NOT NULL,
  alert_reason TEXT NOT NULL,
  alert_data JSONB,
  status VARCHAR(50) DEFAULT 'pending', -- pending, investigating, resolved, dismissed
  assigned_to UUID REFERENCES admin_users(id),
  resolved_by UUID REFERENCES admin_users(id),
  resolution_note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

CREATE INDEX idx_risk_alerts_type ON risk_alerts(alert_type);
CREATE INDEX idx_risk_alerts_severity ON risk_alerts(severity);
CREATE INDEX idx_risk_alerts_status ON risk_alerts(status);
CREATE INDEX idx_risk_alerts_entity ON risk_alerts(entity_type, entity_id);

-- 9. 批量操作记录表
CREATE TABLE IF NOT EXISTS admin_batch_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admin_users(id),
  operation_type VARCHAR(50) NOT NULL, -- bulk_approve, bulk_reject, bulk_disable, etc.
  target_type VARCHAR(50) NOT NULL, -- users, tasks, withdrawals, etc.
  target_ids JSONB NOT NULL, -- 目标ID列表
  operation_params JSONB,
  total_count INTEGER NOT NULL,
  success_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'processing', -- processing, completed, failed
  error_log JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_admin_batch_operations_admin ON admin_batch_operations(admin_id);
CREATE INDEX idx_admin_batch_operations_created ON admin_batch_operations(created_at DESC);

-- 10. 平台公告表
CREATE TABLE IF NOT EXISTS platform_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  announcement_type VARCHAR(50) NOT NULL, -- system, maintenance, feature, policy
  target_audience VARCHAR(50) NOT NULL, -- all, students, companies
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_platform_announcements_published ON platform_announcements(is_published, published_at);
CREATE INDEX idx_platform_announcements_type ON platform_announcements(announcement_type);

-- 11. 创建视图：待审核项目汇总
CREATE OR REPLACE VIEW admin_pending_reviews AS
SELECT
  'withdrawal' as review_type,
  wr.id as item_id,
  wr.user_id,
  wr.amount as amount,
  wr.created_at,
  'pending' as status
FROM withdrawal_requests wr
WHERE wr.status = 'pending'

UNION ALL

SELECT
  'user_verification' as review_type,
  uv.id as item_id,
  uv.user_id,
  NULL as amount,
  uv.created_at,
  uv.status
FROM admin_user_verifications uv
WHERE uv.status = 'pending'

UNION ALL

SELECT
  'task_review' as review_type,
  t.id as item_id,
  t.company_id as user_id,
  t.budget_max as amount,
  t.created_at,
  'pending' as status
FROM tasks t
WHERE t.status = 'pending_review'

UNION ALL

SELECT
  'rating_report' as review_type,
  rr.id as item_id,
  rr.reporter_id as user_id,
  NULL as amount,
  rr.created_at,
  rr.status
FROM rating_reports rr
WHERE rr.status = 'pending';

-- 12. 创建函数：计算平台每日指标
CREATE OR REPLACE FUNCTION calculate_daily_metrics(target_date DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO platform_metrics (
    metric_date,
    metric_type,
    total_users,
    new_users,
    active_users,
    student_count,
    company_count,
    total_tasks,
    new_tasks,
    completed_tasks,
    cancelled_tasks,
    total_gmv,
    platform_revenue,
    total_withdrawals,
    avg_rating,
    dispute_count,
    ai_calls,
    ai_cost
  )
  SELECT
    target_date,
    'daily',
    (SELECT COUNT(*) FROM users WHERE created_at::date <= target_date),
    (SELECT COUNT(*) FROM users WHERE created_at::date = target_date),
    (SELECT COUNT(DISTINCT user_id) FROM mentor_conversations WHERE created_at::date = target_date),
    (SELECT COUNT(*) FROM users WHERE role = 'student' AND created_at::date <= target_date),
    (SELECT COUNT(*) FROM users WHERE role = 'company' AND created_at::date <= target_date),
    (SELECT COUNT(*) FROM tasks WHERE created_at::date <= target_date),
    (SELECT COUNT(*) FROM tasks WHERE created_at::date = target_date),
    (SELECT COUNT(*) FROM tasks WHERE status = 'completed' AND updated_at::date = target_date),
    (SELECT COUNT(*) FROM tasks WHERE status = 'cancelled' AND updated_at::date = target_date),
    (SELECT COALESCE(SUM(amount), 0) FROM escrow_transactions WHERE created_at::date = target_date AND status = 'completed'),
    (SELECT COALESCE(SUM(platform_fee), 0) FROM escrow_transactions WHERE created_at::date = target_date AND status = 'completed'),
    (SELECT COALESCE(SUM(amount), 0) FROM withdrawal_requests WHERE created_at::date = target_date AND status = 'completed'),
    (SELECT AVG(rating_score) FROM ratings WHERE created_at::date = target_date),
    (SELECT COUNT(*) FROM disputes WHERE created_at::date = target_date),
    (SELECT COUNT(*) FROM ai_call_logs WHERE created_at::date = target_date),
    (SELECT COALESCE(SUM(cost_yuan), 0) FROM ai_call_logs WHERE created_at::date = target_date)
  ON CONFLICT (metric_date, metric_type) DO UPDATE SET
    total_users = EXCLUDED.total_users,
    new_users = EXCLUDED.new_users,
    active_users = EXCLUDED.active_users,
    student_count = EXCLUDED.student_count,
    company_count = EXCLUDED.company_count,
    total_tasks = EXCLUDED.total_tasks,
    new_tasks = EXCLUDED.new_tasks,
    completed_tasks = EXCLUDED.completed_tasks,
    cancelled_tasks = EXCLUDED.cancelled_tasks,
    total_gmv = EXCLUDED.total_gmv,
    platform_revenue = EXCLUDED.platform_revenue,
    total_withdrawals = EXCLUDED.total_withdrawals,
    avg_rating = EXCLUDED.avg_rating,
    dispute_count = EXCLUDED.dispute_count,
    ai_calls = EXCLUDED.ai_calls,
    ai_cost = EXCLUDED.ai_cost;
END;
$$ LANGUAGE plpgsql;

-- 13. 插入默认系统配置
INSERT INTO system_configs (config_key, config_value, config_type, description) VALUES
('platform_fee_rate', '{"escrow": 0.05, "withdrawal": 0.01}'::jsonb, 'platform_fee', '平台手续费率配置'),
('withdrawal_limits', '{"min_amount": 100, "max_amount": 50000, "daily_limit": 100000}'::jsonb, 'withdrawal_limit', '提现限额配置'),
('task_rules', '{"min_budget": 50, "max_budget": 100000, "min_duration_days": 1, "max_duration_days": 90}'::jsonb, 'task_rules', '任务规则配置'),
('rating_rules', '{"min_rating": 1, "max_rating": 5, "allow_anonymous": true, "edit_window_hours": 24}'::jsonb, 'rating_rules', '评价规则配置'),
('ai_cost_limits', '{"daily_limit": 1000, "per_user_limit": 50, "alert_threshold": 800}'::jsonb, 'ai_limits', 'AI成本限制配置')
ON CONFLICT (config_key) DO NOTHING;

COMMENT ON TABLE admin_withdrawal_reviews IS '管理员提现审核记录';
COMMENT ON TABLE admin_rating_reviews IS '管理员评价审核记录';
COMMENT ON TABLE admin_user_verifications IS '用户认证审核';
COMMENT ON TABLE admin_task_reviews IS '任务审核记录';
COMMENT ON TABLE system_configs IS '系统配置表';
COMMENT ON TABLE admin_export_logs IS '数据导出日志';
COMMENT ON TABLE platform_metrics IS '平台运营指标';
COMMENT ON TABLE risk_alerts IS '风险预警';
COMMENT ON TABLE admin_batch_operations IS '批量操作记录';
COMMENT ON TABLE platform_announcements IS '平台公告';
