-- 安全合规数据库迁移脚本
-- 创建时间: 2026-05-06

-- ============================================================
-- 1. 创建审计日志表
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admin_users(id),
  action VARCHAR(50) NOT NULL, -- view_phone, view_student_detail, export_data, update_status, etc.
  resource_type VARCHAR(50), -- student, company, task, order, etc.
  resource_id UUID,
  details JSONB, -- 额外的操作详情
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON admin_audit_logs(resource_type, resource_id);

COMMENT ON TABLE admin_audit_logs IS '管理员操作审计日志';
COMMENT ON COLUMN admin_audit_logs.action IS '操作类型：view_phone(查看手机号), view_student_detail(查看学生详情), export_data(导出数据), update_status(更新状态)等';
COMMENT ON COLUMN admin_audit_logs.resource_type IS '资源类型：student, company, task, order等';
COMMENT ON COLUMN admin_audit_logs.resource_id IS '资源ID';
COMMENT ON COLUMN admin_audit_logs.details IS '操作详情JSON';

-- ============================================================
-- 2. 创建密码隔离存储表（可选，如果保留密码功能）
-- ============================================================
CREATE TABLE IF NOT EXISTS user_credentials (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  password_updated_at TIMESTAMP DEFAULT NOW(),
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP,
  last_failed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE user_credentials IS '用户密码凭证表（隔离存储）';
COMMENT ON COLUMN user_credentials.password_hash IS 'bcrypt加密的密码哈希';
COMMENT ON COLUMN user_credentials.failed_login_attempts IS '连续登录失败次数';
COMMENT ON COLUMN user_credentials.locked_until IS '账号锁定到期时间';

-- ============================================================
-- 3. 迁移现有密码数据（如果users表有password_hash字段）
-- ============================================================
-- 注意：这个操作需要谨慎执行，建议先备份数据
-- INSERT INTO user_credentials (user_id, password_hash, created_at)
-- SELECT id, password_hash, created_at
-- FROM users
-- WHERE password_hash IS NOT NULL
-- ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- 4. 添加用户资料完整度字段
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT; -- 一句话介绍
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE; -- 资料是否完善
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMP; -- 资料完善时间

COMMENT ON COLUMN users.bio IS '用户一句话介绍';
COMMENT ON COLUMN users.profile_completed IS '资料是否已完善';
COMMENT ON COLUMN users.profile_completed_at IS '资料完善时间';

-- ============================================================
-- 5. 添加学生额外资料字段
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS university TEXT; -- 学校
ALTER TABLE users ADD COLUMN IF NOT EXISTS major TEXT; -- 专业
ALTER TABLE users ADD COLUMN IF NOT EXISTS grade TEXT; -- 年级
ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT; -- 城市

COMMENT ON COLUMN users.university IS '学校名称';
COMMENT ON COLUMN users.major IS '专业';
COMMENT ON COLUMN users.grade IS '年级';
COMMENT ON COLUMN users.city IS '所在城市';

-- ============================================================
-- 6. 添加企业额外资料字段
-- ============================================================
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS industry TEXT; -- 行业
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS company_size VARCHAR(20); -- 企业规模
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS business_license TEXT; -- 营业执照号
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE; -- 是否已认证
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP; -- 认证时间

COMMENT ON COLUMN company_profiles.industry IS '所属行业';
COMMENT ON COLUMN company_profiles.company_size IS '企业规模：1-50, 51-200, 201-500, 500+';
COMMENT ON COLUMN company_profiles.business_license IS '营业执照号';
COMMENT ON COLUMN company_profiles.verified IS '是否已通过认证';
COMMENT ON COLUMN company_profiles.verified_at IS '认证通过时间';

-- ============================================================
-- 7. 创建数据脱敏视图（供管理后台使用）
-- ============================================================
CREATE OR REPLACE VIEW admin_students_masked AS
SELECT
  u.id,
  u.nickname,
  u.avatar_url,
  CONCAT(SUBSTRING(u.phone, 1, 3), '****', SUBSTRING(u.phone, 8, 4)) as phone_masked,
  u.phone as phone_full, -- 仅super_admin可访问
  u.created_at,
  u.bio,
  u.university,
  u.major,
  u.grade,
  u.city,
  sp.level_a,
  sp.level_b,
  sp.opc_label,
  sp.opc_label_secondary,
  sp.task_count,
  sp.total_earnings,
  sp.track
FROM users u
LEFT JOIN student_profiles sp ON u.id = sp.user_id
WHERE u.role = 'student' AND u.deleted_at IS NULL;

COMMENT ON VIEW admin_students_masked IS '管理后台学生列表视图（包含脱敏数据）';

-- ============================================================
-- 8. 创建企业脱敏视图
-- ============================================================
CREATE OR REPLACE VIEW admin_companies_masked AS
SELECT
  u.id,
  u.nickname,
  u.avatar_url,
  CONCAT(SUBSTRING(u.phone, 1, 3), '****', SUBSTRING(u.phone, 8, 4)) as phone_masked,
  u.phone as phone_full,
  u.created_at,
  cp.company_name,
  cp.contact_name,
  cp.contact_phone,
  cp.industry,
  cp.company_size,
  cp.verified,
  cp.verified_at
FROM users u
LEFT JOIN company_profiles cp ON u.id = cp.user_id
WHERE u.role = 'company' AND u.deleted_at IS NULL;

COMMENT ON VIEW admin_companies_masked IS '管理后台企业列表视图（包含脱敏数据）';

-- ============================================================
-- 9. 创建审计日志记录函数
-- ============================================================
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id UUID,
  p_action VARCHAR(50),
  p_resource_type VARCHAR(50),
  p_resource_id UUID,
  p_details JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO admin_audit_logs (
    admin_id, action, resource_type, resource_id,
    details, ip_address, user_agent
  ) VALUES (
    p_admin_id, p_action, p_resource_type, p_resource_id,
    p_details, p_ip_address, p_user_agent
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_admin_action IS '记录管理员操作审计日志';

-- ============================================================
-- 10. 示例：如何使用审计日志
-- ============================================================
-- SELECT log_admin_action(
--   'admin-uuid',
--   'view_student_detail',
--   'student',
--   'student-uuid',
--   '{"viewed_fields": ["phone", "email"]}'::jsonb,
--   '192.168.1.1'::inet,
--   'Mozilla/5.0...'
-- );

-- ============================================================
-- 11. 查询审计日志示例
-- ============================================================
-- 查看某个管理员的所有操作
-- SELECT * FROM admin_audit_logs WHERE admin_id = 'admin-uuid' ORDER BY created_at DESC;

-- 查看所有查看手机号的操作
-- SELECT * FROM admin_audit_logs WHERE action = 'view_phone' ORDER BY created_at DESC;

-- 查看某个学生被查看的记录
-- SELECT * FROM admin_audit_logs
-- WHERE resource_type = 'student' AND resource_id = 'student-uuid'
-- ORDER BY created_at DESC;

-- ============================================================
-- 完成
-- ============================================================
