-- ============================================================
-- 企业端双模式派单系统 Migration
-- 包含：常规派单价格推荐 + 指定大师派单
-- ============================================================

-- ============================================
-- 1. 修改 tasks 表（原 projects 表）
-- 添加派单模式和价格相关字段
-- ============================================

-- 创建派单模式枚举
DO $$ BEGIN
    CREATE TYPE dispatch_mode AS ENUM ('random', 'designated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 添加派单模式相关字段
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS dispatch_mode dispatch_mode DEFAULT 'random',
ADD COLUMN IF NOT EXISTS estimated_hours INTEGER,
ADD COLUMN IF NOT EXISTS price_min DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS price_max DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS enterprise_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS designated_master_id UUID REFERENCES users(id);

COMMENT ON COLUMN tasks.dispatch_mode IS '派单模式：random=常规派单, designated=指定大师';
COMMENT ON COLUMN tasks.estimated_hours IS '企业预估工时（小时）';
COMMENT ON COLUMN tasks.price_min IS '平台推荐价格下限（学生到手价）';
COMMENT ON COLUMN tasks.price_max IS '平台推荐价格上限（学生到手价）';
COMMENT ON COLUMN tasks.enterprise_price IS '企业设定的学生到手价格';
COMMENT ON COLUMN tasks.designated_master_id IS '指定的大师ID（designated模式时）';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_tasks_dispatch_mode ON tasks(dispatch_mode);
CREATE INDEX IF NOT EXISTS idx_tasks_designated_master ON tasks(designated_master_id) WHERE designated_master_id IS NOT NULL;

-- ============================================
-- 2. 修改 users 表
-- 添加大师相关字段
-- ============================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_master BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS master_min_hourly_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS master_min_order_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS master_accept_designated BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS master_allow_negotiation BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS master_specialties TEXT[],
ADD COLUMN IF NOT EXISTS master_online BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS master_current_load INTEGER DEFAULT 0;

COMMENT ON COLUMN users.is_master IS '是否为认证大师';
COMMENT ON COLUMN users.master_min_hourly_rate IS '大师最低时薪';
COMMENT ON COLUMN users.master_min_order_price IS '大师接单起报价';
COMMENT ON COLUMN users.master_accept_designated IS '是否接受指定邀请';
COMMENT ON COLUMN users.master_allow_negotiation IS '是否接受协商';
COMMENT ON COLUMN users.master_specialties IS '大师擅长领域标签';
COMMENT ON COLUMN users.master_online IS '大师当前是否在线';
COMMENT ON COLUMN users.master_current_load IS '大师当前进行中的项目数';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_is_master ON users(is_master) WHERE is_master = true;
CREATE INDEX IF NOT EXISTS idx_users_master_online ON users(master_online) WHERE master_online = true;

-- ============================================
-- 3. 创建 project_invitations 表
-- 存储指定大师模式的邀请记录
-- ============================================

-- 创建邀请状态枚举
DO $$ BEGIN
    CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'negotiating', 'rejected', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS project_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    enterprise_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    master_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- 报价信息
    enterprise_offer DECIMAL(10,2) NOT NULL,
    master_counter_offer DECIMAL(10,2),

    -- 协商信息
    status invitation_status DEFAULT 'pending',
    message TEXT,
    master_note TEXT,

    -- 时间戳
    created_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '48 hours',

    UNIQUE(task_id, master_id)
);

COMMENT ON TABLE project_invitations IS '指定大师邀请记录表';
COMMENT ON COLUMN project_invitations.enterprise_offer IS '企业出价';
COMMENT ON COLUMN project_invitations.master_counter_offer IS '大师还价';
COMMENT ON COLUMN project_invitations.status IS '邀请状态';
COMMENT ON COLUMN project_invitations.message IS '企业留言';
COMMENT ON COLUMN project_invitations.master_note IS '大师回复/协商说明';
COMMENT ON COLUMN project_invitations.expires_at IS '邀请过期时间（48小时）';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_invitations_task ON project_invitations(task_id);
CREATE INDEX IF NOT EXISTS idx_invitations_master ON project_invitations(master_id, status);
CREATE INDEX IF NOT EXISTS idx_invitations_enterprise ON project_invitations(enterprise_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON project_invitations(status);

-- ============================================
-- 4. 创建 price_calculation_history 表
-- 记录价格推荐计算历史（用于优化算法）
-- ============================================

CREATE TABLE IF NOT EXISTS price_calculation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

    -- 输入参数
    track track_type NOT NULL,
    difficulty INTEGER NOT NULL,
    estimated_hours INTEGER NOT NULL,
    deliverable_type VARCHAR(50),

    -- 计算结果
    base_price DECIMAL(10,2) NOT NULL,
    price_min DECIMAL(10,2) NOT NULL,
    price_max DECIMAL(10,2) NOT NULL,

    -- 历史数据参考
    historical_avg_price DECIMAL(10,2),
    similar_tasks_count INTEGER,

    -- 元数据
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE price_calculation_history IS '价格推荐计算历史记录';
COMMENT ON COLUMN price_calculation_history.base_price IS '基准价格';
COMMENT ON COLUMN price_calculation_history.historical_avg_price IS '历史同类项目平均价格';
COMMENT ON COLUMN price_calculation_history.similar_tasks_count IS '参考的同类项目数量';

CREATE INDEX IF NOT EXISTS idx_price_history_task ON price_calculation_history(task_id);
CREATE INDEX IF NOT EXISTS idx_price_history_params ON price_calculation_history(track, difficulty);

-- ============================================
-- 5. 创建视图：大师概览
-- ============================================

CREATE OR REPLACE VIEW master_overview AS
SELECT
    u.id as master_id,
    u.nickname,
    u.avatar_url,
    u.is_master,
    u.master_min_hourly_rate,
    u.master_min_order_price,
    u.master_accept_designated,
    u.master_allow_negotiation,
    u.master_specialties,
    u.master_online,
    u.master_current_load,

    -- 统计数据
    (SELECT COUNT(*) FROM task_assignments ta
     JOIN tasks t ON ta.task_id = t.id
     WHERE ta.student_id = u.id AND ta.status = 'completed') as completed_tasks,

    (SELECT AVG(tr.company_rating) FROM task_ratings tr
     JOIN task_assignments ta ON tr.task_id = ta.task_id
     WHERE ta.student_id = u.id) as avg_rating,

    (SELECT AVG(EXTRACT(EPOCH FROM (ta.completed_at - ta.accepted_at)) / 3600)
     FROM task_assignments ta
     WHERE ta.student_id = u.id AND ta.status = 'completed' AND ta.completed_at IS NOT NULL
     LIMIT 3) as avg_delivery_hours_recent_3,

    u.created_at

FROM users u
WHERE u.is_master = true;

COMMENT ON VIEW master_overview IS '大师概览视图，用于企业端大师列表展示';

-- ============================================
-- 6. 创建函数：自动过期邀请
-- ============================================

CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
    UPDATE project_invitations
    SET status = 'expired'
    WHERE status = 'pending'
      AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION expire_old_invitations IS '自动将超过48小时未响应的邀请标记为过期';

-- ============================================
-- 完成
-- ============================================

SELECT '企业端双模式派单系统 Migration 完成' as status;
