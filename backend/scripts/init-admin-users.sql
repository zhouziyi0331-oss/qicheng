-- 初始化管理员账号
-- 执行方式：psql -U postgres -d qicheng -f scripts/init-admin-users.sql

-- 清理旧数据（如果存在）
DELETE FROM admin_users WHERE username IN ('admin', 'chengyan');

-- 插入超级管理员账号
INSERT INTO admin_users (
  username,
  password,
  email,
  role,
  permissions,
  status,
  created_at,
  updated_at
) VALUES (
  'admin',
  '$2a$10$LTINUwpAKM7XTGljYluf5.f/ii3Gah5LtHCqhhso8WjZPHhINfm2O', -- admin123456
  'admin@qicheng.com',
  'super_admin',
  '["all"]'::jsonb,
  'active',
  NOW(),
  NOW()
);

-- 插入普通管理员账号
INSERT INTO admin_users (
  username,
  password,
  email,
  role,
  permissions,
  status,
  created_at,
  updated_at
) VALUES (
  'chengyan',
  '$2a$10$9YUgpTdhsnVeBa/YRqjbj.pxxfsn0kA2GO8P/GdIISLOHW7tEnb8y', -- chengyanlove
  'chengyan@qicheng.com',
  'admin',
  '["users:read", "users:write", "tasks:read", "tasks:write", "content:read", "content:write"]'::jsonb,
  'active',
  NOW(),
  NOW()
);

-- 验证插入结果
SELECT 
  id,
  username,
  email,
  role,
  permissions,
  status,
  created_at
FROM admin_users
WHERE username IN ('admin', 'chengyan')
ORDER BY role DESC;
