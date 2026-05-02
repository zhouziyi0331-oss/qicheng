-- OPC能力画像测试题目数据 v2.0
-- 包含2道前置定义题 + 36道六维度选择题

-- ============================================
-- 前置定义题 (2题)
-- ============================================

-- 题目1: 剥离标签后的自我定义
INSERT INTO opc_v2_questions (question_number, question_type, question_text, prompt_text, input_type, max_length, display_order) VALUES
(1, 'definition',
 '当你不能提及任何学校名称、专业、工作单位或光环头衔，你会如何用3个词或3句话介绍自己？剥去所有外在标签之后，你是谁？',
 '例如：好奇的 / 喜欢拆东西 / 想让事情变好一点\n不必修饰，想到什么写什么。',
 'three_phrases', 20, 1);

-- 题目2: 自我定义的"厉害"
INSERT INTO opc_v2_questions (question_number, question_type, question_text, prompt_text, input_type, max_length, display_order) VALUES
(2, 'definition',
 '你做过的、让你自己觉得「还挺厉害的」一件事是什么？可以是任何领域的任何事——不必是大事，不必和成绩、奖项有关。我们看重的是你如何定义「厉害」。',
 '例如：搞定了一件特别麻烦的事 / 帮朋友度过了一个难关 / 坚持每天做一件事做了三个月 / 想出了一个别人没想到的办法……',
 'multi_line', 500, 2);

-- ============================================
-- 维度一: 信息处理风格 (6题, 题号3-8)
-- ============================================

INSERT INTO opc_v2_questions (question_number, question_type, question_text, dimension, options, display_order) VALUES
(3, 'choice', '接到一个模糊的需求时，你通常第一步做什么？', 'info_processing',
 '[
   {"label": "A", "text": "先把需求拆成几个小块，逐个确认具体要什么", "scoring": {"dimension": "info_processing", "value": 3, "direction": "analytical"}},
   {"label": "B", "text": "先问对方最终想要什么效果，倒推需要哪些东西", "scoring": {"dimension": "info_processing", "value": 3, "direction": "integrative"}},
   {"label": "C", "text": "先找类似案例看看别人怎么做的", "scoring": {"dimension": "info_processing", "value": 1, "direction": "integrative"}},
   {"label": "D", "text": "先自己画一个整体框架图，再和对方对齐", "scoring": {"dimension": "info_processing", "value": 2, "direction": "integrative"}}
 ]'::jsonb, 3);

INSERT INTO opc_v2_questions (question_number, question_type, question_text, dimension, options, display_order) VALUES
(4, 'choice', '学习一个新领域时，你更习惯：', 'info_processing',
 '[
   {"label": "A", "text": "先学最核心的几个概念，再向外扩展", "scoring": {"dimension": "info_processing", "value": 1, "direction": "analytical"}},
   {"label": "B", "text": "先画出整个领域的知识地图，再决定从哪里切入", "scoring": {"dimension": "info_processing", "value": 3, "direction": "integrative"}},
   {"label": "C", "text": "直接从具体案例入手，边做边理解", "scoring": {"dimension": "info_processing", "value": 2, "direction": "analytical"}},
   {"label": "D", "text": "先找一本系统教材，按章节顺序学习", "scoring": {"dimension": "info_processing", "value": 2, "direction": "integrative"}}
 ]'::jsonb, 4);

INSERT INTO opc_v2_questions (question_number, question_type, question_text, dimension, options, display_order) VALUES
(5, 'choice', '面对一个复杂问题时，你通常：', 'info_processing',
 '[
   {"label": "A", "text": "先把它分解成几个小问题，一个一个解决", "scoring": {"dimension": "info_processing", "value": 3, "direction": "analytical"}},
   {"label": "B", "text": "先找出问题的核心症结，只解决最关键的", "scoring": {"dimension": "info_processing", "value": 1, "direction": "integrative"}},
   {"label": "C", "text": "先想几种可能的方案，快速测试哪个方向对", "scoring": {"dimension": "info_processing", "value": 1, "direction": "analytical"}},
   {"label": "D", "text": "先收集足够的信息，确保理解全局后再动手", "scoring": {"dimension": "info_processing", "value": 2, "direction": "integrative"}}
 ]'::jsonb, 5);

