-- ========================================
-- Phase R1: 6层记忆系统
-- 创建时间: 2026-07-10
-- 目标: 为AI导师建立完整的6层记忆体系
-- ========================================

-- L5: 核心画像 (Core Profile)
-- 学生的基础信息和能力画像，低频更新
CREATE TABLE IF NOT EXISTS mentor_memory_core_profile (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  nickname VARCHAR(50),
  grade VARCHAR(20),
  major VARCHAR(100),
  track VARCHAR(50), -- content_creation | tool_dev | both
  level INTEGER DEFAULT 0,
  talent_profile JSONB, -- OPC测评结果
  ability_tags JSONB, -- 能力标签数组 ["Python", "UI设计", ...]
  communication_style JSONB, -- 沟通偏好 {prefers_encouragement: true, learning_style: "visual"}
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_core_profile_track ON mentor_memory_core_profile(track);
CREATE INDEX idx_core_profile_level ON mentor_memory_core_profile(level);

COMMENT ON TABLE mentor_memory_core_profile IS 'L5层：核心画像 - 学生的基础信息和能力画像';
COMMENT ON COLUMN mentor_memory_core_profile.talent_profile IS 'OPC六维测评结果';
COMMENT ON COLUMN mentor_memory_core_profile.ability_tags IS '能力标签数组';
COMMENT ON COLUMN mentor_memory_core_profile.communication_style IS '沟通偏好和学习风格';

-- L2: 任务记忆 (Task Context)
-- 当前任务的上下文和进展状态
CREATE TABLE IF NOT EXISTS mentor_memory_task_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  task_phase VARCHAR(20), -- accepted|in_progress|submitted|completed|rejected
  stuck_points JSONB, -- 卡壳记录数组 [{timestamp, description, resolved}]
  hints_given TEXT[], -- 已给提示列表
  emotion_timeline JSONB, -- 情绪时间线 [{timestamp, emotion, intensity}]
  mentor_assessment JSONB, -- 导师判断 {confidence_level, skill_gaps, strengths}
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, task_id)
);

CREATE INDEX idx_task_context_user ON mentor_memory_task_context(user_id, created_at DESC);
CREATE INDEX idx_task_context_task ON mentor_memory_task_context(task_id);
CREATE INDEX idx_task_context_phase ON mentor_memory_task_context(task_phase);

COMMENT ON TABLE mentor_memory_task_context IS 'L2层：任务记忆 - 当前任务的上下文和进展';
COMMENT ON COLUMN mentor_memory_task_context.stuck_points IS '卡壳记录，包含时间、描述、是否已解决';
COMMENT ON COLUMN mentor_memory_task_context.emotion_timeline IS '情绪变化时间线';

