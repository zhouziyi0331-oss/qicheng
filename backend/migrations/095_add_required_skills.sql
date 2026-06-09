-- 迁移095: 添加required_skills字段用于语义匹配
-- 创建日期: 2026-06-09
-- 说明: 临时字段，用于语义匹配系统的技能匹配功能

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS required_skills JSONB DEFAULT '[]';

COMMENT ON COLUMN tasks.required_skills IS '任务要求的技能列表（用于语义匹配，从description中提取或手动填写）';

-- 为现有任务设置默认值（空数组）
UPDATE tasks SET required_skills = '[]' WHERE required_skills IS NULL;
