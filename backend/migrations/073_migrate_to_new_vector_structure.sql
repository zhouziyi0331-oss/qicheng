-- ============================================
-- 迁移到新的向量结构
-- Migration: 073
-- 描述: 从旧的多向量结构迁移到新的单向量+摘要结构
-- ============================================

-- 1. 添加新字段到student_capabilities表
ALTER TABLE student_capabilities
ADD COLUMN IF NOT EXISTS profile_summary TEXT,
ADD COLUMN IF NOT EXISTS profile_vector vector(1024);

-- 2. 删除旧的向量字段（保留数据迁移后再删除）
-- 注意：先不删除，等新向量生成后再删除
-- ALTER TABLE student_capabilities
-- DROP COLUMN IF EXISTS skill_vector,
-- DROP COLUMN IF EXISTS trajectory_vector,
-- DROP COLUMN IF EXISTS quality_vector,
-- DROP COLUMN IF EXISTS preference_vector,
-- DROP COLUMN IF EXISTS combined_vector;

-- 3. 为新的profile_vector创建索引
DROP INDEX IF EXISTS idx_student_capabilities_vector;
CREATE INDEX idx_student_capabilities_profile_vector
ON student_capabilities USING ivfflat (profile_vector vector_cosine_ops)
WITH (lists = 100);

-- 4. 添加requirement_vector到tasks表（如果不存在）
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS requirement_vector vector(1024);

-- 5. 为requirement_vector创建索引
CREATE INDEX IF NOT EXISTS idx_tasks_requirement_vector
ON tasks USING ivfflat (requirement_vector vector_cosine_ops)
WITH (lists = 100);

-- ============================================
-- Migration 完成
-- ============================================
