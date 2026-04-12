-- 故事墙表
CREATE TABLE IF NOT EXISTS story_wall (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  story_text TEXT NOT NULL, -- 一句话故事："我当初也在XX这里卡过，你也可以。"
  current_status VARCHAR(100) NOT NULL, -- 当前状态：独立OPC / 加入XX联合体 / 创立XX工作室
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_story_created (created_at DESC)
);

COMMENT ON TABLE story_wall IS 'OPC故事墙 - 已经找到自己河道的人';
COMMENT ON COLUMN story_wall.story_text IS '学生分享的一句话故事';
COMMENT ON COLUMN story_wall.current_status IS '学生当前状态：独立OPC、加入联合体、创立工作室等';
