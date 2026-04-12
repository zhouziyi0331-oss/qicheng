-- AI导师对话记录表
CREATE TABLE IF NOT EXISTS mentor_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  task_id UUID REFERENCES tasks(id),
  student_message TEXT NOT NULL,
  mentor_response TEXT NOT NULL,
  detected_passion_spark BOOLEAN DEFAULT false,
  detected_flow_moment BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 穿越感时刻记录表
CREATE TABLE IF NOT EXISTS flow_moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  task_id UUID REFERENCES tasks(id),
  moment_text TEXT NOT NULL,
  duration_minutes INTEGER,
  captured_at TIMESTAMP DEFAULT NOW()
);

-- 为查询优化添加索引
CREATE INDEX idx_mentor_conversations_student ON mentor_conversations(student_id, created_at DESC);
CREATE INDEX idx_mentor_conversations_task ON mentor_conversations(task_id);
CREATE INDEX idx_flow_moments_student ON flow_moments(student_id, captured_at DESC);

-- 添加注释
COMMENT ON TABLE mentor_conversations IS 'AI导师对话记录 - 使命是河版本';
COMMENT ON TABLE flow_moments IS '穿越感时刻记录 - 学生在项目中感觉时间过得特别快的时刻';
COMMENT ON COLUMN mentor_conversations.detected_passion_spark IS '是否在对话中检测到热情火花';
COMMENT ON COLUMN mentor_conversations.detected_flow_moment IS '是否在对话中检测到穿越感时刻';
