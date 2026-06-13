-- E-29: 逐项验收清单
-- E-30: 修改意见模板化
-- E-31: 维度化验收评分
-- E-32: 愿意再合作标记
-- E-33: 知识产权声明
-- E-34: 退款补偿机制

-- 验收清单表
CREATE TABLE acceptance_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),

  -- 清单项
  checklist_items JSONB NOT NULL,
  -- [
  --   {id: 1, item: "首页UI设计", status: "pending", checked_by: null, checked_at: null},
  --   {id: 2, item: "响应式适配", status: "approved", checked_by: "uuid", checked_at: "2026-01-15"}
  -- ]

  -- 统计
  total_items INTEGER NOT NULL,
  checked_items INTEGER DEFAULT 0,
  approved_items INTEGER DEFAULT 0,
  rejected_items INTEGER DEFAULT 0,

  -- 状态
  overall_status VARCHAR(50) DEFAULT 'in_progress',  -- 'in_progress', 'completed', 'partial'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 修改意见模板表
CREATE TABLE revision_comment_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 模板分类
  category VARCHAR(50) NOT NULL,  -- 'ui_design', 'code_quality', 'functionality', 'performance'

  -- 模板内容
  template_name VARCHAR(200) NOT NULL,
  template_content TEXT NOT NULL,

  -- 占位符说明
  placeholders JSONB,
  -- {
  --   "element": "元素名称",
  --   "expected": "期望效果",
  --   "current": "当前状态"
  -- }

  -- 使用统计
  usage_count INTEGER DEFAULT 0,

  -- 状态
  is_active BOOLEAN DEFAULT true,
  is_official BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 维度化验收评分表
CREATE TABLE dimensional_acceptance_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) UNIQUE,
  company_id UUID NOT NULL REFERENCES users(id),
  student_id UUID NOT NULL REFERENCES users(id),

  -- 评分维度
  quality_score DECIMAL(3,2) CHECK (quality_score BETWEEN 0 AND 5),  -- 质量
  completeness_score DECIMAL(3,2) CHECK (completeness_score BETWEEN 0 AND 5),  -- 完整度
  timeliness_score DECIMAL(3,2) CHECK (timeliness_score BETWEEN 0 AND 5),  -- 及时性
  communication_score DECIMAL(3,2) CHECK (communication_score BETWEEN 0 AND 5),  -- 沟通
  professionalism_score DECIMAL(3,2) CHECK (professionalism_score BETWEEN 0 AND 5),  -- 专业性

  -- 维度评语
  quality_comment TEXT,
  completeness_comment TEXT,
  timeliness_comment TEXT,
  communication_comment TEXT,
  professionalism_comment TEXT,

  -- 总分
  overall_score DECIMAL(3,2),  -- 加权平均
  overall_comment TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 再合作意愿标记表
CREATE TABLE cooperation_willingness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),
  company_id UUID NOT NULL REFERENCES users(id),
  student_id UUID NOT NULL REFERENCES users(id),

  -- 企业对学生的评价
  company_willing BOOLEAN,
  company_reason TEXT,
  company_tags TEXT[],  -- ['reliable', 'high_quality', 'good_communication']

  -- 学生对企业的评价
  student_willing BOOLEAN,
  student_reason TEXT,
  student_tags TEXT[],  -- ['clear_requirements', 'timely_payment', 'respectful']

  -- 双向意愿
  is_mutual BOOLEAN GENERATED ALWAYS AS (company_willing = true AND student_willing = true) STORED,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(task_id, company_id, student_id)
);

-- 知识产权声明表
CREATE TABLE intellectual_property_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),

  -- 声明类型
  declaration_type VARCHAR(50) NOT NULL,  -- 'full_transfer', 'limited_license', 'shared_ownership'

  -- 声明内容
  declaration_text TEXT NOT NULL,

  -- 权利范围
  rights_scope JSONB NOT NULL,
  -- {
  --   "usage_rights": "unlimited",
  --   "modification_rights": "allowed",
  --   "sublicense_rights": "not_allowed",
  --   "commercial_rights": "allowed"
  -- }

  -- 限制条款
  restrictions TEXT[],

  -- 双方确认
  company_confirmed BOOLEAN DEFAULT false,
  company_confirmed_at TIMESTAMPTZ,
  student_confirmed BOOLEAN DEFAULT false,
  student_confirmed_at TIMESTAMPTZ,

  -- 证明文件
  proof_documents JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(task_id)
);

-- 退款补偿记录表
CREATE TABLE refund_compensation_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),

  -- 申请方
  applicant_id UUID NOT NULL REFERENCES users(id),
  applicant_role VARCHAR(50) NOT NULL,  -- 'company', 'student'

  -- 退款/补偿类型
  record_type VARCHAR(50) NOT NULL,  -- 'full_refund', 'partial_refund', 'compensation'

  -- 申请原因
  reason VARCHAR(50) NOT NULL,
  -- 'task_cancelled', 'quality_issue', 'scope_change', 'deadline_missed', 'breach'

  reason_detail TEXT NOT NULL,

  -- 金额
  requested_amount DECIMAL(10,2) NOT NULL,
  approved_amount DECIMAL(10,2),

  -- 证据材料
  evidence_files JSONB DEFAULT '[]',

  -- 审核状态
  status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'reviewing', 'approved', 'rejected', 'processed'

  -- 平台审核
  reviewed_by UUID REFERENCES users(id),
  review_comment TEXT,
  reviewed_at TIMESTAMPTZ,

  -- 处理信息
  processed_at TIMESTAMPTZ,
  transaction_id VARCHAR(200),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_acceptance_checklists_task ON acceptance_checklists(task_id);
