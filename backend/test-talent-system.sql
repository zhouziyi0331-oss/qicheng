-- ============================================
-- 测试天赋标签系统数据
-- ============================================

-- 1. 检查talent_tags表
\echo '1️⃣ 检查talent_tags表...'
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'talent_tags'
) as talent_tags_exists;

-- 2. 统计标签数量
\echo ''
\echo '2️⃣ 标签统计...'
SELECT
  category,
  COUNT(*) as count
FROM talent_tags
GROUP BY category
ORDER BY category;

\echo ''
SELECT COUNT(*) as total_tags FROM talent_tags;

-- 3. 检查student_talent_tags表
\echo ''
\echo '3️⃣ 检查student_talent_tags表...'
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'student_talent_tags'
) as student_talent_tags_exists;

-- 4. 学生标签统计
\echo ''
\echo '4️⃣ 学生标签统计...'
SELECT
  COUNT(DISTINCT student_id) as student_count,
  COUNT(*) as total_tags,
  COUNT(*) FILTER (WHERE strength = 'emerging') as emerging,
  COUNT(*) FILTER (WHERE strength = 'clear') as clear,
  COUNT(*) FILTER (WHERE strength = 'prominent') as prominent,
  COUNT(*) FILTER (WHERE strength = 'core') as core
FROM student_talent_tags;

-- 5. 查看示例学生的标签（如果有）
\echo ''
\echo '5️⃣ 示例学生标签...'
SELECT
  stt.student_id,
  tt.tag_name,
  tt.category,
  stt.strength,
  stt.confidence,
  stt.source
FROM student_talent_tags stt
JOIN talent_tags tt ON stt.tag_id = tt.id
LIMIT 10;

-- 6. 检查成长仪表盘视图
\echo ''
\echo '6️⃣ 检查student_growth_dashboard视图...'
SELECT EXISTS (
  SELECT FROM information_schema.views
  WHERE table_name = 'student_growth_dashboard'
) as dashboard_view_exists;

\echo ''
\echo '✅ 测试完成！'
