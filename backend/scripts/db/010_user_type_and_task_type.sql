-- 010: 用户类型和任务类型改造
-- 目的：
-- 1. 注册时选择身份（学生/企业），身份不可更改
-- 2. 企业发布任务时选择类型（普通任务/邀请任务）
-- 3. 邀请任务仅限满级学生，且为双向选择

-- 1. 给users表添加user_type字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (user_type IN ('student', 'company'));

-- 为现有用户设置类型（根据是否有company_profiles判断）
UPDATE users u
SET user_type = 'company'
WHERE EXISTS (
  SELECT 1 FROM company_profiles cp WHERE cp.user_id = u.id
);

-- 2. 给tasks表添加task_type字段
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_type VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (task_type IN ('normal', 'invitation'));

-- 为现有的invitation_tasks关联的任务标记为invitation类型
UPDATE tasks t
SET task_type = 'invitation'
WHERE EXISTS (
  SELECT 1 FROM invitation_tasks it WHERE it.task_id = t.id
);

-- 3. 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_tasks_task_type ON tasks(task_type);

-- 4. 添加注释
COMMENT ON COLUMN users.user_type IS '用户类型：student=学生，company=企业（注册后不可更改）';
COMMENT ON COLUMN tasks.task_type IS '任务类型：normal=普通任务（系统匹配），invitation=邀请任务（满级学生双向选择）';

-- 5. 更新invitation_tasks表，添加学生响应状态
ALTER TABLE invitation_tasks ADD COLUMN IF NOT EXISTS student_response VARCHAR(20) CHECK (student_response IN ('pending', 'accepted', 'rejected'));
ALTER TABLE invitation_tasks ADD COLUMN IF NOT EXISTS student_response_at TIMESTAMP;
ALTER TABLE invitation_tasks ADD COLUMN IF NOT EXISTS student_response_reason TEXT;

COMMENT ON COLUMN invitation_tasks.student_response IS '学生响应状态：pending=待响应，accepted=已接受，rejected=已拒绝';
COMMENT ON COLUMN invitation_tasks.student_response_at IS '学生响应时间';
COMMENT ON COLUMN invitation_tasks.student_response_reason IS '学生拒绝原因（可选）';
