-- ============================================================
-- 启程 (Qicheng) · 种子数据
-- OPC人格标签库 (50+) + 25题测试题目 + 系统配置
-- ============================================================

-- ============================================================
-- 1. OPC 人格标签库 (存入 config 表)
-- ============================================================
CREATE TABLE IF NOT EXISTS opc_label_library (
  id          SERIAL PRIMARY KEY,
  label       VARCHAR(128) NOT NULL UNIQUE,
  track       track_type,            -- 倾向赛道 NULL=通用
  d1_weight   NUMERIC(3,2) DEFAULT 0.33, -- 兴趣权重
  d2_weight   NUMERIC(3,2) DEFAULT 0.33, -- 擅长权重
  d4_weight   NUMERIC(3,2) DEFAULT 0.34, -- 方向偏好权重
  description TEXT,
  is_active   BOOLEAN DEFAULT TRUE
);

INSERT INTO opc_label_library (label, track, description) VALUES
-- 赛道A: AI内容创作
('隐藏的创作型执行者',           'A', '有想法有行动力，但平时很低调'),
('天生的品牌叙事者',             'A', '极强的内容感知力，知道怎么讲故事'),
('内容感知力超强的视觉OPC',       'A', '对图像和视觉有天然的审美直觉'),
('把AI用到极致的内容怪',         'A', '爱折腾工具，在内容领域用AI效率极高'),
('低调的内容策划师',             'A', '不声不响但每次都能输出令人惊喜的内容'),
('会讲故事的效率型创作者',        'A', '兼顾创意和执行，少废话多产出'),
('感性驱动的美学创造者',         'A', '靠感觉和审美驱动，产出往往超出预期'),
('AI工具收藏家·内容变现者',      'A', '试过最多AI工具，并能用它们赚到钱'),
('有执行力的创意爆发型',         'A', '灵感来了就动手，完成率高'),
('细腻的内容观察者',             'A', '对细节极度敏感，内容质感出众'),
('内容实验室负责人',             'A', '喜欢测试新内容形式，不怕失败'),
('品牌视觉语言翻译官',           'A', '能把抽象品牌感转化成具体视觉'),
('AI赋能的IP建设者',            'A', '有意识地打造个人或品牌IP'),
('短视频思维的全能创作者',        'A', '天然适应碎片化内容消费时代'),
('跨媒介内容整合者',             'A', '能融合图文视频多种形式'),

-- 赛道B: AI工具开发
('工具控·解决问题专家',          'B', '对工具有强烈的兴趣，专门用来解决实际问题'),
('低调的技术实现派',             'B', '说得少做得多，代码是最好的证明'),
('把AI用到极致的效率怪',         'B', '工具链极度优化，做同样的事效率是别人3倍'),
('自动化流程痴迷者',             'B', '看到重复的事情就想自动化'),
('产品感极强的工具搭建者',        'B', '搭的工具不只是能用，还好用'),
('用户视角的开发者',             'B', '开发时先想用户，后想技术'),
('数据驱动的分析型OPC',          'B', '用数据说话，分析能力突出'),
('系统思维的架构型创造者',        'B', '喜欢想全局，搭架构'),
('Agent搭建爱好者',              'B', '对AI Agent有天然的热情和动手欲'),
('无代码·低代码效率专家',        'B', '不一定写代码，但能搭出有用的工具'),
('逻辑严密的流程优化者',         'B', '爱梳理流程，发现低效就想优化'),
('小程序微创业者',               'B', '喜欢把想法做成可用的小产品'),
('API整合魔法师',                'B', '能把不同服务连接成有价值的新工具'),

