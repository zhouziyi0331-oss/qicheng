-- E-03: 风险预检系统
-- 任务发布前AI自动识别潜在风险并预警

-- 风险检测记录表
CREATE TABLE IF NOT EXISTS risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),
  
  -- 总体风险等级
  overall_risk_level VARCHAR(20) NOT NULL,
  -- 'low' - 低风险
  -- 'medium' - 中风险
  -- 'high' - 高风险
  -- 'critical' - 极高风险
  
  overall_risk_score DECIMAL(3,2) CHECK (overall_risk_score BETWEEN 0 AND 1),
  
  -- 分类风险评估
  risk_dimensions JSONB NOT NULL,
  -- {
  --   "scope_clarity": {"score": 0.8, "level": "low", "issues": []},
  --   "budget_adequacy": {"score": 0.6, "level": "medium", "issues": ["预算可能偏低"]},
  --   "timeline_feasibility": {"score": 0.5, "level": "high", "issues": ["工期过紧"]},
  --   "requirement_completeness": {"score": 0.7, "level": "medium", "issues": []},
  --   "skill_availability": {"score": 0.9, "level": "low", "issues": []}
  -- }
  
  -- 识别的风险列表
  identified_risks JSONB DEFAULT '[]',
  -- [
  --   {
  --     "risk_id": "R001",
  --     "category": "timeline",
  --     "severity": "high",
  --     "title": "工期过于紧张",
  --     "description": "2周内完成3个模块开发难度较大",
  --     "probability": 0.8,
  --     "impact": "任务可能延期或质量不达标",
  --     "mitigation": "建议延长工期至3-4周，或减少功能范围"
  --   }
  -- ]
  
  -- 缓解建议
  mitigation_suggestions TEXT[],
  
  -- 是否建议发布
  publish_recommendation VARCHAR(50) NOT NULL,
  -- 'safe_to_publish' - 可以安全发布
  -- 'caution_recommended' - 建议谨慎，但可发布
  -- 'revision_needed' - 建议修改后再发布
  -- 'high_risk_warning' - 高风险，强烈建议修改
  
  -- AI分析详情
  ai_analysis TEXT,
  confidence_level DECIMAL(3,2) CHECK (confidence_level BETWEEN 0 AND 1),
  
  -- 企业响应
  company_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  company_decision VARCHAR(50),
  -- 'proceed_anyway' - 仍然发布
  -- 'revise_task' - 修改任务
  -- 'cancel' - 取消发布
  
  company_notes TEXT,
  
  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW(),
  assessment_version INTEGER DEFAULT 1
);

CREATE INDEX idx_risk_assessments_task ON risk_assessments(task_id, assessment_version DESC);
CREATE INDEX idx_risk_assessments_level ON risk_assessments(overall_risk_level);
CREATE INDEX idx_risk_assessments_recommendation ON risk_assessments(publish_recommendation);

-- 风险类型定义表
CREATE TABLE IF NOT EXISTS risk_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_code VARCHAR(20) UNIQUE NOT NULL,
  category VARCHAR(50) NOT NULL,
  -- 'scope' - 需求范围
  -- 'budget' - 预算
  -- 'timeline' - 时间
  -- 'skill' - 技能要求
  -- 'communication' - 沟通
  -- 'quality' - 质量
  
  name VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- 检测规则（JSON）
  detection_rules JSONB,
  -- {
  --   "conditions": [
  --     {"field": "deadline_days", "operator": "<", "value": 7}
  --   ],
  --   "thresholds": {"low": 0.3, "medium": 0.5, "high": 0.7}
  -- }
  
  default_severity VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_risk_types_category ON risk_types(category) WHERE is_active = true;

-- 风险历史统计表
CREATE TABLE IF NOT EXISTS risk_history_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES users(id),
  
  -- 统计周期
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- 风险统计
  total_assessments INTEGER DEFAULT 0,
  high_risk_count INTEGER DEFAULT 0,
  medium_risk_count INTEGER DEFAULT 0,
  low_risk_count INTEGER DEFAULT 0,
  
  -- 最常见的风险类型
  common_risks JSONB DEFAULT '[]',
  
  -- 风险实际发生率
  risks_materialized INTEGER DEFAULT 0,
  accuracy_rate DECIMAL(3,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_company_period UNIQUE(company_id, period_start, period_end)
);

CREATE INDEX idx_risk_stats_company ON risk_history_stats(company_id, period_start DESC);

-- 初始化常见风险类型
INSERT INTO risk_types (id, risk_code, category, name, description, default_severity) VALUES
(gen_random_uuid(), 'R001', 'timeline', '工期过紧', '预计完成时间不足，可能导致延期', 'high'),
(gen_random_uuid(), 'R002', 'budget', '预算偏低', '预算低于市场平均价，可能难以吸引优质学生', 'medium'),
(gen_random_uuid(), 'R003', 'scope', '需求不明确', '任务描述模糊，缺少具体要求', 'high'),
(gen_random_uuid(), 'R004', 'skill', '技能要求过高', '要求的技能组合过于复杂，匹配学生少', 'medium'),
(gen_random_uuid(), 'R005', 'quality', '交付标准缺失', '未明确交付物的验收标准', 'medium'),
(gen_random_uuid(), 'R006', 'communication', '沟通期望不明', '未说明沟通频率和方式', 'low'),
(gen_random_uuid(), 'R007', 'scope', '需求范围过大', '任务范围过大，建议拆分', 'high'),
(gen_random_uuid(), 'R008', 'budget', '预算与工作量不匹配', '预算明显低于所需工作量', 'critical')
ON CONFLICT (risk_code) DO NOTHING;

-- 风险统计视图
CREATE OR REPLACE VIEW risk_overview AS
SELECT
  ra.task_id,
  t.title as task_title,
  t.company_id,
  ra.overall_risk_level,
  ra.overall_risk_score,
  ra.publish_recommendation,
  ra.company_acknowledged,
  ra.company_decision,
  jsonb_array_length(ra.identified_risks) as risk_count,
  ra.created_at as assessed_at
FROM risk_assessments ra
JOIN tasks t ON ra.task_id = t.id
ORDER BY ra.created_at DESC;

-- 触发器：风险评估后更新任务状态
CREATE OR REPLACE FUNCTION trigger_update_task_risk_status()
RETURNS trigger AS $$
BEGIN
  -- 如果是高风险或极高风险，标记任务
  IF NEW.overall_risk_level IN ('high', 'critical') THEN
    UPDATE tasks
    SET metadata = COALESCE(metadata, '{}'::jsonb) || 
                   jsonb_build_object('high_risk_flagged', true, 'risk_level', NEW.overall_risk_level)
    WHERE id = NEW.task_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_risk_update_task
AFTER INSERT ON risk_assessments
FOR EACH ROW
EXECUTE FUNCTION trigger_update_task_risk_status();

-- 注释
COMMENT ON TABLE risk_assessments IS 'E-03: 风险检测记录表，存储任务发布前的风险评估';
COMMENT ON TABLE risk_types IS 'E-03: 风险类型定义表，预定义常见风险及检测规则';
COMMENT ON TABLE risk_history_stats IS 'E-03: 风险历史统计表，追踪企业的风险历史';
COMMENT ON VIEW risk_overview IS 'E-03: 风险概览视图，快速查看任务风险状态';
