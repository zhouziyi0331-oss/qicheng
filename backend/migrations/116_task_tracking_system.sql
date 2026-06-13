-- E-23: 任务进度仪表盘
-- E-24: 里程碑确认机制
-- E-25: 交付提前通知
-- E-26: 沟通记录归档
-- E-27: 任务延期预警
-- E-28: 紧急介入按钮

-- 任务进度快照表
CREATE TABLE task_progress_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),

  -- 进度数据
  completion_percentage INTEGER CHECK (completion_percentage BETWEEN 0 AND 100),
  days_elapsed INTEGER,
  days_remaining INTEGER,
  is_on_track BOOLEAN,
  risk_level VARCHAR(50),  -- 'low', 'medium', 'high'

  -- 沟通统计
  messages_count INTEGER DEFAULT 0,
  last_student_message_at TIMESTAMPTZ,
  last_company_message_at TIMESTAMPTZ,
  avg_response_time_hours DECIMAL(10,2),

  -- 里程碑进度
  milestones_total INTEGER DEFAULT 0,
  milestones_completed INTEGER DEFAULT 0,

  -- 预警信息
  warnings JSONB DEFAULT '[]',
  -- [
  --   {type: "no_communication", days: 3, message: "已3天无沟通"},
  --   {type: "behind_schedule", days: 2, message: "进度落后2天"}
  -- ]

  snapshot_time TIMESTAMPTZ DEFAULT NOW()
);

-- 任务里程碑表
CREATE TABLE task_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),

  -- 里程碑信息
  milestone_name VARCHAR(200) NOT NULL,
  description TEXT,
  sequence_number INTEGER NOT NULL,
  due_date DATE,

  -- 交付要求
  deliverables TEXT[],
  acceptance_criteria TEXT[],

  -- 状态
  status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'in_progress', 'submitted', 'approved', 'rejected'

  -- 学生提交
  student_submission TEXT,
  submission_files JSONB DEFAULT '[]',
  submitted_at TIMESTAMPTZ,

  -- 企业确认
  company_feedback TEXT,
  is_approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,
  rejected_reason TEXT,

  -- 预算分配
  budget_allocation DECIMAL(10,2),
  is_paid BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 交付提前通知表
CREATE TABLE delivery_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),
  milestone_id UUID REFERENCES task_milestones(id),

  -- 通知类型
  notification_type VARCHAR(50) NOT NULL,
  -- 'milestone_due_soon', 'final_delivery_due_soon', 'milestone_submitted', 'delivery_submitted'

  -- 通知对象
  recipient_id UUID NOT NULL REFERENCES users(id),
  recipient_role VARCHAR(50),  -- 'company', 'student'

  -- 通知内容
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  days_until_due INTEGER,

  -- 状态
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 沟通记录归档表
CREATE TABLE communication_archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),

  -- 归档时间范围
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,

  -- 归档内容
  messages JSONB NOT NULL,
  -- [
  --   {sender: "company", time: "2026-01-15 10:30", content: "需求说明..."},
  --   {sender: "student", time: "2026-01-15 11:00", content: "收到，开始工作"}
  -- ]

  -- 统计信息
  total_messages INTEGER,
  company_messages INTEGER,
  student_messages INTEGER,
  avg_response_time_hours DECIMAL(10,2),

  -- 关键节点
  key_decisions JSONB DEFAULT '[]',
  -- [
  --   {time: "2026-01-16", decision: "确认需求变更，增加3天工期"}
  -- ]

  -- 问题记录
  issues_raised JSONB DEFAULT '[]',

  -- 归档状态
  is_locked BOOLEAN DEFAULT false,
  archived_by UUID REFERENCES users(id),
  archived_at TIMESTAMPTZ DEFAULT NOW()
);

-- 任务延期预警表
CREATE TABLE task_delay_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),

  -- 预警类型
  warning_type VARCHAR(50) NOT NULL,
  -- 'no_progress', 'behind_schedule', 'no_communication', 'milestone_overdue'

  -- 预警级别
  severity VARCHAR(50) NOT NULL,  -- 'info', 'warning', 'critical'

  -- 预警详情
  warning_message TEXT NOT NULL,
  warning_data JSONB,
  -- {
  --   "days_overdue": 2,
  --   "last_update": "2026-01-10",
  --   "completion_percentage": 30
  -- }

  -- 建议措施
  suggested_actions TEXT[],

  -- 处理状态
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 紧急介入记录表
CREATE TABLE emergency_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),

  -- 发起人
  initiated_by UUID NOT NULL REFERENCES users(id),
  initiator_role VARCHAR(50),  -- 'company', 'student', 'admin'

  -- 介入原因
  reason VARCHAR(50) NOT NULL,
  -- 'task_stuck', 'dispute', 'quality_issue', 'communication_breakdown', 'urgent_change'

  reason_detail TEXT NOT NULL,

  -- 介入状态
  status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'in_progress', 'resolved', 'escalated'

  -- 平台响应
  admin_assigned UUID REFERENCES users(id),
  admin_response TEXT,
  response_time_hours DECIMAL(10,2),

  -- 解决方案
  resolution TEXT,
  resolution_actions JSONB,

  -- 时间线
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

