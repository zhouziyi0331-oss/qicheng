-- 支付托管系统
-- 实现报价净收入、托管账户、资金释放、提现等功能

-- 1. 托管账户表
CREATE TABLE IF NOT EXISTS escrow_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('student', 'company')),

  -- 余额字段（单位：分）
  total_balance INTEGER DEFAULT 0 NOT NULL, -- 总余额
  frozen_balance INTEGER DEFAULT 0 NOT NULL, -- 冻结金额（托管中）
  available_balance INTEGER DEFAULT 0 NOT NULL, -- 可用余额（可提现）
  pending_settlement INTEGER DEFAULT 0 NOT NULL, -- 待结算金额（7天后可提现）

  -- 累计统计
  total_income INTEGER DEFAULT 0 NOT NULL, -- 累计收入
  total_withdrawal INTEGER DEFAULT 0 NOT NULL, -- 累计提现

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_escrow_accounts_user ON escrow_accounts(user_id, user_type);

-- 2. 任务报价表
CREATE TABLE IF NOT EXISTS task_quotes (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 报价金额（单位：分）
  quoted_amount INTEGER NOT NULL, -- 企业报价
  platform_fee_rate DECIMAL(5,4) DEFAULT 0.05 NOT NULL, -- 平台费率（默认5%）
  platform_fee INTEGER NOT NULL, -- 平台费用
  student_net_income INTEGER NOT NULL, -- 学生净收入

  -- 状态
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending',      -- 待学生确认
    'accepted',     -- 学生已接受
    'rejected',     -- 学生已拒绝
    'paid',         -- 企业已支付（进入托管）
    'completed',    -- 任务完成（进入待结算）
    'released',     -- 资金已释放（可提现）
    'cancelled'     -- 已取消
  )),

  -- 时间节点
  quoted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP,
  paid_at TIMESTAMP,
  completed_at TIMESTAMP,
  released_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_task_quotes_task ON task_quotes(task_id);
CREATE INDEX idx_task_quotes_student ON task_quotes(student_id);
CREATE INDEX idx_task_quotes_company ON task_quotes(company_id);
CREATE INDEX idx_task_quotes_status ON task_quotes(status);

-- 3. 资金流水表
CREATE TABLE IF NOT EXISTS transaction_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('student', 'company')),

  -- 交易类型
  transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN (
    'payment',          -- 企业支付
    'escrow',           -- 进入托管
    'settlement',       -- 进入待结算
    'release',          -- 释放到可提现
    'withdrawal',       -- 提现
    'refund',           -- 退款
    'platform_fee'      -- 平台费用
  )),

  -- 金额（单位：分）
  amount INTEGER NOT NULL,
  balance_before INTEGER NOT NULL, -- 交易前余额
  balance_after INTEGER NOT NULL, -- 交易后余额

  -- 关联信息
  task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  quote_id INTEGER REFERENCES task_quotes(id) ON DELETE SET NULL,
  withdrawal_id INTEGER REFERENCES withdrawal_requests(id) ON DELETE SET NULL,

  -- 描述
  description TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transaction_logs_user ON transaction_logs(user_id, user_type);
CREATE INDEX idx_transaction_logs_type ON transaction_logs(transaction_type);
CREATE INDEX idx_transaction_logs_task ON transaction_logs(task_id);
CREATE INDEX idx_transaction_logs_created ON transaction_logs(created_at);

-- 4. 提现申请表
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 提现金额（单位：分）
  amount INTEGER NOT NULL CHECK (amount >= 1000), -- 最低10元

  -- 提现方式
  withdrawal_method VARCHAR(20) NOT NULL CHECK (withdrawal_method IN ('wechat', 'alipay')),

  -- 收款账户信息（加密存储）
  account_name VARCHAR(100) NOT NULL, -- 真实姓名
  account_number VARCHAR(100) NOT NULL, -- 账号

  -- 状态
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending',      -- 待审核
    'approved',     -- 已批准
    'processing',   -- 处理中
    'completed',    -- 已完成
    'rejected',     -- 已拒绝
    'failed'        -- 失败
  )),

  -- 审核信息
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  reject_reason TEXT,

  -- 第三方支付信息
  payment_order_id VARCHAR(100), -- 支付订单号
  payment_completed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_withdrawal_requests_user ON withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX idx_withdrawal_requests_created ON withdrawal_requests(created_at);

-- 5. 支付订单表（企业支付）
CREATE TABLE IF NOT EXISTS payment_orders (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  quote_id INTEGER NOT NULL REFERENCES task_quotes(id) ON DELETE CASCADE,

  -- 订单金额（单位：分）
  amount INTEGER NOT NULL,

  -- 支付方式
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('wechat', 'alipay', 'balance')),

  -- 订单状态
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending',      -- 待支付
    'processing',   -- 支付处理中
    'completed',    -- 支付成功
    'failed',       -- 支付失败
    'cancelled',    -- 已取消
    'refunded'      -- 已退款
  )),

  -- 第三方支付信息
  payment_order_id VARCHAR(100), -- 第三方订单号
  payment_completed_at TIMESTAMP,

  -- 退款信息
  refund_amount INTEGER,
  refund_reason TEXT,
  refunded_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_orders_company ON payment_orders(company_id);
CREATE INDEX idx_payment_orders_task ON payment_orders(task_id);
CREATE INDEX idx_payment_orders_status ON payment_orders(status);

-- 6. 扩展 tasks 表，添加支付相关字段
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'unpaid'
  CHECK (payment_status IN ('unpaid', 'paid', 'in_escrow', 'in_settlement', 'released', 'refunded'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS escrow_amount INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS settlement_date TIMESTAMP;

-- 7. 创建触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_escrow_accounts_updated_at BEFORE UPDATE ON escrow_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_quotes_updated_at BEFORE UPDATE ON task_quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_withdrawal_requests_updated_at BEFORE UPDATE ON withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_orders_updated_at BEFORE UPDATE ON payment_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. 初始化所有用户的托管账户
INSERT INTO escrow_accounts (user_id, user_type)
SELECT id, role FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM escrow_accounts WHERE escrow_accounts.user_id = users.id
)
ON CONFLICT DO NOTHING;
