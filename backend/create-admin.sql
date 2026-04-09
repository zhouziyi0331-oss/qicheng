-- 创建测试管理员账号
INSERT INTO users (phone, password_hash, role, nickname, created_at, updated_at)
VALUES (
  '13800000000',
  '$2b$10$rKZLvVxwFqtxJz8YvJ5pXeYxGxKxKxKxKxKxKxKxKxKxKxKxKxK',
  'admin',
  '管理员',
  NOW(),
  NOW()
)
ON CONFLICT (phone) DO UPDATE SET role = 'admin';
