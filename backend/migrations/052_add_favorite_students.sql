-- 收藏学生表
CREATE TABLE IF NOT EXISTS favorite_students (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_favorite_students_company_id ON favorite_students(company_id);
CREATE INDEX IF NOT EXISTS idx_favorite_students_student_id ON favorite_students(student_id);

COMMENT ON TABLE favorite_students IS '企业收藏学生表';
COMMENT ON COLUMN favorite_students.id IS '主键ID';
COMMENT ON COLUMN favorite_students.company_id IS '企业ID';
COMMENT ON COLUMN favorite_students.student_id IS '学生ID';
COMMENT ON COLUMN favorite_students.created_at IS '收藏时间';
