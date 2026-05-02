-- AI导师对话记录表（表已存在，只添加缺失的列）
DO $$
BEGIN
  -- 添加 student_message 列（如果不存在）
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='mentor_conversations' AND column_name='student_message') THEN
    ALTER TABLE mentor_conversations ADD COLUMN student_message TEXT;
  END IF;

  -- 添加 mentor_response 列（如果不存在）
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='mentor_conversations' AND column_name='mentor_response') THEN
    ALTER TABLE mentor_conversations ADD COLUMN mentor_response TEXT;
  END IF;

  -- 添加 detected_passion_spark 列（如果不存在）
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='mentor_conversations' AND column_name='detected_passion_spark') THEN
    ALTER TABLE mentor_conversations ADD COLUMN detected_passion_spark BOOLEAN DEFAULT false;
  END IF;

  -- 添加 detected_flow_moment 列（如果不存在）
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='mentor_conversations' AND column_name='detected_flow_moment') THEN
    ALTER TABLE mentor_conversations ADD COLUMN detected_flow_moment BOOLEAN DEFAULT false;
  END IF;
END $$;

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
CREATE INDEX IF NOT EXISTS idx_mentor_conversations_student ON mentor_conversations(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mentor_conversations_task ON mentor_conversations(task_id);
CREATE INDEX IF NOT EXISTS idx_flow_moments_student ON flow_moments(student_id, captured_at DESC);

-- 添加注释
COMMENT ON TABLE mentor_conversations IS 'AI导师对话记录 - 使命是河版本';
COMMENT ON TABLE flow_moments IS '穿越感时刻记录 - 学生在项目中感觉时间过得特别快的时刻';
COMMENT ON COLUMN mentor_conversations.detected_passion_spark IS '是否在对话中检测到热情火花';
COMMENT ON COLUMN mentor_conversations.detected_flow_moment IS '是否在对话中检测到穿越感时刻';
