-- 跳级挑战表
CREATE TABLE IF NOT EXISTS stretch_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  current_level INTEGER NOT NULL,
  target_level INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, success, failed
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,

  INDEX idx_challenge_student (student_id, created_at DESC),
  INDEX idx_challenge_status (status)
);

COMMENT ON TABLE stretch_challenges IS '跳级挑战记录表';
COMMENT ON COLUMN stretch_challenges.status IS '状态：pending=进行中, success=成功, failed=失败';
