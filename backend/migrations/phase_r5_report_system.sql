-- Phase R5: 学生能力报告系统数据库表
-- 用于企业查看学生报告、报告购买、访问控制等功能

-- 1. 学生报告缓存表
CREATE TABLE IF NOT EXISTS student_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL DEFAULT 'comprehensive', -- comprehensive, summary, growth
  report_data JSONB NOT NULL, -- 完整的报告JSON数据
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  generated_for_company_id UUID REFERENCES users(id), -- 如果是为某企业生成的
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_student_reports_student_id ON student_reports(student_id);
CREATE INDEX idx_student_reports_generated_at ON student_reports(generated_at DESC);
CREATE INDEX idx_student_reports_type ON student_reports(student_id, report_type, generated_at DESC);

COMMENT ON TABLE student_reports IS '学生能力报告缓存表';
COMMENT ON COLUMN student_reports.report_type IS '报告类型：comprehensive-综合报告, summary-摘要报告, growth-成长报告';
COMMENT ON COLUMN student_reports.report_data IS '报告完整数据，包含summary, milestones, skillProfile等';

-- 2. 报告购买记录表
CREATE TABLE IF NOT EXISTS report_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL DEFAULT 99.00, -- 购买价格
  duration_days INTEGER NOT NULL DEFAULT 30, -- 访问时长（天）
  purchase_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL, -- 过期时间
  payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, refunded
  payment_method VARCHAR(50), -- wechat, alipay, balance
  transaction_id VARCHAR(100), -- 第三方支付交易ID
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_report_purchases_company ON report_purchases(company_id);
CREATE INDEX idx_report_purchases_student ON report_purchases(student_id);
CREATE INDEX idx_report_purchases_expires ON report_purchases(expires_at);
CREATE UNIQUE INDEX idx_report_purchases_active ON report_purchases(company_id, student_id)
  WHERE expires_at > NOW() AND payment_status = 'paid';

COMMENT ON TABLE report_purchases IS '企业购买学生报告记录';
COMMENT ON COLUMN report_purchases.duration_days IS '购买的访问时长，例如30天、90天';
COMMENT ON COLUMN report_purchases.payment_status IS '支付状态：pending-待支付, paid-已支付, refunded-已退款';

-- 3. 报告访问日志表
CREATE TABLE IF NOT EXISTS report_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_reason VARCHAR(50) NOT NULL, -- purchased, collaborated, public
  report_type VARCHAR(50) NOT NULL DEFAULT 'comprehensive',
  accessed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address INET, -- 访问IP
  user_agent TEXT -- 访问设备信息
);

CREATE INDEX idx_report_access_logs_company ON report_access_logs(company_id);
CREATE INDEX idx_report_access_logs_student ON report_access_logs(student_id);
CREATE INDEX idx_report_access_logs_time ON report_access_logs(accessed_at DESC);

COMMENT ON TABLE report_access_logs IS '报告访问日志';
COMMENT ON COLUMN report_access_logs.access_reason IS '访问原因：purchased-已购买, collaborated-合作过, public-学生公开';

-- 4. 为users表添加报告可见性字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS report_public BOOLEAN DEFAULT false;
COMMENT ON COLUMN users.report_public IS '学生是否公开自己的能力报告';

-- 5. 报告统计视图（方便查询）
CREATE OR REPLACE VIEW report_stats AS
SELECT
  sr.student_id,
  u.nickname as student_name,
  COUNT(DISTINCT ral.company_id) as view_count,
  COUNT(DISTINCT rp.id) FILTER (WHERE rp.expires_at > NOW()) as active_purchases,
  MAX(ral.accessed_at) as last_viewed_at,
  COUNT(DISTINCT sr.id) as reports_generated
FROM users u
LEFT JOIN student_reports sr ON u.id = sr.student_id
LEFT JOIN report_access_logs ral ON u.id = ral.student_id
LEFT JOIN report_purchases rp ON u.id = rp.student_id
WHERE u.role = 'student'
GROUP BY sr.student_id, u.nickname;

COMMENT ON VIEW report_stats IS '学生报告统计视图，展示每个学生的报告被查看次数、购买情况等';

