-- ══════════════════════════════════════════════════════════════
-- AI导师系统数据库表
-- ══════════════════════════════════════════════════════════════

-- AI导师对话记录表
CREATE TABLE IF NOT EXISTS mentor_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  trigger_type VARCHAR(50) NOT NULL, -- 'task_start', 'stuck', 'rejected', 'idle', 'milestone'
  user_message TEXT, -- 学生发送的消息（如果有）
  mentor_response TEXT NOT NULL, -- AI导师的回复
  response_time_ms INTEGER, -- AI响应时间（毫秒）
  is_read BOOLEAN DEFAULT FALSE, -- 学生是否已读
  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_mentor_student (student_id, created_at DESC),
  INDEX idx_mentor_task (task_id, created_at DESC),
  INDEX idx_mentor_trigger (trigger_type, created_at DESC)
);

COMMENT ON TABLE mentor_conversations IS 'AI导师对话记录';
COMMENT ON COLUMN mentor_conversations.trigger_type IS '触发类型：task_start=任务开始, stuck=学生卡住, rejected=交付物打回, idle=长时间无操作, milestone=里程碑';
COMMENT ON COLUMN mentor_conversations.response_time_ms IS 'AI响应时间，用于监控性能';

-- 学生卡点记录表
CREATE TABLE IF NOT EXISTS student_stuck_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  stuck_description TEXT NOT NULL, -- 学生描述的卡点
  stuck_at_step VARCHAR(100), -- 卡在哪一步（AI推测）
  stuck_category VARCHAR(50), -- 卡点类型：tool=工具不会用, concept=概念不理解, resource=资源找不到
  resolved BOOLEAN DEFAULT FALSE, -- 是否已解决
  resolved_at TIMESTAMP, -- 解决时间
  resolution_method TEXT, -- 解决方法（AI记录）
  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_stuck_student (student_id, created_at DESC),
  INDEX idx_stuck_task (task_id, created_at DESC),
  INDEX idx_stuck_unresolved (student_id, resolved) WHERE resolved = FALSE
);

COMMENT ON TABLE student_stuck_points IS '学生卡点记录，用于分析学生常见困难和成长轨迹';
COMMENT ON COLUMN student_stuck_points.stuck_category IS '卡点类型：tool=工具不会用, concept=概念不理解, resource=资源找不到, other=其他';

-- 学生成长里程碑表
CREATE TABLE IF NOT EXISTS student_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  milestone_type VARCHAR(50) NOT NULL, -- 'first_task', 'level_up', 'new_tool', 'overcome_stuck', 'high_score'
  milestone_data JSONB NOT NULL, -- 具体数据
  mentor_message TEXT NOT NULL, -- AI导师的见证消息
  is_celebrated BOOLEAN DEFAULT FALSE, -- 是否已庆祝（推送通知）
  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_milestone_student (student_id, created_at DESC),
  INDEX idx_milestone_type (milestone_type, created_at DESC),
  INDEX idx_milestone_uncelebrated (student_id, is_celebrated) WHERE is_celebrated = FALSE
);

COMMENT ON TABLE student_milestones IS '学生成长里程碑，AI导师见证学生的每一次进步';
COMMENT ON COLUMN student_milestones.milestone_type IS '里程碑类型：first_task=首单, level_up=升级, new_tool=首次使用新工具, overcome_stuck=克服历史卡点, high_score=高分';

-- 学生活动日志表（用于检测长时间无操作）
CREATE TABLE IF NOT EXISTS student_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- 'view_task', 'upload_file', 'send_message', 'update_progress'
  activity_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_activity_student (student_id, created_at DESC),
  INDEX idx_activity_task (task_id, created_at DESC)
);

COMMENT ON TABLE student_activity_log IS '学生活动日志，用于检测长时间无操作';

-- AI导师轻推记录表（防止频繁推送）
CREATE TABLE IF NOT EXISTS mentor_nudge_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  nudge_count INTEGER DEFAULT 1, -- 第几次轻推
  last_nudge_at TIMESTAMP DEFAULT NOW(),

  UNIQUE (student_id, task_id),
  INDEX idx_nudge_student_task (student_id, task_id)
);

COMMENT ON TABLE mentor_nudge_log IS 'AI导师轻推记录，防止频繁推送打扰学生';

-- 插入测试数据（可选）
-- INSERT INTO mentor_conversations (student_id, task_id, trigger_type, mentor_response)
-- SELECT
--   u.id,
--   t.id,
--   'task_start',
--   '你接到了「' || t.title || '」的任务，恭喜！🎉 我帮你拆了一下，这个任务大概分3步...'
-- FROM users u
-- CROSS JOIN tasks t
-- WHERE u.role = 'student'
-- LIMIT 1;
