-- 任务邀约系统
-- 实现定向邀约机制，替代公开抢单模式

-- ==========================================
-- 1. 任务邀约表
-- ==========================================

CREATE TABLE IF NOT EXISTS task_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 邀约状态
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- pending: 待响应
  -- accepted: 已接受
  -- declined: 已拒绝
  -- expired: 已过期
  -- cancelled: 企业取消

  -- 邀约类型
  invitation_type VARCHAR(20) NOT NULL DEFAULT 'auto',
  -- auto: 系统自动邀约（免费）
  -- paid: 企业付费定向邀约

  -- 邀约理由（AI生成）
  invitation_reason TEXT,

  -- 匹配分数
  match_score INT CHECK (match_score >= 0 AND match_score <= 100),

  -- 匹配详情（JSON格式）
  match_details JSONB,
  -- {
  --   "reasons": ["擅长电商UI设计", "Figma熟练度高"],
  --   "strengths": ["视觉设计", "用户体验"],
  --   "relevantProjects": 8,
  --   "avgDeliveryDays": 5,
  --   "avgRating": 4.8
  -- }

  -- 排名（同一任务中的邀约排名）
  rank INT,

  -- 时间戳
  invited_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '24 hours'),

  -- 付费定向相关
  paid_amount DECIMAL(10,2) DEFAULT 0.00,
  payment_id VARCHAR(100),

  -- 索引约束
  UNIQUE(task_id, student_id)
);

-- 索引优化
CREATE INDEX idx_task_invitations_student ON task_invitations(student_id, status);
CREATE INDEX idx_task_invitations_task ON task_invitations(task_id, status);
CREATE INDEX idx_task_invitations_expires ON task_invitations(expires_at) WHERE status = 'pending';
CREATE INDEX idx_task_invitations_type ON task_invitations(invitation_type);

-- 注释
COMMENT ON TABLE task_invitations IS '任务邀约表 - 定向邀约机制';
COMMENT ON COLUMN task_invitations.status IS '邀约状态: pending/accepted/declined/expired/cancelled';
COMMENT ON COLUMN task_invitations.invitation_type IS '邀约类型: auto(系统自动)/paid(企业付费定向)';
COMMENT ON COLUMN task_invitations.match_score IS '匹配分数 0-100';
COMMENT ON COLUMN task_invitations.rank IS '同一任务中的邀约排名，1表示最匹配';


-- ==========================================
-- 2. 人才推荐记录表
-- ==========================================

CREATE TABLE IF NOT EXISTS talent_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 匹配分数
  match_score INT NOT NULL CHECK (match_score >= 0 AND match_score <= 100),

  -- 匹配理由（数组）
  match_reasons JSONB NOT NULL,
  -- ["擅长电商UI设计（完成过8个类似项目）", "Figma熟练度：高级"]

  -- 推荐排名
  rank INT NOT NULL,

  -- 是否已自动邀约
  auto_invited BOOLEAN DEFAULT FALSE,

  -- 推荐时间
  recommended_at TIMESTAMP DEFAULT NOW(),

  -- 约束
  UNIQUE(task_id, student_id)
);

-- 索引
CREATE INDEX idx_talent_recommendations_task ON talent_recommendations(task_id, rank);
CREATE INDEX idx_talent_recommendations_score ON talent_recommendations(task_id, match_score DESC);

-- 注释
COMMENT ON TABLE talent_recommendations IS '人才推荐记录表 - 企业端查看';
COMMENT ON COLUMN talent_recommendations.rank IS '推荐排名，1表示最匹配';
COMMENT ON COLUMN talent_recommendations.auto_invited IS '是否已自动发送邀请';


-- ==========================================
-- 3. 自动过期邀约的触发器
-- ==========================================

-- 自动将过期的pending邀约标记为expired
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE task_invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 注释
COMMENT ON FUNCTION expire_old_invitations() IS '自动将超过24小时未响应的邀约标记为expired';


-- ==========================================
-- 4. 修改tasks表，添加邀约模式字段
-- ==========================================

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS invitation_mode BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN tasks.invitation_mode IS '是否启用邀约模式（true: 定向邀约, false: 公开抢单）';

-- 默认所有任务启用邀约模式
UPDATE tasks SET invitation_mode = TRUE WHERE invitation_mode IS NULL;


-- ==========================================
-- 5. 示例数据（用于测试）
-- ==========================================

-- 注意：这些示例数据需要在有实际task_id和student_id的情况下才能插入
-- 实际使用时通过后端服务创建邀约

/*
-- 示例：为某个任务创建3个自动邀约
INSERT INTO task_invitations (
  task_id,
  student_id,
  status,
  invitation_type,
  invitation_reason,
  match_score,
  match_details,
  rank
) VALUES
(
  'task-uuid-here',
  'student-uuid-1',
  'pending',
  'auto',
  '你的UI设计能力和视觉表达能力非常匹配这个项目',
  92,
  '{"reasons": ["擅长电商UI设计（完成过8个类似项目）", "Figma熟练度：高级", "平均交付周期：5天"], "strengths": ["视觉设计", "用户体验"], "relevantProjects": 8, "avgDeliveryDays": 5, "avgRating": 4.8}'::jsonb,
  1
),
(
  'task-uuid-here',
  'student-uuid-2',
  'pending',
  'auto',
  '你的前端开发经验和技术栈很适合这个项目',
  88,
  '{"reasons": ["React开发经验丰富", "响应式设计能力强"], "strengths": ["前端开发", "性能优化"], "relevantProjects": 6, "avgDeliveryDays": 7, "avgRating": 4.6}'::jsonb,
  2
);
*/
