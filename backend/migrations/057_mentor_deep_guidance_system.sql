-- AI导师深层引导系统 - 看到问题背后的模式
-- 创建时间: 2026-05-10

-- 1. 深层模式识别表
CREATE TABLE IF NOT EXISTS mentor_deep_patterns (
    id SERIAL PRIMARY KEY,
    pattern_name VARCHAR(100) NOT NULL UNIQUE, -- fear_of_unknown, perfectionism, need_for_control, etc.
    pattern_category VARCHAR(50) NOT NULL, -- fear, belief, habit, emotion

    -- 模式描述
    pattern_description TEXT NOT NULL,
    surface_manifestations TEXT[], -- 表面表现（学生会说什么、做什么）

    -- 深层信念
    underlying_beliefs TEXT[], -- 背后的信念（"我必须完美"、"失败=我是失败者"）

    -- 引导策略
    guidance_approach TEXT NOT NULL, -- 如何引导
    reframing_questions TEXT[], -- 重新框架的问题
    new_perspectives TEXT[], -- 提供的新视角

    -- 示例对话
    example_dialogues JSONB, -- 示例对话片段

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_pattern_category (pattern_category)
);

-- 2. 学生深层模式记录
CREATE TABLE IF NOT EXISTS student_deep_patterns (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pattern_id INTEGER NOT NULL REFERENCES mentor_deep_patterns(id),

    -- 识别信息
    first_detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    detection_confidence DECIMAL(3,2), -- 0-1，识别的置信度

    -- 表现记录
    manifestation_examples JSONB, -- 具体表现的例子
    trigger_situations TEXT[], -- 触发情境

    -- 引导进展
    guidance_sessions INTEGER DEFAULT 0, -- 引导了多少次
    last_guided_at TIMESTAMP,
    progress_level VARCHAR(50) DEFAULT 'identified', -- identified, acknowledged, working_on, improved

    -- 学生反应
    student_awareness BOOLEAN DEFAULT false, -- 学生是否意识到这个模式
    student_willingness_to_change DECIMAL(3,2), -- 改变意愿 0-1

    -- 效果追踪
    behavior_changes JSONB, -- 行为变化记录

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_student_patterns (student_id),
    INDEX idx_pattern_progress (pattern_id, progress_level),
    UNIQUE(student_id, pattern_id)
);

-- 3. 深层对话模板
CREATE TABLE IF NOT EXISTS mentor_deep_dialogue_templates (
    id SERIAL PRIMARY KEY,
    pattern_id INTEGER NOT NULL REFERENCES mentor_deep_patterns(id),
    dialogue_stage VARCHAR(50) NOT NULL, -- identify, acknowledge, challenge, reframe, practice

    -- 对话内容
    opening_line TEXT NOT NULL, -- 开场（"嗯，我感觉到..."）
    probing_questions TEXT[], -- 探索性问题
    empathy_statements TEXT[], -- 共情表达
    challenge_statements TEXT[], -- 挑战信念的表达
    reframing_statements TEXT[], -- 重新框架的表达
    invitation_to_try TEXT[], -- 邀请尝试的表达

    -- 使用条件
    student_readiness_level VARCHAR(50), -- 学生准备度（defensive, curious, open, ready）

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_dialogue_pattern_stage (pattern_id, dialogue_stage)
);

-- 4. 信念转变追踪
CREATE TABLE IF NOT EXISTS student_belief_shifts (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pattern_id INTEGER NOT NULL REFERENCES mentor_deep_patterns(id),

    -- 旧信念
    old_belief TEXT NOT NULL,
    old_belief_strength DECIMAL(3,2), -- 0-1，旧信念的强度

    -- 新信念
    new_belief TEXT NOT NULL,
    new_belief_acceptance DECIMAL(3,2), -- 0-1，新信念的接受度

    -- 转变过程
    shift_triggered_by TEXT, -- 什么触发了转变
    shift_conversation_id INTEGER, -- 哪次对话

    -- 巩固
    reinforcement_count INTEGER DEFAULT 0, -- 强化次数
    last_reinforced_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_belief_shifts (student_id, pattern_id)
);

