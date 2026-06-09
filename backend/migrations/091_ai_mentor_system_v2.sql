-- 迁移091: AI导师陪伴系统 v2.0
-- 创建日期: 2026-06-09
-- 说明: 实现5大触发场景的AI导师系统

-- 1. 导师对话记录表（扩展版）
CREATE TABLE IF NOT EXISTS mentor_conversations_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE, -- 关联任务（可为空，用于通用对话）

  -- 对话内容
  role VARCHAR(20) NOT NULL, -- 'student', 'mentor', 'system'
  message TEXT NOT NULL,

  -- 触发场景
  trigger_type VARCHAR(50), -- 'T-01_onboarding', 'T-02_stuck', 'T-03_rejected', 'T-04_inactive', 'T-05_milestone', 'manual'
  trigger_context JSONB, -- 触发时的上下文数据

  -- AI调用信息
  ai_model VARCHAR(50), -- 'claude-opus-4', 'claude-sonnet-4'
  ai_temperature DECIMAL(3,2),
  ai_prompt_tokens INTEGER,
  ai_completion_tokens INTEGER,

  -- 快捷回复
  quick_replies JSONB, -- ["按钮1", "按钮2", "按钮3"]

  -- 元数据
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT mentor_conversations_v2_role_check
    CHECK (role IN ('student', 'mentor', 'system'))
);

CREATE INDEX idx_mentor_conversations_v2_student ON mentor_conversations_v2(student_id, created_at DESC);
CREATE INDEX idx_mentor_conversations_v2_task ON mentor_conversations_v2(task_id);
CREATE INDEX idx_mentor_conversations_v2_trigger ON mentor_conversations_v2(trigger_type);

COMMENT ON TABLE mentor_conversations_v2 IS 'AI导师对话记录（v2.0，支持5大触发场景）';
COMMENT ON COLUMN mentor_conversations_v2.trigger_type IS 'T-01接单/T-02卡住/T-03打回/T-04闲置/T-05里程碑/manual手动';
COMMENT ON COLUMN mentor_conversations_v2.trigger_context IS '触发场景的上下文数据（JSON）';

-- 2. 导师触发事件表
CREATE TABLE IF NOT EXISTS mentor_trigger_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,

  -- 触发类型
  trigger_type VARCHAR(50) NOT NULL,
  trigger_data JSONB NOT NULL, -- 触发时的详细数据

  -- 处理状态
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  processed_at TIMESTAMPTZ,
  conversation_id UUID REFERENCES mentor_conversations_v2(id),

  -- 错误信息
  error_message TEXT,

  -- 元数据
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT mentor_trigger_events_status_check
    CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

CREATE INDEX idx_mentor_trigger_events_student ON mentor_trigger_events(student_id);
CREATE INDEX idx_mentor_trigger_events_status ON mentor_trigger_events(status, created_at);
CREATE INDEX idx_mentor_trigger_events_trigger_type ON mentor_trigger_events(trigger_type);

COMMENT ON TABLE mentor_trigger_events IS 'AI导师触发事件队列';
COMMENT ON COLUMN mentor_trigger_events.trigger_type IS '触发类型（T-01到T-05）';
COMMENT ON COLUMN mentor_trigger_events.trigger_data IS '触发场景的完整数据';

-- 3. 学生卡点记录表（扩展mentor_growth_observations）
CREATE TABLE IF NOT EXISTS student_stuck_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,

  -- 卡点信息
  stuck_type VARCHAR(50) NOT NULL, -- 'tool_selection', 'requirement_understanding', 'technical_issue', 'creative_block', 'other'
  stuck_description TEXT NOT NULL,
  stuck_at_step VARCHAR(100), -- 卡在哪一步

  -- AI导师响应
  mentor_response_id UUID REFERENCES mentor_conversations_v2(id),
  provided_clue TEXT, -- 导师给的线索

  -- 解决状态
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolution_method VARCHAR(50), -- 'mentor_clue', 'self_solved', 'peer_help', 'gave_up'
  time_to_resolve_minutes INTEGER, -- 从卡住到解决的时间（分钟）

  -- 元数据
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT student_stuck_points_stuck_type_check
    CHECK (stuck_type IN ('tool_selection', 'requirement_understanding', 'technical_issue', 'creative_block', 'other')),
  CONSTRAINT student_stuck_points_resolution_check
    CHECK (resolution_method IN ('mentor_clue', 'self_solved', 'peer_help', 'gave_up'))
);

CREATE INDEX idx_student_stuck_points_student ON student_stuck_points(student_id);
CREATE INDEX idx_student_stuck_points_task ON student_stuck_points(task_id);
CREATE INDEX idx_student_stuck_points_resolved ON student_stuck_points(resolved, created_at DESC);

COMMENT ON TABLE student_stuck_points IS '学生卡点记录（用于T-02场景和同类卡点匹配）';
COMMENT ON COLUMN student_stuck_points.stuck_type IS '卡点类型（工具选择/需求理解/技术问题/创意阻塞）';
COMMENT ON COLUMN student_stuck_points.provided_clue IS 'AI导师提供的线索（不是答案）';

