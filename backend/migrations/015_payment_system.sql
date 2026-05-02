-- 微信支付系统数据库迁移
-- 创建时间：2024年

-- 1. 创建支付订单表
CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no VARCHAR(64) UNIQUE NOT NULL, -- 订单号（系统生成）
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('student', 'company')),

  -- 支付类型
  payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('deposit', 'balance', 'full')),
  -- deposit: 定金（30%）
  -- balance: 尾款（70%）
  -- full: 全款（100%）

  -- 金额信息（单位：分）
  total_amount INTEGER NOT NULL, -- 总金额
  paid_amount INTEGER DEFAULT 0, -- 已支付金额
  refund_amount INTEGER DEFAULT 0, -- 已退款金额

  -- 订单状态
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',    -- 待支付
    'paying',     -- 支付中
    'paid',       -- 已支付
    'refunding',  -- 退款中
    'refunded',   -- 已退款
    'cancelled',  -- 已取消
    'expired'     -- 已过期
  )),

  -- 微信支付信息
  wx_prepay_id VARCHAR(128), -- 微信预支付ID
  wx_transaction_id VARCHAR(128), -- 微信交易号
  wx_trade_type VARCHAR(20), -- 交易类型（JSAPI/NATIVE/APP/MWEB）

  -- 时间信息
  expire_time TIMESTAMP, -- 过期时间（15分钟）
  paid_at TIMESTAMP, -- 支付完成时间
  refund_at TIMESTAMP, -- 退款完成时间

  -- 备注
  description TEXT, -- 订单描述
  remark TEXT, -- 备注

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 创建支付交易记录表
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_no VARCHAR(64) UNIQUE NOT NULL, -- 交易流水号
  order_id UUID NOT NULL REFERENCES payment_orders(id) ON DELETE CASCADE,

  -- 交易类型
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN (
    'payment',  -- 支付
    'refund',   -- 退款
    'transfer'  -- 转账
  )),

  -- 金额（单位：分）
  amount INTEGER NOT NULL,

  -- 微信支付信息
  wx_transaction_id VARCHAR(128), -- 微信交易号
  wx_refund_id VARCHAR(128), -- 微信退款单号

  -- 交易状态
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',   -- 处理中
    'success',   -- 成功
    'failed',    -- 失败
    'cancelled'  -- 已取消
  )),

  -- 失败信息
  error_code VARCHAR(50),
  error_message TEXT,

  -- 回调信息
  notify_data JSONB, -- 微信回调数据

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 创建用户钱包表
CREATE TABLE IF NOT EXISTS user_wallets (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  -- 余额（单位：分）
  balance INTEGER DEFAULT 0, -- 可用余额
  frozen_balance INTEGER DEFAULT 0, -- 冻结余额
  total_income INTEGER DEFAULT 0, -- 累计收入
  total_expense INTEGER DEFAULT 0, -- 累计支出

  -- 提现信息
  withdrawable_balance INTEGER DEFAULT 0, -- 可提现余额
  total_withdrawn INTEGER DEFAULT 0, -- 累计提现

  -- 微信支付信息
  wx_openid VARCHAR(128), -- 微信openid

  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. 创建钱包流水表
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_no VARCHAR(64) UNIQUE NOT NULL, -- 流水号
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 交易类型
  transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN (
    'income',           -- 收入
    'expense',          -- 支出
    'freeze',           -- 冻结
    'unfreeze',         -- 解冻
    'withdraw',         -- 提现
    'refund',           -- 退款
    'platform_fee',     -- 平台抽成
    'deposit_payment',  -- 定金支付
    'balance_payment',  -- 尾款支付
    'task_income'       -- 任务收入
  )),

  -- 金额（单位：分）
  amount INTEGER NOT NULL,

  -- 余额快照
  balance_before INTEGER NOT NULL, -- 交易前余额
  balance_after INTEGER NOT NULL, -- 交易后余额

  -- 关联信息
  related_order_id UUID REFERENCES payment_orders(id),
  related_task_id UUID REFERENCES tasks(id),

  -- 描述
  description TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. 创建提现申请表
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_no VARCHAR(64) UNIQUE NOT NULL, -- 申请单号
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 提现金额（单位：分）
  amount INTEGER NOT NULL,

  -- 提现方式
  withdraw_type VARCHAR(20) NOT NULL DEFAULT 'wechat' CHECK (withdraw_type IN ('wechat', 'alipay', 'bank')),

  -- 提现账户信息
  account_info JSONB, -- 账户信息（微信openid、支付宝账号、银行卡号等）

  -- 状态
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',   -- 待审核
    'approved',  -- 已审核
    'processing',-- 处理中
    'completed', -- 已完成
    'rejected',  -- 已拒绝
    'failed'     -- 失败
  )),

  -- 审核信息
  reviewer_id UUID REFERENCES users(id),
  review_remark TEXT,
  reviewed_at TIMESTAMP,

  -- 处理信息
  wx_payment_no VARCHAR(128), -- 微信付款单号
  completed_at TIMESTAMP,

  -- 失败信息
  error_message TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. 创建平台收入记录表
CREATE TABLE IF NOT EXISTS platform_revenues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  order_id UUID REFERENCES payment_orders(id),

  -- 金额（单位：分）
  total_amount INTEGER NOT NULL, -- 任务总金额
  platform_fee INTEGER NOT NULL, -- 平台抽成（15%）
  student_income INTEGER NOT NULL, -- 学生收入（85%）

  -- 状态
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',   -- 待结算
    'settled',   -- 已结算
    'cancelled'  -- 已取消
  )),

  settled_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. 创建索引
CREATE INDEX IF NOT EXISTS idx_payment_orders_order_no ON payment_orders(order_no);
CREATE INDEX IF NOT EXISTS idx_payment_orders_task_id ON payment_orders(task_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_created_at ON payment_orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_created_at ON withdrawal_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_revenues_task_id ON platform_revenues(task_id);
CREATE INDEX IF NOT EXISTS idx_platform_revenues_status ON platform_revenues(status);

-- 8. 创建触发器：自动更新updated_at
CREATE OR REPLACE FUNCTION update_payment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_orders_updated_at
  BEFORE UPDATE ON payment_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_updated_at();

CREATE TRIGGER trigger_update_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_updated_at();

CREATE TRIGGER trigger_update_user_wallets_updated_at
  BEFORE UPDATE ON user_wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_updated_at();

CREATE TRIGGER trigger_update_withdrawal_requests_updated_at
  BEFORE UPDATE ON withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_updated_at();

-- 9. 初始化用户钱包（为现有用户创建钱包）
INSERT INTO user_wallets (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM user_wallets);

COMMENT ON TABLE payment_orders IS '支付订单表';
COMMENT ON TABLE payment_transactions IS '支付交易记录表';
COMMENT ON TABLE user_wallets IS '用户钱包表';
COMMENT ON TABLE wallet_transactions IS '钱包流水表';
COMMENT ON TABLE withdrawal_requests IS '提现申请表';
COMMENT ON TABLE platform_revenues IS '平台收入记录表';