INSERT INTO opc_v2_questions (question_number, question_type, question_text, dimension, options, display_order) VALUES
(6, 'choice', '整理一份资料时，你更倾向于：', 'info_processing',
 '[
   {"label": "A", "text": "按逻辑层级分类，层层递进", "scoring": {"dimension": "info_processing", "value": 2, "direction": "analytical"}},
   {"label": "B", "text": "按应用场景分类，方便查找使用", "scoring": {"dimension": "info_processing", "value": 1, "direction": "integrative"}},
   {"label": "C", "text": "按时间线或流程顺序整理", "scoring": {"dimension": "info_processing", "value": 1, "direction": "analytical"}},
   {"label": "D", "text": "用思维导图把各部分关系画出来", "scoring": {"dimension": "info_processing", "value": 3, "direction": "integrative"}}
 ]'::jsonb, 6);

INSERT INTO opc_v2_questions (question_number, question_type, question_text, dimension, options, display_order) VALUES
(7, 'choice', '别人问你一个你懂的问题，你通常：', 'info_processing',
 '[
   {"label": "A", "text": "从最基础的概念开始讲，确保对方理解透彻", "scoring": {"dimension": "info_processing", "value": 1, "direction": "analytical"}},
   {"label": "B", "text": "直接给出结论，然后解释为什么", "scoring": {"dimension": "info_processing", "value": 1, "direction": "integrative"}},
   {"label": "C", "text": "用类比的方式讲，让对方快速建立直观理解", "scoring": {"dimension": "info_processing", "value": 2, "direction": "integrative"}},
   {"label": "D", "text": "问清楚对方已经知道什么，只补充缺失的部分", "scoring": {"dimension": "info_processing", "value": 3, "direction": "analytical"}}
 ]'::jsonb, 7);

INSERT INTO opc_v2_questions (question_number, question_type, question_text, dimension, options, display_order) VALUES
(8, 'choice', '做一个项目时，你更关注：', 'info_processing',
 '[
   {"label": "A", "text": "每个环节是否按计划推进", "scoring": {"dimension": "info_processing", "value": 2, "direction": "analytical"}},
   {"label": "B", "text": "最终成果是否达到预期效果", "scoring": {"dimension": "info_processing", "value": 1, "direction": "integrative"}},
   {"label": "C", "text": "过程中是否发现了新的可能性", "scoring": {"dimension": "info_processing", "value": 2, "direction": "integrative"}},
   {"label": "D", "text": "各个部分之间是否协调一致", "scoring": {"dimension": "info_processing", "value": 3, "direction": "integrative"}}
 ]'::jsonb, 8);

-- ============================================
-- 维度二: 创作驱动偏好 (6题, 题号9-14)
-- ============================================

INSERT INTO opc_v2_questions (question_number, question_type, question_text, dimension, options, display_order) VALUES
(9, 'choice', '看到一个好的作品，你更容易被什么打动？', 'creation_drive',
 '[
   {"label": "A", "text": "视觉冲击力——构图、色彩、光影", "scoring": {"dimension": "creation_drive", "value": 3, "direction": "visual"}},
   {"label": "B", "text": "结构设计——信息组织、逻辑层次、叙事节奏", "scoring": {"dimension": "creation_drive", "value": 3, "direction": "logical"}},
   {"label": "C", "text": "情感共鸣——传递的情绪和故事感", "scoring": {"dimension": "creation_drive", "value": 1, "direction": "visual"}},
   {"label": "D", "text": "技术实现——背后的技术方案和实现难度", "scoring": {"dimension": "creation_drive", "value": 2, "direction": "logical"}}
 ]'::jsonb, 9);

INSERT INTO opc_v2_questions (question_number, question_type, question_text, dimension, options, display_order) VALUES
(10, 'choice', '你更享受哪种创作过程？', 'creation_drive',
 '[
   {"label": "A", "text": "在空白画布上从无到有地构建画面", "scoring": {"dimension": "creation_drive", "value": 3, "direction": "visual"}},
   {"label": "B", "text": "把混乱的信息整理成清晰的结构", "scoring": {"dimension": "creation_drive", "value": 3, "direction": "logical"}},
   {"label": "C", "text": "用已有素材拼贴组合出新的东西", "scoring": {"dimension": "creation_drive", "value": 1, "direction": "visual"}},
   {"label": "D", "text": "设定一套规则，让系统自动生成内容", "scoring": {"dimension": "creation_drive", "value": 2, "direction": "logical"}}
 ]'::jsonb, 10);

