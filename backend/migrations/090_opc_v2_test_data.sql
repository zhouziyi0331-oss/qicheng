-- OPC v2.0 测试题库数据
-- 总共25题：AI工具使用(6) + 创作偏好(7) + 工作风格(6) + 兴趣方向(6)

-- 维度1: AI工具使用习惯 (6题)
INSERT INTO opc_v2_test_questions (question_number, dimension, question_text, question_type, options, display_order) VALUES
(1, 'ai_tools', '你最常用来解决问题的AI工具是？', 'single_choice',
  '[
    {"value": "A", "text": "ChatGPT/Claude等对话类工具"},
    {"value": "B", "text": "Midjourney/Stable Diffusion等生图工具"},
    {"value": "C", "text": "GitHub Copilot/Cursor等代码工具"},
    {"value": "D", "text": "剪映/Runway等视频工具"}
  ]'::jsonb, 1),

(2, 'ai_tools', '当AI生成的结果不理想时，你的第一反应是？', 'single_choice',
  '[
    {"value": "A", "text": "调整prompt，换个说法再试"},
    {"value": "B", "text": "换个工具试试"},
    {"value": "C", "text": "手动修改AI的输出"},
    {"value": "D", "text": "先搜索别人怎么做的"}
  ]'::jsonb, 2),

(3, 'ai_tools', '你觉得AI最擅长帮你做什么？', 'single_choice',
  '[
    {"value": "A", "text": "快速生成多个方案供我选择"},
    {"value": "B", "text": "把我的想法具象化成可见的图像"},
    {"value": "C", "text": "自动化重复性的工作"},
    {"value": "D", "text": "帮我理清思路和逻辑"}
  ]'::jsonb, 3),

(4, 'ai_tools', '你用AI时最在意什么？', 'single_choice',
  '[
    {"value": "A", "text": "生成速度要快"},
    {"value": "B", "text": "结果质量要高"},
    {"value": "C", "text": "操作简单易用"},
    {"value": "D", "text": "可控性和可定制性"}
  ]'::jsonb, 4),

(5, 'ai_tools', '你会如何描述自己和AI的协作方式？', 'single_choice',
  '[
    {"value": "A", "text": "我提供想法，AI帮我实现"},
    {"value": "B", "text": "AI给初稿，我来精修"},
    {"value": "C", "text": "我们来回对话，逐步优化"},
    {"value": "D", "text": "我搭建流程，让AI自动跑"}
  ]'::jsonb, 5),

(6, 'ai_tools', '下列场景中，你最熟悉的是？', 'single_choice',
  '[
    {"value": "A", "text": "用AI写文案/做内容"},
    {"value": "B", "text": "用AI生成图片/视频"},
    {"value": "C", "text": "用AI写代码/做工具"},
    {"value": "D", "text": "用AI分析数据/做决策"}
  ]'::jsonb, 6);

-- 维度2: 创作偏好 (7题)
INSERT INTO opc_v2_test_questions (question_number, dimension, question_text, question_type, options, display_order) VALUES
(7, 'creative_preference', '给你一个品牌宣传任务，你最先想到的是？', 'single_choice',
  '[
    {"value": "A", "text": "设计一组视觉海报"},
    {"value": "B", "text": "写一段走心的文案"},
    {"value": "C", "text": "做一套完整的传播方案"},
    {"value": "D", "text": "分析目标用户画像"}
  ]'::jsonb, 7),

(8, 'creative_preference', '如果要做一个小红书账号，你会选择哪个方向？', 'single_choice',
  '[
    {"value": "A", "text": "美图类（穿搭/美食/旅行）"},
    {"value": "B", "text": "干货类（职场/学习/效率）"},
    {"value": "C", "text": "工具类（AI教程/模板分享）"},
    {"value": "D", "text": "数据类（行业分析/趋势解读）"}
  ]'::jsonb, 8),

(9, 'creative_preference', '你更喜欢哪种创作状态？', 'single_choice',
  '[
    {"value": "A", "text": "灵感突然来了，一口气做完"},
    {"value": "B", "text": "先快速做出10个版本，再选最好的"},
    {"value": "C", "text": "按计划稳步推进，每天做一点"},
    {"value": "D", "text": "边做边调整，不断优化"}
  ]'::jsonb, 9),

(10, 'creative_preference', '如果客户说"不太对，但说不出哪里不对"，你会？', 'single_choice',
  '[
    {"value": "A", "text": "做几个不同风格的版本给他选"},
    {"value": "B", "text": "找类似案例让他指出区别"},
    {"value": "C", "text": "主动问具体的场景和目标"},
    {"value": "D", "text": "用数据或理论说服他"}
  ]'::jsonb, 10),

(11, 'creative_preference', '下面哪句话最符合你的创作理念？', 'single_choice',
  '[
    {"value": "A", "text": "好的作品要一眼就抓住人"},
    {"value": "B", "text": "细节决定作品的品质"},
    {"value": "C", "text": "作品要解决实际问题"},
    {"value": "D", "text": "数据验证比主观感觉重要"}
  ]'::jsonb, 11),

(12, 'creative_preference', '你觉得自己在团队中通常扮演什么角色？', 'single_choice',
  '[
    {"value": "A", "text": "idea提供者"},
    {"value": "B", "text": "执行落地者"},
    {"value": "C", "text": "流程优化者"},
    {"value": "D", "text": "问题发现者"}
  ]'::jsonb, 12),

