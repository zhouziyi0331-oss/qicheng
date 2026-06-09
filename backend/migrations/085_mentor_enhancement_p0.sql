-- ============================================
-- 启程平台AI导师功能增强 - P0级
-- Migration: 085
-- 创建日期: 2026-05-27
-- 功能：主动预警系统、长期记忆系统、风格自适应引导
-- ============================================

-- ============================================
-- 1. 主动预警系统
-- ============================================

-- 预警规则表
CREATE TABLE IF NOT EXISTS mentor_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type VARCHAR(50) NOT NULL,
  -- 'level_gap': 等级跨度过大
  -- 'repeated_rejection': 连续同类问题打回
  -- 'deadline_pressure': 截止时间紧迫
  -- 'direction_mismatch': 方向偏差

  rule_name VARCHAR(100) NOT NULL,
  trigger_condition JSONB NOT NULL,
  alert_template TEXT NOT NULL,

  priority INTEGER DEFAULT 1, -- 1=高, 2=中, 3=低
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_rule_type CHECK (
    rule_type IN ('level_gap', 'repeated_rejection', 'deadline_pressure', 'direction_mismatch')
  ),
  CONSTRAINT valid_priority CHECK (priority BETWEEN 1 AND 3)
);

-- 预警记录表
CREATE TABLE IF NOT EXISTS mentor_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES mentor_alert_rules(id) ON DELETE SET NULL,
  rule_type VARCHAR(50) NOT NULL,

  alert_message TEXT NOT NULL,
  trigger_data JSONB,

  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  student_viewed BOOLEAN DEFAULT false,
  viewed_at TIMESTAMPTZ,
  student_responded BOOLEAN DEFAULT false,
  responded_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mentor_alerts_student ON mentor_alerts(student_id, created_at DESC);
CREATE INDEX idx_mentor_alerts_order ON mentor_alerts(order_id);
CREATE INDEX idx_mentor_alerts_unsent ON mentor_alerts(is_sent, created_at) WHERE is_sent = false;
CREATE INDEX idx_mentor_alerts_rule_type ON mentor_alerts(rule_type, created_at DESC);

COMMENT ON TABLE mentor_alert_rules IS 'AI导师主动预警规则配置表';
COMMENT ON TABLE mentor_alerts IS 'AI导师预警记录表';

-- ============================================
-- 2. 长期记忆系统
-- ============================================

-- 学生长期记忆缓存表
CREATE TABLE IF NOT EXISTS mentor_student_profile_cache (
  student_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  -- 长期记忆摘要（200字以内）
  profile_summary TEXT NOT NULL,

  -- 高频卡点（Top 3）
  top_stuck_points JSONB NOT NULL DEFAULT '[]',

  -- 最近突破（Top 3）
  recent_breakthroughs JSONB NOT NULL DEFAULT '[]',

  -- 能力画像快照
  ability_snapshot JSONB NOT NULL,

  -- 工作习惯分析
  work_patterns JSONB NOT NULL,

  -- 引导风格
  guidance_style VARCHAR(50) NOT NULL,

  -- 元数据
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  update_trigger VARCHAR(50),

  CONSTRAINT valid_guidance_style CHECK (
    guidance_style IN ('visual', 'logical', 'independent', 'collaborative', 'adventurous', 'steady')
  )
);

CREATE INDEX idx_mentor_profile_cache_updated ON mentor_student_profile_cache(last_updated DESC);
CREATE INDEX idx_mentor_profile_cache_style ON mentor_student_profile_cache(guidance_style);

COMMENT ON TABLE mentor_student_profile_cache IS 'AI导师学生长期记忆缓存表';
COMMENT ON COLUMN mentor_student_profile_cache.profile_summary IS '学生长期记忆摘要，200字以内';
COMMENT ON COLUMN mentor_student_profile_cache.guidance_style IS '引导风格：visual/logical/independent/collaborative/adventurous/steady';

-- 扩展成长观察记录表
ALTER TABLE mentor_growth_observations
ADD COLUMN IF NOT EXISTS observation_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_significant BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tags TEXT[];

