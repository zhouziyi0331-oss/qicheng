-- 热情火花捕捉表
CREATE TABLE IF NOT EXISTS passion_sparks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  spark_text TEXT NOT NULL,
  context TEXT,
  captured_at TIMESTAMP DEFAULT NOW(),
  want_explore BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_passion_spark_student ON passion_sparks(student_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_passion_spark_explore ON passion_sparks(student_id, want_explore);

COMMENT ON TABLE passion_sparks IS '热情火花捕捉记录';
COMMENT ON COLUMN passion_sparks.spark_text IS '火花描述：我发现自己在XX上有穿越感';
COMMENT ON COLUMN passion_sparks.context IS '当时在做什么';
COMMENT ON COLUMN passion_sparks.want_explore IS '是否想继续探索这个方向';