-- 索引
CREATE INDEX idx_progress_snapshots_task ON task_progress_snapshots(task_id, snapshot_time DESC);
CREATE INDEX idx_milestones_task ON task_milestones(task_id, sequence_number);
CREATE INDEX idx_milestones_status ON task_milestones(status, due_date);
CREATE INDEX idx_delivery_notifications_recipient ON delivery_notifications(recipient_id, is_read, created_at DESC);
CREATE INDEX idx_communication_archives_task ON communication_archives(task_id, archived_at DESC);
CREATE INDEX idx_delay_warnings_task ON task_delay_warnings(task_id, is_resolved, created_at DESC);
CREATE INDEX idx_emergency_interventions_task ON emergency_interventions(task_id, status);
CREATE INDEX idx_emergency_interventions_admin ON emergency_interventions(admin_assigned, status);

-- 定时创建进度快照（由后端定时任务触发）
CREATE OR REPLACE FUNCTION create_progress_snapshot(p_task_id UUID)
RETURNS void AS $$
DECLARE
  v_task RECORD;
  v_messages_count INTEGER;
  v_last_student_msg TIMESTAMPTZ;
  v_last_company_msg TIMESTAMPTZ;
  v_milestones_total INTEGER;
  v_milestones_completed INTEGER;
  v_warnings JSONB := '[]';
BEGIN
  -- 获取任务信息
  SELECT * INTO v_task FROM tasks WHERE id = p_task_id;

  -- 获取沟通统计
  SELECT COUNT(*),
         MAX(created_at) FILTER (WHERE sender_role = 'student'),
         MAX(created_at) FILTER (WHERE sender_role = 'company')
  INTO v_messages_count, v_last_student_msg, v_last_company_msg
  FROM messages
  WHERE task_id = p_task_id;

  -- 获取里程碑统计
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'approved')
  INTO v_milestones_total, v_milestones_completed
  FROM task_milestones
  WHERE task_id = p_task_id;

  -- 检查预警
  IF v_last_student_msg IS NULL OR (NOW() - v_last_student_msg) > INTERVAL '3 days' THEN
    v_warnings := v_warnings || jsonb_build_object(
      'type', 'no_communication',
      'days', EXTRACT(DAY FROM NOW() - COALESCE(v_last_student_msg, v_task.created_at)),
      'message', '学生已多日无沟通'
    );
  END IF;

  -- 插入快照
  INSERT INTO task_progress_snapshots (
    id, task_id, completion_percentage, days_elapsed, days_remaining,
    is_on_track, risk_level, messages_count,
    last_student_message_at, last_company_message_at,
    milestones_total, milestones_completed, warnings
  ) VALUES (
    gen_random_uuid(), p_task_id,
    COALESCE((SELECT completion_percentage FROM task_progress WHERE task_id = p_task_id), 0),
    EXTRACT(DAY FROM NOW() - v_task.created_at)::INTEGER,
    EXTRACT(DAY FROM v_task.deadline - NOW())::INTEGER,
    (v_task.deadline > NOW()),
    CASE
      WHEN v_task.deadline < NOW() THEN 'high'
      WHEN v_task.deadline < NOW() + INTERVAL '3 days' THEN 'medium'
      ELSE 'low'
    END,
    v_messages_count, v_last_student_msg, v_last_company_msg,
    v_milestones_total, v_milestones_completed, v_warnings
  );
END;
$$ LANGUAGE plpgsql;

-- 里程碑完成后自动通知
CREATE OR REPLACE FUNCTION notify_milestone_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'submitted' AND OLD.status != 'submitted' THEN
    INSERT INTO delivery_notifications (
      id, task_id, milestone_id, notification_type,
      recipient_id, recipient_role, title, message
    )
    SELECT
      gen_random_uuid(), NEW.task_id, NEW.id, 'milestone_submitted',
      t.company_id, 'company',
      '里程碑已提交',
      '学生已提交里程碑：' || NEW.milestone_name
    FROM tasks t
    WHERE t.id = NEW.task_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_milestone_notification
AFTER UPDATE ON task_milestones
FOR EACH ROW
EXECUTE FUNCTION notify_milestone_completion();

COMMENT ON TABLE task_progress_snapshots IS 'E-23: 任务进度仪表盘快照';
COMMENT ON TABLE task_milestones IS 'E-24: 里程碑确认机制';
COMMENT ON TABLE delivery_notifications IS 'E-25: 交付提前通知';
COMMENT ON TABLE communication_archives IS 'E-26: 沟通记录归档';
COMMENT ON TABLE task_delay_warnings IS 'E-27: 任务延期预警';
COMMENT ON TABLE emergency_interventions IS 'E-28: 紧急介入按钮';