-- 双赛道通用
('全栈型OPC探索者',              'AB', '内容和工具都感兴趣，在探索哪个更适合自己'),
('斜杠OPC·创作+技术双修',        'AB', '两条腿走路，内容和工具都能做'),
('市场感极强的创业型思维者',      'AB', '做任何事都在想商业化可能性'),
('执行力第一名',                 NULL, '给什么做什么，完成率行业前10%'),
('安静的高产出者',               NULL, '不爱说话，但产出让人惊喜'),
('反应极快的需求理解专家',        NULL, '甲方说什么就理解什么，很少需要修改'),
('自学成才的AI原住民',           NULL, '没人教，自己摸索，已经比很多人用得更好'),
('有商业直觉的创造者',           NULL, '做事情会考虑能不能卖，能卖多少'),
('把第一次做好的完美主义者',      NULL, '交付物质量超出预期'),
('团队协作的枢纽型人才',         NULL, '个人能力强，协作能力更强'),
('跨领域融合创新者',             NULL, '能把两个不相关的领域连接起来'),
('迭代速度极快的精益OPC',        NULL, '不追求完美，快速出结果快速迭代'),
('乐于助人的知识输出者',         NULL, '做完自己的任务还喜欢帮别人'),
('擅长化繁为简的表达者',         NULL, '复杂的事情讲得很清楚'),
('有耐心的长期价值建设者',        NULL, '不急于变现，专注积累'),
('直觉型创作者·灵感驱动',        NULL, '靠感觉做决策，往往是对的'),
('结果导向的职业型OPC',          NULL, '非常清楚自己在为什么而做'),
('好奇心驱动的终身学习者',        NULL, '每周都在学新东西，停不下来'),
('把工具用出灵魂的极客',         NULL, '工具本身不重要，用法让人叹服');

-- ============================================================
-- 2. 系统配置表
-- ============================================================
CREATE TABLE IF NOT EXISTS system_config (
  key         VARCHAR(128) PRIMARY KEY,
  value       TEXT NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  UUID
);

INSERT INTO system_config (key, value, description) VALUES
('platform_fee_rate_lv0_2',  '0.20', 'Lv.0-2 平台抽成比例'),
('platform_fee_rate_lv3',    '0.18', 'Lv.3 平台抽成比例'),
('platform_fee_rate_lv4_5',  '0.15', 'Lv.4-5 平台抽成比例'),
('first_task_settlement_hours', '24', '首单结算小时数'),
('normal_task_settlement_days', '7',  '普通任务结算天数'),
('first_task_max_budget',    '20.00', '首单最高报酬(平台垫付)'),
('first_task_min_budget',    '5.00',  '首单最低报酬'),
('min_withdrawal_amount',    '10.00', '最低提现金额'),
('auto_withdrawal_limit',    '1000.00', '自动处理提现上限'),
('task_assign_max_count',    '3',    '每个任务最多推送人数'),
('ai_review_max_attempts',   '2',    'AI审核最多重审次数'),
('frustrated_signal_threshold', '2', '触发挫败信号的打回次数'),
('level_upgrade_a_min_score_lv1', '70', 'Lv.1升级最低AI评分'),
('level_upgrade_a_min_score_lv2', '75', 'Lv.2升级最低AI评分'),
('level_upgrade_a_min_score_lv3', '80', 'Lv.3升级最低AI评分'),
('level_upgrade_a_min_score_lv4', '85', 'Lv.4升级最低AI评分'),
('contact_unlock_task_count', '2',   '解锁联系方式所需完成任务数'),
('report_r1_price', '69.00',  'R1能力全景图价格'),
('report_r2_price', '69.00',  'R2执行力档案价格'),
('report_r3_price', '99.00',  'R3学习成长曲线价格'),
('report_r4_price', '99.00',  'R4简历包装方案价格'),
('report_r5_price', '199.00', 'R5 OPC方向报告价格'),
('report_full_price','299.00','完整版报告价格'),
('ability_detail_price', '69.00', '六维能力详细版价格'),
('company_designate_fee_lv3', '50.00', '企业定向指定Lv.3费用'),
('company_designate_fee_lv4', '100.00','企业定向指定Lv.4费用'),
('company_designate_fee_lv5', '200.00','企业定向指定Lv.5费用')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 3. 25题测试题目库
-- ============================================================
CREATE TABLE IF NOT EXISTS test_questions (
  id            SERIAL PRIMARY KEY,
  question_num  SMALLINT NOT NULL UNIQUE,  -- 1-25
  dimension     VARCHAR(8) NOT NULL,       -- D1/D2/D3/D4/D5
  question_text TEXT NOT NULL,
  input_type    VARCHAR(16) NOT NULL,      -- open/single/multi
  options       JSONB,                     -- [{value, label}] NULL if open
  max_select    SMALLINT DEFAULT 1,        -- multi时最多选几个
  is_active     BOOLEAN DEFAULT TRUE
);

