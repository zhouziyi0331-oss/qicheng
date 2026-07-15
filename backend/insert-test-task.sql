-- 插入测试任务到tasks表
INSERT INTO tasks (id, title, description, enterprise_id, status, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000002', '测试任务', '用于Phase R2测试', '00000000-0000-0000-0000-000000000001', 'open', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
