-- ============================================
-- Migration: 071_security_and_unlock_enhancement.sql
-- Description: 数据安全与联系方式解锁系统
-- Author: Claude
-- Date: 2026-05-26
-- ============================================

-- ============================================
-- 1. 修改联系方式交换逻辑（从3单改为2单）
-- ============================================

-- 更新函数：检查是否可以交换联系方式（改为2单）
CREATE OR REPLACE FUNCTION can_exchange_contacts(
  p_student_id UUID,
  p_company_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
  v_exchanged BOOLEAN;
BEGIN
  -- 检查合作次数（改为2次）
  SELECT COUNT(*) INTO v_count
  FROM collaboration_history
  WHERE student_id = p_student_id
    AND company_id = p_company_id
    AND status = 'completed';

  -- 检查是否已经交换过
  SELECT exchanged INTO v_exchanged
  FROM contact_exchange_requests
  WHERE student_id = p_student_id AND company_id = p_company_id;

  RETURN (v_count >= 2 AND COALESCE(v_exchanged, false) = false);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION can_exchange_contacts IS '检查是否可以交换联系方式（2单解锁）';

-- ============================================
-- 2. 交付物加密元数据表
-- ============================================

CREATE TABLE IF NOT EXISTS deliverable_encryption_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 关联信息
  deliverable_id UUID NOT NULL, -- 可能关联task_deliverables或pbl_project_deliverables
  deliverable_type VARCHAR(50) NOT NULL, -- task_deliverable, pbl_deliverable

  -- 加密信息
  encryption_algorithm VARCHAR(50) NOT NULL DEFAULT 'aes-256-gcm',
  encryption_key_id VARCHAR(100) NOT NULL, -- 密钥ID（用于密钥轮换）
  iv VARCHAR(100) NOT NULL, -- 初始化向量（Base64编码）
  auth_tag VARCHAR(100), -- GCM认证标签（Base64编码）

  -- 加密字段
  encrypted_fields JSONB NOT NULL, -- 记录哪些字段被加密了
  -- 例如: {"description": true, "file_url": true, "content": true}

  -- 元数据
  encrypted_at TIMESTAMPTZ DEFAULT NOW(),
  encrypted_by UUID REFERENCES users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deliverable_encryption_deliverable
  ON deliverable_encryption_metadata(deliverable_id, deliverable_type);
CREATE INDEX IF NOT EXISTS idx_deliverable_encryption_key
  ON deliverable_encryption_metadata(encryption_key_id);

COMMENT ON TABLE deliverable_encryption_metadata IS '交付物加密元数据表';
COMMENT ON COLUMN deliverable_encryption_metadata.iv IS '初始化向量，每次加密都不同';
COMMENT ON COLUMN deliverable_encryption_metadata.auth_tag IS 'GCM模式的认证标签，用于验证数据完整性';

-- ============================================
-- 3. 数据访问日志表
-- ============================================

CREATE TABLE IF NOT EXISTS data_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 访问者信息
  user_id UUID NOT NULL REFERENCES users(id),
  user_type VARCHAR(50) NOT NULL, -- student, company, platform_admin

  -- 访问资源
  resource_type VARCHAR(50) NOT NULL, -- task_deliverable, pbl_deliverable, contact_info, student_profile
  resource_id UUID NOT NULL,

  -- 访问详情
  action VARCHAR(50) NOT NULL, -- view, download, decrypt, export, create
  access_method VARCHAR(50), -- web, api, admin_panel

  -- 访问结果
  success BOOLEAN DEFAULT true,
  failure_reason TEXT,

  -- 解密信息（如果涉及解密）
  decryption_performed BOOLEAN DEFAULT false,
  decrypted_fields JSONB, -- 记录解密了哪些字段

  -- 网络信息
  ip_address INET,
  user_agent TEXT,

  -- 时间信息
  access_duration_ms INTEGER, -- 访问持续时间（毫秒）
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_access_user ON data_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_data_access_resource ON data_access_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_data_access_action ON data_access_logs(action);
CREATE INDEX IF NOT EXISTS idx_data_access_created ON data_access_logs(created_at DESC);

COMMENT ON TABLE data_access_logs IS '数据访问日志表（包含解密操作）';

-- ============================================
-- 4. 扩展任务交付物表（添加加密标记）
-- ============================================

-- 为task_deliverables添加加密标记（如果表存在）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='task_deliverables') THEN
    ALTER TABLE task_deliverables
    ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS encrypted_at TIMESTAMPTZ;
  END IF;
END $$;

-- 为pbl_project_deliverables添加加密标记
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='pbl_project_deliverables') THEN
    ALTER TABLE pbl_project_deliverables
    ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS encrypted_at TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================
-- 5. 合作进度视图（用于前端展示）
-- ============================================

CREATE OR REPLACE VIEW collaboration_progress AS
SELECT
  ch.student_id,
  ch.company_id,
  COUNT(*) FILTER (WHERE ch.status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE ch.status = 'in_progress') as in_progress_count,

  -- 解锁状态（改为2单）
  CASE
    WHEN COUNT(*) FILTER (WHERE ch.status = 'completed') >= 2 THEN true
    ELSE false
  END as can_unlock_contact,

  -- 是否已解锁
  COALESCE(cer.exchanged, false) as contact_unlocked,

  -- 双方同意状态
  cer.student_agreed,
  cer.company_agreed,

  -- 最新合作时间
  MAX(ch.completed_at) as last_completed_at,

  -- 平均评分
  ROUND(AVG(ch.student_rating), 1) as avg_student_rating,
  ROUND(AVG(ch.company_rating), 1) as avg_company_rating

