-- ============================================
-- 启程小程序 - 测试数据种子脚本（最终版）
-- 目的：让前端能看到真实数据，验证完整流程
-- ============================================

-- 1. 创建测试企业用户（使用新的手机号）
INSERT INTO users (id, phone, role, user_type, nickname, is_active, created_at)
VALUES
  ('33333333-3333-3333-3333-333333333333', '13900000001', 'company', 'company', '创意工作室A', true, NOW()),
  ('44444444-4444-4444-4444-444444444444', '13900000002', 'company', 'company', '科技公司B', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- 创建企业档案（使用正确的字段）
INSERT INTO company_profiles (user_id, company_name, industry, contact_name, contact_phone, created_at, updated_at)
VALUES
  ('33333333-3333-3333-3333-333333333333', '创意工作室A', 'design', '张经理', '13900000001', NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444444', '科技公司B', 'technology', '李总监', '13900000002', NOW(), NOW())
ON CONFLICT (user_id) DO NOTHING;

-- 2. 创建10个真实的任务
INSERT INTO tasks (
  id, company_id, title, description, track, level_required,
  budget_gross, budget_net, platform_fee_rate, acceptance_criteria,
  estimated_minutes, deadline, status,
  created_at, updated_at
)
VALUES
  -- A赛道（AI内容创作）- Lv.0 任务
  (
    '10000000-0000-0000-0000-000000000001',
    '33333333-3333-3333-3333-333333333333',
    'AI生成品牌宣传海报',
    '使用AI工具（Midjourney/Stable Diffusion）为新产品生成3张不同风格的宣传海报，要求风格统一、色彩协调。',
    'A',
    0,
    187.50,
    150.00,
    0.20,
    '1) 提供3张高清海报图片（分辨率不低于1920x1080）
2) 提供Prompt设计思路说明
3) 风格统一、色彩协调',
    180,
    NOW() + INTERVAL '3 days',
    'active',
    NOW(),
    NOW()
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '33333333-3333-3333-3333-333333333333',
    'AI生成系列表情包',
    '使用AI工具生成一套10个表情包，风格可爱，适合社交媒体使用。',
    'A',
    0,
    150.00,
    120.00,
    0.20,
    '1) 10个表情包图片
2) 统一风格、表情丰富
3) 尺寸512x512px',
    120,
    NOW() + INTERVAL '2 days',
    'active',
    NOW(),
    NOW()
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    '44444444-4444-4444-4444-444444444444',
    '制作产品介绍短视频',
    '使用AI工具制作一个30秒的产品介绍短视频，包含配音和字幕。',
    'A',
    1,
    625.00,
    500.00,
    0.20,
    '1) 视频脚本
2) AI生成的视频素材
3) 配音文案
4) 最终成片（30秒，1080p）',
    480,
    NOW() + INTERVAL '5 days',
    'active',
    NOW(),
    NOW()
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    '44444444-4444-4444-4444-444444444444',
    'AI辅助撰写产品文案',
    '使用AI工具（ChatGPT/Claude）为新产品撰写营销文案。',
    'A',
    1,
    375.00,
    300.00,
    0.20,
    '1) 产品介绍（200字）
2) 卖点提炼（5个）
3) 社交媒体文案（3条）',
    240,
    NOW() + INTERVAL '4 days',
    'active',
    NOW(),
    NOW()
  ),
  (
    '10000000-0000-0000-0000-000000000005',
    '44444444-4444-4444-4444-444444444444',
    '搭建简单的AI聊天机器人',
    '使用现成的AI API（如OpenAI）搭建一个简单的网页聊天机器人。',
    'B',
    0,
    500.00,
    400.00,
    0.20,
    '1) 能进行基础对话
2) 有简洁的UI界面
3) 提供部署链接和源代码',
    360,
    NOW() + INTERVAL '7 days',
    'active',
    NOW(),
    NOW()
  ),
  (
    '10000000-0000-0000-0000-000000000006',
    '44444444-4444-4444-4444-444444444444',
    '开发AI图片批量处理工具',
    '开发一个Python脚本，使用AI工具批量处理图片（如：背景移除、尺寸调整、风格转换）。',
    'B',
    1,
    750.00,
    600.00,
    0.20,
    '1) 支持批量处理
2) 有进度显示
3) 提供使用文档和源代码',
    600,
    NOW() + INTERVAL '7 days',
    'active',
    NOW(),
    NOW()
  ),
  (
    '10000000-0000-0000-0000-000000000007',
    '33333333-3333-3333-3333-333333333333',
    'AI生成Logo设计方案',
    '使用AI工具为品牌生成5个Logo设计方案。',
    'A',
    0,
    250.00,
    200.00,
    0.20,
    '1) 5个Logo设计方案
2) 风格多样
3) 提供黑白和彩色版本
4) 附设计说明',
    150,
    NOW() + INTERVAL '3 days',
    'active',
    NOW(),
    NOW()
  ),
  (
    '10000000-0000-0000-0000-000000000008',
    '33333333-3333-3333-3333-333333333333',
    'AI辅助制作PPT模板',
    '使用AI工具设计一套商务PPT模板（10页）。',
    'A',
    1,
    437.50,
    350.00,
    0.20,
    '包括：封面、目录、内容页、数据页、结尾页。要求风格专业、配色协调',
    300,
    NOW() + INTERVAL '5 days',
    'active',
    NOW(),
    NOW()
  ),
  (
    '10000000-0000-0000-0000-000000000009',
    '44444444-4444-4444-4444-444444444444',
    '开发AI文本摘要工具',
    '开发一个网页工具，能够将长文本自动生成摘要。',
    'B',
    1,
    625.00,
    500.00,
    0.20,
    '1) 支持中英文
2) 可调节摘要长度
3) 有简洁的UI
4) 提供部署链接',
    480,
    NOW() + INTERVAL '6 days',
    'active',
    NOW(),
    NOW()
  ),
  (
    '10000000-0000-0000-0000-000000000010',
    '33333333-3333-3333-3333-333333333333',
    'AI生成社交媒体配图',
    '使用AI工具为社交媒体账号生成一周的配图（7张）。',
    'A',
    0,
    225.00,
    180.00,
    0.20,
    '1) 风格统一
2) 尺寸适配Instagram
3) 附文案建议',
    200,
    NOW() + INTERVAL '4 days',
    'active',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- 3. 为测试学生创建OPC档案