INSERT INTO opc_v2_questions (question_number, question_type, question_text, dimension, options, display_order) VALUES
(11, 'choice', '描述一件事物时，你更习惯：', 'creation_drive',
 '[
   {"label": "A", "text": "用画面感的语言，让人\"看到\"", "scoring": {"dimension": "creation_drive", "value": 3, "direction": "visual"}},
   {"label": "B", "text": "用结构化的语言，分点说明", "scoring": {"dimension": "creation_drive", "value": 3, "direction": "logical"}},
   {"label": "C", "text": "用故事的方式讲，有起承转合", "scoring": {"dimension": "creation_drive", "value": 1, "direction": "visual"}},
   {"label": "D", "text": "用类比和比喻，让人快速理解", "scoring": {"dimension": "creation_drive", "value": 1, "direction": "logical"}}
 ]'::jsonb, 11);

INSERT INTO opc_v2_questions (question_number, question_type, question_text, dimension, options, display_order) VALUES
(12, 'choice', '给你一个"设计一个AI助手"的任务，你最先想到的是：', 'creation_drive',
 '[
   {"label": "A", "text": "它的界面长什么样，交互方式是否自然", "scoring": {"dimension": "creation_drive", "value": 2, "direction": "visual"}},
   {"label": "B", "text": "它能解决什么问题，功能逻辑怎么设计", "scoring": {"dimension": "creation_drive", "value": 3, "direction": "logical"}},
   {"label": "C", "text": "它的\"性格\"是什么样的，说话语气如何", "scoring": {"dimension": "creation_drive", "value": 1, "direction": "visual"}},
   {"label": "D", "text": "它的技术架构怎么搭，用哪些模型和工具", "scoring": {"dimension": "creation_drive", "value": 2, "direction": "logical"}}
 ]'::jsonb, 12);

INSERT INTO opc_v2_questions (question_number, question_type, question_text, dimension, options, display_order) VALUES
(13, 'choice', '你觉得自己在哪方面更有天赋？', 'creation_drive',
 '[
   {"label": "A", "text": "视觉审美——能判断什么好看、什么不协调", "scoring": {"dimension": "creation_drive", "value": 3, "direction": "visual"}},
   {"label": "B", "text": "逻辑梳理——能把复杂的事情讲清楚", "scoring": {"dimension": "creation_drive", "value": 3, "direction": "logical"}},
   {"label": "C", "text": "情感洞察——能感知到别人的情绪和需求", "scoring": {"dimension": "creation_drive", "value": 1, "direction": "visual"}},
   {"label": "D", "text": "系统思维——能设计一套规则让事情自动运行", "scoring": {"dimension": "creation_drive", "value": 2, "direction": "logical"}}
 ]'::jsonb, 13);

INSERT INTO opc_v2_questions (question_number, question_type, question_text, dimension, options, display_order) VALUES
(14, 'choice', '如果让你做一个内容账号，你更可能做：', 'creation_drive',
 '[
   {"label": "A", "text": "视觉类——摄影、设计、插画、视频", "scoring": {"dimension": "creation_drive", "value": 3, "direction": "visual"}},
   {"label": "B", "text": "知识类——深度分析、行业观察、方法总结", "scoring": {"dimension": "creation_drive", "value": 3, "direction": "logical"}},
   {"label": "C", "text": "故事类——个人经历、人物访谈、叙事内容", "scoring": {"dimension": "creation_drive", "value": 1, "direction": "visual"}},
   {"label": "D", "text": "工具类——教程、资源推荐、效率技巧", "scoring": {"dimension": "creation_drive", "value": 2, "direction": "logical"}}
 ]'::jsonb, 14);

-- ============================================
-- 维度三: 工具学习方式 (6题, 题号15-20)
-- ============================================

INSERT INTO opc_v2_questions (question_number, question_type, question_text, dimension, options, display_order) VALUES
(15, 'choice', '拿到一个从没用过的AI工具，你通常：', 'tool_learning',
 '[
   {"label": "A", "text": "直接开始试用，边点边学", "scoring": {"dimension": "tool_learning", "value": 3, "direction": "exploratory"}},
   {"label": "B", "text": "先看别人用它的视频，再自己试", "scoring": {"dimension": "tool_learning", "value": 1, "direction": "exploratory"}},
   {"label": "C", "text": "先想清楚自己想用它做什么，再去找对应功能", "scoring": {"dimension": "tool_learning", "value": 1, "direction": "manual"}},
   {"label": "D", "text": "先看官方文档或教程，系统了解功能", "scoring": {"dimension": "tool_learning", "value": 3, "direction": "manual"}}
 ]'::jsonb, 15);

