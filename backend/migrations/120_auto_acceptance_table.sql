-- 添加自动确认记录表
CREATE TABLE IF NOT EXISTS auto_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  task_id UUID NOT NULL REFERENCES tasks(id),
  student_id UUID NOT NULL REFERENCES users(id),
  company_id UUID NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_auto_acceptances_order ON auto_acceptances(order_id);
CREATE INDEX idx_auto_acceptances_task ON auto_acceptances(task_id);
CREATE INDEX idx_auto_acceptances_executed ON auto_acceptances(executed_at DESC);

COMMENT ON TABLE auto_acceptances IS '自动确认记录表 - 记录系统自动确认交付的历史';
COMMENT ON COLUMN auto_acceptances.reason IS '自动确认原因';