(13, 'creative_preference', '如果让你选一个AI能力方向深耕，你会选？', 'single_choice',
  '[
    {"value": "A", "text": "AI生图/视频创作"},
    {"value": "B", "text": "AI文案/内容写作"},
    {"value": "C", "text": "AI自动化工作流"},
    {"value": "D", "text": "AI数据分析"}
  ]'::jsonb, 13);

-- 维度3: 工作风格 (6题)
INSERT INTO opc_v2_test_questions (question_number, dimension, question_text, question_type, options, display_order) VALUES
(14, 'work_style', '拿到一个模糊的需求，你的第一反应是？', 'single_choice',
  '[
    {"value": "A", "text": "先做一版出来看看"},
    {"value": "B", "text": "列清楚所有细节再开始"},
    {"value": "C", "text": "找类似案例参考"},
    {"value": "D", "text": "和需求方反复确认"}
  ]'::jsonb, 14),

(15, 'work_style', '你更喜欢什么样的任务？', 'single_choice',
  '[
    {"value": "A", "text": "有挑战性的新任务"},
    {"value": "B", "text": "能发挥专长的熟悉任务"},
    {"value": "C", "text": "目标明确的结构化任务"},
    {"value": "D", "text": "可以自由发挥的开放任务"}
  ]'::jsonb, 15),

(16, 'work_style', '当一个项目进度落后时，你倾向于？', 'single_choice',
  '[
    {"value": "A", "text": "加快速度，先完成再优化"},
    {"value": "B", "text": "砍掉不重要的部分"},
    {"value": "C", "text": "寻求帮助或工具"},
    {"value": "D", "text": "重新规划优先级"}
  ]'::jsonb, 16),

(17, 'work_style', '你通常如何管理自己的工作？', 'single_choice',
  '[
    {"value": "A", "text": "todo清单+deadline"},
    {"value": "B", "text": "看心情和灵感"},
    {"value": "C", "text": "固定时间固定任务"},
    {"value": "D", "text": "敏捷迭代，快速调整"}
  ]'::jsonb, 17),

(18, 'work_style', '遇到技术难题时，你的第一选择是？', 'single_choice',
  '[
    {"value": "A", "text": "Google/ChatGPT搜索"},
    {"value": "B", "text": "看官方文档"},
    {"value": "C", "text": "问有经验的人"},
    {"value": "D", "text": "自己试错摸索"}
  ]'::jsonb, 18),

(19, 'work_style', '完成一个项目后，你会？', 'single_choice',
  '[
    {"value": "A", "text": "马上投入下一个"},
    {"value": "B", "text": "回顾总结经验"},
    {"value": "C", "text": "优化流程和模板"},
    {"value": "D", "text": "分享给别人看"}
  ]'::jsonb, 19);

-- 维度4: 兴趣方向 (6题)
INSERT INTO opc_v2_test_questions (question_number, dimension, question_text, question_type, options, display_order) VALUES
(20, 'interest_direction', '以下哪种AI应用场景最让你兴奋？', 'single_choice',
  '[
    {"value": "A", "text": "AI生成精美的视觉作品"},
    {"value": "B", "text": "AI自动化处理重复工作"},
    {"value": "C", "text": "AI理解并执行复杂指令"},
    {"value": "D", "text": "AI分析并预测趋势"}
  ]'::jsonb, 20),

(21, 'interest_direction', '如果可以选择，你想为哪类客户服务？', 'single_choice',
  '[
    {"value": "A", "text": "创意公司/品牌方"},
    {"value": "B", "text": "中小企业/个人"},
    {"value": "C", "text": "互联网公司/技术团队"},
    {"value": "D", "text": "不确定，都可以"}
  ]'::jsonb, 21),

(22, 'interest_direction', '你更想在哪个领域积累经验？', 'single_choice',
  '[
    {"value": "A", "text": "内容创作（文案/图片/视频）"},
    {"value": "B", "text": "营销传播（策划/投放/运营）"},
    {"value": "C", "text": "产品开发（工具/应用/系统）"},
    {"value": "D", "text": "数据分析（洞察/报告/决策）"}
  ]'::jsonb, 22),

(23, 'interest_direction', '5年后，你希望别人怎么介绍你？', 'single_choice',
  '[
    {"value": "A", "text": "TA是个很有创意的设计师/创作者"},
    {"value": "B", "text": "TA能快速把想法落地"},
    {"value": "C", "text": "TA搭建了一套自动化系统"},
    {"value": "D", "text": "TA对行业趋势判断很准"}
  ]'::jsonb, 23),

(24, 'interest_direction', '如果让你开一门AI课程，你会教什么？', 'single_choice',
  '[
    {"value": "A", "text": "AI绘画/视频创作"},
    {"value": "B", "text": "AI写作/内容生产"},
    {"value": "C", "text": "AI工具开发/自动化"},
    {"value": "D", "text": "AI商业应用/变现"}
  ]'::jsonb, 24),

(25, 'interest_direction', '下面哪句话最打动你？', 'single_choice',
  '[
    {"value": "A", "text": "用AI把脑海中的画面变成现实"},
    {"value": "B", "text": "用AI让重复工作全自动化"},
    {"value": "C", "text": "用AI理解用户真正的需求"},
    {"value": "D", "text": "用AI发现别人看不到的机会"}
  ]'::jsonb, 25);

-- 验证数据
SELECT dimension, COUNT(*) as count
FROM opc_v2_test_questions
GROUP BY dimension
ORDER BY dimension;
