-- AI导师"人性化"系统 - 让导师真正像一个朋友
-- 创建时间: 2026-05-10

-- 1. 工具/软件推荐库
CREATE TABLE IF NOT EXISTS mentor_tool_recommendations (
    id SERIAL PRIMARY KEY,
    tool_name VARCHAR(100) NOT NULL,
    tool_category VARCHAR(50) NOT NULL, -- design, coding, ai_assistant, project_management, learning
    tool_description TEXT NOT NULL,
    why_recommend TEXT NOT NULL, -- 为什么推荐这个工具

    -- 适用场景
    suitable_for JSONB, -- { "skill_level": ["beginner", "intermediate"], "task_type": ["ui_design", "frontend"] }

    -- 具体使用方法
    how_to_use TEXT, -- 具体步骤
    quick_start_steps TEXT[], -- 快速上手步骤

    -- 工具信息
    is_free BOOLEAN DEFAULT true,
    website_url TEXT,
    tutorial_url TEXT,

    -- 替代方案
    alternatives TEXT[], -- 其他类似工具

    -- 使用统计
    times_recommended INTEGER DEFAULT 0,
    success_rate DECIMAL(3,2), -- 推荐后学生成功使用的比例

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_tool_category (tool_category),
    INDEX idx_tool_suitable (suitable_for) USING GIN
);

-- 2. 对话片段库（有温度的表达）
CREATE TABLE IF NOT EXISTS mentor_conversation_phrases (
    id SERIAL PRIMARY KEY,
    phrase_type VARCHAR(50) NOT NULL, -- greeting, empathy, encouragement, celebration, comfort, transition
    situation VARCHAR(100) NOT NULL, -- first_time, stuck, frustrated, breakthrough, confused, anxious

    -- 表达内容
    phrase_text TEXT NOT NULL,
    tone VARCHAR(50), -- warm, supportive, excited, calm, understanding

    -- 使用条件
    student_emotion VARCHAR(50), -- 适用的学生情绪
    conversation_stage VARCHAR(50), -- 对话的哪个阶段

    -- 变体（同一个意思的不同说法）
    variations TEXT[],

    -- 使用统计
    times_used INTEGER DEFAULT 0,
    student_response_positive INTEGER DEFAULT 0, -- 学生正面回应次数

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_phrase_type_situation (phrase_type, situation),
    INDEX idx_phrase_emotion (student_emotion)
);

-- 3. 任务分析模板
CREATE TABLE IF NOT EXISTS mentor_task_analysis_templates (
    id SERIAL PRIMARY KEY,
    task_type VARCHAR(100) NOT NULL, -- ui_design, frontend_dev, backend_api, data_analysis

    -- 任务分解
    required_skills JSONB, -- { "html": "basic", "css": "intermediate", "design": "basic" }
    typical_challenges TEXT[], -- 常见困难

    -- 推荐工具
    recommended_tools INTEGER[], -- 关联 mentor_tool_recommendations 的 id

    -- 学习路径
    learning_path JSONB, -- 分步骤的学习路径

    -- 时间估算
    estimated_hours INTEGER,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_task_type (task_type)
);

