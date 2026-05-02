-- 修复 ai_matches 表的类型不匹配问题
-- task_id 和 student_id 应该是 UUID 而不是 INTEGER

BEGIN;

-- 删除旧表（如果有数据，先备份）
DROP TABLE IF EXISTS ai_matches CASCADE;

-- 重新创建 ai_matches 表，使用正确的 UUID 类型
CREATE TABLE ai_matches (
  id SERIAL PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_score DECIMAL(5,2) NOT NULL,
  match_reason TEXT,
  is_selected_by_company BOOLEAN DEFAULT FALSE,
  is_invited BOOLEAN DEFAULT FALSE,
  invitation_status VARCHAR(20) DEFAULT 'pending',
  responded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  difficulty_level VARCHAR(20),
  estimated_growth_openness INTEGER,
  estimated_growth_persistence INTEGER,
  estimated_growth_creativity INTEGER,
  UNIQUE(task_id, student_id)
);

CREATE INDEX idx_ai_matches_task ON ai_matches(task_id);
CREATE INDEX idx_ai_matches_student ON ai_matches(student_id);
CREATE INDEX idx_ai_matches_score ON ai_matches(match_score DESC);

COMMIT;
