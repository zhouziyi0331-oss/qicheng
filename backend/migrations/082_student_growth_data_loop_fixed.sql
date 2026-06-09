-- Migration: 学生成长数据闭环系统（修正版）
-- 适配现有的 growth_reports 表结构
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

-- 添加 report_type 字段（用于区分不同类型的报告）
ALTER TABLE growth_reports
ADD COLUMN IF NOT EXISTS report_type VARCHAR(20) DEFAULT 'periodic';

-- 添加 graduation 到 report_type 的检查约束
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'growth_reports_report_type_check'
    ) THEN
        ALTER TABLE growth_reports
        ADD CONSTRAINT growth_reports_report_type_check
        CHECK (report_type IN ('periodic', 'graduation'));
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

COMMENT ON COLUMN growth_reports.report_type IS '报告类型：periodic=周期报告, graduation=毕业报告';
COMMENT ON COLUMN growth_reports.is_paid IS '是否已付费解锁';
COMMENT ON COLUMN growth_reports.paid_at IS '付费时间';
COMMENT ON COLUMN growth_reports.payment_amount IS '付费金额';
COMMENT ON COLUMN growth_reports.preview_content IS '预览内容（第一章前300字）';
COMMENT ON COLUMN growth_reports.full_content_json IS '完整报告内容（JSON格式，包含六章）';
COMMENT ON COLUMN growth_reports.pdf_url IS 'PDF下载链接';
COMMENT ON COLUMN growth_reports.update_count IS '报告更新次数';

-- 为毕业报告查询创建索引
CREATE INDEX IF NOT EXISTS idx_growth_reports_graduation
ON growth_reports(student_id, report_type)
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
CREATE INDEX IF NOT EXISTS idx_ability_history_user ON ability_dimension_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ability_history_order ON ability_dimension_history(related_order_id);

-- ============================================
-- 5. 创建 growth_summary_cache 表
-- 缓存即时成长总结
-- ============================================

CREATE TABLE IF NOT EXISTS growth_summary_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

    -- 成长总结内容（JSON格式）
    summary_json JSONB NOT NULL,
    -- {
    --   "headline": "从零到一，独立完成品牌视觉设计",
    --   "paragraph_1": "...",
    --   "paragraph_2": "...",
    --   "paragraph_3": "...",
    --   "skills_demonstrated": ["Figma", "品牌设计"]
    -- }

    -- 生成状态
    generation_status VARCHAR(20) DEFAULT 'completed', -- 'pending', 'generating', 'completed', 'failed'
    error_message TEXT,

    -- 用户反馈
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    user_feedback VARCHAR(20), -- 'helpful', 'not_helpful'

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(order_id)
);

COMMENT ON TABLE growth_summary_cache IS '即时成长总结缓存表';
COMMENT ON COLUMN growth_summary_cache.summary_json IS 'AI生成的成长总结内容';
COMMENT ON COLUMN growth_summary_cache.generation_status IS '生成状态';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_growth_summary_student ON growth_summary_cache(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_growth_summary_order ON growth_summary_cache(order_id);
CREATE INDEX IF NOT EXISTS idx_growth_summary_unread ON growth_summary_cache(student_id, is_read)
WHERE is_read = false;

-- ============================================
-- 6. 创建 graduation_report_payments 表
-- 记录毕业报告的付费信息
-- ============================================

CREATE TABLE IF NOT EXISTS graduation_report_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES growth_reports(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- 付费信息
    amount DECIMAL(10,2) NOT NULL DEFAULT 299.00,
    payment_method VARCHAR(50), -- 'wechat', 'alipay', 'balance'
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
    transaction_id VARCHAR(100),

    -- 时间戳
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,

    UNIQUE(report_id)
);

COMMENT ON TABLE graduation_report_payments IS '毕业报告付费记录表';
COMMENT ON COLUMN graduation_report_payments.amount IS '付费金额（默认¥299）';
COMMENT ON COLUMN graduation_report_payments.payment_status IS '付费状态';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_graduation_payments_student ON graduation_report_payments(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_graduation_payments_status ON graduation_report_payments(payment_status);

-- ============================================
-- 7. 创建视图：学生成长概览
-- ============================================

CREATE OR REPLACE VIEW student_growth_overview AS
SELECT
    u.id as student_id,
    u.username,
    u.current_level,

    -- 最新能力画像
    uap.information_processing,
    uap.creative_drive,
    uap.tool_learning,
    uap.task_execution,
    uap.collaboration_tendency,
    uap.risk_attitude,
    uap.personality_label,
    uap.version as current_profile_version,

    -- 成长总结统计
    (SELECT COUNT(*) FROM growth_summary_cache WHERE student_id = u.id) as total_summaries,
    (SELECT COUNT(*) FROM growth_summary_cache WHERE student_id = u.id AND is_read = false) as unread_summaries,

    -- 毕业报告状态
    (SELECT COUNT(*) FROM growth_reports WHERE student_id = u.id AND report_type = 'graduation') as has_graduation_report,
    (SELECT is_paid FROM growth_reports WHERE student_id = u.id AND report_type = 'graduation' LIMIT 1) as graduation_report_paid,

    -- 时间戳
    uap.updated_at as profile_updated_at

FROM users u
LEFT JOIN user_ability_profiles uap ON u.id = uap.user_id AND uap.is_current = true
WHERE u.role = 'student';

COMMENT ON VIEW student_growth_overview IS '学生成长数据概览视图';

-- ============================================
-- 完成
-- ============================================

SELECT '学生成长数据闭环系统 Migration 完成' as status;