INSERT INTO student_profiles (
  user_id, level_a, level_b, track, opc_label,
  created_at, updated_at
)
VALUES
  ('22222222-2222-2222-2222-222222222222', 1, 0, 'A', 'creative_explorer', NOW(), NOW())
ON CONFLICT (user_id) DO UPDATE SET
  level_a = EXCLUDED.level_a,
  level_b = EXCLUDED.level_b,
  track = EXCLUDED.track,
  opc_label = EXCLUDED.opc_label;

-- 4. 创建任务邀请
INSERT INTO task_invitations (
  id, task_id, student_id, status, custom_message,
  created_at, updated_at
)
VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '22222222-2222-2222-2222-222222222222',
    'pending',
    '你好！看到你的创意能力很强，这个海报设计任务很适合你，期待你的作品！',
    NOW(),
    NOW()
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    'pending',
    '表情包设计任务，轻松有趣，快来试试吧！',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- 5. 创建已接受的任务
INSERT INTO task_assignments (
  id, task_id, student_id, status, assigned_at, accepted_at
)
VALUES
  (
    '30000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000003',
    '22222222-2222-2222-2222-222222222222',
    'accepted',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT (task_id, student_id) DO NOTHING;

-- 6. 创建任务步骤（需要先确保students表有记录）
-- 先检查students表是否有该学生记录
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM students WHERE id = '22222222-2222-2222-2222-222222222222') THEN
    INSERT INTO students (id, user_id, created_at, updated_at)
    VALUES ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

INSERT INTO task_steps (
  id, task_id, student_id, step_num, step_title, step_desc,
  tool_hint, est_minutes, status,
  created_at, updated_at
)
VALUES
  (
    '40000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000003',
    '22222222-2222-2222-2222-222222222222',
    1,
    '撰写视频脚本',
    '根据产品特点，撰写30秒短视频的脚本大纲，包括开场、产品介绍、卖点展示、结尾',
    'ChatGPT',
    60,
    'completed',
    NOW() - INTERVAL '1 day',
    NOW()
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000003',
    '22222222-2222-2222-2222-222222222222',
    2,
    '生成视频素材',
    '使用AI视频工具（如Runway、Pika）生成视频片段',
    'Runway',
    180,
    'in_progress',
    NOW() - INTERVAL '1 day',
    NOW()
  ),
  (
    '40000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000003',
    '22222222-2222-2222-2222-222222222222',
    3,
    '添加配音和字幕',
    '使用AI配音工具生成旁白，添加字幕',
    '剪映',
    120,
    'pending',
    NOW() - INTERVAL '1 day',
    NOW()
  ),
  (
    '40000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000003',
    '22222222-2222-2222-2222-222222222222',
    4,
    '剪辑成片',
    '将所有素材剪辑成30秒完整视频，调整节奏和转场',
    '剪映',
    120,
    'pending',
    NOW() - INTERVAL '1 day',
    NOW()
  )
ON CONFLICT (task_id, student_id, step_num) DO NOTHING;

-- 7. 创建通知
INSERT INTO notifications (
  id, user_id, type, title, content, action_url,
  created_at
)
VALUES
  (
    '50000000-0000-0000-0000-000000000001',
    '22222222-2222-2222-2222-222222222222',
    'task_invitation',
    '收到新的任务邀请',
    '创意工作室A邀请你完成"AI生成品牌宣传海报"任务',
    '/pages/tasks/detail?id=10000000-0000-0000-0000-000000000001',
    NOW()
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    'task_invitation',
    '收到新的任务邀请',
    '创意工作室A邀请你完成"AI生成系列表情包"任务',
    '/pages/tasks/detail?id=10000000-0000-0000-0000-000000000002',
    NOW()
  ),
  (
    '50000000-0000-0000-0000-000000000003',
    '22222222-2222-2222-2222-222222222222',
    'system',
    '欢迎加入启程',
    '开始你的OPC成长之旅，完成第一个任务吧！',
    '/pages/tasks/index',
    NOW() - INTERVAL '2 days'
  )
ON CONFLICT (id) DO NOTHING;

-- 8. 显示统计信息
SELECT '✅ 测试数据创建完成！' as status;
SELECT '📊 数据统计：' as info;
SELECT COUNT(*) as "活跃任务数" FROM tasks WHERE status = 'active';
SELECT COUNT(*) as "待处理邀请数" FROM task_invitations WHERE status = 'pending';
SELECT COUNT(*) as "已接受任务数" FROM task_assignments WHERE status = 'accepted';
SELECT COUNT(*) as "未读通知数" FROM notifications WHERE is_read = false;
SELECT '🎯 现在可以测试前端了！' as next_step;
