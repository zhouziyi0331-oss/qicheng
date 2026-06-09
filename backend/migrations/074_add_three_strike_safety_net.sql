-- Migration: 添加三次审核兜底机制相关字段
-- 用途: 支持第三次审核失败后的转单/召唤大师功能

-- 1. 添加 is_final_fail 字段到 task_submissions
ALTER TABLE task_submissions
ADD COLUMN IF NOT EXISTS is_final_fail BOOLEAN DEFAULT false;

-- 2. 添加转单相关字段到 task_assignments
ALTER TABLE task_assignments
ADD COLUMN IF NOT EXISTS transfer_to UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS transfer_reason TEXT,
ADD COLUMN IF NOT EXISTS transferred_at TIMESTAMP WITH TIME ZONE;

-- 3. 添加大师相关字段到 task_assignments
ALTER TABLE task_assignments
ADD COLUMN IF NOT EXISTS master_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS master_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS master_requested_at TIMESTAMP WITH TIME ZONE;

-- 4. 扩展 assignment_status 枚举类型
DO $$
BEGIN
    -- 检查枚举类型是否存在 'transferred' 值
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'transferred'
        AND enumtypid = 'assignment_status'::regtype
    ) THEN
        ALTER TYPE assignment_status ADD VALUE 'transferred';
    END IF;

    -- 检查枚举类型是否存在 'master_assigned' 值
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'master_assigned'
        AND enumtypid = 'assignment_status'::regtype
    ) THEN
        ALTER TYPE assignment_status ADD VALUE 'master_assigned';
    END IF;
END $$;

-- 5. 创建大师用户表（扩展users表的大师相关字段）
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_master BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS master_specialties JSONB,
ADD COLUMN IF NOT EXISTS master_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS master_min_task_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS master_accept_designated BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS master_allow_negotiation BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS master_total_tasks INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS master_avg_rating DECIMAL(3,1),
ADD COLUMN IF NOT EXISTS master_approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS master_bio TEXT;

-- 6. 创建项目邀请表（指定大师模式）
CREATE TABLE IF NOT EXISTS project_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id),
    master_id UUID NOT NULL REFERENCES users(id),
    enterprise_offer DECIMAL(10,2) NOT NULL,
    master_counter_offer DECIMAL(10,2),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '48 hours',

    CONSTRAINT chk_invitation_status CHECK (status IN ('pending', 'accepted', 'negotiating', 'rejected', 'expired'))
);

-- 7. 添加 dispatch_mode 字段到 tasks 表
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS dispatch_mode VARCHAR(20) DEFAULT 'random',
ADD COLUMN IF NOT EXISTS designated_master_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS master_base_price DECIMAL(10,2);

ALTER TABLE tasks
ADD CONSTRAINT chk_dispatch_mode CHECK (dispatch_mode IN ('random', 'designated'));

-- 8. 创建索引
CREATE INDEX IF NOT EXISTS idx_task_submissions_final_fail
ON task_submissions(task_id, is_final_fail)
WHERE is_final_fail = true;

CREATE INDEX IF NOT EXISTS idx_task_assignments_transfer
ON task_assignments(transfer_to)
WHERE transfer_to IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_task_assignments_master
ON task_assignments(master_id)
WHERE master_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_master
ON users(is_master)
WHERE is_master = true;

CREATE INDEX IF NOT EXISTS idx_project_invitations_master
ON project_invitations(master_id, status);

CREATE INDEX IF NOT EXISTS idx_project_invitations_task
ON project_invitations(task_id, status);

-- 9. 添加注释
COMMENT ON COLUMN task_submissions.is_final_fail IS '是否第三次审核失败（触发兜底机制）';
COMMENT ON COLUMN task_assignments.transfer_to IS '转单目标学生ID';
COMMENT ON COLUMN task_assignments.master_id IS '指派的大师ID';
COMMENT ON COLUMN users.is_master IS '是否为认证大师';
COMMENT ON COLUMN tasks.dispatch_mode IS '派单模式：random=常规派单，designated=指定大师';
COMMENT ON TABLE project_invitations IS '企业邀请大师记录表';