-- 5. 成长挑战任务
CREATE TABLE IF NOT EXISTS student_growth_challenges (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pattern_id INTEGER REFERENCES mentor_deep_patterns(id),

    -- 挑战内容
    challenge_title VARCHAR(200) NOT NULL,
    challenge_description TEXT NOT NULL,
    challenge_type VARCHAR(50), -- try_new_behavior, question_belief, practice_skill

    -- 具体任务
    specific_actions TEXT[], -- 具体要做的事情
    success_criteria TEXT, -- 成功标准

    -- 状态
    status VARCHAR(50) DEFAULT 'proposed', -- proposed, accepted, in_progress, completed, abandoned
    proposed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    completed_at TIMESTAMP,

    -- 结果
    student_reflection TEXT, -- 学生的反思
    outcome_description TEXT, -- 结果描述
    lessons_learned TEXT[], -- 学到的东西

    -- 导师跟进
    mentor_followup_needed BOOLEAN DEFAULT true,
    mentor_followup_at TIMESTAMP,

    INDEX idx_student_challenges (student_id, status),
    INDEX idx_pattern_challenges (pattern_id)
);

-- 插入深层模式数据
INSERT INTO mentor_deep_patterns (pattern_name, pattern_category, pattern_description, surface_manifestations, underlying_beliefs, guidance_approach, reframing_questions, new_perspectives) VALUES

-- 1. 对未知的恐惧
('fear_of_unknown', 'fear',
 '学生面对新技术、新任务时，第一反应是"我肯定学不会"，而不是"我可以试试"',
 ARRAY['说"我不会"、"太难了"', '看到代码就头疼', '还没开始就说做不了', '总是问"我能学会吗"'],
 ARRAY['"不会"="学不会"', '"新的"="困难的"', '"我必须一开始就会"', '"失败=证明我不行"'],
 '帮助学生区分"不会"和"学不会"，引导看到自己过去的学习经历，建立"可以学会"的信念',
 ARRAY['你是真的"不会"，还是"害怕自己学不会"？', '你还记得第一次用手机的时候吗？那时候你也"不会"，但现在你会了', '如果我们不要想"学会"这么大的目标，就试试"看懂一行代码"呢？'],
 ARRAY['"不会"和"学不会"是两回事', '"不会"只是现在的状态，不是永久的', '你已经学会了很多你曾经"不会"的东西', '学习是一个过程，不是一个结果']),

-- 2. 完美主义/拖延
('perfectionism_procrastination', 'belief',
 '学生总是拖到最后才开始，因为在等"完美的时机"或"完全准备好"',
 ARRAY['拖到最后才开始', '说"我还没准备好"', '花很多时间"准备"但不开始', '总是觉得"还差一点"'],
 ARRAY['"我必须完美"', '"我要先把所有东西都搞清楚才能开始"', '"做不好=失败"', '"别人会看到我的不完美"'],
 '挑战"完美准备"的信念，引导学生看到"开始"比"完美"更重要，建立"做比不做好"的信念',
 ARRAY['你是真的"懒"，还是在等一个"完美的时机"？', '你永远不会"准备好"，因为"准备好"是一种感觉，只有开始做了之后才会出现', '"做不好"不是问题，"不开始"才是问题'],
 ARRAY['你永远不会"准备好"', '开始了，就没那么可怕了', '做不好，可以改；不开始，什么都不会发生', '完成比完美更重要']),

-- 3. 需要外部认可
('need_for_external_validation', 'belief',
 '学生过度依赖他人的评价来判断自己的价值，缺乏内在的自我评估标准',
 ARRAY['总是问"这样做对吗"', '做完了不敢提交', '说"我不知道做得好不好"', '等别人说好才觉得好'],
 ARRAY['"我需要别人告诉我我做得好"', '"我自己的判断不可靠"', '"别人的评价=我的价值"', '"如果别人不满意，说明我不行"'],
 '帮助学生建立内在的评估标准，引导学生看到自己的判断力，区分"做得好"和"可以更好"',
 ARRAY['你是怎么判断"做得好不好"的？', '如果你自己都不知道好不好，别人的评价就会变得特别重要', '你觉得你做的这个东西，有没有达到任务的要求？'],
 ARRAY['你其实是有判断力的', '"做得好"和"可以更好"是两回事', '企业的反馈是帮你"更好"，不是否定你"好"', '你可以先自己给自己一个评价']),