INSERT INTO test_questions (question_num, dimension, question_text, input_type, options, max_select) VALUES
-- D1 兴趣探索
(1, 'D1', '你上一次做一件事做到忘记时间，是在做什么？', 'open', NULL, NULL),
(2, 'D1', '如果有一整天完全自由，你最可能做什么？', 'multi',
  '[{"value":"video","label":"刷视频"},{"value":"game","label":"打游戏"},{"value":"create","label":"做创作"},{"value":"learn","label":"学新东西"},{"value":"social","label":"社交"},{"value":"sport","label":"运动"},{"value":"other","label":"其他"}]'::jsonb, 3),
(3, 'D1', '以下哪种创造方式让你最有成就感？', 'single',
  '[{"value":"visual","label":"视觉内容（图/视频）"},{"value":"text","label":"文字内容（文案/故事）"},{"value":"tool","label":"工具搭建（小程序/自动化）"},{"value":"data","label":"数据分析"},{"value":"plan","label":"策划方案"},{"value":"other","label":"其他"}]'::jsonb, 1),
(4, 'D1', '你最近一次主动学一个新东西，是因为什么？', 'single',
  '[{"value":"curious","label":"好奇心驱动"},{"value":"useful","label":"觉得有用"},{"value":"friend","label":"朋友推荐"},{"value":"course","label":"课程要求"},{"value":"other","label":"其他"}]'::jsonb, 1),
(5, 'D1', '你觉得自己更像哪种人？', 'single',
  '[{"value":"content","label":"喜欢创造内容的人"},{"value":"tool","label":"喜欢搭建工具的人"},{"value":"both","label":"两者都有"},{"value":"unsure","label":"都不确定"}]'::jsonb, 1),
-- D2 擅长识别
(6, 'D2', '朋友最常找你帮忙做什么？', 'multi',
  '[{"value":"design","label":"修图/设计"},{"value":"copy","label":"写文案"},{"value":"tech","label":"修电脑/手机"},{"value":"doc","label":"做表格/文档"},{"value":"idea","label":"出主意/策划"},{"value":"research","label":"找资料"},{"value":"other","label":"其他"}]'::jsonb, 3),
(7, 'D2', '你觉得自己比大多数同学做得更好的事情是？', 'open', NULL, NULL),
(8, 'D2', '你最近一次被人夸，是因为什么？', 'open', NULL, NULL),
(9, 'D2', '以下哪种成就感对你最真实？', 'single',
  '[{"value":"beauty","label":"做出了一个好看的东西"},{"value":"solve","label":"解决了一个复杂问题"},{"value":"help","label":"帮别人省了时间"},{"value":"earn","label":"赚到了钱"},{"value":"praise","label":"被人认可和夸奖"}]'::jsonb, 1),
(10, 'D2', '你做过最有成就感的一件事是？', 'open', NULL, NULL),
-- D3 专业与工具
(11, 'D3', '你的专业方向是？', 'single',
  '[{"value":"cs","label":"计算机/AI/自动化"},{"value":"design","label":"设计/艺术/传媒"},{"value":"business","label":"商科/管理/市场"},{"value":"stem","label":"理工科（非计算机）"},{"value":"liberal","label":"文科/社科/教育"},{"value":"other","label":"其他"}]'::jsonb, 1),
(12, 'D3', '你目前用过哪些AI工具？', 'multi',
  '[{"value":"chatgpt","label":"ChatGPT"},{"value":"claude","label":"Claude"},{"value":"midjourney","label":"Midjourney"},{"value":"sd","label":"Stable Diffusion"},{"value":"runway","label":"Runway"},{"value":"sora","label":"Sora"},{"value":"coze","label":"Coze"},{"value":"wenxin","label":"文心一言"},{"value":"tongyi","label":"通义千问"},{"value":"kimi","label":"Kimi"},{"value":"doubao","label":"豆包"},{"value":"cursor","label":"Cursor"},{"value":"copilot","label":"GitHub Copilot"},{"value":"jimeng","label":"即梦"},{"value":"other","label":"其他"}]'::jsonb, 10),
(13, 'D3', '你用AI工具的频率？', 'single',
  '[{"value":"daily","label":"每天都用"},{"value":"weekly","label":"每周几次"},{"value":"sometimes","label":"偶尔用"},{"value":"never","label":"几乎没用过"}]'::jsonb, 1),