INSERT INTO opc_v2_questions (question_number, question_type, question_text, dimension, options, display_order) VALUES
(16, 'choice', '遇到一个功能不知道怎么用时，你通常：', 'tool_learning',
 '[
   {"label": "A", "text": "自己到处点点，总能试出来", "scoring": {"dimension": "tool_learning", "value": 3, "direction": "exploratory"}},
   {"label": "B", "text": "搜索一下，看有没有人分享过方法", "scoring": {"dimension": "tool_learning", "value": 1, "direction": "exploratory"}},
   {"label": "C", "text": "问身边用过的人或AI助手", "scoring": {"dimension": "tool_learning", "value": 1, "direction": "manual"}},
   {"label": "D", "text": "去看官方帮助文档", "scoring": {"dimension": "tool_learning", "value": 3, "direction": "manual"}}
 ]'::jsonb, 16);

INSERT INTO opc_v2_questions (question_number, question_type, question_text, dimension, options, display_order) VALUES
(17, 'choice', '学习新工具时，你更看重：', 'tool_learning',
 '[
   {"label": "A", "text": "能不能快速上手做出第一个东西", "scoring": {"dimension": "tool_learning", "value": 2, "direction": "exploratory"}},
   {"label": "B", "text": "能不能找到足够多的教程和案例", "scoring": {"dimension": "tool_learning", "value": 1, "direction": "manual"}},
   {"label": "C", "text": "能不能理解它的底层逻辑和限制", "scoring": {"dimension": "tool_learning", "value": 3, "direction": "manual"}},
   {"label": "D", "text": "能不能把它整合到自己的工作流里", "scoring": {"dimension": "tool_learning", "value": 1, "direction": "exploratory"}}
 ]'::jsonb, 17);

INSERT INTO opc_v2_questions (question_number, question_type, question_text, dimension, options, display_order) VALUES
(18, 'choice', '你对工具的态度更接近：', 'tool_learning',
 '[
   {"label": "A", "text": "工具够用就行，不追求最新最全", "scoring": {"dimension": "tool_learning", "value": 1, "direction": "manual"}},
   {"label": "B", "text": "喜欢尝试新工具，但只深入用几款核心的", "scoring": {"dimension": "tool_learning", "value": 2, "direction": "exploratory"}},
   {"label": "C", "text": "会花时间精通一款工具，把它用到极致", "scoring": {"dimension": "tool_learning", "value": 3, "direction": "manual"}},
   {"label": "D", "text": "持续关注新工具，保持工具链更新", "scoring": {"dimension": "tool_learning", "value": 1, "direction": "exploratory"}}
 ]'::jsonb, 18);

INSERT INTO opc_v2_questions (question_number, question_type, question_text, dimension, options, display_order) VALUES
(19, 'choice', '教别人用一款工具时，你通常：', 'tool_learning',
 '[
   {"label": "A", "text": "直接演示一遍，让他跟着做", "scoring": {"dimension": "tool_learning", "value": 2, "direction": "exploratory"}},
   {"label": "B", "text": "告诉他核心逻辑，剩下的他自己摸索", "scoring": {"dimension": "tool_learning", "value": 1, "direction": "manual"}},
   {"label": "C", "text": "先问他想达成什么效果，告诉他对应的功能在哪", "scoring": {"dimension": "tool_learning", "value": 2, "direction": "manual"}},
   {"label": "D", "text": "从界面布局开始，系统讲一遍", "scoring": {"dimension": "tool_learning", "value": 3, "direction": "manual"}}
 ]'::jsonb, 19);

INSERT INTO opc_v2_questions (question_number, question_type, question_text, dimension, options, display_order) VALUES
(20, 'choice', '你觉得一个好的工具应该：', 'tool_learning',
 '[
   {"label": "A", "text": "上手简单，不需要看说明书就能用", "scoring": {"dimension": "tool_learning", "value": 3, "direction": "exploratory"}},
   {"label": "B", "text": "功能强大，能满足各种复杂需求", "scoring": {"dimension": "tool_learning", "value": 1, "direction": "manual"}},
   {"label": "C", "text": "有丰富的社区和教程资源", "scoring": {"dimension": "tool_learning", "value": 2, "direction": "manual"}},
   {"label": "D", "text": "能和其他工具灵活组合使用", "scoring": {"dimension": "tool_learning", "value": 1, "direction": "exploratory"}}
 ]'::jsonb, 20);

-- 继续下一部分...