-- 4. 比较心态
('comparison_mindset', 'habit',
 '学生习惯性地与他人比较，看到别人好就觉得自己差，陷入"向下比较"',
 ARRAY['说"别人做得那么好，我好差"', '看到别人的成果就焦虑', '总是关注自己的不足', '忽视自己的进步'],
 ARRAY['"别人好=我差"', '"这是零和游戏"', '"我必须比别人好才有价值"', '"我看到的就是全部"'],
 '帮助学生区分"向上比较"和"向下比较"，引导与"昨天的自己"比较，看到自己的进步',
 ARRAY['你是在跟"别人"比，还是在跟"理想中的自己"比？', '别人做得好，不代表你做得差', '你看到的"别人做得好"，可能只是他们展示出来的部分'],
 ARRAY['别人做得好，不代表你做得差', '这不是零和游戏', '跟"昨天的自己"比，而不是跟别人比', '你只看到结果，没看到过程']),

-- 5. 害怕失败
('fear_of_failure', 'fear',
 '学生把"做不好"等同于"我是失败者"，害怕失败会证明自己不行',
 ARRAY['不敢提交', '说"怕企业不满意"', '避免尝试新东西', '一遇到困难就想放弃'],
 ARRAY['"做不好=我是失败者"', '"失败=证明我不行"', '"别人会看不起我"', '"我必须一次就成功"'],
 '帮助学生区分"做不好"和"我是失败者"，重新定义失败为"学习机会"',
 ARRAY['你怕的是"企业不满意"，还是怕"自己是个失败者"？', '"做不好"和"你是个失败者"是两回事', '提交不是"考试"，提交是"展示你现在的成果，然后一起讨论怎么更好"'],
 ARRAY['"做不好"是一个结果，"你是失败者"是一个身份', '结果可以改，身份不能改', '"做不好"是一个学习的机会', '企业说"这里需要改"，不是说"你是失败者"']),

-- 6. 控制欲/不信任
('need_for_control', 'belief',
 '学生在团队协作中想控制每个细节，不敢放手让队友做，背后是对失控的恐惧',
 ARRAY['盯着每个细节', '不敢让队友独立做事', '总是担心"他们做不好"', '自己很累但不敢放手'],
 ARRAY['"我必须控制才安全"', '"别人做不好"', '"放手=失控"', '"信任=冒险"'],
 '帮助学生看到控制的代价，引导理解"信任是需要允许来建立的"，尝试小范围放手',
 ARRAY['你现在盯着每个细节，是让项目变好了，还是让大家都很紧张？', '信任，是需要"允许"来建立的', '如果他们做错了，你们一起改，对吧？'],
 ARRAY['信任是互相的，不是单向的', '你先"允许"队友按他们的想法做', '控制每个细节，其实是在剥夺他们"犯错和成长"的机会', '也许他们的做法，跟你想的不一样，但不一定就是错的']),

-- 7. 沟通僵硬
('rigid_communication', 'habit',
 '学生习惯性地直接指出问题，不知道如何"柔软"地表达，导致关系紧张',
 ARRAY['说话很直接', '直接指出错误', '不考虑对方感受', '觉得"直接=高效"'],
 ARRAY['"直接=高效"', '"说问题就是帮助对方"', '"柔软=浪费时间"', '"我说的是对的，对方应该接受"'],
 '帮助学生理解"柔软不是妥协"，教具体的柔软沟通方式，看到柔软的长期价值',
 ARRAY['你是不是觉得"直接"就是"高效"？', '如果你直接说，对方不高兴，然后你们要花时间处理情绪，这个时间是不是更长？', '柔软地说话，看起来慢，但其实是在"投资"你们的关系'],
 ARRAY['柔软不是让你不说问题，而是换一种方式说', '用"我有个想法"而不是"你错了"', '用"你觉得"邀请对方一起讨论', '当你开始柔软地对待队友，他们也会开始柔软地对待你']),

