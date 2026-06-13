-- E-20: 资金托管透明化
-- 可视化展示托管流程的每个节点，让双方实时了解资金状态

-- 托管流程节点表
CREATE TABLE IF NOT EXISTS escrow_flow_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),
  
  -- 节点信息
  node_type VARCHAR(50) NOT NULL,
  -- 'payment_initiated' - 企业发起支付
  -- 'funds_locked' - 资金锁定
  -- 'task_started' - 任务开始
  -- 'milestone_completed' - 里程碑完成
  -- 'review_submitted' - 交付物提交
  -- 'review_approved' - 验收通过
  -- 'funds_releasing' - 资金释放中
  -- 'funds_released' - 资金已释放
  -- 'dispute_raised' - 发起争议
  -- 'dispute_resolved' - 争议解决
  
  title VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- 状态
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- 'pending' - 待处理
  -- 'in_progress' - 进行中
  -- 'completed' - 已完成
  -- 'failed' - 失败
  -- 'skipped' - 跳过
  
  -- 金额信息
  amount DECIMAL(10,2),
  currency VARCHAR(10) DEFAULT 'CNY',
  
  -- 操作人
  actor_id UUID REFERENCES users(id),
  actor_role VARCHAR(50),  -- 'company', 'student', 'platform', 'system'
  
  -- 时间戳
  expected_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- 额外数据
  metadata JSONB DEFAULT '{}',
  
  -- 节点顺序
  sequence_order INTEGER NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_task_node_sequence UNIQUE(task_id, sequence_order)
);

CREATE INDEX idx_escrow_nodes_task ON escrow_flow_nodes(task_id, sequence_order);
CREATE INDEX idx_escrow_nodes_status ON escrow_flow_nodes(task_id, status);
CREATE INDEX idx_escrow_nodes_type ON escrow_flow_nodes(task_id, node_type);

-- 资金流水记录表
CREATE TABLE IF NOT EXISTS escrow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),
  flow_node_id UUID REFERENCES escrow_flow_nodes(id),
  
  -- 交易类型
  transaction_type VARCHAR(50) NOT NULL,
  -- 'deposit' - 企业充值
  -- 'lock' - 锁定
  -- 'release' - 释放给学生
  -- 'refund' - 退款给企业
  -- 'fee_deduction' - 平台手续费扣除
  -- 'penalty' - 违约金
  
  -- 金额
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'CNY',
  
  -- 流向
  from_party VARCHAR(50),  -- 'company', 'student', 'platform', 'escrow'
  to_party VARCHAR(50),
  
  -- 状态
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- 'pending' - 待处理
  -- 'processing' - 处理中
  -- 'completed' - 已完成
  -- 'failed' - 失败
  
  -- 描述
  description TEXT,
  
  -- 外部交易ID（支付网关）
  external_transaction_id VARCHAR(200),
  
  -- 时间戳
  initiated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- 额外数据
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_escrow_transactions_task ON escrow_transactions(task_id, initiated_at DESC);
CREATE INDEX idx_escrow_transactions_type ON escrow_transactions(transaction_type, status);
CREATE INDEX idx_escrow_transactions_external ON escrow_transactions(external_transaction_id) WHERE external_transaction_id IS NOT NULL;

-- 托管账户余额表
CREATE TABLE IF NOT EXISTS escrow_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) UNIQUE,
  
  -- 各状态的金额
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  locked_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  released_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  refunded_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  fee_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- 可用余额
  available_balance DECIMAL(10,2) GENERATED ALWAYS AS 
    (total_amount - locked_amount - released_amount - refunded_amount - fee_amount) STORED,
  
  -- 状态
  status VARCHAR(50) NOT NULL DEFAULT 'empty',
  -- 'empty' - 空
  -- 'deposited' - 已充值
  -- 'locked' - 已锁定
  -- 'releasing' - 释放中
  -- 'released' - 已释放
  -- 'refunded' - 已退款
  
  -- 时间戳
  last_transaction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_escrow_balances_status ON escrow_balances(status);

