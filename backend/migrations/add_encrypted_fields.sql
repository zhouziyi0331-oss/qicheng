-- P1安全加固：手机号和敏感数据加密存储
-- 执行时间：预计5-10分钟
-- ⚠️ 重要：执行前请确保已备份数据库！

-- ============================================================
-- 第一步：添加加密字段到users表
-- ============================================================

-- 添加加密字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_encrypted TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_hash VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS wechat_openid_encrypted TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wechat_openid_hash VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS wechat_unionid_encrypted TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wechat_unionid_hash VARCHAR(64);

-- 添加索引（用于查询）
CREATE INDEX IF NOT EXISTS idx_users_phone_hash ON users(phone_hash);
CREATE INDEX IF NOT EXISTS idx_users_wechat_openid_hash ON users(wechat_openid_hash);
CREATE INDEX IF NOT EXISTS idx_users_wechat_unionid_hash ON users(wechat_unionid_hash);

-- 添加注释
COMMENT ON COLUMN users.phone_encrypted IS '加密后的手机号 (AES-256-GCM)';
COMMENT ON COLUMN users.phone_hash IS '手机号SHA256哈希 (用于查询索引)';
COMMENT ON COLUMN users.wechat_openid_encrypted IS '加密后的微信openid';
COMMENT ON COLUMN users.wechat_openid_hash IS '微信openid SHA256哈希';
COMMENT ON COLUMN users.wechat_unionid_encrypted IS '加密后的微信unionid';
COMMENT ON COLUMN users.wechat_unionid_hash IS '微信unionid SHA256哈希';

-- ============================================================
-- 第二步：数据迁移说明
-- ============================================================
--
-- ⚠️ 数据迁移需要在Node.js脚本中完成，因为需要使用加密工具
--
-- 迁移步骤：
-- 1. 运行 npm run migrate:encrypt-phone
-- 2. 验证加密数据正确性
-- 3. 更新应用代码使用加密字段
-- 4. 测试所有相关功能
-- 5. 确认无误后，删除旧的明文字段
--
-- 删除明文字段的SQL（迁移完成后执行）：
-- ALTER TABLE users DROP COLUMN IF EXISTS phone;
-- ALTER TABLE users DROP COLUMN IF EXISTS wechat_openid;
-- ALTER TABLE users DROP COLUMN IF EXISTS wechat_unionid;
--
-- ============================================================

-- ============================================================
-- 第三步：添加加密字段到其他表（如需要）
-- ============================================================

-- admin_users表（如果有敏感信息）
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS phone_encrypted TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS phone_hash VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_admin_users_phone_hash ON admin_users(phone_hash);

-- ============================================================
-- 第四步：验证SQL
-- ============================================================

-- 检查字段是否添加成功
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('phone_encrypted', 'phone_hash', 'wechat_openid_encrypted', 'wechat_openid_hash');

-- 检查索引是否创建成功
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'users'
AND indexname IN ('idx_users_phone_hash', 'idx_users_wechat_openid_hash');

-- ============================================================
-- 执行记录
-- ============================================================
-- 执行时间：______
-- 执行人：______
-- 备份文件：______
-- 验证结果：______
-- ============================================================