-- 8. 孤独感/不会求助
('isolation_cant_ask_for_help', 'habit',
 '学生感觉自己一个人在扛，不知道如何表达需求，不会主动沟通',
 ARRAY['说"我一个人在扛"', '不主动沟通', '以为"对方应该知道"', '憋着不说'],
 ARRAY['"我不应该需要帮助"', '"说出来=示弱"', '"对方应该知道"', '"我必须自己解决"'],
 '帮助学生看到"说出来"的重要性，教具体的沟通方式，理解"求助=力量"',
 ARRAY['你有没有跟他们说过，你在想什么？', '很多时候，我们以为"对方应该知道"，但其实对方真的不知道', '团队合作，不是一个人扛，而是大家一起扛'],
 ARRAY['你在心里想了很多，但没有说出来，队友就不知道你的想法', '当你打开心扉，他们也会打开心扉', '说出你的想法，倾听他们的想法', '求助不是示弱，而是智慧']);

-- 插入对话模板示例
INSERT INTO mentor_deep_dialogue_templates (pattern_id, dialogue_stage, opening_line, probing_questions, empathy_statements, challenge_statements, reframing_statements, invitation_to_try, student_readiness_level) VALUES

-- 对未知的恐惧 - 识别阶段
((SELECT id FROM mentor_deep_patterns WHERE pattern_name = 'fear_of_unknown'),
 'identify',
 '嗯，看到代码就头疼...',
 ARRAY['你是真的"不会"，还是"害怕自己学不会"？', '你觉得是什么让你觉得"头疼"？'],
 ARRAY['这个感觉我懂', '很多人都有这种感觉'],
 ARRAY['"不会"和"学不会"是两回事', '"不会"只是现在的状态，不代表你学不会'],
 ARRAY['你已经学会了很多你曾经"不会"的东西', '比如你现在会用手机，但第一次用的时候你也"不会"'],
 ARRAY['要不这样，我们不要想"学会"这么大的目标，我们就试试"看懂一行代码"？', '就一行，不多。我陪你一起看，好吗？'],
 'defensive'),

-- 完美主义 - 挑战阶段
((SELECT id FROM mentor_deep_patterns WHERE pattern_name = 'perfectionism_procrastination'),
 'challenge',
 '嗯，拖到最后才做...',
 ARRAY['你是真的"懒"，还是在等一个"完美的时机"？', '你是不是觉得"我要先把所有东西都搞清楚，才能开始做"？'],
 ARRAY['这个想法很常见', '我理解你想"准备好"的心情'],
 ARRAY['但是你知道吗，你永远不会"准备好"', '因为"准备好"是一种感觉，只有在你开始做了之后才会出现'],
 ARRAY['"做不好"不是问题，"不开始"才是问题', '做不好，可以改；不开始，什么都不会发生'],
 ARRAY['要不这样，给自己10分钟，随便做点什么，不要求质量，就是"动起来"', '10分钟后，你会发现：开始了，就没那么可怕了'],
 'curious');

-- 创建视图：学生深层模式概览
CREATE OR REPLACE VIEW student_deep_pattern_overview AS
SELECT
    s.student_id,
    u.nickname as student_name,
    p.pattern_name,
    p.pattern_category,
    s.progress_level,
    s.guidance_sessions,
    s.student_awareness,
    s.student_willingness_to_change,
    s.first_detected_at,
    s.last_guided_at,
    (SELECT COUNT(*) FROM student_growth_challenges
     WHERE student_id = s.student_id AND pattern_id = s.pattern_id AND status = 'completed') as challenges_completed
FROM student_deep_patterns s
JOIN users u ON s.student_id = u.id
JOIN mentor_deep_patterns p ON s.pattern_id = p.id;

COMMENT ON TABLE mentor_deep_patterns IS '深层模式定义 - 问题背后的深层信念和习惯';
COMMENT ON TABLE student_deep_patterns IS '学生深层模式记录 - 识别学生的深层模式';
COMMENT ON TABLE mentor_deep_dialogue_templates IS '深层对话模板 - 如何引导学生改变信念';
COMMENT ON TABLE student_belief_shifts IS '信念转变追踪 - 记录学生信念的转变过程';
COMMENT ON TABLE student_growth_challenges IS '成长挑战任务 - 帮助学生实践新行为';
