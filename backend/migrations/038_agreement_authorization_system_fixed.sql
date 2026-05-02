-- 注册协议与数据授权系统数据库迁移（修复版）
-- 创建时间: 2026-04-13
-- 功能：实现用户协议、数据授权、隐私保护
-- 修复：使用UUID类型匹配现有users表

-- ============================================
-- 1. 协议文档表
-- ============================================
CREATE TABLE IF NOT EXISTS agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_type VARCHAR(50) NOT NULL CHECK (agreement_type IN ('user_agreement', 'privacy_policy', 'data_authorization', 'payment_terms')),
  version VARCHAR(20) NOT NULL,

  -- 协议内容
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,

  -- 状态
  is_active BOOLEAN DEFAULT TRUE,
  is_required BOOLEAN DEFAULT TRUE, -- 是否必须同意

  -- 生效时间
  effective_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. 用户协议签署记录表
-- ============================================
CREATE TABLE IF NOT EXISTS user_agreement_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agreement_id UUID NOT NULL REFERENCES agreements(id) ON DELETE CASCADE,

  -- 签署信息
  signed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,

  -- 唯一约束：每个用户对每个协议版本只能签署一次
  UNIQUE(user_id, agreement_id)
);

-- ============================================
-- 3. 数据授权设置表
-- ============================================
CREATE TABLE IF NOT EXISTS data_authorization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- 基础数据授权
  allow_profile_analysis BOOLEAN DEFAULT TRUE, -- 允许分析个人资料
  allow_behavior_tracking BOOLEAN DEFAULT TRUE, -- 允许行为追踪
  allow_ability_assessment BOOLEAN DEFAULT TRUE, -- 允许能力评估

  -- 数据使用授权
  allow_ai_training BOOLEAN DEFAULT FALSE, -- 允许用于AI训练
  allow_research_use BOOLEAN DEFAULT FALSE, -- 允许用于研究
  allow_third_party_share BOOLEAN DEFAULT FALSE, -- 允许第三方共享

  -- 营销授权
  allow_marketing_push BOOLEAN DEFAULT TRUE, -- 允许营销推送
  allow_personalized_ads BOOLEAN DEFAULT TRUE, -- 允许个性化广告

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. 数据授权变更历史表
-- ============================================
CREATE TABLE IF NOT EXISTS data_authorization_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  setting_id UUID NOT NULL REFERENCES data_authorization_settings(id) ON DELETE CASCADE,

  -- 变更内容
  changed_field VARCHAR(50) NOT NULL,
  old_value BOOLEAN,
  new_value BOOLEAN NOT NULL,

  -- 变更原因
  change_reason VARCHAR(100),

  -- 时间戳
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. 必读条款表
-- ============================================
CREATE TABLE IF NOT EXISTS required_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID NOT NULL REFERENCES agreements(id) ON DELETE CASCADE,

  -- 条款内容
  term_key VARCHAR(50) NOT NULL UNIQUE,
  term_title VARCHAR(200) NOT NULL,
  term_content TEXT NOT NULL,

  -- 展示顺序
  display_order INTEGER DEFAULT 0,

  -- 是否必须确认
  requires_explicit_consent BOOLEAN DEFAULT TRUE,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. 用户条款确认记录表
-- ============================================
CREATE TABLE IF NOT EXISTS user_term_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES required_terms(id) ON DELETE CASCADE,

  -- 确认信息
  confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),

  -- 唯一约束
  UNIQUE(user_id, term_id)
);

-- ============================================
-- 7. 创建索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_agreements_type_active ON agreements(agreement_type, is_active);
CREATE INDEX IF NOT EXISTS idx_user_agreement_signatures_user_id ON user_agreement_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_user_agreement_signatures_agreement_id ON user_agreement_signatures(agreement_id);
CREATE INDEX IF NOT EXISTS idx_data_authorization_settings_user_id ON data_authorization_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_data_authorization_history_user_id ON data_authorization_history(user_id);
CREATE INDEX IF NOT EXISTS idx_required_terms_agreement_id ON required_terms(agreement_id);
CREATE INDEX IF NOT EXISTS idx_user_term_confirmations_user_id ON user_term_confirmations(user_id);

-- ============================================
-- 8. 添加注释
-- ============================================
COMMENT ON TABLE agreements IS '协议文档表';
COMMENT ON TABLE user_agreement_signatures IS '用户协议签署记录表';
COMMENT ON TABLE data_authorization_settings IS '数据授权设置表';
COMMENT ON TABLE data_authorization_history IS '数据授权变更历史表';
COMMENT ON TABLE required_terms IS '必读条款表';
COMMENT ON TABLE user_term_confirmations IS '用户条款确认记录表';
