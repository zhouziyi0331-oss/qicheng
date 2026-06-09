-- AI导师自动触发系统数据库表
-- 迁移文件：075_mentor_auto_trigger.sql

-- 1. 导师消息表（如果不存在）
CREATE TABLE IF NOT EXISTS mentor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id),

  -- 消息内容
  role VARCHAR(50) NOT NULL, -- 'user', 'assistant'
  content TEXT NOT NULL,
  context VARCHAR(100), -- 'task_start', 'stuck', 'rejection_guidance', 'milestone_celebration'

  -- 触发信息
  triggered_by VARCHAR(50), -- 'T-01', 'T-03', 'T-05', 'manual'
  auto_triggered BOOLEAN DEFAULT false,

  -- 学生反馈
  student_viewed BOOLEAN DEFAULT false,
  viewed_at TIMESTAMPTZ,
  student_replied BOOLEAN DEFAULT false,
  replied_at TIMESTAMPTZ,

  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentor_messages_task ON mentor_messages(task_id, created_at);
CREATE INDEX IF NOT EXISTS idx_mentor_messages_student ON mentor_messages(student_id, created_at);
CREATE INDEX IF NOT EXISTS idx_mentor_messages_triggered ON mentor_messages(triggered_by, created_at);

-- 2. 导师触发记录表
CREATE TABLE mentor_trigger_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  trigger_type VARCHAR(50) NOT NULL, -- 'T-01', 'T-03', 'T-05'

  -- 触发状态
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- 'pending', 'triggered', 'failed', 'skipped'

  -- 触发时间
  scheduled_at TIMESTAMPTZ NOT NULL,
  triggered_at TIMESTAMPTZ,

  -- 结果
  message_id UUID REFERENCES mentor_messages(id),
  error_message TEXT,

  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mentor_trigger_logs_order ON mentor_trigger_logs(order_id);
CREATE INDEX idx_mentor_trigger_logs_status ON mentor_trigger_logs(status, scheduled_at);
CREATE INDEX idx_mentor_trigger_logs_type ON mentor_trigger_logs(trigger_type, status);

-- 3. 扩展orders表，添加触发标记
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS t01_triggered BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS t01_triggered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS t03_triggered_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS t03_last_triggered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS t05_triggered BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS t05_triggered_at TIMESTAMPTZ;

-- 4. 创建触发器函数：订单接受后30秒调度T-01
CREATE OR REPLACE FUNCTION schedule_t01_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- 当订单状态变为accepted时，调度T-01触发
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    INSERT INTO mentor_trigger_logs (order_id, trigger_type, scheduled_at, status)
    VALUES (NEW.id, 'T-01', NOW() + INTERVAL '30 seconds', 'pending');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_schedule_t01
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION schedule_t01_trigger();

-- 5. 创建触发器函数：订单打回后立即调度T-03
CREATE OR REPLACE FUNCTION schedule_t03_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- 当订单状态变为rejected时，调度T-03触发
  IF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    INSERT INTO mentor_trigger_logs (order_id, trigger_type, scheduled_at, status)
    VALUES (NEW.id, 'T-03', NOW() + INTERVAL '5 seconds', 'pending');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_schedule_t03
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION schedule_t03_trigger();

-- 6. 创建触发器函数：订单完成后立即调度T-05
CREATE OR REPLACE FUNCTION schedule_t05_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- 当订单状态变为completed或confirmed时，调度T-05触发
  IF (NEW.status = 'completed' OR NEW.status = 'confirmed')
     AND (OLD.status != 'completed' AND OLD.status != 'confirmed') THEN
    INSERT INTO mentor_trigger_logs (order_id, trigger_type, scheduled_at, status)
    VALUES (NEW.id, 'T-05', NOW() + INTERVAL '10 seconds', 'pending');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_schedule_t05
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION schedule_t05_trigger();

-- 7. 创建更新触发器
CREATE OR REPLACE FUNCTION update_mentor_trigger_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mentor_trigger_logs_updated_at
  BEFORE UPDATE ON mentor_trigger_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_mentor_trigger_updated_at();

-- 8. 添加注释
COMMENT ON TABLE mentor_messages IS 'AI导师消息表';
COMMENT ON TABLE mentor_trigger_logs IS 'AI导师触发记录表';
COMMENT ON COLUMN mentor_messages.triggered_by IS '触发方式：T-01（接单后）、T-03（打回后）、T-05（完成后）、manual（手动）';
COMMENT ON COLUMN mentor_trigger_logs.trigger_type IS '触发类型：T-01、T-03、T-05';
COMMENT ON COLUMN orders.t01_triggered IS 'T-01是否已触发';
COMMENT ON COLUMN orders.t03_triggered_count IS 'T-03触发次数（可能被打回多次）';
COMMENT ON COLUMN orders.t05_triggered IS 'T-05是否已触发';
