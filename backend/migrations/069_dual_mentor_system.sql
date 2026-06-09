-- ============================================
-- 双导师协同系统数据库扩展
-- ============================================

-- 1. 导师模式表
CREATE TABLE mentor_modes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) UNIQUE,

  -- 当前模式
  current_mode TEXT NOT NULL DEFAULT 'emotional',  -- emotional, project, hybrid, auto

  -- 模式偏好
  preferred_mode TEXT,  -- 用户偏好的模式
  auto_switch BOOLEAN DEFAULT TRUE,  -- 是否自动切换

  -- 使用统计
  emotional_sessions INTEGER DEFAULT 0,
  project_sessions INTEGER DEFAULT 0,
  hybrid_sessions INTEGER DEFAULT 0,

  -- 最后使用
  last_emotional_at TIMESTAMPTZ,
  last_project_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 导师协同记录
CREATE TABLE mentor_collaboration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  session_id UUID,  -- 对话会话ID

  -- 协同类型
  collaboration_type TEXT NOT NULL,  -- handoff, parallel, integrated

  -- 参与导师
  from_mentor TEXT,  -- emotional, project
  to_mentor TEXT,

  -- 触发原因
  trigger_reason TEXT,  -- user_request, auto_detect, stuck, emotional_need

  -- 上下文
  context JSONB,
  user_message TEXT,

  -- 协同结果
  success BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 情感-项目关联表
CREATE TABLE emotional_project_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),

  -- 情感记录（可以关联到多种情感记录）
  life_question_id UUID,  -- 生命问题
  flow_moment_id UUID,    -- 穿越感时刻
  emotional_state TEXT,   -- 情感状态
  emotional_description TEXT,  -- 情感描述

  -- 项目记录
  pbl_project_id UUID REFERENCES pbl_projects(id),

  -- 关联类型
  link_type TEXT NOT NULL,  -- confusion_to_project, interest_to_practice, problem_to_solution

  -- 关联说明
  link_reason TEXT,
  transformation_story TEXT,  -- 转化故事

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 统一对话历史（整合两个导师的对话）
CREATE TABLE unified_mentor_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  session_id UUID NOT NULL,  -- 会话ID

  -- 消息内容
  role TEXT NOT NULL,  -- user, emotional_mentor, project_mentor, coordinated
  content TEXT NOT NULL,

  -- 导师信息
  mentor_type TEXT,  -- emotional, project, coordinated

  -- 协同消息的特殊字段
  emotional_content TEXT,  -- 情感导师部分
  project_content TEXT,    -- 项目导师部分
  transition_text TEXT,    -- 过渡语

  -- 消息元数据
  message_type TEXT,  -- question, answer, encouragement, guidance, reflection
  emotional_tone TEXT,  -- supportive, encouraging, empathetic, neutral

  -- 上下文
  context JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 导师切换建议
CREATE TABLE mentor_switch_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),

  -- 建议信息
  from_mentor TEXT NOT NULL,
  to_mentor TEXT NOT NULL,

  -- 建议原因
  reason TEXT NOT NULL,
  confidence FLOAT,  -- 0-1

  -- 触发条件
  trigger_message TEXT,
  trigger_context JSONB,

  -- 用户响应
  user_accepted BOOLEAN,
  user_feedback TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_mentor_modes_user ON mentor_modes(user_id);
CREATE INDEX idx_collaboration_logs_user ON mentor_collaboration_logs(user_id);
CREATE INDEX idx_collaboration_logs_session ON mentor_collaboration_logs(session_id);
CREATE INDEX idx_emotional_project_links_user ON emotional_project_links(user_id);
CREATE INDEX idx_emotional_project_links_project ON emotional_project_links(pbl_project_id);
CREATE INDEX idx_unified_conversations_user ON unified_mentor_conversations(user_id);
CREATE INDEX idx_unified_conversations_session ON unified_mentor_conversations(session_id);
CREATE INDEX idx_switch_suggestions_user ON mentor_switch_suggestions(user_id);

-- 触发器：更新导师模式统计
CREATE OR REPLACE FUNCTION update_mentor_mode_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.mentor_type = 'emotional' THEN
    UPDATE mentor_modes
    SET emotional_sessions = emotional_sessions + 1,
        last_emotional_at = NOW(),
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
  ELSIF NEW.mentor_type = 'project' THEN
    UPDATE mentor_modes
    SET project_sessions = project_sessions + 1,
        last_project_at = NOW(),
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
  ELSIF NEW.mentor_type = 'coordinated' THEN
    UPDATE mentor_modes
    SET hybrid_sessions = hybrid_sessions + 1,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_mentor_stats
AFTER INSERT ON unified_mentor_conversations
FOR EACH ROW
WHEN (NEW.role != 'user')
EXECUTE FUNCTION update_mentor_mode_stats();

-- 视图：用户导师使用概览
CREATE VIEW user_mentor_overview AS
SELECT
  u.id AS user_id,
  u.name,
  mm.current_mode,
  mm.preferred_mode,
  mm.auto_switch,
  mm.emotional_sessions,
  mm.project_sessions,
  mm.hybrid_sessions,
  mm.emotional_sessions + mm.project_sessions + mm.hybrid_sessions AS total_sessions,
  CASE
    WHEN mm.emotional_sessions > mm.project_sessions THEN 'emotional_dominant'
    WHEN mm.project_sessions > mm.emotional_sessions THEN 'project_dominant'
    ELSE 'balanced'
  END AS usage_pattern,
  COUNT(DISTINCT epl.pbl_project_id) AS projects_from_emotions,
  mm.last_emotional_at,
  mm.last_project_at
FROM users u
LEFT JOIN mentor_modes mm ON u.id = mm.user_id
LEFT JOIN emotional_project_links epl ON u.id = epl.user_id
GROUP BY u.id, u.name, mm.current_mode, mm.preferred_mode, mm.auto_switch,
         mm.emotional_sessions, mm.project_sessions, mm.hybrid_sessions,
         mm.last_emotional_at, mm.last_project_at;

-- 初始化函数：为现有用户创建导师模式记录
CREATE OR REPLACE FUNCTION initialize_mentor_modes()
RETURNS void AS $$
BEGIN
  INSERT INTO mentor_modes (user_id, current_mode, auto_switch)
  SELECT id, 'emotional', TRUE
  FROM users
  WHERE id NOT IN (SELECT user_id FROM mentor_modes)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 执行初始化
SELECT initialize_mentor_modes();
