-- Migration: 学生成长数据闭环系统
-- 包含三个模块：即时成长总结、六维能力动态更新、Lv.6毕业报告

-- ============================================
-- 1. 修改 mentor_growth_observations 表
-- 添加即时成长总结相关字段
-- ============================================

ALTER TABLE mentor_growth_observations
ADD COLUMN IF NOT EXISTS instant_summary JSONB,
ADD COLUMN IF NOT EXISTS skills_demonstrated JSONB;

COMMENT ON COLUMN mentor_growth_observations.instant_summary IS '即时成长总结（AI生成），包含headline、before_after_comparison、breakthrough_point等';
COMMENT ON COLUMN mentor_growth_observations.skills_demonstrated IS '本次任务展示的技能列表';

-- ============================================
-- 2. 修改 user_ability_profiles 表
-- 添加版本化和文字解读字段
-- ============================================

ALTER TABLE user_ability_profiles
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_reason VARCHAR(200),
ADD COLUMN IF NOT EXISTS dimension_descriptions JSONB;

COMMENT ON COLUMN user_ability_profiles.version IS '画像版本号，每次更新+1';
COMMENT ON COLUMN user_ability_profiles.is_current IS '是否为当前有效版本';
COMMENT ON COLUMN user_ability_profiles.updated_reason IS '更新原因（如"完成订单#XXX"）';
COMMENT ON COLUMN user_ability_profiles.dimension_descriptions IS '每个维度的文字解读';

-- 为版本查询创建索引
CREATE INDEX IF NOT EXISTS idx_user_ability_profiles_version
ON user_ability_profiles(user_id, version DESC);

CREATE INDEX IF NOT EXISTS idx_user_ability_profiles_current
ON user_ability_profiles(user_id, is_current)
WHERE is_current = true;

-- ============================================
-- 3. 修改 growth_reports 表
-- 添加毕业报告类型和付费相关字段
-- ============================================

-- 检查 report_type 枚举是否存在，如果存在则添加新值
DO $$
BEGIN
    -- 添加 graduation 类型到 report_type 枚举
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'graduation'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'report_type')
    ) THEN
        ALTER TYPE report_type ADD VALUE 'graduation';
    END IF;
END $$;

-- 添加付费相关字段
ALTER TABLE growth_reports
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS preview_content TEXT,
ADD COLUMN IF NOT EXISTS full_content_json JSONB,
ADD COLUMN IF NOT EXISTS pdf_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS update_count INTEGER DEFAULT 0;

COMMENT ON COLUMN growth_reports.is_paid IS '是否已付费解锁';
COMMENT ON COLUMN growth_reports.paid_at IS '付费时间';
COMMENT ON COLUMN growth_reports.payment_amount IS '付费金额';
COMMENT ON COLUMN growth_reports.preview_content IS '预览内容（第一章前300字）';
COMMENT ON COLUMN growth_reports.full_content_json IS '完整报告内容（JSON格式，包含六章）';
COMMENT ON COLUMN growth_reports.pdf_url IS 'PDF下载链接';
COMMENT ON COLUMN growth_reports.update_count IS '报告更新次数';

-- 为毕业报告查询创建索引
CREATE INDEX IF NOT EXISTS idx_growth_reports_graduation
ON growth_reports(user_id, report_type)
WHERE report_type = 'graduation';

-- ============================================
-- 4. 创建 ability_dimension_history 表
-- 存储六维能力的历史变化记录
-- ============================================

CREATE TABLE IF NOT EXISTS ability_dimension_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile_version INTEGER NOT NULL,

    -- 六个维度的分数
    information_processing INTEGER CHECK (information_processing BETWEEN 0 AND 100),
    creative_drive INTEGER CHECK (creative_drive BETWEEN 0 AND 100),
    tool_learning INTEGER CHECK (tool_learning BETWEEN 0 AND 100),
    task_execution INTEGER CHECK (task_execution BETWEEN 0 AND 100),
    collaboration_tendency INTEGER CHECK (collaboration_tendency BETWEEN 0 AND 100),
    risk_attitude INTEGER CHECK (risk_attitude BETWEEN 0 AND 100),

    -- 变化原因
    change_trigger VARCHAR(100), -- 'order_completed', 'manual_update', 'test_result'
    related_order_id UUID REFERENCES orders(id),

    -- 本次变化的详细说明
    change_details JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE ability_dimension_history IS '六维能力历史变化记录表';
COMMENT ON COLUMN ability_dimension_history.profile_version IS '对应的画像版本号';
COMMENT ON COLUMN ability_dimension_history.change_trigger IS '变化触发原因';
COMMENT ON COLUMN ability_dimension_history.change_details IS '变化详情，包含每个维度的变化值和原因';

-- 创建索引
CREATE INDEX idx_ability_history_user ON ability_dimension_history(user_id, created_at DESC);
CREATE INDEX idx_ability_history_order ON ability_dimension_history(related_order_id);

-- ============================================
-- 5. 创建 growth_summary_cache 表
-- 缓存即时成长总结，避免重复生成
-- ============================================