FROM collaboration_history ch
LEFT JOIN contact_exchange_requests cer
  ON ch.student_id = cer.student_id
  AND ch.company_id = cer.company_id
GROUP BY ch.student_id, ch.company_id, cer.exchanged, cer.student_agreed, cer.company_agreed;

COMMENT ON VIEW collaboration_progress IS '合作进度视图（用于前端展示2单解锁进度）';

-- ============================================
-- 6. 安全承诺配置表
-- ============================================

CREATE TABLE IF NOT EXISTS security_commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 承诺内容
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) NOT NULL, -- data_security, privacy_protection, encryption, access_control

  -- 显示顺序
  display_order INTEGER DEFAULT 0,

  -- 状态
  is_active BOOLEAN DEFAULT true,

  -- 版本控制
  version VARCHAR(20) DEFAULT '1.0',
  effective_date DATE DEFAULT CURRENT_DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_commitments_category ON security_commitments(category);
CREATE INDEX IF NOT EXISTS idx_security_commitments_active ON security_commitments(is_active);

COMMENT ON TABLE security_commitments IS '平台安全承诺配置表';

-- 插入默认安全承诺
INSERT INTO security_commitments (title, content, category, display_order) VALUES
('交付物加密存储', '所有学生提交的交付物内容均采用AES-256-GCM加密算法加密存储，确保数据安全。', 'encryption', 1),
('数据访问日志', '平台记录所有数据访问行为，包括查看、下载、解密等操作，确保可追溯。', 'access_control', 2),
('企业数据隔离', '企业只能访问自己发布任务的相关数据，无法查看其他企业的信息。', 'data_security', 3),
('2单后解锁联系方式', '同一企业与同一学生完成2单后，双方授权同意后可解锁联系方式，建立直接联系。', 'privacy_protection', 4),
('数据传输加密', '所有数据传输均采用HTTPS加密，防止中间人攻击。', 'data_security', 5),
('定期安全审计', '平台定期进行安全审计，及时发现和修复安全漏洞。', 'data_security', 6)
ON CONFLICT DO NOTHING;

-- ============================================
-- 7. 密钥管理表（用于密钥轮换）
-- ============================================

CREATE TABLE IF NOT EXISTS encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 密钥标识
  key_id VARCHAR(100) UNIQUE NOT NULL,

  -- 密钥信息（实际密钥存储在环境变量或密钥管理服务中）
  key_version INTEGER NOT NULL DEFAULT 1,
  algorithm VARCHAR(50) NOT NULL DEFAULT 'aes-256-gcm',

  -- 状态
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, rotating, deprecated

  -- 时间信息
  created_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  deprecated_at TIMESTAMPTZ,

  -- 使用统计
  encryption_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_encryption_keys_status ON encryption_keys(status);
CREATE INDEX IF NOT EXISTS idx_encryption_keys_key_id ON encryption_keys(key_id);

COMMENT ON TABLE encryption_keys IS '加密密钥管理表（实际密钥存储在环境变量中）';

-- 插入默认密钥记录
INSERT INTO encryption_keys (key_id, key_version, status) VALUES
('platform-key-v1', 1, 'active')
ON CONFLICT (key_id) DO NOTHING;

-- ============================================
-- 8. 更新时间戳触发器
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为新表添加更新时间戳触发器
DROP TRIGGER IF EXISTS update_deliverable_encryption_metadata_updated_at ON deliverable_encryption_metadata;
CREATE TRIGGER update_deliverable_encryption_metadata_updated_at
  BEFORE UPDATE ON deliverable_encryption_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_security_commitments_updated_at ON security_commitments;
CREATE TRIGGER update_security_commitments_updated_at
  BEFORE UPDATE ON security_commitments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. 权限设置
-- ============================================

-- 确保应用用户有权限访问新表
-- GRANT SELECT, INSERT, UPDATE ON deliverable_encryption_metadata TO app_user;
-- GRANT SELECT, INSERT ON data_access_logs TO app_user;
-- GRANT SELECT ON security_commitments TO app_user;
-- GRANT SELECT, UPDATE ON encryption_keys TO app_user;
-- GRANT SELECT ON collaboration_progress TO app_user;

-- ============================================
-- 完成
-- ============================================

-- 记录migration执行
DO $$
BEGIN
  RAISE NOTICE '✓ Migration 071_security_and_unlock_enhancement.sql completed successfully';
  RAISE NOTICE '  - Modified can_exchange_contacts function (3 -> 2 orders)';
  RAISE NOTICE '  - Created deliverable_encryption_metadata table';
  RAISE NOTICE '  - Created data_access_logs table';
  RAISE NOTICE '  - Created security_commitments table';
  RAISE NOTICE '  - Created encryption_keys table';
  RAISE NOTICE '  - Created collaboration_progress view';
  RAISE NOTICE '  - Added encryption columns to deliverable tables';
  RAISE NOTICE '  - Inserted default security commitments';
END $$;
