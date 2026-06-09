-- ============================================
-- 启程小程序 - 测试数据种子脚本
-- 目的：让前端能看到真实数据，验证完整流程
-- ============================================

-- 1. 创建测试企业用户（如果不存在）
INSERT INTO users (id, phone, user_type, created_at, updated_at)
VALUES
  ('33333333-3333-3333-3333-333333333333', '13800000001', 'company', NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444444', '13800000002', 'company', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 创建企业档案
INSERT INTO companies (id, user_id, name, industry, scale, created_at, updated_at)
VALUES
  ('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', '创意工作室A', 'design', 'small', NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', '科技公司B', 'technology', 'medium', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. 创建10个真实的任务（覆盖不同赛道和等级）
INSERT INTO tasks (
  id, company_id, title, description, track, level_required,
  budget_net, estimated_minutes, deadline, status,
  created_at, updated_at
)
VALUES
  -- AI内容创作赛道 - Lv.0 任务
  (
    '10000000-0000-0000-0000-000000000001',
    '33333333-3333-3333-3333-333333333333',
    'AI生成品牌宣传海报',
    '使用AI工具（Midjourney/Stable Diffusion）为新产品生成3张不同风格的宣传海报，要求风格统一、色彩协调。需要提供：1) 3张高清海报图片 2) Prompt设计思路说明',
    'content',
    0,
    150,
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
    '使用AI工具生成一套10个表情包，风格可爱，适合社交媒体使用。要求：统一风格、表情丰富、尺寸512x512px',
    'content',
    0,
    120,
    120,
    NOW() + INTERVAL '2 days',
    'active',
    NOW(),
    NOW()
  ),

  -- AI内容创作赛道 - Lv.1 任务
  (
    '10000000-0000-0000-0000-000000000003',
    '44444444-4444-4444-4444-444444444444',
    '制作产品介绍短视频',
    '使用AI工具制作一个30秒的产品介绍短视频，包含配音和字幕。需要：1) 视频脚本 2) AI生成的视频素材 3) 配音文案 4) 最终成片',
    'content',
    1,
    500,
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
    '使用AI工具（ChatGPT/Claude）为新产品撰写营销文案，包括：1) 产品介绍（200字）2) 卖点提炼（5个）3) 社交媒体文案（3条）',
    'content',
    1,
    300,
    240,
    NOW() + INTERVAL '4 days',
    'active',
    NOW(),
    NOW()
  ),

  -- AI工具开发赛道 - Lv.0 任务
  (
    '10000000-0000-0000-0000-000000000005',
    '44444444-4444-4444-4444-444444444444',
    '搭建简单的AI聊天机器人',
    '使用现成的AI API（如OpenAI）搭建一个简单的网页聊天机器人。要求：1) 能进行基础对话 2) 有简洁的UI界面 3) 提供部署链接',
    'tool',
    0,
    400,
    360,
    NOW() + INTERVAL '7 days',
    'active',
    NOW(),
    NOW()
  ),

  -- AI工具开发赛道 - Lv.1 任务
  (
    '10000000-0000-0000-0000-000000000006',
    '44444444-4444-4444-4444-444444444444',
    '开发AI图片批量处理工具',
    '开发一个Python脚本，使用AI工具批量处理图片（如：背景移除、尺寸调整、风格转换）。要求：1) 支持批量处理 2) 有进度显示 3) 提供使用文档',
    'tool',
    1,
    600,
    600,
    NOW() + INTERVAL '7 days',
    'active',
    NOW(),
    NOW()
  ),

  -- 更多任务
  (
    '10000000-0000-0000-0000-000000000007',
    '33333333-3333-3333-3333-333333333333',
    'AI生成Logo设计方案',
    '使用AI工具为品牌生成5个Logo设计方案，要求：1) 风格多样 2) 提供黑白和彩色版本 3) 附设计说明',
    'content',
    0,
    200,
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
    '使用AI工具设计一套商务PPT模板（10页），包括：封面、目录、内容页、数据页、结尾页。要求风格专业、配色协调',
    'content',
    1,
    350,
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
    '开发一个网页工具，能够将长文本自动生成摘要。要求：1) 支持中英文 2) 可调节摘要长度 3) 有简洁的UI',
    'tool',
    1,
    500,
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
    '使用AI工具为社交媒体账号生成一周的配图（7张），要求：1) 风格统一 2) 尺寸适配Instagram 3) 附文案建议',
    'content',
    0,
    180,
    200,
    NOW() + INTERVAL '4 days',
    'active',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- 3. 为测试学生创建OPC档案（如果不存在）
INSERT INTO student_profiles (
  user_id, level_a, level_b, track, opc_label,
  created_at, updated_at
)
VALUES
  ('22222222-2222-2222-2222-222222222222', 1, 0, 'content', 'creative_explorer', NOW(), NOW())
ON CONFLICT (user_id) DO UPDATE SET
  level_a = EXCLUDED.level_a,
  level_b = EXCLUDED.level_b,
  track = EXCLUDED.track,
  opc_label = EXCLUDED.opc_label;

-- 4. 创建一些任务邀请（让学生能看到邀请）
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

-- 5. 创建一个已接受的任务（让"我的任务"页面有数据）
INSERT INTO task_assignments (
  id, task_id, student_id, status, accepted_at,
  created_at, updated_at
)
VALUES
  (
    '30000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000003',
    '22222222-2222-2222-2222-222222222222',
    'working',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- 6. 为已接受的任务创建步骤拆解
INSERT INTO task_steps (
  id, task_id, student_id, step_number, title, description,
  tool_name, estimated_minutes, status,
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
ON CONFLICT (id) DO NOTHING;

-- 7. 创建一些通知
INSERT INTO notifications (
  id, user_id, type, title, content, link,
  created_at, updated_at
)
VALUES
  (
    '50000000-0000-0000-0000-000000000001',
    '22222222-2222-2222-2222-222222222222',
    'task_invitation',
    '收到新的任务邀请',
    '创意工作室A邀请你完成"AI生成品牌宣传海报"任务',
    '/pages/tasks/detail?id=10000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    'task_invitation',
    '收到新的任务邀请',
    '创意工作室A邀请你完成"AI生成系列表情包"任务',
    '/pages/tasks/detail?id=10000000-0000-0000-0000-000000000002',
    NOW(),
    NOW()
  ),
  (
    '50000000-0000-0000-0000-000000000003',
    '22222222-2222-2222-2222-222222222222',
    'system',
    '欢迎加入启程',
    '开始你的OPC成长之旅，完成第一个任务吧！',
    '/pages/tasks/index',
    NOW() - INTERVAL '2 days',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- 8. 更新统计信息
-- 这样前端能看到真实的数据

SELECT '✅ 测试数据创建完成！' as status;
SELECT '📊 数据统计：' as info;
SELECT COUNT(*) as "活跃任务数" FROM tasks WHERE status = 'active';
SELECT COUNT(*) as "待处理邀请数" FROM task_invitations WHERE status = 'pending';
SELECT COUNT(*) as "进行中任务数" FROM task_assignments WHERE status = 'working';
SELECT COUNT(*) as "未读通知数" FROM notifications WHERE read_at IS NULL;
