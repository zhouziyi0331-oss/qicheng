-- ============================================
-- 支付托管和提现系统
-- ============================================

-- 1. 托管账户表
CREATE TABLE IF NOT EXISTS escrow_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_type VARCHAR(20) NOT NULL, -- student, company

  -- 账户余额
  balance DECIMAL(12, 2) DEFAULT 0 CHECK (balance >= 0),
  frozen_balance DECIMAL(12, 2) DEFAULT 0 CHECK (frozen_balance >= 0), -- 冻结金额
  available_balance DECIMAL(12, 2) DEFAULT 0 CHECK (available_balance >= 0), -- 可用余额

  -- 累计统计
  total_income DECIMAL(12, 2) DEFAULT 0, -- 累计收入
  total_withdrawal DECIMAL(12, 2) DEFAULT 0, -- 累计提现
  total_frozen DECIMAL(12, 2) DEFAULT 0, -- 累计冻结

  -- 账户状态
  status VARCHAR(50) DEFAULT 'active', -- active, frozen, closed
  freeze_reason TEXT,

  -- 实名认证
  is_verified BOOLEAN DEFAULT false,
  real_name VARCHAR(100),
  id_card VARCHAR(50),
  bank_account VARCHAR(50),
  bank_name VARCHAR(100),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id)
);

CREATE INDEX idx_escrow_accounts_user ON escrow_accounts(user_id);
CREATE INDEX idx_escrow_accounts_status ON escrow_accounts(status);

-- 2. 托管交易表
CREATE TABLE IF NOT EXISTS escrow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

  -- 交易双方
  payer_id UUID NOT NULL REFERENCES users(id), -- 付款方（企业）
  payee_id UUID NOT NULL REFERENCES users(id), -- 收款方（学生）

  -- 金额
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  platform_fee DECIMAL(10, 2) DEFAULT 0, -- 平台手续费
  actual_amount DECIMAL(10, 2) NOT NULL, -- 实际到账金额

  -- 交易类型
  transaction_type VARCHAR(50) NOT NULL, -- deposit（托管）, release（释放）, refund（退款）, partial_release（部分释放）

  -- 交易状态
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed, cancelled

  -- 支付信息
  payment_method VARCHAR(50), -- alipay, wechat, bank_transfer
  payment_channel VARCHAR(50), -- 支付渠道
  payment_order_id VARCHAR(100), -- 第三方支付订单号
  payment_time TIMESTAMP,

  -- 描述
  description TEXT,
  remark TEXT,

  -- 失败原因
  failure_reason TEXT,

  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_escrow_transactions_task ON escrow_transactions(task_id);
CREATE INDEX idx_escrow_transactions_payer ON escrow_transactions(payer_id);
CREATE INDEX idx_escrow_transactions_payee ON escrow_transactions(payee_id);
CREATE INDEX idx_escrow_transactions_status ON escrow_transactions(status);
CREATE INDEX idx_escrow_transactions_created ON escrow_transactions(created_at DESC);

-- 3. 提现申请表
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES escrow_accounts(id),

  -- 提现金额
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  fee DECIMAL(10, 2) DEFAULT 0, -- 提现手续费
  actual_amount DECIMAL(10, 2) NOT NULL, -- 实际到账金额

  -- 提现方式
  withdrawal_method VARCHAR(50) NOT NULL, -- alipay, wechat, bank_transfer
  withdrawal_account VARCHAR(100) NOT NULL, -- 提现账号
  account_name VARCHAR(100) NOT NULL, -- 账户名

  -- 银行信息（如果是银行转账）
  bank_name VARCHAR(100),
  bank_branch VARCHAR(200),

  -- 状态
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, processing, completed, rejected, failed

  -- 审核信息
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_note TEXT,

  -- 处理信息
  processed_by UUID REFERENCES users(id),
  processed_at TIMESTAMP,
  transfer_order_id VARCHAR(100), -- 转账订单号
  transfer_time TIMESTAMP,

  -- 失败原因
  failure_reason TEXT,
  reject_reason TEXT,

  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_withdrawal_requests_user ON withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_requests_account ON withdrawal_requests(account_id);
