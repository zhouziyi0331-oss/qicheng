-- 创建测试管理员账号
-- 用户名: admin
-- 密码: admin123
-- 手机号: 13800138000

-- 1. 创建用户记录
INSERT INTO users (id, phone, role, nickname, is_active, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '13800138000',
  'admin',
  '超级管理员',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (phone) DO NOTHING;

-- 2. 创建管理员记录
INSERT INTO admin_users (user_id, username, password_hash, role, is_active, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin',
  '$2b$10$K7U65RkS7jw9oG.xkWoquuZzU3/9Bg9hKpj9ktMlFhdedPHi0J/xu',
  'super',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  updated_at = NOW();

-- 验证创建结果
SELECT
  u.id,
  u.phone,
  u.nickname,
  u.role as user_role,
  au.username,
  au.role as admin_role,
  au.is_active
FROM users u
JOIN admin_users au ON u.id = au.user_id
WHERE u.phone = '13800138000';
