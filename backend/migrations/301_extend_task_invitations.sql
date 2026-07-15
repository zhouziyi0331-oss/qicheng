-- 扩展现有的task_invitations表，添加邀约系统所需字段

-- 1. 添加邀约类型
ALTER TABLE task_invitations
ADD COLUMN IF NOT EXISTS invitation_type VARCHAR(20) DEFAULT 'auto';

-- 2. 添加邀约理由
ALTER TABLE task_invitations
ADD COLUMN IF NOT EXISTS invitation_reason TEXT;

-- 3. 添加匹配分数
ALTER TABLE task_invitations
ADD COLUMN IF NOT EXISTS match_score INT CHECK (match_score >= 0 AND match_score <= 100);

-- 4. 添加匹配详情
ALTER TABLE task_invitations
ADD COLUMN IF NOT EXISTS match_details JSONB;

-- 5. 添加排名
ALTER TABLE task_invitations
ADD COLUMN IF NOT EXISTS rank INT;

-- 6. 添加过期时间
ALTER TABLE task_invitations
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '24 hours');

-- 7. 添加付费相关字段
ALTER TABLE task_invitations
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10,2) DEFAULT 0.00;

ALTER TABLE task_invitations
ADD COLUMN IF NOT EXISTS payment_id VARCHAR(100);

-- 8. 修改status约束，支持declined
ALTER TABLE task_invitations
DROP CONSTRAINT IF EXISTS task_invitations_status_check;

ALTER TABLE task_invitations
ADD CONSTRAINT task_invitations_status_check
CHECK (status IN ('pending', 'accepted', 'declined', 'rejected', 'expired', 'cancelled'));

-- 9. 创建索引
CREATE INDEX IF NOT EXISTS idx_task_invitations_expires
ON task_invitations(expires_at) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_task_invitations_type
ON task_invitations(invitation_type);

-- 10. 添加注释
COMMENT ON COLUMN task_invitations.invitation_type IS '邀约类型: auto(系统自动)/paid(企业付费定向)';
COMMENT ON COLUMN task_invitations.invitation_reason IS 'AI生成的邀约理由';
COMMENT ON COLUMN task_invitations.match_score IS '匹配分数 0-100';
COMMENT ON COLUMN task_invitations.match_details IS '匹配详情JSON: reasons, strengths, relevantProjects等';
COMMENT ON COLUMN task_invitations.rank IS '同一任务中的邀约排名，1表示最匹配';
COMMENT ON COLUMN task_invitations.expires_at IS '邀约过期时间，默认24小时';

-- 11. 更新现有数据的默认值
UPDATE task_invitations
SET invitation_type = 'auto'
WHERE invitation_type IS NULL;

UPDATE task_invitations
SET expires_at = invited_at + INTERVAL '24 hours'
WHERE expires_at IS NULL;

-- 12. 创建talent_recommendations表
CREATE TABLE IF NOT EXISTS talent_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_score INT NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  match_reasons JSONB NOT NULL,
  rank INT NOT NULL,
  auto_invited BOOLEAN DEFAULT FALSE,
  recommended_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(task_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_talent_recommendations_task
ON talent_recommendations(task_id, rank);

CREATE INDEX IF NOT EXISTS idx_talent_recommendations_score
ON talent_recommendations(task_id, match_score DESC);

COMMENT ON TABLE talent_recommendations IS '人才推荐记录表 - 企业端查看';

-- 13. 添加任务邀约模式字段
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS invitation_mode BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN tasks.invitation_mode IS '是否启用邀约模式（true: 定向邀约, false: 公开抢单）';

UPDATE tasks SET invitation_mode = TRUE WHERE invitation_mode IS NULL;

-- 14. 创建自动过期函数
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE task_invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION expire_old_invitations() IS '自动将超过24小时未响应的邀约标记为expired';
