-- 添加申请超时记录表
CREATE TABLE IF NOT EXISTS application_timeouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  task_id UUID NOT NULL REFERENCES tasks(id),
  student_id UUID NOT NULL REFERENCES users(id),
  company_id UUID NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_application_timeouts_task ON application_timeouts(task_id);
CREATE INDEX idx_application_timeouts_student ON application_timeouts(student_id);
CREATE INDEX idx_application_timeouts_executed ON application_timeouts(executed_at DESC);

COMMENT ON TABLE application_timeouts IS '申请超时记录表';
