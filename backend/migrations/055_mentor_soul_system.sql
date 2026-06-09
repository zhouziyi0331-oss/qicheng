-- AI导师"灵魂"系统 - 情绪感知、成长追踪、记忆陪伴
-- 创建时间: 2024-05-08

-- 1. 学生情绪日志表
CREATE TABLE IF NOT EXISTS student_emotion_log (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    session_id INTEGER NOT NULL REFERENCES mentor_stage_sessions(id) ON DELETE CASCADE,
    message_id INTEGER REFERENCES mentor_stage_messages(id) ON DELETE SET NULL,

    -- 情绪分析
    detected_emotion VARCHAR(50) NOT NULL, -- anxious, excited, frustrated, confused, confident, overwhelmed, proud
    emotion_intensity DECIMAL(3,2) NOT NULL CHECK (emotion_intensity >= 0 AND emotion_intensity <= 1), -- 0-1
    emotion_signals JSONB, -- 情绪信号词汇和模式

    -- 上下文
    trigger_content TEXT, -- 触发情绪的内容
    context_summary TEXT, -- 当时的上下文

    -- 响应
    mentor_response_strategy VARCHAR(50), -- comfort, celebrate, encourage, validate, guide
    mentor_response_content TEXT, -- 导师的响应内容

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_student_emotion (student_id, created_at),
    INDEX idx_task_emotion (task_id, created_at),
    INDEX idx_emotion_type (detected_emotion)
);

-- 2. 学生成长里程碑表
CREATE TABLE IF NOT EXISTS student_growth_milestones (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    session_id INTEGER NOT NULL REFERENCES mentor_stage_sessions(id) ON DELETE CASCADE,

    -- 里程碑信息
    milestone_type VARCHAR(50) NOT NULL, -- first_question, first_breakthrough, overcame_fear, independent_solution, quality_improvement
    milestone_title VARCHAR(200) NOT NULL,
    milestone_description TEXT,

    -- 成长数据
    before_state JSONB, -- 之前的状态（能力、情绪、信心）
    after_state JSONB, -- 之后的状态
    growth_indicators JSONB, -- 成长指标

    -- 庆祝
    celebrated BOOLEAN DEFAULT FALSE,
    celebration_message TEXT,
    celebration_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_student_milestones (student_id, created_at),
    INDEX idx_milestone_type (milestone_type),
    INDEX idx_uncelebrated (celebrated, created_at) WHERE celebrated = FALSE
);