CREATE INDEX idx_revision_templates_category ON revision_comment_templates(category, is_active);
CREATE INDEX idx_dimensional_scores_task ON dimensional_acceptance_scores(task_id);
CREATE INDEX idx_dimensional_scores_student ON dimensional_acceptance_scores(student_id);
CREATE INDEX idx_cooperation_willingness_company ON cooperation_willingness(company_id, company_willing);
CREATE INDEX idx_cooperation_willingness_student ON cooperation_willingness(student_id, student_willing);
CREATE INDEX idx_cooperation_willingness_mutual ON cooperation_willingness(is_mutual) WHERE is_mutual = true;
CREATE INDEX idx_ip_declarations_task ON intellectual_property_declarations(task_id);
CREATE INDEX idx_refund_records_task ON refund_compensation_records(task_id, status);
CREATE INDEX idx_refund_records_applicant ON refund_compensation_records(applicant_id, status);
CREATE INDEX idx_refund_records_status ON refund_compensation_records(status, created_at DESC);

-- 更新维度评分时自动计算总分
CREATE OR REPLACE FUNCTION calculate_overall_acceptance_score()
RETURNS TRIGGER AS $$
BEGIN
  -- 加权平均：质量30%，完整度25%，及时性20%，沟通15%，专业性10%
  NEW.overall_score := (
    COALESCE(NEW.quality_score, 0) * 0.3 +
    COALESCE(NEW.completeness_score, 0) * 0.25 +
    COALESCE(NEW.timeliness_score, 0) * 0.2 +
    COALESCE(NEW.communication_score, 0) * 0.15 +
    COALESCE(NEW.professionalism_score, 0) * 0.1
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_overall_score
BEFORE INSERT OR UPDATE ON dimensional_acceptance_scores
FOR EACH ROW
EXECUTE FUNCTION calculate_overall_acceptance_score();

-- 更新合作意愿统计
ALTER TABLE users ADD COLUMN IF NOT EXISTS willing_to_cooperate_again_rate DECIMAL(3,2);

CREATE OR REPLACE FUNCTION update_cooperation_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- 更新企业的再合作意愿率
  WITH company_stats AS (
    SELECT
      COUNT(*) FILTER (WHERE company_willing = true) as willing,
      COUNT(*) as total
    FROM cooperation_willingness
    WHERE company_id = NEW.company_id
  )
  UPDATE users
  SET willing_to_cooperate_again_rate = (SELECT willing::DECIMAL / NULLIF(total, 0) FROM company_stats)
  WHERE id = NEW.company_id;

  -- 更新学生的再合作意愿率
  WITH student_stats AS (
    SELECT
      COUNT(*) FILTER (WHERE student_willing = true) as willing,
      COUNT(*) as total
    FROM cooperation_willingness
    WHERE student_id = NEW.student_id
  )
  UPDATE users
  SET willing_to_cooperate_again_rate = (SELECT willing::DECIMAL / NULLIF(total, 0) FROM student_stats)
  WHERE id = NEW.student_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cooperation_stats
AFTER INSERT OR UPDATE ON cooperation_willingness
FOR EACH ROW
EXECUTE FUNCTION update_cooperation_stats();

-- 插入官方修改意见模板
INSERT INTO revision_comment_templates (id, category, template_name, template_content, placeholders) VALUES
(gen_random_uuid(), 'ui_design', 'UI元素位置调整', '请调整{{element}}的位置，当前{{current}}，建议{{expected}}。', '{"element": "元素名称", "current": "当前位置", "expected": "期望位置"}'),
(gen_random_uuid(), 'ui_design', '颜色调整', '{{element}}的颜色需要调整，当前{{current}}，建议改为{{expected}}以符合品牌色。', '{"element": "元素名称", "current": "当前颜色", "expected": "期望颜色"}'),
(gen_random_uuid(), 'ui_design', '字体大小调整', '{{element}}的字体大小需要调整，当前{{current}}，建议改为{{expected}}。', '{"element": "元素名称", "current": "当前大小", "expected": "期望大小"}'),
(gen_random_uuid(), 'functionality', '功能缺失', '缺少{{feature}}功能，请补充实现。参考需求：{{requirement}}。', '{"feature": "功能名称", "requirement": "需求描述"}'),
(gen_random_uuid(), 'functionality', '功能异常', '{{feature}}功能存在问题：{{issue}}。期望效果：{{expected}}。', '{"feature": "功能名称", "issue": "问题描述", "expected": "期望效果"}'),
(gen_random_uuid(), 'code_quality', '代码规范问题', '代码{{location}}不符合规范，具体问题：{{issue}}。建议{{suggestion}}。', '{"location": "位置", "issue": "问题", "suggestion": "建议"}'),
(gen_random_uuid(), 'performance', '性能优化', '{{component}}性能需要优化，当前{{current}}，建议{{expected}}。', '{"component": "组件名称", "current": "当前性能", "expected": "期望性能"}');

COMMENT ON TABLE acceptance_checklists IS 'E-29: 逐项验收清单';
COMMENT ON TABLE revision_comment_templates IS 'E-30: 修改意见模板化';
COMMENT ON TABLE dimensional_acceptance_scores IS 'E-31: 维度化验收评分';
COMMENT ON TABLE cooperation_willingness IS 'E-32: 愿意再合作标记';
COMMENT ON TABLE intellectual_property_declarations IS 'E-33: 知识产权声明';
COMMENT ON TABLE refund_compensation_records IS 'E-34: 退款补偿机制';