-- 6. 创建自动清理旧报告的函数（保留最近30天）
CREATE OR REPLACE FUNCTION cleanup_old_reports() RETURNS void AS $$
BEGIN
  DELETE FROM student_reports
  WHERE generated_at < NOW() - INTERVAL '30 days'
  AND id NOT IN (
    -- 保留每个学生每种类型的最新报告
    SELECT DISTINCT ON (student_id, report_type) id
    FROM student_reports
    ORDER BY student_id, report_type, generated_at DESC
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_reports IS '清理30天前的旧报告，但保留每个学生每种类型的最新一份';

-- 7. 创建定时任务清理旧报告（需要pg_cron扩展，可选）
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('cleanup-old-reports', '0 2 * * *', 'SELECT cleanup_old_reports()');

-- 8. 插入示例数据权限配置
INSERT INTO system_config (key, value, description, category)
VALUES
  ('report_price_default', '99', '默认报告价格（元）', 'reports'),
  ('report_price_duration_30d', '99', '30天访问权限价格', 'reports'),
  ('report_price_duration_90d', '249', '90天访问权限价格', 'reports'),
  ('report_cache_hours', '24', '报告缓存有效期（小时）', 'reports'),
  ('report_generation_enabled', 'true', '是否启用报告生成功能', 'reports')
ON CONFLICT (key) DO NOTHING;

-- 9. 为测试用户添加报告公开设置
UPDATE users SET report_public = true
WHERE id = '00000000-0000-0000-0000-000000000001';

COMMENT ON TABLE system_config IS '系统配置表，存储报告价格等可配置参数';

-- Phase R5.2: 报告分享链接功能

-- 10. 报告分享链接表
CREATE TABLE IF NOT EXISTS report_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  share_token VARCHAR(64) NOT NULL UNIQUE, -- 分享token（64位随机字符串）
  report_type VARCHAR(50) NOT NULL DEFAULT 'comprehensive',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL, -- 过期时间
  view_count INTEGER DEFAULT 0, -- 查看次数
  last_viewed_at TIMESTAMP, -- 最后查看时间
  is_active BOOLEAN DEFAULT true -- 是否激活（学生可手动禁用）
);

CREATE INDEX idx_report_share_links_token ON report_share_links(share_token);
CREATE INDEX idx_report_share_links_student ON report_share_links(student_id);
CREATE INDEX idx_report_share_links_expires ON report_share_links(expires_at);

COMMENT ON TABLE report_share_links IS '学生报告分享链接表';
COMMENT ON COLUMN report_share_links.share_token IS '唯一分享token，用于生成分享URL';
COMMENT ON COLUMN report_share_links.view_count IS '通过此链接访问的总次数';

-- 11. 报告分享访问日志表
CREATE TABLE IF NOT EXISTS report_share_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_link_id UUID NOT NULL REFERENCES report_share_links(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  accessed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address INET, -- 访问者IP
  user_agent TEXT, -- 访问者设备信息
  referrer TEXT -- 来源页面
);

CREATE INDEX idx_report_share_access_logs_link ON report_share_access_logs(share_link_id);
CREATE INDEX idx_report_share_access_logs_student ON report_share_access_logs(student_id);
CREATE INDEX idx_report_share_access_logs_time ON report_share_access_logs(accessed_at DESC);

COMMENT ON TABLE report_share_access_logs IS '报告分享链接访问日志';

-- 12. 创建自动清理过期分享链接的函数
CREATE OR REPLACE FUNCTION cleanup_expired_share_links() RETURNS void AS $$
BEGIN
  DELETE FROM report_share_links
  WHERE expires_at < NOW() - INTERVAL '7 days'; -- 过期7天后删除
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_share_links IS '清理过期7天以上的分享链接';

-- 13. 更新report_access_logs表添加访问来源字段
ALTER TABLE report_access_logs ADD COLUMN IF NOT EXISTS access_source VARCHAR(50) DEFAULT 'direct';
COMMENT ON COLUMN report_access_logs.access_source IS '访问来源：direct-直接访问, share_link-分享链接';

-- 14. 插入分享链接配置
INSERT INTO system_config (key, value, description, category)
VALUES
  ('share_link_default_days', '7', '分享链接默认有效期（天）', 'reports'),
  ('share_link_max_days', '90', '分享链接最长有效期（天）', 'reports'),
  ('share_link_enabled', 'true', '是否启用报告分享功能', 'reports')
ON CONFLICT (key) DO NOTHING;
