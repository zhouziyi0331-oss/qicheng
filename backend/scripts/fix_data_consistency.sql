-- ============================================================================
-- 数据一致性修复脚本
-- 警告: 执行前请先运行 check_data_consistency.sql 确认问题
-- 执行方法: psql -d qicheng_db -f fix_data_consistency.sql
-- ============================================================================

\echo '========================================='
\echo '数据一致性修复开始'
\echo '警告: 将修改数据，请确认已备份'
\echo '========================================='
\echo ''

BEGIN;

-- 修复1: 同步学生累计收入
\echo '修复1: 同步学生累计收入...'
UPDATE users u
SET total_income = COALESCE(income_sum.total, 0)
FROM (
    SELECT
        student_id,
        SUM(student_income) as total
    FROM orders
    WHERE status = 'completed'
    GROUP BY student_id
) income_sum
WHERE u.id = income_sum.student_id
  AND u.role = 'student'
  AND u.total_income != income_sum.total;

\echo '修复完成。'
\echo ''

-- 修复2: 同步学生完成订单数
\echo '修复2: 同步学生完成订单数...'
UPDATE users u
SET completed_orders = COALESCE(order_count.total, 0)
FROM (
    SELECT
        student_id,
        COUNT(*) as total
    FROM orders
    WHERE status = 'completed'
    GROUP BY student_id
) order_count
WHERE u.id = order_count.student_id
  AND u.role = 'student'
  AND u.completed_orders != order_count.total;

\echo '修复完成。'
\echo ''

-- 修复3: 同步任务已接单人数
\echo '修复3: 同步任务已接单人数...'
UPDATE tasks t
SET slots_taken = COALESCE(slot_count.total, 0)
FROM (
    SELECT
        task_id,
        COUNT(*) as total
    FROM orders
    WHERE status IN ('accepted', 'in_progress', 'submitted', 'completed')
    GROUP BY task_id
) slot_count
WHERE t.id = slot_count.task_id
  AND t.slots_taken != slot_count.total;

\echo '修复完成。'
\echo ''

-- 修复4: 确保每个学生只有一个is_current=true的画像
\echo '修复4: 确保画像is_current唯一性...'

-- 先找出有多个current画像的学生
CREATE TEMP TABLE duplicate_current_profiles AS
SELECT
    student_id,
    ARRAY_AGG(id ORDER BY created_at DESC) as profile_ids
FROM user_ability_profiles
WHERE is_current = true
GROUP BY student_id
HAVING COUNT(*) > 1;

-- 将除了最新的画像外，其他都设为false
UPDATE user_ability_profiles
SET is_current = false
WHERE id IN (
    SELECT UNNEST(profile_ids[2:])
    FROM duplicate_current_profiles
);

\echo '修复完成。'
\echo ''

-- 修复5: 同步用户表和画像表的等级
\echo '修复5: 同步用户等级与画像等级...'
UPDATE users u
SET student_level = uap.current_level
FROM user_ability_profiles uap
WHERE u.id = uap.student_id
  AND uap.is_current = true
  AND u.role = 'student'
  AND u.student_level IS DISTINCT FROM uap.current_level;

\echo '修复完成。'
\echo ''

-- 修复6: 清理孤立的匹配记录（任务或学生已删除）
\echo '修复6: 清理孤立的匹配记录...'
DELETE FROM task_student_matches
WHERE task_id NOT IN (SELECT id FROM tasks)
   OR student_id NOT IN (SELECT id FROM users);

\echo '修复完成。'
\echo ''

COMMIT;

\echo '========================================='
\echo '数据一致性修复完成'
\echo '请重新运行 check_data_consistency.sql 验证'
\echo '========================================='