CREATE INDEX idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX idx_withdrawal_requests_created ON withdrawal_requests(created_at DESC);

-- 4. 账户流水表
CREATE TABLE IF NOT EXISTS account_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES escrow_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),

  -- 交易类型
  transaction_type VARCHAR(50) NOT NULL, -- income（收入）, withdrawal（提现）, freeze（冻结）, unfreeze（解冻）, refund（退款）, fee（手续费）

  -- 金额变动
  amount DECIMAL(10, 2) NOT NULL, -- 正数表示增加，负数表示减少
  balance_before DECIMAL(12, 2) NOT NULL,
  balance_after DECIMAL(12, 2) NOT NULL,

  -- 关联信息
  related_task_id UUID REFERENCES tasks(id),
  related_transaction_id UUID REFERENCES escrow_transactions(id),
  related_withdrawal_id UUID REFERENCES withdrawal_requests(id),

  -- 描述
  description TEXT NOT NULL,
  remark TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_account_transactions_account ON account_transactions(account_id);
CREATE INDEX idx_account_transactions_user ON account_transactions(user_id);
CREATE INDEX idx_account_transactions_type ON account_transactions(transaction_type);
CREATE INDEX idx_account_transactions_created ON account_transactions(created_at DESC);

-- 5. 扩展tasks表
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS escrow_status VARCHAR(50) DEFAULT 'not_deposited'; -- not_deposited, deposited, released, refunded, partial_released
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS escrow_amount DECIMAL(10, 2);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS escrow_transaction_id UUID REFERENCES escrow_transactions(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS release_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2) DEFAULT 0;

-- 6. 创建函数：创建托管账户
CREATE OR REPLACE FUNCTION create_escrow_account(p_user_id UUID, p_user_type VARCHAR(20))
RETURNS UUID AS $$
DECLARE
  v_account_id UUID;
BEGIN
  INSERT INTO escrow_accounts (user_id, user_type)
  VALUES (p_user_id, p_user_type)
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO v_account_id;

  IF v_account_id IS NULL THEN
    SELECT id INTO v_account_id FROM escrow_accounts WHERE user_id = p_user_id;
  END IF;

  RETURN v_account_id;
END;
$$ LANGUAGE plpgsql;

