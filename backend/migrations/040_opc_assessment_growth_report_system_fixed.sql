-- OPC评估与成长报告系统数据库迁移(修复版)
-- 创建时间: 2026-04-13
-- 功能:实现OPC能力评估、成长报告生成、数据可视化
-- 修复:使用UUID类型匹配现有users表

-- ============================================
-- 1. OPC评估记录表
-- ============================================
CREATE TABLE IF NOT EXISTS opc_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 评估维度分数(0-100)
  originality_score INTEGER CHECK (originality_score >= 0 AND originality_score <= 100),
  professionalism_score INTEGER CHECK (professionalism_score >= 0 AND professionalism_score <= 100),
  collaboration_score INTEGER CHECK (collaboration_score >= 0 AND collaboration_score <= 100),

  -- 综合评分
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),

  -- 评估依据
  assessment_basis JSONB NOT NULL, -- 包含各维度的详细评估数据

  -- 评估类型
  assessment_type VARCHAR(20) NOT NULL CHECK (assessment_type IN ('initial', 'periodic', 'graduation')),

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. OPC维度详细数据表
-- ============================================
CREATE TABLE IF NOT EXISTS opc_dimension_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES opc_assessments(id) ON DELETE CASCADE,
  dimension VARCHAR(20) NOT NULL CHECK (dimension IN ('originality', 'professionalism', 'collaboration')),

  -- 子维度评分
  sub_dimensions JSONB NOT NULL, -- 各子维度的详细评分

  -- 证据数据
  evidence_data JSONB, -- 支撑评分的具体数据

  -- 改进建议
  improvement_suggestions TEXT,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. 成长报告表
-- ============================================
CREATE TABLE IF NOT EXISTS growth_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 报告周期
  report_period VARCHAR(20) NOT NULL CHECK (report_period IN ('weekly', 'monthly', 'quarterly', 'annual')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- 报告内容
  summary TEXT NOT NULL,
  achievements JSONB NOT NULL, -- 成就列表
  growth_trends JSONB NOT NULL, -- 成长趋势数据
  recommendations TEXT,

  -- OPC评估快照
  opc_snapshot JSONB, -- 该周期的OPC评分

  -- 可见性控制
  visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'shared')),

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. 成长里程碑表
-- ============================================
CREATE TABLE IF NOT EXISTS growth_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 里程碑信息
  milestone_type VARCHAR(50) NOT NULL, -- 如'first_task', 'level_up', 'graduation'等
  milestone_title VARCHAR(200) NOT NULL,
  milestone_description TEXT,

  -- 关联数据
  related_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  related_data JSONB, -- 其他相关数据

  -- 时间戳
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. 数据可视化配置表
-- ============================================
CREATE TABLE IF NOT EXISTS visualization_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- 可视化偏好
  preferred_chart_types JSONB, -- 用户偏好的图表类型
  color_scheme VARCHAR(20) DEFAULT 'default',

  -- 展示配置
  show_opc_radar BOOLEAN DEFAULT TRUE,
  show_growth_curve BOOLEAN DEFAULT TRUE,
  show_task_timeline BOOLEAN DEFAULT TRUE,
  show_earnings_chart BOOLEAN DEFAULT TRUE,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. 创建索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_opc_assessments_student_id ON opc_assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_opc_assessments_created_at ON opc_assessments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opc_dimension_details_assessment_id ON opc_dimension_details(assessment_id);
CREATE INDEX IF NOT EXISTS idx_growth_reports_student_id ON growth_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_growth_reports_period ON growth_reports(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_growth_milestones_student_id ON growth_milestones(student_id);
CREATE INDEX IF NOT EXISTS idx_growth_milestones_achieved_at ON growth_milestones(achieved_at DESC);

-- ============================================
-- 7. 添加注释
-- ============================================
COMMENT ON TABLE opc_assessments IS 'OPC评估记录表';
COMMENT ON TABLE opc_dimension_details IS 'OPC维度详细数据表';
COMMENT ON TABLE growth_reports IS '成长报告表';
COMMENT ON TABLE growth_milestones IS '成长里程碑表';
COMMENT ON TABLE visualization_configs IS '数据可视化配置表';
