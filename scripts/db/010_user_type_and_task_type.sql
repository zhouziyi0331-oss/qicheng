/**
 * 010_user_type_and_task_type.sql
 * 添加用户类型和任务类型字段
 *
 * 功能：
 * 1. users表添加user_type字段（student/company，注册时选择，不可更改）
 * 2. tasks表添加task_type字段（normal/invitation，发布时选择）
 * 3. invitation_tasks表添加学生响应字段
 */

-- 1. 添加用户类型字段
ALTER TABLE users
ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) CHECK (user_type IN ('student', 'company'));

-- 为现有用户设置默认值（根据role推断）
UPDATE users
SET user_type = CASE
  WHEN role = 'student' THEN 'student'
  WHEN role = 'company' THEN 'company'
  ELSE NULL
END
WHERE user_type IS NULL;

-- 设置为必填字段
ALTER TABLE users
ALTER COLUMN user_type SET NOT NULL;

-- 添加注释
COMMENT ON COLUMN users.user_type IS '用户类型：student=学生, company=企业（注册时选择，不可更改）';

-- 2. 添加任务类型字段
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS task_type VARCHAR(20) DEFAULT 'normal' CHECK (task_type IN ('normal', 'invitation'));

-- 为现有任务设置默认值
UPDATE tasks
SET task_type = 'normal'
WHERE task_type IS NULL;

-- 设置为必填字段
ALTER TABLE tasks
ALTER COLUMN task_type SET NOT NULL;

-- 添加注释
COMMENT ON COLUMN tasks.task_type IS '任务类型：normal=普通匹配任务, invitation=邀请指定任务';

-- 3. invitation_tasks表添加学生响应字段（如果表已存在）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invitation_tasks') THEN
    -- 添加学生响应状态字段
    ALTER TABLE invitation_tasks
    ADD COLUMN IF NOT EXISTS student_response_status VARCHAR(20) DEFAULT 'pending'
    CHECK (student_response_status IN ('pending', 'accepted', 'rejected'));

    -- 添加学生响应时间
    ALTER TABLE invitation_tasks
    ADD COLUMN IF NOT EXISTS student_responded_at TIMESTAMP;

    -- 添加学生响应消息
    ALTER TABLE invitation_tasks
    ADD COLUMN IF NOT EXISTS student_response_message TEXT;

    -- 添加注释
    COMMENT ON COLUMN invitation_tasks.student_response_status IS '学生响应状态：pending=待响应, accepted=已接受, rejected=已拒绝';
    COMMENT ON COLUMN invitation_tasks.student_responded_at IS '学生响应时间';
    COMMENT ON COLUMN invitation_tasks.student_response_message IS '学生响应留言';
  END IF;
END $$;

-- 4. 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_tasks_task_type ON tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_tasks_type_status ON tasks(task_type, status);

-- 5. 添加约束：邀请任务必须指定学生
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
    -- 邀请任务的assigned_to字段必须有值
    ALTER TABLE tasks
    ADD CONSTRAINT check_invitation_has_assignee
    CHECK (
      task_type = 'normal' OR
      (task_type = 'invitation' AND assigned_to IS NOT NULL)
    );
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 完成
SELECT 'Migration 010 completed: user_type and task_type fields added' AS status;