CREATE TABLE IF NOT EXISTS growth_summary_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

    -- 总结内容
    summary_json JSONB NOT NULL,

    -- 生成信息
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    ai_model VARCHAR(50),
    generation_time_ms INTEGER,

    -- 用户反馈
    user_viewed BOOLEAN DEFAULT false,
    viewed_at TIMESTAMPTZ,
    user_feedback VARCHAR(20), -- 'helpful', 'not_helpful', 'neutral'

    UNIQUE(order_id)
);

COMMENT ON TABLE growth_summary_cache IS '即时成长总结缓存表';
COMMENT ON COLUMN growth_summary_cache.summary_json IS '总结内容JSON，包含headline、before_after_comparison等字段';
COMMENT ON COLUMN growth_summary_cache.user_feedback IS '用户对总结的反馈';

-- 创建索引
CREATE INDEX idx_growth_summary_user ON growth_summary_cache(user_id, generated_at DESC);
CREATE INDEX idx_growth_summary_order ON growth_summary_cache(order_id);

-- ============================================
-- 6. 创建 graduation_report_payments 表
-- 记录毕业报告的付费信息
-- ============================================

CREATE TABLE IF NOT EXISTS graduation_report_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_id UUID NOT NULL REFERENCES growth_reports(id) ON DELETE CASCADE,

    -- 付费信息
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50), -- 'wechat', 'alipay', 'points'
    transaction_id VARCHAR(100),

    -- 积分抵扣
    points_used INTEGER DEFAULT 0,
    points_value DECIMAL(10,2) DEFAULT 0,

    -- 状态
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
    paid_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(report_id)
);

COMMENT ON TABLE graduation_report_payments IS '毕业报告付费记录表';
COMMENT ON COLUMN graduation_report_payments.points_used IS '使用的积分数量';
COMMENT ON COLUMN graduation_report_payments.points_value IS '积分抵扣的金额';

-- 创建索引
CREATE INDEX idx_graduation_payments_user ON graduation_report_payments(user_id, created_at DESC);
CREATE INDEX idx_graduation_payments_status ON graduation_report_payments(status, created_at DESC);

-- ============================================
-- 7. 创建视图：学生成长概览
-- ============================================

CREATE OR REPLACE VIEW student_growth_overview AS
SELECT
    u.id as user_id,
    u.username,
    u.current_level,

    -- 订单统计
    COUNT(DISTINCT o.id) as total_orders,
    COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END) as completed_orders,
    COALESCE(AVG(CASE WHEN o.status = 'completed' THEN o.client_rating END), 0) as avg_rating,
    COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.student_price END), 0) as total_earnings,

    -- 能力画像
    uap.version as current_profile_version,
    uap.information_processing,
    uap.creative_drive,
    uap.tool_learning,
    uap.task_execution,
    uap.collaboration_tendency,
    uap.risk_attitude,
    uap.personality_label,

    -- 成长总结
    COUNT(DISTINCT gsc.id) as growth_summaries_count,

    -- 毕业报告
    gr.id as graduation_report_id,
    gr.is_paid as graduation_report_paid,

    -- 时间信息
    u.created_at as joined_at,
    MAX(o.completed_at) as last_order_completed_at

FROM users u
LEFT JOIN orders o ON u.id = o.student_id
LEFT JOIN user_ability_profiles uap ON u.id = uap.user_id AND uap.is_current = true
LEFT JOIN growth_summary_cache gsc ON u.id = gsc.user_id
LEFT JOIN growth_reports gr ON u.id = gr.user_id AND gr.report_type = 'graduation'
WHERE u.role = 'student'
GROUP BY u.id, u.username, u.current_level, uap.version, uap.information_processing,
         uap.creative_drive, uap.tool_learning, uap.task_execution,
         uap.collaboration_tendency, uap.risk_attitude, uap.personality_label,
         gr.id, gr.is_paid, u.created_at;

COMMENT ON VIEW student_growth_overview IS '学生成长概览视图，汇总订单、能力、报告等信息';

-- ============================================
-- 8. 创建触发器：自动更新 updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 graduation_report_payments 表添加触发器
DROP TRIGGER IF EXISTS update_graduation_report_payments_updated_at ON graduation_report_payments;
CREATE TRIGGER update_graduation_report_payments_updated_at
    BEFORE UPDATE ON graduation_report_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. 插入初始数据
-- ============================================

-- 为现有的 user_ability_profiles 记录设置版本号
UPDATE user_ability_profiles
SET version = 1, is_current = true
WHERE version IS NULL;

-- ============================================
-- 完成
-- ============================================

-- 输出完成信息
DO $$
BEGIN
    RAISE NOTICE '学生成长数据闭环系统 Migration 完成';
    RAISE NOTICE '新增表: ability_dimension_history, growth_summary_cache, graduation_report_payments';
    RAISE NOTICE '修改表: mentor_growth_observations, user_ability_profiles, growth_reports';
    RAISE NOTICE '新增视图: student_growth_overview';
END $$;