-- 创建视图：托管流程概览
CREATE OR REPLACE VIEW escrow_flow_overview AS
SELECT
  t.id as task_id,
  t.title as task_title,
  t.budget,
  eb.total_amount,
  eb.locked_amount,
  eb.released_amount,
  eb.available_balance,
  eb.status as escrow_status,
  COUNT(efn.id) as total_nodes,
  COUNT(efn.id) FILTER (WHERE efn.status = 'completed') as completed_nodes,
  COUNT(efn.id) FILTER (WHERE efn.status = 'pending') as pending_nodes,
  MAX(efn.completed_at) as last_node_completed_at,
  eb.last_transaction_at
FROM tasks t
LEFT JOIN escrow_balances eb ON t.id = eb.task_id
LEFT JOIN escrow_flow_nodes efn ON t.id = efn.task_id
GROUP BY t.id, t.title, t.budget, eb.total_amount, eb.locked_amount, 
         eb.released_amount, eb.available_balance, eb.status, eb.last_transaction_at;

-- 初始化托管流程节点的函数
CREATE OR REPLACE FUNCTION initialize_escrow_flow(p_task_id UUID)
RETURNS void AS $$
DECLARE
  v_budget DECIMAL(10,2);
BEGIN
  -- 获取任务预算
  SELECT budget INTO v_budget FROM tasks WHERE id = p_task_id;
  
  -- 创建标准托管流程节点
  INSERT INTO escrow_flow_nodes (id, task_id, node_type, title, description, status, amount, sequence_order)
  VALUES
    (gen_random_uuid(), p_task_id, 'payment_initiated', '企业发起支付', '企业确认任务并发起支付', 'pending', v_budget, 1),
    (gen_random_uuid(), p_task_id, 'funds_locked', '资金锁定', '款项进入平台托管账户', 'pending', v_budget, 2),
    (gen_random_uuid(), p_task_id, 'task_started', '任务开始', '学生开始执行任务', 'pending', NULL, 3),
    (gen_random_uuid(), p_task_id, 'review_submitted', '交付物提交', '学生提交任务交付物', 'pending', NULL, 4),
    (gen_random_uuid(), p_task_id, 'review_approved', '验收通过', '企业确认验收通过', 'pending', NULL, 5),
    (gen_random_uuid(), p_task_id, 'funds_releasing', '资金释放中', '平台处理款项释放', 'pending', v_budget * 0.95, 6),
    (gen_random_uuid(), p_task_id, 'funds_released', '资金已释放', '学生收到任务款项', 'pending', v_budget * 0.95, 7)
  ON CONFLICT (task_id, sequence_order) DO NOTHING;
  
  -- 初始化托管账户余额
  INSERT INTO escrow_balances (id, task_id, total_amount, status)
  VALUES (gen_random_uuid(), p_task_id, 0, 'empty')
  ON CONFLICT (task_id) DO NOTHING;
  
  RAISE NOTICE 'Escrow flow initialized for task %', p_task_id;
END;
$$ LANGUAGE plpgsql;

-- 触发器：任务发布后自动初始化托管流程
CREATE OR REPLACE FUNCTION trigger_init_escrow_on_publish()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    PERFORM initialize_escrow_flow(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_init_escrow_flow
AFTER INSERT OR UPDATE ON tasks
FOR EACH ROW
WHEN (NEW.status = 'published')
EXECUTE FUNCTION trigger_init_escrow_on_publish();

-- 注释
COMMENT ON TABLE escrow_flow_nodes IS 'E-20: 托管流程节点表，记录资金托管的每个环节';
COMMENT ON TABLE escrow_transactions IS 'E-20: 托管交易流水表，记录所有资金变动';
COMMENT ON TABLE escrow_balances IS 'E-20: 托管账户余额表，实时追踪资金状态';
COMMENT ON VIEW escrow_flow_overview IS 'E-20: 托管流程概览视图，展示任务的完整资金状态';
