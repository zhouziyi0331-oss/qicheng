-- 补充创建缺失的表

-- ============================================
-- 创建 ability_dimension_history 表
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
    change_trigger VARCHAR(100),
    related_task_id UUID REFERENCES tasks(id),

    -- 本次变化的详细说明
    change_details JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE ability_dimension_history IS '六维能力历史变化记录表';

CREATE INDEX IF NOT EXISTS idx_ability_history_user ON ability_dimension_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ability_history_task ON ability_dimension_history(related_task_id);

-- ============================================
-- 创建 growth_summary_cache 表
-- ============================================

CREATE TABLE IF NOT EXISTS growth_summary_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

    -- 成长总结内容（JSON格式）
    summary_json JSONB NOT NULL,

    -- 生成状态
    generation_status VARCHAR(20) DEFAULT 'completed',
    error_message TEXT,

    -- 用户反馈
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    user_feedback VARCHAR(20),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(task_id)
);

COMMENT ON TABLE growth_summary_cache IS '即时成长总结缓存表';

CREATE INDEX IF NOT EXISTS idx_growth_summary_student ON growth_summary_cache(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_growth_summary_task ON growth_summary_cache(task_id);
CREATE INDEX IF NOT EXISTS idx_growth_summary_unread ON growth_summary_cache(student_id, is_read)
WHERE is_read = false;

-- ============================================
-- 创建视图：学生成长概览（修正版）
-- ============================================

CREATE OR REPLACE VIEW student_growth_overview AS
SELECT
    u.id as student_id,
    u.nickname,
    u.role,

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

SELECT '补充表创建完成' as status;