CREATE INDEX IF NOT EXISTS idx_growth_obs_category ON mentor_growth_observations(observation_category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_growth_obs_significant ON mentor_growth_observations(is_significant, created_at DESC) WHERE is_significant = true;
CREATE INDEX IF NOT EXISTS idx_growth_obs_tags ON mentor_growth_observations USING gin(tags);

COMMENT ON COLUMN mentor_growth_observations.observation_category IS '观察类型：stuck_point/breakthrough/skill_improvement/behavior_change';
COMMENT ON COLUMN mentor_growth_observations.is_significant IS '是否是重要观察（用于筛选进入长期记忆）';
COMMENT ON COLUMN mentor_growth_observations.tags IS '标签数组，如：[配色, 品牌设计, 客户沟通]';

-- ============================================
-- 3. 初始化预警规则
-- ============================================

INSERT INTO mentor_alert_rules (rule_type, rule_name, trigger_condition, alert_template, priority) VALUES
(
  'level_gap',
  '接单等级跨度预警',
  '{"level_gap": 2, "operator": ">="}'::jsonb,
  '学生接了比当前等级高{level_gap}级的项目。项目难度：Lv.{task_level}，学生等级：Lv.{student_level}。建议引导学生先拆解需求，列出不确定的地方。',
  1
),
(
  'repeated_rejection',
  '连续同类问题打回预警',
  '{"rejection_count": 2, "same_issue_category": true, "time_window_hours": 72}'::jsonb,
  '学生连续{rejection_count}次被打回，都是因为{issue_category}。建议引导学生重新理解客户对这个点的要求。',
  1
),
(
  'deadline_pressure',
  '截止时间紧迫预警',
  '{"time_remaining_percent": 30, "submission_status": "not_submitted"}'::jsonb,
  '距离交付还有{hours_remaining}小时，学生还没提交。需要确认是卡住了还是在打磨。',
  2
),
(
  'direction_mismatch',
  '交付物方向偏差预警',
  '{"ai_review_mismatch_score": 0.7, "operator": ">="}'::jsonb,
  'AI-03审核检测到交付物和需求有结构性偏差。偏差类型：{mismatch_type}。建议学生在提交前自查需求匹配度。',
  1
)
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. 数据完整性检查
-- ============================================

-- 确保所有学生都有长期记忆缓存（初始化为空）
INSERT INTO mentor_student_profile_cache (
  student_id,
  profile_summary,
  top_stuck_points,
  recent_breakthroughs,
  ability_snapshot,
  work_patterns,
  guidance_style,
  update_trigger
)
SELECT
  u.id,
  '新学生，暂无历史数据。',
  '[]'::jsonb,
  '[]'::jsonb,
  jsonb_build_object(
    'level', COALESCE(u.level, 0),
    'six_dimensions', '{}',
    'personality_tag', '未知',
    'core_strengths', '[]'
  ),
  jsonb_build_object(
    'avg_delivery_days_before_deadline', 0,
    'avg_revision_rounds', 0,
    'recent_5_orders_avg_score', 0
  ),
  'logical',
  'initial_migration'
FROM users u
WHERE u.role = 'student'
  AND NOT EXISTS (
    SELECT 1 FROM mentor_student_profile_cache mspc
    WHERE mspc.student_id = u.id
  )
ON CONFLICT (student_id) DO NOTHING;

-- ============================================
-- 5. 性能优化
-- ============================================

-- 分析表以优化查询计划
ANALYZE mentor_alert_rules;
ANALYZE mentor_alerts;
ANALYZE mentor_student_profile_cache;
ANALYZE mentor_growth_observations;

-- ============================================
-- 6. 权限设置
-- ============================================

-- 确保应用用户有权限访问新表
GRANT SELECT, INSERT, UPDATE, DELETE ON mentor_alert_rules TO qicheng_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON mentor_alerts TO qicheng_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON mentor_student_profile_cache TO qicheng_user;

-- ============================================
-- 完成
-- ============================================

-- 记录迁移完成
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 085 completed successfully';
  RAISE NOTICE '   - Created mentor_alert_rules table';
  RAISE NOTICE '   - Created mentor_alerts table';
  RAISE NOTICE '   - Created mentor_student_profile_cache table';
  RAISE NOTICE '   - Extended mentor_growth_observations table';
  RAISE NOTICE '   - Initialized 4 alert rules';
  RAISE NOTICE '   - Initialized profile cache for existing students';
END $$;
