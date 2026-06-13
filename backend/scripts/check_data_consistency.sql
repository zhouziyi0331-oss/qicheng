-- ============================================================================
-- 数据一致性检查脚本
-- 执行方法: psql -d qicheng_db -f check_data_consistency.sql
-- ============================================================================

\echo '========================================='
\echo '数据一致性检查开始'
\echo '========================================='
\echo ''

-- 检查1: 学生累计收入一致性
\echo '检查1: 学生累计收入一致性...'
SELECT
    u.id,
    u.username,
    u.total_income AS recorded_income,
    COALESCE(SUM(o.student_income), 0) AS calculated_income,
    u.total_income - COALESCE(SUM(o.student_income), 0) AS difference
FROM users u
LEFT JOIN orders o ON o.student_id = u.id AND o.status = 'completed'
WHERE u.role = 'student'
GROUP BY u.id, u.username, u.total_income
HAVING u.total_income != COALESCE(SUM(o.student_income), 0)
LIMIT 10;

\echo ''

-- 检查2: 学生完成订单数一致性
\echo '检查2: 学生完成订单数一致性...'
SELECT
    u.id,
    u.username,
    u.completed_orders AS recorded_count,
    COUNT(o.id) AS actual_count,
    u.completed_orders - COUNT(o.id) AS difference
FROM users u
LEFT JOIN orders o ON o.student_id = u.id AND o.status = 'completed'
WHERE u.role = 'student'
GROUP BY u.id, u.username, u.completed_orders
HAVING u.completed_orders != COUNT(o.id)
LIMIT 10;

\echo ''

-- 检查3: 任务已接单人数一致性
\echo '检查3: 任务已接单人数一致性...'
SELECT
    t.id,
    t.title,
    t.slots_taken AS recorded_slots,
    COUNT(o.id) AS actual_slots,
    t.slots_taken - COUNT(o.id) AS difference
FROM tasks t
LEFT JOIN orders o ON o.task_id = t.id
  AND o.status IN ('accepted', 'in_progress', 'submitted', 'completed')
GROUP BY t.id, t.title, t.slots_taken
HAVING t.slots_taken != COUNT(o.id)
LIMIT 10;

\echo ''

-- 检查4: 画像is_current唯一性
\echo '检查4: 画像is_current唯一性...'
SELECT
    student_id,
    COUNT(*) as current_count,
    STRING_AGG(id::text, ', ') as profile_ids
FROM user_ability_profiles
WHERE is_current = true
GROUP BY student_id
HAVING COUNT(*) > 1;

\echo ''

-- 检查5: 学生等级与最新画像一致性
\echo '检查5: 学生等级与最新画像一致性...'
SELECT
    u.id,
    u.username,
    u.student_level AS user_level,
    uap.current_level AS profile_level
FROM users u
LEFT JOIN user_ability_profiles uap ON uap.student_id = u.id AND uap.is_current = true
WHERE u.role = 'student'
  AND u.student_level IS DISTINCT FROM uap.current_level
LIMIT 10;

\echo ''

-- 检查6: 企业发布任务数统计
\echo '检查6: 企业发布任务数统计...'
SELECT
    u.id,
    u.username,
    COUNT(t.id) AS published_tasks,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) AS completed_tasks
FROM users u
LEFT JOIN tasks t ON t.company_id = u.id
WHERE u.role = 'company'
GROUP BY u.id, u.username
ORDER BY published_tasks DESC
LIMIT 10;

\echo ''

-- 检查7: 匹配记录的is_current一致性
\echo '检查7: 匹配记录的is_current一致性...'
SELECT
    task_id,
    COUNT(*) as total_matches,
    COUNT(CASE WHEN is_current = true THEN 1 END) as current_matches
FROM task_student_matches
GROUP BY task_id
HAVING COUNT(CASE WHEN is_current = true THEN 1 END) = 0
LIMIT 10;

\echo ''

-- 检查8: 关注关系双向一致性（如果表存在）
\echo '检查8: 关注关系统计...'
SELECT
    company_id,
    COUNT(*) as following_count,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_following
FROM company_student_follows
GROUP BY company_id
ORDER BY following_count DESC
LIMIT 10;

\echo ''
\echo '========================================='
\echo '数据一致性检查完成'
\echo '========================================='
