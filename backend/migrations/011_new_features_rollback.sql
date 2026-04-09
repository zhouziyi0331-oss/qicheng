-- ============================================================
-- Rollback Migration 011: 新增功能表
-- 创建时间: 2026-04-09
-- 说明: 回滚跳级挑战、学生标签等新功能的数据库表
-- ============================================================

-- 删除触发器
DROP TRIGGER IF EXISTS trigger_level_challenges_updated_at ON level_challenges;
DROP TRIGGER IF EXISTS trigger_student_tags_updated_at ON student_tags;
DROP TRIGGER IF EXISTS trigger_task_steps_updated_at ON task_steps;

-- 删除触发器函数
DROP FUNCTION IF EXISTS update_level_challenges_updated_at();
DROP FUNCTION IF EXISTS update_student_tags_updated_at();
DROP FUNCTION IF EXISTS update_task_steps_updated_at();

-- 删除表（按依赖关系倒序）
DROP TABLE IF EXISTS task_steps CASCADE;
DROP TABLE IF EXISTS student_tags CASCADE;
DROP TABLE IF EXISTS level_challenges CASCADE;

-- 移除新增的列（如果需要）
DO $$
BEGIN
  -- 移除 student_profiles.six_dim_scores
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'student_profiles' AND column_name = 'six_dim_scores'
  ) THEN
    ALTER TABLE student_profiles DROP COLUMN IF EXISTS six_dim_scores;
  END IF;

  -- 移除 tasks.task_type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'task_type'
  ) THEN
    ALTER TABLE tasks DROP COLUMN IF EXISTS task_type;
  END IF;
END $$;

-- 验证回滚
DO $$
DECLARE
  table_count INT;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_name IN ('level_challenges', 'student_tags', 'task_steps')
    AND table_schema = 'public';

  IF table_count = 0 THEN
    RAISE NOTICE '✅ Rollback 011 completed successfully. All tables removed.';
  ELSE
    RAISE WARNING '⚠️  Rollback 011 incomplete. Found % tables remaining', table_count;
  END IF;
END $$;