-- 3. 学生学习档案表
CREATE TABLE IF NOT EXISTS student_learning_profiles (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- 学习风格
    learning_style JSONB, -- { visual: 0.7, hands_on: 0.8, theoretical: 0.3 }
    preferred_pace VARCHAR(50), -- fast, moderate, slow, variable

    -- 能力画像
    technical_skills JSONB, -- { frontend: 0.6, backend: 0.4, database: 0.5 }
    soft_skills JSONB, -- { communication: 0.7, problem_solving: 0.8, persistence: 0.6 }

    -- 情绪模式
    common_emotions JSONB, -- 常见情绪及频率
    stress_triggers JSONB, -- 压力触发点
    motivation_factors JSONB, -- 激励因素

    -- 成长轨迹
    confidence_trend JSONB, -- 信心变化趋势 [{ date, score }]
    skill_growth_trend JSONB, -- 技能成长趋势

    -- 互动偏好
    preferred_guidance_style VARCHAR(50), -- direct, socratic, encouraging, challenging
    response_to_feedback JSONB, -- 对不同反馈的响应

    -- 统计
    total_tasks_completed INTEGER DEFAULT 0,
    total_breakthroughs INTEGER DEFAULT 0,
    total_mentor_interactions INTEGER DEFAULT 0,
    average_task_quality_score DECIMAL(5,2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_student_profile (student_id)
);

-- 4. 导师记忆表
CREATE TABLE IF NOT EXISTS mentor_memory (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES mentor_stage_sessions(id) ON DELETE CASCADE,

    -- 记忆类型
    memory_type VARCHAR(50) NOT NULL, -- struggle, breakthrough, pattern, preference, milestone
    memory_category VARCHAR(50), -- technical, emotional, behavioral, learning

    -- 记忆内容
    memory_title VARCHAR(200) NOT NULL,
    memory_content TEXT NOT NULL,
    memory_context JSONB, -- 记忆的上下文

    -- 重要性
    importance_score DECIMAL(3,2) DEFAULT 0.5 CHECK (importance_score >= 0 AND importance_score <= 1),
    relevance_tags TEXT[], -- 相关标签

    -- 使用
    times_recalled INTEGER DEFAULT 0,
    last_recalled_at TIMESTAMP,

    -- 关联
    related_memories INTEGER[], -- 关联的其他记忆ID

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP, -- 记忆过期时间（可选）

    INDEX idx_student_memory (student_id, created_at),
    INDEX idx_memory_type (memory_type),
    INDEX idx_importance (importance_score DESC),
    INDEX idx_relevance (relevance_tags) USING GIN
);

-- 5. 对话上下文增强表
CREATE TABLE IF NOT EXISTS mentor_conversation_context (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES mentor_stage_sessions(id) ON DELETE CASCADE,

    -- 当前状态
    current_emotion VARCHAR(50), -- 当前检测到的情绪
    current_confidence_level DECIMAL(3,2), -- 当前信心水平 0-1
    current_struggle_area TEXT, -- 当前困难领域

    -- 对话模式
    conversation_depth INTEGER DEFAULT 0, -- 对话深度（问了几层问题）
    guidance_approach VARCHAR(50), -- 当前引导方式
    last_breakthrough_at TIMESTAMP, -- 上次突破时间

    -- 动态调整
    needs_encouragement BOOLEAN DEFAULT FALSE,
    needs_challenge BOOLEAN DEFAULT FALSE,
    needs_simplification BOOLEAN DEFAULT FALSE,

    -- 里程碑追踪
    session_breakthroughs INTEGER DEFAULT 0,
    session_struggles INTEGER DEFAULT 0,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_session_context (session_id)
);

-- 6. 情绪响应策略表
CREATE TABLE IF NOT EXISTS emotion_response_strategies (
    id SERIAL PRIMARY KEY,
    emotion VARCHAR(50) NOT NULL UNIQUE,

    -- 响应策略
    response_approach TEXT NOT NULL, -- 如何响应这种情绪
    tone_guidelines TEXT, -- 语气指南
    example_phrases TEXT[], -- 示例短语

    -- 引导策略
    guidance_adjustments JSONB, -- 引导方式调整

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认情绪响应策略
INSERT INTO emotion_response_strategies (emotion, response_approach, tone_guidelines, example_phrases, guidance_adjustments) VALUES
('anxious',
 '先安抚情绪，降低压力，分解任务为小步骤，强调"一步一步来"',
 '温和、稳定、支持性的语气，避免增加压力',
 ARRAY['我理解你现在的感受，这很正常', '我们一起来，一步一步解决', '不用担心，我会陪着你'],
 '{"pace": "slower", "complexity": "reduced", "encouragement_frequency": "high"}'::jsonb
),
('frustrated',
 '认可情绪，帮助换个角度看问题，提供新的思路',
 '理解、共情、积极的语气',
 ARRAY['我能感受到你的挫折感', '让我们换个角度试试', '这个困难说明你在挑战自己的边界'],
 '{"approach": "reframe", "provide_alternative": true, "break_down": true}'::jsonb
),
('confused',
 '澄清问题，简化解释，提供具体例子',
 '清晰、耐心、循序渐进的语气',
 ARRAY['让我用另一种方式解释', '我们先理清思路', '这个概念可以这样理解'],
 '{"clarity": "high", "examples": "concrete", "pace": "slower"}'::jsonb
),
('excited',
 '分享喜悦，引导深入思考，趁势推进',
 '积极、鼓励、引导性的语气',
 ARRAY['太棒了！你发现了关键点', '这个想法很有潜力', '让我们把这个想法发展得更完整'],
 '{"momentum": "maintain", "depth": "increase", "challenge": "appropriate"}'::jsonb
),
('confident',
 '肯定能力，适当增加挑战，引导独立思考',
 '肯定、挑战性、启发性的语气',
 ARRAY['你已经掌握了基础，准备好迎接新挑战了吗', '我看到你的进步，试试这个更深入的问题'],
 '{"challenge_level": "increase", "independence": "encourage", "depth": "deeper"}'::jsonb
),
('overwhelmed',
 '立即降低复杂度，聚焦最小可行步骤，提供清晰路径',
 '简洁、明确、支持性的语气',
 ARRAY['我们先暂停一下，聚焦最重要的部分', '让我帮你理清优先级', '一次只做一件事'],
 '{"simplify": true, "focus": "narrow", "steps": "minimal"}'::jsonb
),
('proud',
 '庆祝成就，回顾成长，设定新目标',
 '庆祝、肯定、展望的语气',
 ARRAY['你应该为自己骄傲！', '看看你走了多远', '准备好迎接下一个挑战了吗'],
 '{"celebrate": true, "reflect": true, "goal_setting": true}'::jsonb
);

-- 7. 创建视图：学生成长仪表板
CREATE OR REPLACE VIEW student_growth_dashboard AS
SELECT
    slp.student_id,
    u.nickname as student_name,
    slp.learning_style,
    slp.preferred_pace,
    slp.technical_skills,
    slp.soft_skills,
    slp.confidence_trend,
    slp.total_tasks_completed,
    slp.total_breakthroughs,
    slp.average_task_quality_score,

    -- 最近情绪
    (SELECT json_agg(json_build_object(
        'emotion', detected_emotion,
        'intensity', emotion_intensity,
        'created_at', created_at
    ) ORDER BY created_at DESC)
    FROM (
        SELECT detected_emotion, emotion_intensity, created_at
        FROM student_emotion_log
        WHERE student_id = slp.student_id
        ORDER BY created_at DESC
        LIMIT 10
    ) recent_emotions) as recent_emotions,

    -- 最近里程碑
    (SELECT json_agg(json_build_object(
        'type', milestone_type,
        'title', milestone_title,
        'created_at', created_at,
        'celebrated', celebrated
    ) ORDER BY created_at DESC)
    FROM (
        SELECT milestone_type, milestone_title, created_at, celebrated
        FROM student_growth_milestones
        WHERE student_id = slp.student_id
        ORDER BY created_at DESC
        LIMIT 5
    ) recent_milestones) as recent_milestones,

    -- 重要记忆
    (SELECT json_agg(json_build_object(
        'type', memory_type,
        'title', memory_title,
        'importance', importance_score
    ) ORDER BY importance_score DESC)
    FROM (
        SELECT memory_type, memory_title, importance_score
        FROM mentor_memory
        WHERE student_id = slp.student_id
        ORDER BY importance_score DESC, created_at DESC
        LIMIT 10
    ) important_memories) as important_memories

FROM student_learning_profiles slp
JOIN users u ON slp.student_id = u.id;

-- 8. 创建函数：更新学生档案
CREATE OR REPLACE FUNCTION update_student_profile_on_milestone()
RETURNS TRIGGER AS $$
BEGIN
    -- 更新里程碑计数
    UPDATE student_learning_profiles
    SET
        total_breakthroughs = total_breakthroughs + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE student_id = NEW.student_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profile_on_milestone
AFTER INSERT ON student_growth_milestones
FOR EACH ROW
EXECUTE FUNCTION update_student_profile_on_milestone();

-- 9. 创建函数：自动创建学生档案
CREATE OR REPLACE FUNCTION create_student_profile_if_not_exists()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO student_learning_profiles (student_id)
    VALUES (NEW.student_id)
    ON CONFLICT (student_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_profile_on_first_session
AFTER INSERT ON mentor_stage_sessions
FOR EACH ROW
EXECUTE FUNCTION create_student_profile_if_not_exists();

COMMENT ON TABLE student_emotion_log IS '学生情绪日志 - 追踪学生在学习过程中的情绪变化';
COMMENT ON TABLE student_growth_milestones IS '学生成长里程碑 - 记录学生的突破和成长时刻';
COMMENT ON TABLE student_learning_profiles IS '学生学习档案 - 学生的学习风格、能力画像、成长轨迹';
COMMENT ON TABLE mentor_memory IS '导师记忆 - AI导师记住的关于学生的重要信息';
COMMENT ON TABLE mentor_conversation_context IS '对话上下文 - 当前对话的动态上下文信息';
COMMENT ON TABLE emotion_response_strategies IS '情绪响应策略 - 针对不同情绪的响应方式';