-- 4. 导师人设记忆库
CREATE TABLE IF NOT EXISTS mentor_persona_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 记忆类型
  memory_type VARCHAR(50) NOT NULL, -- 'experience', 'mistake', 'tip', 'encouragement'

  -- 记忆内容
  situation VARCHAR(200) NOT NULL, -- 适用场景（如："审核时发现字号问题"）
  memory_text TEXT NOT NULL, -- 记忆内容（如："我刚开始审核的时候也经常看走眼..."）

  -- 使用频率控制
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- 适用条件
  applicable_stuck_types VARCHAR(50)[], -- 适用的卡点类型
  applicable_task_types VARCHAR(50)[], -- 适用的任务类型

  -- 元数据
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT mentor_persona_memories_memory_type_check
    CHECK (memory_type IN ('experience', 'mistake', 'tip', 'encouragement'))
);

CREATE INDEX idx_mentor_persona_memories_type ON mentor_persona_memories(memory_type);
CREATE INDEX idx_mentor_persona_memories_active ON mentor_persona_memories(is_active);

COMMENT ON TABLE mentor_persona_memories IS '导师人设记忆库（偶尔引用自己的经历）';
COMMENT ON COLUMN mentor_persona_memories.memory_type IS '经验/错误/技巧/鼓励';
COMMENT ON COLUMN mentor_persona_memories.usage_count IS '被使用次数（控制频率，避免重复）';

-- 5. 任务进度快照表（用于T-04场景检测）
CREATE TABLE IF NOT EXISTS task_activity_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 活动信息
  last_activity_type VARCHAR(50), -- 'message_sent', 'file_uploaded', 'deliverable_submitted', 'mentor_conversation'
  last_activity_at TIMESTAMPTZ NOT NULL,

  -- 进度信息
  current_status VARCHAR(50),
  progress_percentage INTEGER,

  -- 检测标记
  inactive_warning_sent BOOLEAN DEFAULT false,
  inactive_warning_count INTEGER DEFAULT 0,

  -- 元数据
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_task_activity_snapshots_task ON task_activity_snapshots(task_id);
CREATE INDEX idx_task_activity_snapshots_last_activity ON task_activity_snapshots(last_activity_at);
CREATE INDEX idx_task_activity_snapshots_inactive ON task_activity_snapshots(inactive_warning_sent, last_activity_at);

COMMENT ON TABLE task_activity_snapshots IS '任务活动快照（用于检测长时间无操作）';
COMMENT ON COLUMN task_activity_snapshots.last_activity_at IS '最后活动时间（用于T-04触发检测）';

-- 6. 里程碑成就记录表（用于T-05场景）
CREATE TABLE IF NOT EXISTS student_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 里程碑类型
  milestone_type VARCHAR(50) NOT NULL, -- 'first_task_completed', 'level_up', 'overcome_stuck_point', 'high_rating', 'fast_completion'
  milestone_data JSONB NOT NULL, -- 里程碑详细数据

  -- 导师见证
  mentor_witnessed BOOLEAN DEFAULT false,
  mentor_message_id UUID REFERENCES mentor_conversations_v2(id),
  witness_message TEXT, -- 导师的见证话语

  -- 对比数据（用于"有对比"）
  comparison_data JSONB, -- 如：{"first_task_days": 7, "current_task_days": 2}

  -- 元数据
  achieved_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT student_milestones_milestone_type_check
    CHECK (milestone_type IN ('first_task_completed', 'level_up', 'overcome_stuck_point', 'high_rating', 'fast_completion', 'skill_mastered'))
);

CREATE INDEX idx_student_milestones_student ON student_milestones(student_id);
CREATE INDEX idx_student_milestones_type ON student_milestones(milestone_type);
CREATE INDEX idx_student_milestones_witnessed ON student_milestones(mentor_witnessed);

COMMENT ON TABLE student_milestones IS '学生里程碑成就记录（用于T-05见证）';
COMMENT ON COLUMN student_milestones.comparison_data IS '对比数据（第1单 vs 当前单）';

-- 7. 触发器：更新updated_at
CREATE OR REPLACE FUNCTION update_mentor_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER student_stuck_points_updated_at
  BEFORE UPDATE ON student_stuck_points
  FOR EACH ROW EXECUTE FUNCTION update_mentor_updated_at();

CREATE TRIGGER task_activity_snapshots_updated_at
  BEFORE UPDATE ON task_activity_snapshots
  FOR EACH ROW EXECUTE FUNCTION update_mentor_updated_at();

-- 8. 插入初始导师人设记忆
INSERT INTO mentor_persona_memories (memory_type, situation, memory_text, applicable_stuck_types) VALUES
  ('experience', '审核时发现字号问题', '我刚开始审核的时候也经常看走眼。第3张图的字号问题，你试试调成14px看看。', ARRAY['technical_issue']),
  ('experience', '配色选择困难', '这一步我当初也卡过——你先试试用Canva的「移动端预览」看一眼。', ARRAY['creative_block']),
  ('mistake', '忽略移动端适配', '我刚开始审核的时候，也经常忽略移动端预览这一步。', ARRAY['technical_issue']),
  ('tip', '工具选择建议', '我发现XX工具在处理这类任务时更快一些，你可以试试。', ARRAY['tool_selection']),
  ('encouragement', '第一次提交被打回', '我记得我第一次做这类任务，也是被打回了两次才通过的。', ARRAY['creative_block', 'technical_issue']);

COMMENT ON TABLE mentor_persona_memories IS '导师人设记忆库已初始化5条记忆';
