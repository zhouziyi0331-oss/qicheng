-- ============================================================
-- 数据迁移脚本：student_profiles → users
-- 将旧等级系统的数据同步到新等级系统
-- ============================================================

-- 1. 同步赛道信息
UPDATE users u
SET track = sp.track
FROM student_profiles sp
WHERE u.id = sp.user_id
  AND u.role = 'student'
  AND u.track IS NULL;

-- 2. 同步等级信息（使用level_a作为current_level）
UPDATE users u
SET current_level = sp.level_a
FROM student_profiles sp
WHERE u.id = sp.user_id
  AND u.role = 'student'
  AND (u.current_level IS NULL OR u.current_level = 0);

-- 3. 初始化student_capabilities表（如果记录不存在）
INSERT INTO student_capabilities (
  student_id,
  skills,
  tasks_completed,
  opc_openness,
  opc_persistence,
  opc_creativity,
  personality_style,
  created_at
)
SELECT
  sp.user_id,
  '{}'::jsonb,
  sp.task_count,
  (sp.six_dim_scores->>'openness')::integer,
  (sp.six_dim_scores->>'persistence')::integer,
  (sp.six_dim_scores->>'creativity')::integer,
  sp.opc_label,
  NOW()
FROM student_profiles sp
WHERE NOT EXISTS (
  SELECT 1 FROM student_capabilities sc WHERE sc.student_id = sp.user_id
)
ON CONFLICT (student_id) DO NOTHING;

-- 4. 更新任务完成数统计
UPDATE student_capabilities sc
SET tasks_completed = (
  SELECT COUNT(*)
  FROM orders o
  WHERE o.student_id = sc.student_id
    AND o.status = 'completed'
    AND o.order_type = 'normal'
);

-- 5. 更新平均评分
UPDATE student_capabilities sc
SET avg_task_quality = (
  SELECT AVG(company_score) / 100.0
  FROM orders o
  WHERE o.student_id = sc.student_id
    AND o.status = 'completed'
    AND o.order_type = 'normal'
    AND o.company_score IS NOT NULL
);

-- 6. 更新平均客户满意度（假设company_score就是满意度）
UPDATE student_capabilities sc
SET avg_client_satisfaction = (
  SELECT AVG(company_score) / 100.0
  FROM orders o
  WHERE o.student_id = sc.student_id
    AND o.status = 'completed'
    AND o.order_type = 'normal'
    AND o.company_score IS NOT NULL
);

-- 7. 计算准时交付率
UPDATE student_capabilities sc
SET on_time_delivery_rate = (
  SELECT
    CASE
      WHEN COUNT(*) = 0 THEN 0
      ELSE COUNT(*) FILTER (WHERE o.completed_at <= o.deadline_at)::decimal / COUNT(*)
    END
  FROM orders o
  WHERE o.student_id = sc.student_id
    AND o.status = 'completed'
    AND o.order_type = 'normal'
    AND o.deadline_at IS NOT NULL
);

-- 8. 设置默认赛道（如果仍为空）
UPDATE users
SET track = 'content'
WHERE role = 'student'
  AND track IS NULL;

-- 9. 设置默认等级（如果仍为空）
UPDATE users
SET current_level = 0
WHERE role = 'student'
  AND current_level IS NULL;

-- 10. 验证数据迁移结果
SELECT
  '数据迁移完成' as status,
  COUNT(*) as total_students,
  COUNT(*) FILTER (WHERE track IS NOT NULL) as students_with_track,
  COUNT(*) FILTER (WHERE current_level IS NOT NULL) as students_with_level
FROM users
WHERE role = 'student';

-- 11. 显示迁移后的等级分布
SELECT
  track,
  current_level,
  COUNT(*) as student_count
FROM users
WHERE role = 'student'
GROUP BY track, current_level
ORDER BY track, current_level;

-- ============================================================
-- 注意事项
-- ============================================================
-- 1. 此脚本是幂等的，可以多次执行
-- 2. 使用ON CONFLICT DO NOTHING避免重复插入
-- 3. 只更新NULL值，不覆盖已有数据
-- 4. 建议在执行前备份数据库
-- 5. 执行后检查验证结果
