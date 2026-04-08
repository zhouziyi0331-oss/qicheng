-- ============================================================
-- 012_team_collaboration.sql
-- 组队接单功能补充
-- ============================================================

-- 为 team_tasks 表添加缺失字段
ALTER TABLE team_tasks ADD COLUMN IF NOT EXISTS started_at TIMESTAMP;
ALTER TABLE team_tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- 为 team_members 表添加缺失字段
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP DEFAULT NOW();

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_team_tasks_leader ON team_tasks(team_leader_id);
CREATE INDEX IF NOT EXISTS idx_team_tasks_status ON team_tasks(status);
CREATE INDEX IF NOT EXISTS idx_team_members_student ON team_members(student_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_task_id);

-- 添加注释
COMMENT ON COLUMN team_tasks.started_at IS '团队任务开始时间';
COMMENT ON COLUMN team_tasks.completed_at IS '团队任务完成时间';
COMMENT ON COLUMN team_members.joined_at IS '成员加入时间';
