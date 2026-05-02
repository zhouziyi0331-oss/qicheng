-- 安装 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 为任务表添加 embedding 字段（用于AI匹配）
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS title_embedding vector(1536);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description_embedding vector(1536);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS combined_embedding vector(1536);

-- 为学生表添加 embedding 字段（用于AI匹配）
ALTER TABLE users ADD COLUMN IF NOT EXISTS skills_embedding vector(1536);
ALTER TABLE users ADD COLUMN IF NOT EXISTS interests_embedding vector(1536);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_embedding vector(1536);

-- 创建向量索引以加速相似度搜索
CREATE INDEX IF NOT EXISTS tasks_title_embedding_idx ON tasks USING ivfflat (title_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS tasks_description_embedding_idx ON tasks USING ivfflat (description_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS tasks_combined_embedding_idx ON tasks USING ivfflat (combined_embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS users_skills_embedding_idx ON users USING ivfflat (skills_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS users_interests_embedding_idx ON users USING ivfflat (interests_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS users_profile_embedding_idx ON users USING ivfflat (profile_embedding vector_cosine_ops) WITH (lists = 100);

-- 创建 AI 匹配日志表（记录 AI 辅助匹配的详细信息）
CREATE TABLE IF NOT EXISTS ai_match_logs (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id),
    student_id INTEGER REFERENCES users(id),
    vector_similarity DECIMAL(5, 4),
    rule_based_score DECIMAL(5, 2),
    final_score DECIMAL(5, 2),
    ai_reasoning TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ai_match_logs_task_id_idx ON ai_match_logs(task_id);
CREATE INDEX IF NOT EXISTS ai_match_logs_student_id_idx ON ai_match_logs(student_id);
CREATE INDEX IF NOT EXISTS ai_match_logs_created_at_idx ON ai_match_logs(created_at);

-- 添加注释
COMMENT ON COLUMN tasks.title_embedding IS '任务标题的向量表示，用于AI语义匹配';
COMMENT ON COLUMN tasks.description_embedding IS '任务描述的向量表示，用于AI语义匹配';
COMMENT ON COLUMN tasks.combined_embedding IS '任务标题+描述的组合向量表示';
COMMENT ON COLUMN users.skills_embedding IS '学生技能的向量表示';
COMMENT ON COLUMN users.interests_embedding IS '学生兴趣的向量表示';
COMMENT ON COLUMN users.profile_embedding IS '学生完整画像的向量表示';
COMMENT ON TABLE ai_match_logs IS 'AI辅助匹配的详细日志，记录向量相似度和规则评分的混合结果';
