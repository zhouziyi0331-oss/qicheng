-- 支付托管系统数据库迁移（修复版）
-- 创建时间: 2026-04-13
-- 功能：实现支付托管、资金冻结释放、提现系统
-- 修复：使用UUID类型匹配现有users表

-- ============================================
-- 1. 托管账户表
-- ============================================
CREATE TABLE IF NOT EXISTS escrow_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- 账户余额（单位：分）
  pending_balance BIGINT DEFAULT 0 CHECK (pending_balance >= 0), -- 待结算余额（任务进行中）
  available_balance BIGINT DEFAULT 0 CHECK (available_balance >= 0), -- 可提现余额（任务已完成）

  -- 统计信息
  total_earned BIGINT DEFAULT 0, -- 累计收入
  total_withdrawn BIGINT DEFAULT 0, -- 累计提现

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. 托管交易流水表
-- ============================================
CREATE TABLE IF NOT EXISTS escrow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES escrow_accounts(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,

  -- 交易类型
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('freeze', 'release', 'refund', 'withdraw')),

  -- 金额（单位：分）
  amount BIGINT NOT NULL,

  -- 余额快照
  pending_balance_before BIGINT NOT NULL,
  pending_balance_after BIGINT NOT NULL,
  available_balance_before BIGINT NOT NULL,
  available_balance_after BIGINT NOT NULL,

  -- 描述
  description TEXT,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. 提现申请表
-- ============================================
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES escrow_accounts(id) ON DELETE CASCADE,

  -- 提现金额（单位：分）
  amount BIGINT NOT NULL CHECK (amount >= 10000), -- 最低100元

  -- 提现方式
  withdrawal_method VARCHAR(20) NOT NULL CHECK (withdrawal_method IN ('wechat', 'alipay')),
  withdrawal_account VARCHAR(100) NOT NULL, -- 微信openid或支付宝账号

  -- 状态
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),

  -- 审核信息
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reject_reason TEXT,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. 提现记录表
-- ============================================
CREATE TABLE IF NOT EXISTS withdrawal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES withdrawal_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 提现金额（单位：分）
  amount BIGINT NOT NULL,

  -- 提现方式
  withdrawal_method VARCHAR(20) NOT NULL,

  -- 第三方交易信息
  transaction_id VARCHAR(100), -- 微信/支付宝交易号
  transaction_status VARCHAR(20),

  -- 时间戳
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. 创建索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_escrow_accounts_user_id ON escrow_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_account_id ON escrow_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_task_id ON escrow_transactions(task_id);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_created_at ON escrow_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_records_user_id ON withdrawal_records(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_records_request_id ON withdrawal_records(request_id);

-- ============================================
-- 6. 添加注释
-- ============================================
COMMENT ON TABLE escrow_accounts IS '托管账户表';
COMMENT ON TABLE escrow_transactions IS '托管交易流水表';
COMMENT ON TABLE withdrawal_requests IS '提现申请表';
COMMENT ON TABLE withdrawal_records IS '提现记录表';