-- L4: 成长档案 (Growth Archive)
-- 长期成长轨迹和里程碑
CREATE TABLE IF NOT EXISTS mentor_memory_growth_archive (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  milestones JSONB, -- 里程碑事件 [{date, type, description, impact}]
  task_micro_reports JSONB, -- 每单微报告 [{task_id, completion_date, key_learnings, breakthrough}]
  score_snapshots JSONB, -- 六维能力快照 [{date, dimensions: {info_processing: 7.2, ...}}]
  growth_patterns JSONB, -- 成长模式识别 {preferred_learning_path, common_struggles, strengths_evolution}
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_growth_archive_user ON mentor_memory_growth_archive(user_id);

COMMENT ON TABLE mentor_memory_growth_archive IS 'L4层：成长档案 - 长期成长轨迹和里程碑';
COMMENT ON COLUMN mentor_memory_growth_archive.milestones IS '重要里程碑事件数组';
COMMENT ON COLUMN mentor_memory_growth_archive.task_micro_reports IS '每个任务的微报告';
COMMENT ON COLUMN mentor_memory_growth_archive.score_snapshots IS '能力快照时间序列';

-- L6: 关系记忆 (Relationship Memory)
-- 师生关系的情感维度
CREATE TABLE IF NOT EXISTS mentor_memory_relationship (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  relationship_stage VARCHAR(20) DEFAULT 'new', -- new|warming|trusted|deep
  memorable_quotes JSONB, -- 学生重要话语 [{date, quote, context}]
  mentor_promises JSONB, -- 导师承诺 [{date, promise, fulfilled}]
  emotional_anchors JSONB, -- 情感锚点 [{type, description, trigger_context}]
  conversation_summaries JSONB, -- 关键对话摘要 [{date, topic, emotional_tone, outcome}]
  last_interaction_at TIMESTAMP,
  total_conversations INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_relationship_user ON mentor_memory_relationship(user_id);
CREATE INDEX idx_relationship_stage ON mentor_memory_relationship(relationship_stage);

COMMENT ON TABLE mentor_memory_relationship IS 'L6层：关系记忆 - 师生关系的情感维度';
COMMENT ON COLUMN mentor_memory_relationship.relationship_stage IS '关系阶段：新建立/升温/信任/深度';
COMMENT ON COLUMN mentor_memory_relationship.memorable_quotes IS '学生说过的重要话语';
COMMENT ON COLUMN mentor_memory_relationship.emotional_anchors IS '情感锚点事件';

-- L3: 近期摘要 (Recent Summary)
-- 近30天的活动摘要，每日凌晨聚合
CREATE TABLE IF NOT EXISTS mentor_memory_recent_summary (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  summary_date DATE DEFAULT CURRENT_DATE,
  tasks_completed_30d INTEGER DEFAULT 0,
  tasks_in_progress INTEGER DEFAULT 0,
  top_stuck_types TEXT[], -- 高频卡点类型
  emotion_trend VARCHAR(50), -- positive|neutral|struggling|distressed
  avg_response_speed_hours DECIMAL(5,2),
  last_active_at TIMESTAMP,
  engagement_score DECIMAL(3,2), -- 0-1，参与度评分
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recent_summary_user ON mentor_memory_recent_summary(user_id);
CREATE INDEX idx_recent_summary_date ON mentor_memory_recent_summary(summary_date DESC);

COMMENT ON TABLE mentor_memory_recent_summary IS 'L3层：近期摘要 - 近30天的活动聚合';
COMMENT ON COLUMN mentor_memory_recent_summary.top_stuck_types IS '高频卡点类型列表';
COMMENT ON COLUMN mentor_memory_recent_summary.emotion_trend IS '整体情绪趋势';
COMMENT ON COLUMN mentor_memory_recent_summary.engagement_score IS '参与度评分 0-1';

-- L1: 即时上下文 (Session Context)
-- 当前对话会话的短期记忆，存储在Redis，这里只建表结构用于备份
CREATE TABLE IF NOT EXISTS mentor_memory_session_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(100) NOT NULL,
  conversation_history JSONB, -- 最近10轮对话 [{role, content, timestamp}]
  current_intent VARCHAR(50), -- ask_question|seek_encouragement|report_progress|stuck_help
  context_keywords TEXT[], -- 当前讨论的关键词
  emotional_state VARCHAR(20), -- current_emotion
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_session_user ON mentor_memory_session_context(user_id, session_id);
CREATE INDEX idx_session_expires ON mentor_memory_session_context(expires_at);

COMMENT ON TABLE mentor_memory_session_context IS 'L1层：即时上下文 - 当前会话的短期记忆（主要存Redis）';
COMMENT ON COLUMN mentor_memory_session_context.conversation_history IS '最近10轮对话记录';
COMMENT ON COLUMN mentor_memory_session_context.current_intent IS '当前对话意图';

-- 触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_mentor_memory_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_core_profile_updated
  BEFORE UPDATE ON mentor_memory_core_profile
  FOR EACH ROW EXECUTE FUNCTION update_mentor_memory_timestamp();

CREATE TRIGGER trigger_task_context_updated
  BEFORE UPDATE ON mentor_memory_task_context
  FOR EACH ROW EXECUTE FUNCTION update_mentor_memory_timestamp();

CREATE TRIGGER trigger_growth_archive_updated
  BEFORE UPDATE ON mentor_memory_growth_archive
  FOR EACH ROW EXECUTE FUNCTION update_mentor_memory_timestamp();

CREATE TRIGGER trigger_relationship_updated
  BEFORE UPDATE ON mentor_memory_relationship
  FOR EACH ROW EXECUTE FUNCTION update_mentor_memory_timestamp();

CREATE TRIGGER trigger_recent_summary_updated
  BEFORE UPDATE ON mentor_memory_recent_summary
  FOR EACH ROW EXECUTE FUNCTION update_mentor_memory_timestamp();

CREATE TRIGGER trigger_session_context_updated
  BEFORE UPDATE ON mentor_memory_session_context
  FOR EACH ROW EXECUTE FUNCTION update_mentor_memory_timestamp();

-- 初始化已有用户的记忆表
-- L5: 从users表初始化核心画像
INSERT INTO mentor_memory_core_profile (user_id, nickname, level, talent_profile)
SELECT
  u.id,
  u.username,
  u.level,
  jsonb_build_object(
    'personality_tag', uor.personality_tag,
    'dimensions', jsonb_build_object(
      'info_processing', uor.info_processing_score,
      'creation_drive', uor.creation_drive_score,
      'tool_learning', uor.tool_learning_score,
      'task_execution', uor.task_execution_score,
      'collaboration', uor.collaboration_score,
      'risk_attitude', uor.risk_attitude_score
    )
  )
FROM users u
LEFT JOIN user_opc_results uor ON u.id = uor.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM mentor_memory_core_profile WHERE user_id = u.id
);

-- L6: 初始化关系记忆（所有用户从new阶段开始）
INSERT INTO mentor_memory_relationship (user_id, relationship_stage, total_conversations)
SELECT id, 'new', 0
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM mentor_memory_relationship WHERE user_id = users.id
);

-- L4: 初始化成长档案
INSERT INTO mentor_memory_growth_archive (user_id, milestones, task_micro_reports, score_snapshots)
SELECT id, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM mentor_memory_growth_archive WHERE user_id = users.id
);

-- L3: 初始化近期摘要
INSERT INTO mentor_memory_recent_summary (user_id, tasks_completed_30d, emotion_trend)
SELECT id, 0, 'neutral'
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM mentor_memory_recent_summary WHERE user_id = users.id
);

-- 验证
DO $$
DECLARE
  v_user_count INTEGER;
  v_l5_count INTEGER;
  v_l6_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_user_count FROM users;
  SELECT COUNT(*) INTO v_l5_count FROM mentor_memory_core_profile;
  SELECT COUNT(*) INTO v_l6_count FROM mentor_memory_relationship;

  RAISE NOTICE '========================================';
  RAISE NOTICE '6层记忆系统初始化完成';
  RAISE NOTICE '========================================';
  RAISE NOTICE '用户总数: %', v_user_count;
  RAISE NOTICE 'L5 核心画像: % 条记录', v_l5_count;
  RAISE NOTICE 'L6 关系记忆: % 条记录', v_l6_count;
  RAISE NOTICE '========================================';
END $$;
