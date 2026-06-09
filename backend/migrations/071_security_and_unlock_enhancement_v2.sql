-- ============================================
-- 数据安全与联系方式解锁系统增强 (适配现有架构)
-- Migration: 071_v2
-- ============================================

-- 1. 扩展 collaborations 表（已存在，添加状态字段）
ALTER TABLE collaborations
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS student_agreed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS company_agreed BOOLEAN DEFAULT false;

-- 2. 扩展 contact_unlocks 表（已存在，添加双向同意字段）
ALTER TABLE contact_unlocks
ADD COLUMN IF NOT EXISTS student_agreed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS company_agreed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS exchanged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS requested_by VARCHAR(20);

-- 3. 创建交付物加密元数据表
CREATE TABLE IF NOT EXISTS deliverable_encryption_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL,
  deliverable_type VARCHAR(50) NOT NULL,
  encryption_algorithm VARCHAR(50) NOT NULL DEFAULT 'aes-256-gcm',
  encryption_key_id VARCHAR(100) NOT NULL,
  iv VARCHAR(100) NOT NULL,
  auth_tag VARCHAR(100),
  encrypted_fields JSONB NOT NULL,
  encrypted_at TIMESTAMPTZ DEFAULT NOW(),
  encrypted_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deliverable_encryption_deliverable
ON deliverable_encryption_metadata(deliverable_id, deliverable_type);

-- 4. 创建数据访问日志表
CREATE TABLE IF NOT EXISTS data_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  success BOOLEAN DEFAULT true,
  decryption_performed BOOLEAN DEFAULT false,
  decrypted_fields JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_access_logs_user ON data_access_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_resource ON data_access_logs(resource_type, resource_id, created_at DESC);

-- 5. 创建安全承诺配置表
CREATE TABLE IF NOT EXISTS security_commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入默认安全承诺
INSERT INTO security_commitments (title, content, category, display_order) VALUES
('数据加密存储', '所有交付物和敏感信息采用AES-256-GCM加密算法存储，确保数据安全。', 'data_security', 1),
('访问日志记录', '所有数据访问行为都会被记录，包括查看、下载、解密等操作，可追溯审计。', 'data_security', 2),
('企业数据隔离', '不同企业的数据完全隔离，平台无法查看企业的交付物内容。', 'data_security', 3),
('联系方式保护', '学生和企业的联系方式受到保护，需完成2单合作且双方同意后才能解锁。', 'privacy_protection', 4),
('透明解锁规则', '解锁进度和条件完全透明，用户随时可查看当前状态。', 'privacy_protection', 5)
ON CONFLICT DO NOTHING;

-- 6. 创建密钥管理表
CREATE TABLE IF NOT EXISTS encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id VARCHAR(100) UNIQUE NOT NULL,
  key_version INTEGER NOT NULL DEFAULT 1,
  algorithm VARCHAR(50) NOT NULL DEFAULT 'aes-256-gcm',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  encryption_count INTEGER DEFAULT 0
);

-- 插入默认密钥记录
INSERT INTO encryption_keys (key_id, key_version, algorithm, status) VALUES
('default-key-v1', 1, 'aes-256-gcm', 'active')
ON CONFLICT (key_id) DO NOTHING;

-- 7. 修改交付物表（添加加密标记）
ALTER TABLE task_deliverables
ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS encrypted_at TIMESTAMPTZ;

-- 8. 创建合作进度视图（基于现有 collaborations 表）
-- 注意：需要类型转换，因为 collaborations 用 INTEGER，contact_unlocks 用 UUID
CREATE OR REPLACE VIEW collaboration_progress AS
SELECT
  c.student_id::TEXT as student_id,
  c.company_id::TEXT as company_id,
  c.collaboration_count as completed_count,
  CASE
    WHEN c.collaboration_count >= 2 THEN true
    ELSE false
  END as can_unlock_contact,
  COALESCE(cu.exchanged, false) as contact_unlocked,
  COALESCE(cu.student_agreed, false) as student_agreed,
  COALESCE(cu.company_agreed, false) as company_agreed,
  c.last_collaboration_at,
  cu.unlocked_at
FROM collaborations c
LEFT JOIN contact_unlocks cu
  ON c.student_id::TEXT = cu.student_id::TEXT
  AND c.company_id::TEXT = cu.company_id::TEXT;

-- 9. 创建或替换解锁检查函数（2单解锁）
-- 注意：collaborations 表使用 INTEGER 类型的 ID
CREATE OR REPLACE FUNCTION can_exchange_contacts(
  p_student_id INTEGER,
  p_company_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT collaboration_count INTO v_count
  FROM collaborations
  WHERE student_id = p_student_id
    AND company_id = p_company_id;

  RETURN (COALESCE(v_count, 0) >= 2);
END;
$$ LANGUAGE plpgsql;

-- 10. 创建合作计数更新函数
CREATE OR REPLACE FUNCTION increment_collaboration_count(
  p_student_id INTEGER,
  p_company_id INTEGER
) RETURNS void AS $$
BEGIN
  INSERT INTO collaborations (
    student_id,
    company_id,
    collaboration_count,
    first_collaboration_at,
    last_collaboration_at,
    created_at,
    updated_at
  ) VALUES (
    p_student_id,
    p_company_id,
    1,
    NOW(),
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (student_id, company_id)
  DO UPDATE SET
    collaboration_count = collaborations.collaboration_count + 1,
    last_collaboration_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 11. 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_collaborations_student_company
ON collaborations(student_id, company_id);

CREATE INDEX IF NOT EXISTS idx_contact_unlocks_student_company
ON contact_unlocks(student_id, company_id);

-- ============================================
-- Migration 完成
-- ============================================