-- 4. 对话上下文增强（更人性化）
CREATE TABLE IF NOT EXISTS mentor_humanized_context (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES mentor_stage_sessions(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- 关系建立
    relationship_stage VARCHAR(50) DEFAULT 'initial', -- initial, building, established, close
    trust_level DECIMAL(3,2) DEFAULT 0.5, -- 信任程度 0-1

    -- 对话风格偏好
    preferred_tone VARCHAR(50), -- casual, formal, encouraging, direct
    response_to_humor BOOLEAN, -- 学生是否喜欢幽默

    -- 重要时刻记录
    important_moments JSONB, -- [{ "moment": "first_breakthrough", "date": "2024-05-10", "detail": "..." }]

    -- 共同经历
    shared_experiences TEXT[], -- "一起解决了登录bug", "一起完成了第一个UI设计"

    -- 学生说过的话（值得记住的）
    memorable_quotes JSONB, -- [{ "quote": "我觉得我做不了", "context": "...", "date": "..." }]

    -- 导师说过的承诺
    mentor_promises TEXT[], -- "我会一直陪着你", "我们一步一步来"

    -- 下次对话提醒
    next_conversation_topics TEXT[], -- 下次要问的问题
    follow_up_needed BOOLEAN DEFAULT false,
    follow_up_reason TEXT,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_humanized_session (session_id),
    INDEX idx_humanized_student (student_id)
);

-- 5. 学生具体困难记录（不是抽象的，是具体的）
CREATE TABLE IF NOT EXISTS mentor_student_specific_struggles (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    session_id INTEGER NOT NULL REFERENCES mentor_stage_sessions(id) ON DELETE CASCADE,

    -- 具体困难
    struggle_description TEXT NOT NULL, -- "不知道怎么写登录功能的代码"
    student_original_words TEXT, -- 学生原话："我看着那些代码就头疼"

    -- 困难分析
    root_cause VARCHAR(100), -- lack_of_knowledge, lack_of_tool, lack_of_confidence, unclear_requirement
    specific_gap TEXT, -- 具体缺少什么："不会用React Hooks"

    -- 解决方案
    solution_provided TEXT, -- 提供的具体解决方案
    tool_recommended INTEGER REFERENCES mentor_tool_recommendations(id),

    -- 结果
    resolved BOOLEAN DEFAULT false,
    resolution_time TIMESTAMP,
    how_resolved TEXT, -- 怎么解决的

    -- 学生反馈
    student_feedback TEXT,
    was_helpful BOOLEAN,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_struggle_student (student_id),
    INDEX idx_struggle_resolved (resolved)
);

-- 6. 工具使用跟踪
CREATE TABLE IF NOT EXISTS mentor_tool_usage_tracking (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tool_id INTEGER NOT NULL REFERENCES mentor_tool_recommendations(id),
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

    -- 推荐情况
    recommended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recommendation_context TEXT, -- 在什么情况下推荐的

    -- 使用情况
    student_tried BOOLEAN DEFAULT false,
    tried_at TIMESTAMP,

    -- 结果
    succeeded BOOLEAN,
    difficulty_level VARCHAR(50), -- easy, medium, hard
    time_to_learn_minutes INTEGER,

    -- 反馈
    student_comment TEXT,
    would_recommend_to_others BOOLEAN,

    INDEX idx_tool_usage_student (student_id),
    INDEX idx_tool_usage_tool (tool_id)
);

-- 7. 对话自然度评分
CREATE TABLE IF NOT EXISTS mentor_conversation_naturalness (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES mentor_stage_sessions(id) ON DELETE CASCADE,
    message_id INTEGER NOT NULL REFERENCES mentor_stage_messages(id) ON DELETE CASCADE,

    -- 自然度指标
    feels_like_human BOOLEAN, -- 感觉像人在说话
    has_empathy BOOLEAN, -- 有共情
    has_warmth BOOLEAN, -- 有温度
    remembers_past BOOLEAN, -- 记得过去

    -- 学生反应
    student_engaged BOOLEAN, -- 学生是否积极回应
    student_opened_up BOOLEAN, -- 学生是否敞开心扉

    -- 评分来源
    rated_by VARCHAR(50), -- student, system, manual_review

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_naturalness_session (session_id)
);

-- 插入工具推荐数据
INSERT INTO mentor_tool_recommendations (tool_name, tool_category, tool_description, why_recommend, suitable_for, how_to_use, quick_start_steps, is_free, website_url) VALUES
('即时设计', 'design', '国产在线UI设计工具，类似Figma',
 '中文界面，上手快，有大量现成模板，特别适合新手。不需要下载安装，打开浏览器就能用。',
 '{"skill_level": ["beginner", "intermediate"], "task_type": ["ui_design", "prototype"]}'::jsonb,
 '1. 访问 js.design 注册账号\n2. 搜索你需要的模板（如"电商小程序"）\n3. 复制模板到你的工作区\n4. 修改文字、颜色、图片\n5. 导出设计稿',
 ARRAY['注册账号', '搜索模板', '复制并修改', '导出'],
 true,
 'https://js.design'),

('Cursor', 'ai_assistant', 'AI编程助手，能帮你写代码、解释代码、修bug',
 '你用中文描述功能，它就能帮你写代码。看不懂的代码，它能解释。有bug，它能帮你改。就像有个程序员朋友一直在旁边帮你。',
 '{"skill_level": ["beginner", "intermediate", "advanced"], "task_type": ["frontend", "backend", "any_coding"]}'::jsonb,
 '1. 去 cursor.sh 下载安装\n2. 打开你的项目文件夹\n3. 按 Cmd+K (Mac) 或 Ctrl+K (Windows)\n4. 用中文告诉它你要什么功能\n5. 它会帮你写代码',
 ARRAY['下载安装', '打开项目', '按快捷键', '描述需求', '获得代码'],
 true,
 'https://cursor.sh'),

('微信开发者工具', 'coding', '微信小程序官方开发工具',
 '做小程序必须用的工具，有代码编辑、实时预览、调试功能。虽然一开始可能觉得复杂，但用熟了很方便。',
 '{"skill_level": ["beginner", "intermediate", "advanced"], "task_type": ["miniapp", "frontend"]}'::jsonb,
 '1. 去微信公众平台下载\n2. 用微信扫码登录\n3. 创建或导入项目\n4. 左边写代码，右边看效果\n5. 用调试器查看错误',
 ARRAY['下载安装', '扫码登录', '创建项目', '开始开发'],
 true,
 'https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html'),

('ChatGPT', 'ai_assistant', 'AI对话助手，能回答问题、解释概念、提供建议',
 '遇到不懂的概念、看不懂的代码、不知道怎么做的功能，都可以问它。它会用你能理解的方式解释给你听。',
 '{"skill_level": ["beginner", "intermediate", "advanced"], "task_type": ["learning", "problem_solving"]}'::jsonb,
 '1. 访问 chat.openai.com 注册\n2. 直接用中文提问\n3. 如果回答不够清楚，继续追问\n4. 可以让它举例子、画图、写代码',
 ARRAY['注册账号', '开始提问', '持续对话'],
 false,
 'https://chat.openai.com'),

('Notion', 'project_management', '笔记和项目管理工具',
 '可以记录任务进度、整理学习笔记、制定计划。界面简洁，功能强大，很多人用它来管理项目。',
 '{"skill_level": ["beginner", "intermediate", "advanced"], "task_type": ["planning", "note_taking", "project_management"]}'::jsonb,
 '1. 访问 notion.so 注册\n2. 创建一个页面\n3. 用模板或自己设计\n4. 记录任务、笔记、想法',
 ARRAY['注册账号', '创建页面', '开始记录'],
 true,
 'https://notion.so');

-- 插入对话片段
INSERT INTO mentor_conversation_phrases (phrase_type, situation, phrase_text, tone, student_emotion, variations) VALUES
-- 共情类
('empathy', 'stuck', '我知道现在很难，你可能觉得自己怎么努力都做不好。这种感觉我懂，真的很难受。', 'understanding', 'frustrated',
 ARRAY['我理解你现在的感受，卡住了确实很让人沮丧', '嗯，我能感觉到你的挫败感，这个确实不容易']),

('empathy', 'anxious', '先别慌，我们一起来看看。焦虑是正常的，第一次做都会这样。', 'calm', 'anxious',
 ARRAY['别紧张，我陪着你呢，我们慢慢来', '我感觉到你有点紧张，没关系的，一步一步来']),

('empathy', 'confused', '嗯嗯，我明白了。看到一堆不懂的东西，确实会让人头疼。', 'patient', 'confused',
 ARRAY['我懂，这个确实有点绕，我来帮你理清楚', '我理解，第一次看到这些会觉得很复杂']),

-- 鼓励类
('encouragement', 'trying', '你刚才那个想法真的很棒！我看到你在尝试用不同的角度思考，这个变化我注意到了。', 'excited', 'confident',
 ARRAY['哇，你这个思路很好！我看到你在进步', '很好！你已经开始自己思考解决方案了']),

('encouragement', 'small_progress', '你看，你已经完成第一步了！开始是最难的，你已经迈出去了。', 'warm', 'neutral',
 ARRAY['嘿，你做到了第一步！这个很重要', '你看，你已经开始了，这就是进步']),

-- 庆祝类
('celebration', 'breakthrough', '哇！你刚才自己想出来了！还记得一开始你说"我完全不知道怎么办"吗？现在你已经能自己找到方法了！', 'excited', 'proud',
 ARRAY['太棒了！你自己解决了！我看到你的成长了', '你做到了！从不会到会，你真的进步很大']),

-- 安慰类
('comfort', 'want_to_give_up', '嘿...等等，先别急着放弃。我一直在陪着你，我看到你已经做了这么多。', 'supportive', 'overwhelmed',
 ARRAY['别放弃，我们一起走到这里了，再坚持一下', '我知道你累了，但你已经走了这么远了']),

-- 过渡类
('transition', 'to_solution', '好，我明白了。我帮你分析一下，然后我们一起想办法。', 'supportive', 'any',
 ARRAY['嗯，我懂了。让我们一起来看看怎么解决', '好的，我理解情况了，我们来想想办法']),

('transition', 'to_action', '要不这样，我们先试试这个方法，看看效果怎么样？', 'encouraging', 'any',
 ARRAY['来，我们先做第一步，试试看', '那我们开始吧，先从最简单的开始']),

-- 陪伴类
('companionship', 'ongoing', '我等你消息，有问题随时来找我。', 'warm', 'any',
 ARRAY['我一直在这儿，有需要就叫我', '别担心，我会一直陪着你']),

('companionship', 'checking', '上次你说要试试那个方法，怎么样了？', 'caring', 'any',
 ARRAY['你试了吗？进展怎么样？', '后来怎么样了？顺利吗？']);

-- 创建视图：工具推荐效果分析
CREATE OR REPLACE VIEW mentor_tool_effectiveness AS
SELECT
    t.tool_name,
    t.tool_category,
    COUNT(u.id) as times_recommended,
    COUNT(CASE WHEN u.student_tried THEN 1 END) as times_tried,
    COUNT(CASE WHEN u.succeeded THEN 1 END) as times_succeeded,
    CASE
        WHEN COUNT(CASE WHEN u.student_tried THEN 1 END) > 0
        THEN ROUND(COUNT(CASE WHEN u.succeeded THEN 1 END)::numeric / COUNT(CASE WHEN u.student_tried THEN 1 END), 2)
        ELSE 0
    END as success_rate,
    AVG(u.time_to_learn_minutes) as avg_learning_time
FROM mentor_tool_recommendations t
LEFT JOIN mentor_tool_usage_tracking u ON t.id = u.tool_id
GROUP BY t.id, t.tool_name, t.tool_category;

COMMENT ON TABLE mentor_tool_recommendations IS '工具/软件推荐库 - 知道有哪些工具可以推荐给学生';
COMMENT ON TABLE mentor_conversation_phrases IS '对话片段库 - 有温度的表达方式';
COMMENT ON TABLE mentor_task_analysis_templates IS '任务分析模板 - 分析任务需要什么能力';
COMMENT ON TABLE mentor_humanized_context IS '人性化对话上下文 - 记住关系、承诺、重要时刻';
COMMENT ON TABLE mentor_student_specific_struggles IS '学生具体困难记录 - 不是抽象的，是具体的';
COMMENT ON TABLE mentor_tool_usage_tracking IS '工具使用跟踪 - 推荐的工具学生用了吗，效果如何';
COMMENT ON TABLE mentor_conversation_naturalness IS '对话自然度评分 - 是否像人在说话';
