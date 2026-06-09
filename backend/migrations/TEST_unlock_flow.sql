-- ============================================
-- 测试脚本：验证2单解锁完整流程
-- ============================================

-- 前提：需要先执行 071_security_and_unlock_enhancement.sql

-- ============================================
-- 1. 创建测试数据
-- ============================================

-- 插入测试学生
INSERT INTO users (id, phone, nickname, role, wechat, email)
VALUES
  ('11111111-1111-1111-1111-111111111111', '13800138001', '测试学生A', 'student', 'wechat_student_a', 'student_a@test.com'),
  ('22222222-2222-2222-2222-222222222222', '13800138002', '测试学生B', 'student', 'wechat_student_b', 'student_b@test.com')
ON CONFLICT (id) DO NOTHING;

-- 插入测试企业
INSERT INTO users (id, phone, nickname, role, wechat, email)
VALUES
  ('33333333-3333-3333-3333-333333333333', '13900139001', '测试企业X', 'company', 'wechat_company_x', 'company_x@test.com'),
  ('44444444-4444-4444-4444-444444444444', '13900139002', '测试企业Y', 'company', 'wechat_company_y', 'company_y@test.com')
ON CONFLICT (id) DO NOTHING;

-- 插入测试任务
INSERT INTO tasks (id, title, company_id, accepted_student_id, status, student_price, company_price)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '测试任务1', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'completed', 100, 120),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '测试任务2', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'completed', 150, 180)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. 模拟完成2单合作
-- ============================================

-- 第1单完成
INSERT INTO collaboration_history (student_id, company_id, task_id, status, completed_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'completed', NOW() - INTERVAL '10 days')
ON CONFLICT (student_id, company_id, task_id) DO NOTHING;

-- 第2单完成
INSERT INTO collaboration_history (student_id, company_id, task_id, status, completed_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'completed', NOW() - INTERVAL '2 days')
ON CONFLICT (student_id, company_id, task_id) DO NOTHING;

-- ============================================
-- 3. 验证查询
-- ============================================

-- 3.1 查看合作历史
SELECT
  ch.*,
  s.nickname as student_name,
  c.nickname as company_name,
  t.title as task_title
FROM collaboration_history ch
JOIN users s ON ch.student_id = s.id
JOIN users c ON ch.company_id = c.id
JOIN tasks t ON ch.task_id = t.id
WHERE ch.student_id = '11111111-1111-1111-1111-111111111111'
  AND ch.company_id = '33333333-3333-3333-3333-333333333333';

-- 3.2 查看合作进度（应该显示已完成2单）
SELECT * FROM collaboration_progress
WHERE student_id = '11111111-1111-1111-1111-111111111111'
  AND company_id = '33333333-3333-3333-3333-333333333333';

-- 3.3 检查是否可以解锁（应该返回true）
SELECT can_exchange_contacts(
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333333'
) as can_unlock;

-- ============================================
-- 4. 模拟解锁流程
-- ============================================

-- 4.1 学生申请解锁
INSERT INTO contact_exchange_requests (
  student_id,
  company_id,
  task_id,
  student_agreed,
  student_agreed_at,
  collaboration_count
)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333333',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  true,
  NOW(),
  2
)
ON CONFLICT (student_id, company_id) DO NOTHING;

-- 4.2 查看解锁请求状态
SELECT
  cer.*,
  s.nickname as student_name,
  c.nickname as company_name
FROM contact_exchange_requests cer
JOIN users s ON cer.student_id = s.id
JOIN users c ON cer.company_id = c.id
WHERE cer.student_id = '11111111-1111-1111-1111-111111111111'
  AND cer.company_id = '33333333-3333-3333-3333-333333333333';

-- 4.3 企业同意解锁
UPDATE contact_exchange_requests
SET
  company_agreed = true,
  company_agreed_at = NOW(),
  exchanged = true,
  exchanged_at = NOW()
WHERE student_id = '11111111-1111-1111-1111-111111111111'
  AND company_id = '33333333-3333-3333-3333-333333333333';

-- 4.4 验证解锁成功
SELECT
  cer.exchanged,
  cer.exchanged_at,
  s.phone as student_phone,
  s.wechat as student_wechat,
  c.phone as company_phone,
  c.wechat as company_wechat
FROM contact_exchange_requests cer
JOIN users s ON cer.student_id = s.id
JOIN users c ON cer.company_id = c.id
WHERE cer.student_id = '11111111-1111-1111-1111-111111111111'
  AND cer.company_id = '33333333-3333-3333-3333-333333333333';

-- ============================================
-- 5. 清理测试数据（可选）
-- ============================================

-- 取消注释以下代码来清理测试数据
/*
DELETE FROM contact_exchange_requests
WHERE student_id = '11111111-1111-1111-1111-111111111111';

DELETE FROM collaboration_history
WHERE student_id = '11111111-1111-1111-1111-111111111111';

DELETE FROM tasks
WHERE id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

DELETE FROM users
WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444'
);
*/

-- ============================================
-- 6. 验证安全功能
-- ============================================

-- 6.1 查看安全承诺
SELECT * FROM security_commitments WHERE is_active = true ORDER BY display_order;

-- 6.2 查看加密密钥
SELECT * FROM encryption_keys WHERE status = 'active';

-- 6.3 查看数据访问日志（如果有）
SELECT
  dal.*,
  u.nickname as user_name
FROM data_access_logs dal
JOIN users u ON dal.user_id = u.id
ORDER BY dal.created_at DESC
LIMIT 10;