-- 7. 创建函数：冻结资金
CREATE OR REPLACE FUNCTION freeze_funds(
  p_account_id UUID,
  p_amount DECIMAL(10, 2),
  p_description TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_account RECORD;
BEGIN
  -- 获取账户信息
  SELECT * INTO v_account FROM escrow_accounts WHERE id = p_account_id FOR UPDATE;

  IF v_account IS NULL THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  IF v_account.available_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- 更新账户余额
  UPDATE escrow_accounts
  SET frozen_balance = frozen_balance + p_amount,
      available_balance = available_balance - p_amount,
      total_frozen = total_frozen + p_amount,
      updated_at = NOW()
  WHERE id = p_account_id;

  -- 记录流水
  INSERT INTO account_transactions (
    account_id, user_id, transaction_type, amount,
    balance_before, balance_after, description
  ) VALUES (
    p_account_id, v_account.user_id, 'freeze', -p_amount,
    v_account.balance, v_account.balance, p_description
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 8. 创建函数：解冻资金
CREATE OR REPLACE FUNCTION unfreeze_funds(
  p_account_id UUID,
  p_amount DECIMAL(10, 2),
  p_description TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_account RECORD;
BEGIN
  SELECT * INTO v_account FROM escrow_accounts WHERE id = p_account_id FOR UPDATE;

  IF v_account IS NULL THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  IF v_account.frozen_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient frozen balance';
  END IF;

  -- 更新账户余额
  UPDATE escrow_accounts
  SET frozen_balance = frozen_balance - p_amount,
      available_balance = available_balance + p_amount,
      updated_at = NOW()
  WHERE id = p_account_id;

  -- 记录流水
  INSERT INTO account_transactions (
    account_id, user_id, transaction_type, amount,
    balance_before, balance_after, description
  ) VALUES (
    p_account_id, v_account.user_id, 'unfreeze', p_amount,
    v_account.balance, v_account.balance, p_description
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 9. 创建函数：转账
CREATE OR REPLACE FUNCTION transfer_funds(
  p_from_account_id UUID,
  p_to_account_id UUID,
  p_amount DECIMAL(10, 2),
  p_description TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_from_account RECORD;
  v_to_account RECORD;
BEGIN
  -- 获取账户信息（加锁）
  SELECT * INTO v_from_account FROM escrow_accounts WHERE id = p_from_account_id FOR UPDATE;
  SELECT * INTO v_to_account FROM escrow_accounts WHERE id = p_to_account_id FOR UPDATE;

  IF v_from_account IS NULL OR v_to_account IS NULL THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  IF v_from_account.frozen_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient frozen balance';
  END IF;

  -- 从付款方扣除冻结金额
  UPDATE escrow_accounts
  SET frozen_balance = frozen_balance - p_amount,
      balance = balance - p_amount,
      updated_at = NOW()
  WHERE id = p_from_account_id;

  -- 给收款方增加余额
  UPDATE escrow_accounts
  SET balance = balance + p_amount,
      available_balance = available_balance + p_amount,
      total_income = total_income + p_amount,
      updated_at = NOW()
  WHERE id = p_to_account_id;

  -- 记录流水（付款方）
  INSERT INTO account_transactions (
    account_id, user_id, transaction_type, amount,
    balance_before, balance_after, description
  ) VALUES (
    p_from_account_id, v_from_account.user_id, 'payment', -p_amount,
    v_from_account.balance, v_from_account.balance - p_amount, p_description
  );

  -- 记录流水（收款方）
  INSERT INTO account_transactions (
    account_id, user_id, transaction_type, amount,
    balance_before, balance_after, description
  ) VALUES (
    p_to_account_id, v_to_account.user_id, 'income', p_amount,
    v_to_account.balance, v_to_account.balance + p_amount, p_description
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 10. 创建触发器：用户注册时自动创建托管账户
CREATE OR REPLACE FUNCTION trigger_create_escrow_account()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_escrow_account(NEW.id, NEW.role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_escrow_account
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION trigger_create_escrow_account();

-- 11. 创建视图：账户概览
CREATE OR REPLACE VIEW account_overview AS
SELECT
  ea.*,
  u.username,
  u.email,
  COUNT(DISTINCT et.id) FILTER (WHERE et.transaction_type = 'deposit') as total_deposits,
  COUNT(DISTINCT wr.id) as total_withdrawals,
  COUNT(DISTINCT wr.id) FILTER (WHERE wr.status = 'pending') as pending_withdrawals
FROM escrow_accounts ea
JOIN users u ON ea.user_id = u.id
LEFT JOIN escrow_transactions et ON ea.user_id = et.payee_id
LEFT JOIN withdrawal_requests wr ON ea.id = wr.account_id
GROUP BY ea.id, u.username, u.email;

-- 12. 创建视图：提现统计
CREATE OR REPLACE VIEW withdrawal_statistics AS
SELECT
  user_id,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
  SUM(amount) FILTER (WHERE status = 'completed') as total_withdrawn,
  SUM(fee) FILTER (WHERE status = 'completed') as total_fees,
  MAX(created_at) FILTER (WHERE status = 'completed') as last_withdrawal_at
FROM withdrawal_requests
GROUP BY user_id;

COMMENT ON TABLE escrow_accounts IS '托管账户 - 用户的资金账户';
COMMENT ON TABLE escrow_transactions IS '托管交易 - 任务相关的资金交易';
COMMENT ON TABLE withdrawal_requests IS '提现申请 - 用户的提现请求';
COMMENT ON TABLE account_transactions IS '账户流水 - 所有账户资金变动记录';
COMMENT ON FUNCTION create_escrow_account IS '创建托管账户';
COMMENT ON FUNCTION freeze_funds IS '冻结资金';
COMMENT ON FUNCTION unfreeze_funds IS '解冻资金';
COMMENT ON FUNCTION transfer_funds IS '转账（从冻结金额中扣除并转给收款方）';
