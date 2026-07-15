-- 初始化测试数据
-- 为每个新表插入基础数据，让前端能够显示内容

-- 1. 为测试用户初始化游戏化数据
INSERT INTO user_gamification (user_id, thinking_points, streak, ability_fragments)
SELECT id, 120, 5, 15
FROM users
WHERE role = 'student'
LIMIT 5
ON CONFLICT (user_id) DO UPDATE
SET thinking_points = 120, streak = 5, ability_fragments = 15;

-- 2. 初始化每日任务（已在migration中完成，这里更新）
UPDATE daily_tasks SET active = true;

-- 3. 为测试用户初始化今天的任务进度
INSERT INTO user_daily_tasks (user_id, task_id, date, progress, completed)
SELECT u.id, 'daily_login', CURRENT_DATE, 1, true
FROM users u WHERE role = 'student' LIMIT 5
ON CONFLICT (user_id, task_id, date) DO NOTHING;

INSERT INTO user_daily_tasks (user_id, task_id, date, progress, completed)
SELECT u.id, 'daily_learn', CURRENT_DATE, 0, false
FROM users u WHERE role = 'student' LIMIT 5
ON CONFLICT (user_id, task_id, date) DO NOTHING;

-- 4. 初始化用户能力数据
INSERT INTO user_abilities (user_id, ability_id, level, experience)
SELECT u.id, 'ai_prompting', 2, 150
FROM users u WHERE role = 'student' LIMIT 5
ON CONFLICT (user_id, ability_id) DO UPDATE
SET level = 2, experience = 150;

INSERT INTO user_abilities (user_id, ability_id, level, experience)
SELECT u.id, 'text_to_image', 1, 50
FROM users u WHERE role = 'student' LIMIT 5
ON CONFLICT (user_id, ability_id) DO UPDATE
SET level = 1, experience = 50;

-- 5. 为tasks表添加icon字段（如果是课程表）
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT '📚';
UPDATE tasks SET icon = '📚' WHERE icon IS NULL;

-- 6. 为mentor_sessions添加需要的字段
ALTER TABLE mentor_sessions ADD COLUMN IF NOT EXISTS current_stage VARCHAR(100) DEFAULT '情境化';
ALTER TABLE mentor_sessions ADD COLUMN IF NOT EXISTS progress INT DEFAULT 0;
ALTER TABLE mentor_sessions ADD COLUMN IF NOT EXISTS iteration_count INT DEFAULT 0;

-- 7. 创建一些板块数据
INSERT INTO sectors (id, name, description, icon, bg_gradient, careers, order_index) VALUES
('sector_ai', 'AI应用', '学习如何使用AI工具提升效率', '🤖', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', '["AI产品经理", "提示工程师"]', 1),
('sector_design', '设计创作', '掌握设计工具和创意思维', '🎨', 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', '["UI设计师", "平面设计师"]', 2),
('sector_content', '内容创作', '学习内容创作和传播技巧', '✍️', 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', '["内容运营", "自媒体"]', 3)
ON CONFLICT (id) DO NOTHING;

-- 8. 创建技能数据
INSERT INTO skills (id, name, category) VALUES
('skill_prompting', 'AI提示工程', 'AI'),
('skill_midjourney', 'Midjourney', 'AI'),
('skill_writing', '文案写作', '内容'),
('skill_design', '视觉设计', '设计')
ON CONFLICT (id) DO NOTHING;

-- 9. 为tasks关联技能（假设tasks是课程）
INSERT INTO course_skills (course_id, skill_id)
SELECT t.id, 'skill_prompting'
FROM tasks t
WHERE t.title LIKE '%AI%' OR t.title LIKE '%人工智能%'
LIMIT 10
ON CONFLICT DO NOTHING;

-- 10. 创建学习统计数据
INSERT INTO user_learning_stats (id, user_id, session_id, duration_hours, status)
SELECT
  'stat_' || u.id || '_' || generate_series,
  u.id,
  NULL,
  2.5,
  'completed'
FROM users u
CROSS JOIN generate_series(1, 3)
WHERE u.role = 'student'
LIMIT 15
ON CONFLICT DO NOTHING;

-- 11. 创建活动记录
INSERT INTO user_activities (id, user_id, type, description, created_at)
SELECT
  'activity_' || u.id || '_' || generate_series,
  u.id,
  'session_complete',
  '完成了AI提示工程项目',
  NOW() - (generate_series || ' days')::interval
FROM users u
CROSS JOIN generate_series(1, 5)
WHERE u.role = 'student'
LIMIT 25
ON CONFLICT DO NOTHING;

-- 12. 为mentor_sessions更新当前阶段
UPDATE mentor_sessions
SET current_stage = '情境化', progress = 20
WHERE current_stage IS NULL;

-- 验证数据
SELECT
  (SELECT COUNT(*) FROM user_gamification) as gamification_users,
  (SELECT COUNT(*) FROM daily_tasks WHERE active = true) as active_tasks,
  (SELECT COUNT(*) FROM abilities) as abilities_count,
  (SELECT COUNT(*) FROM sectors) as sectors_count,
  (SELECT COUNT(*) FROM user_activities) as activities_count;
