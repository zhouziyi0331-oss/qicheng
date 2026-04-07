-- 009_invitation_system.sql
-- 邀请任务系统：满级学生的定向邀请机制

-- 1. 邀请任务表（商家发起的定向邀请）
CREATE TABLE IF NOT EXISTS invitation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 任务基本信息
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  deliverables TEXT,
  budget DECIMAL(10,2) NOT NULL,
  deadline TIMESTAMP,

  -- 邀请目标条件
  target_level_min INTEGER DEFAULT 10, -- 最低等级要求（默认满级）
  target_abilities JSONB, -- 六维能力要求 {"d1": 80, "d2": 70, ...}
  target_tags TEXT[], -- 目标学生标签
  max_invitations INTEGER DEFAULT 5, -- 最多邀请人数

  -- 状态
  status VARCHAR(20) DEFAULT 'active', -- active, paused, closed
  visibility VARCHAR(20) DEFAULT 'invitation_only', -- 仅邀请可见

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invitation_tasks_company ON invitation_tasks(company_id);
CREATE INDEX idx_invitation_tasks_status ON invitation_tasks(status);
CREATE INDEX idx_invitation_tasks_level ON invitation_tasks(target_level_min);

-- 2. 邀请记录表（具体的邀请发送记录）
CREATE TABLE IF NOT EXISTS invitation_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES invitation_tasks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 邀请信息
  invitation_message TEXT, -- 商家自定义邀请语
  match_score INTEGER, -- 匹配度分数 0-100
  match_reason JSONB, -- 匹配原因 {"ability_match": 85, "history_match": 90, ...}

  -- 状态流转
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected, expired, withdrawn
  student_viewed_at TIMESTAMP, -- 学生查看时间
  student_responded_at TIMESTAMP, -- 学生响应时间
  response_message TEXT, -- 学生回复消息

  -- 过期时间（7天未响应自动过期）
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '7 days',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invitation_records_task ON invitation_records(task_id);
CREATE INDEX idx_invitation_records_student ON invitation_records(student_id);
CREATE INDEX idx_invitation_records_status ON invitation_records(status);
CREATE INDEX idx_invitation_records_expires ON invitation_records(expires_at);

-- 3. 学生活跃度日志表
CREATE TABLE IF NOT EXISTS student_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 活跃度数据
  last_login_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMP NOT NULL DEFAULT NOW(), -- 最后活跃时间（任何操作）
  login_count INTEGER DEFAULT 1, -- 登录次数

  -- 活跃度状态
  is_active BOOLEAN DEFAULT true, -- 是否活跃（7天内有登录）
  inactive_since TIMESTAMP, -- 不活跃开始时间
  invitation_eligible BOOLEAN DEFAULT true, -- 是否有邀请资格

  -- 统计数据
  weekly_logins INTEGER DEFAULT 0, -- 本周登录次数
  monthly_logins INTEGER DEFAULT 0, -- 本月登录次数

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(student_id)
);

CREATE INDEX idx_activity_logs_student ON student_activity_logs(student_id);
CREATE INDEX idx_activity_logs_active ON student_activity_logs(is_active);
CREATE INDEX idx_activity_logs_eligible ON student_activity_logs(invitation_eligible);
CREATE INDEX idx_activity_logs_last_login ON student_activity_logs(last_login_at);

-- 4. 邀请匹配配置表
CREATE TABLE IF NOT EXISTS invitation_match_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 匹配权重配置
  ability_weight INTEGER DEFAULT 40, -- 能力匹配权重 (%)
  history_weight INTEGER DEFAULT 30, -- 历史表现权重 (%)
  tag_weight INTEGER DEFAULT 20, -- 标签匹配权重 (%)
  activity_weight INTEGER DEFAULT 10, -- 活跃度权重 (%)

  -- 偏好设置
  preferred_abilities TEXT[], -- 偏好的能力维度 ["d1", "d3"]
  preferred_tags TEXT[], -- 偏好的学生标签
  min_match_score INTEGER DEFAULT 60, -- 最低匹配分数

  -- 黑名单
  blacklist_students UUID[], -- 不邀请的学生ID列表

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(company_id)
);

CREATE INDEX idx_match_configs_company ON invitation_match_configs(company_id);

-- 5. 邀请任务接受后转为正式任务的关联表
CREATE TABLE IF NOT EXISTS invitation_task_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_record_id UUID NOT NULL REFERENCES invitation_records(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

  -- 转换信息
  converted_at TIMESTAMP DEFAULT NOW(),
  original_budget DECIMAL(10,2), -- 原始预算
  final_budget DECIMAL(10,2), -- 最终协商预算
  negotiation_rounds INTEGER DEFAULT 0, -- 协商轮次

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_task_conversions_invitation ON invitation_task_conversions(invitation_record_id);
CREATE INDEX idx_task_conversions_task ON invitation_task_conversions(task_id);

-- 6. 触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_invitation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_invitation_tasks_updated_at
  BEFORE UPDATE ON invitation_tasks
  FOR EACH ROW EXECUTE FUNCTION update_invitation_updated_at();

CREATE TRIGGER trigger_invitation_records_updated_at
  BEFORE UPDATE ON invitation_records
  FOR EACH ROW EXECUTE FUNCTION update_invitation_updated_at();

CREATE TRIGGER trigger_activity_logs_updated_at
  BEFORE UPDATE ON student_activity_logs
  FOR EACH ROW EXECUTE FUNCTION update_invitation_updated_at();

CREATE TRIGGER trigger_match_configs_updated_at
  BEFORE UPDATE ON invitation_match_configs
  FOR EACH ROW EXECUTE FUNCTION update_invitation_updated_at();

-- 7. 初始化默认配置
-- 为所有现有商家创建默认匹配配置
INSERT INTO invitation_match_configs (company_id)
SELECT id FROM users WHERE role = 'company'
ON CONFLICT (company_id) DO NOTHING;

-- 8. 为所有满级学生初始化活跃度记录
INSERT INTO student_activity_logs (student_id, last_login_at, last_active_at, is_active, invitation_eligible)
SELECT
  u.id,
  NOW(),
  NOW(),
  true,
  CASE WHEN sp.level_a >= 10 THEN true ELSE false END
FROM users u
JOIN student_profiles sp ON u.id = sp.user_id
WHERE u.role = 'student'
ON CONFLICT (student_id) DO NOTHING;

COMMENT ON TABLE invitation_tasks IS '邀请任务表：商家发起的定向邀请任务';
COMMENT ON TABLE invitation_records IS '邀请记录表：具体的邀请发送和响应记录';
COMMENT ON TABLE student_activity_logs IS '学生活跃度日志：追踪登录和活跃状态';
COMMENT ON TABLE invitation_match_configs IS '邀请匹配配置：商家的匹配偏好设置';
COMMENT ON TABLE invitation_task_conversions IS '邀请转换记录：邀请接受后转为正式任务的关联';