(14, 'D3', '除AI工具外，你最熟悉的软件或技能是？', 'multi',
  '[{"value":"ps","label":"Photoshop/PS"},{"value":"pr","label":"Premiere/PR"},{"value":"ae","label":"After Effects/AE"},{"value":"figma","label":"Figma"},{"value":"excel","label":"Excel/表格"},{"value":"python","label":"Python"},{"value":"js","label":"JavaScript"},{"value":"code","label":"其他编程语言"},{"value":"jianying","label":"剪映"},{"value":"other","label":"其他"}]'::jsonb, 5),
(15, 'D3', '你有没有用AI做过能给别人看的东西？', 'single',
  '[{"value":"yes_shared","label":"有，做过并展示过"},{"value":"yes_private","label":"有，但没给人看"},{"value":"no_want","label":"没有，但想试试"},{"value":"no","label":"没有"}]'::jsonb, 1),
-- D4 方向偏好
(16, 'D4', '你更倾向于做哪类工作？', 'single',
  '[{"value":"content","label":"创作内容（图/视频/文案）"},{"value":"tool","label":"搭建工具（小程序/Agent/自动化）"},{"value":"both","label":"两者都行"},{"value":"unsure","label":"不确定"}]'::jsonb, 1),
(17, 'D4', '如果有人愿意付钱让你做一件事，你最希望是什么？', 'open', NULL, NULL),
(18, 'D4', '你对「接单赚钱」这件事的态度是？', 'single',
  '[{"value":"very","label":"很感兴趣，想试试"},{"value":"some","label":"有点兴趣，但不确定"},{"value":"neutral","label":"无所谓"},{"value":"low","label":"不太感兴趣"}]'::jsonb, 1),
(19, 'D4', '你最看好哪个方向的未来发展？', 'multi',
  '[{"value":"ai_content","label":"AI内容创作"},{"value":"ai_tool","label":"AI工具开发"},{"value":"ecom","label":"跨境电商"},{"value":"brand","label":"品牌运营"},{"value":"data","label":"数据分析"},{"value":"other","label":"其他"}]'::jsonb, 2),
(20, 'D4', '你最担心的是什么？', 'multi',
  '[{"value":"fail","label":"做不好被否定"},{"value":"time","label":"没有时间"},{"value":"start","label":"不知道从哪里开始"},{"value":"trouble","label":"怕麻烦"},{"value":"unknown","label":"不知道自己能做什么"},{"value":"other","label":"其他"}]'::jsonb, 3),
-- D5 能力自评
(21, 'D5', '如果给你一个任务，你通常会怎么做？', 'single',
  '[{"value":"plan_first","label":"先想清楚再动手"},{"value":"do_think","label":"边做边想"},{"value":"ask","label":"先找人问"},{"value":"delay","label":"先放着，之后再说"}]'::jsonb, 1),
(22, 'D5', '你通常需要多长时间完成一个新技能的初步掌握？', 'single',
  '[{"value":"hours","label":"几小时内"},{"value":"days","label":"1-3天"},{"value":"week","label":"一周左右"},{"value":"long","label":"需要更长时间"}]'::jsonb, 1),
(23, 'D5', '你的时间管理能力如何？', 'single',
  '[{"value":"good","label":"很好，基本不拖延"},{"value":"ok","label":"一般，偶尔拖延"},{"value":"bad","label":"不太好，经常拖延"},{"value":"terrible","label":"很差，严重拖延"}]'::jsonb, 1),
(24, 'D5', '遇到不会的问题，你通常怎么解决？', 'single',
  '[{"value":"self","label":"自己研究直到解决"},{"value":"ai","label":"问AI"},{"value":"friend","label":"问朋友或同学"},{"value":"delay","label":"先放着，之后再说"},{"value":"other","label":"其他"}]'::jsonb, 1),
(25, 'D5', '你愿意为了赚钱花多少时间在一个任务上？', 'single',
  '[{"value":"1h","label":"1小时以内"},{"value":"3h","label":"1-3小时"},{"value":"4h","label":"半天（4小时左右）"},{"value":"day","label":"一天以上"}]'::jsonb, 1)
ON CONFLICT (question_num) DO NOTHING;
