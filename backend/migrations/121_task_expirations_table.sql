-- 添加任务过期记录表
CREATE TABLE IF NOT EXISTS task_expirations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),
  student_id UUID REFERENCES users(id),
  company_id UUID NOT NULL REFERENCES users(id),
  expiration_type VARCHAR(50) NOT NULL,
  reason TEXT NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_task_expirations_task ON task_expirations(task_id);
CREATE INDEX idx_task_expirations_type ON task_expirations(expiration_type);
CREATE INDEX idx_task_expirations_executed ON task_expirations(executed_at DESC);

COMMENT ON TABLE task_expirations IS '任务过期记录表';
COMMENT ON COLUMN task_expirations.expiration_type IS '过期类型: deadline_exceeded=截止时间已过, no_applicants=无人接单';
