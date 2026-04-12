-- 生命问题记录表
CREATE TABLE IF NOT EXISTS life_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  reflections JSONB DEFAULT '[]'::jsonb,

  INDEX idx_life_question_student (student_id)
);

COMMENT ON TABLE life_questions IS '学生的生命问题记录';
COMMENT ON COLUMN life_questions.question IS '学生当下人生的生命问题';
COMMENT ON COLUMN life_questions.reflections IS '在不同项目中的反思记录 [{taskId, reflection, createdAt}]';

-- 示例数据
-- INSERT INTO life_questions (student_id, question) VALUES
-- ('user-uuid', '我想知道自己真正喜欢什么'),
-- ('user-uuid', '我想找到自己的节奏，不是别人的节奏');
