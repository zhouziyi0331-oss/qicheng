-- E-21: AI审核报告透明化
-- AI自动审核交付物，生成结构化报告，企业驳回时AI转化为学生可执行的改进指引

-- AI审核报告表
CREATE TABLE IF NOT EXISTS ai_review_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),
  submission_id UUID,  -- 关联交付物提交记录
  
  -- 审核版本
  review_version INTEGER NOT NULL DEFAULT 1,
  
  -- 总体评分
  overall_score DECIMAL(3,2) CHECK (overall_score BETWEEN 0 AND 1),
  overall_grade VARCHAR(10),  -- 'A+', 'A', 'B+', 'B', 'C', 'D', 'F'
  
  -- 分项评分
  quality_scores JSONB NOT NULL,
  -- {
  --   "functionality": {"score": 0.9, "weight": 0.4, "feedback": "功能完整"},
  --   "code_quality": {"score": 0.8, "weight": 0.2, "feedback": "代码规范"},
  --   "documentation": {"score": 0.7, "weight": 0.15, "feedback": "文档清晰"},
  --   "ui_design": {"score": 0.85, "weight": 0.15, "feedback": "界面美观"},
  --   "performance": {"score": 0.75, "weight": 0.1, "feedback": "性能良好"}
  -- }
  
  -- 优点
  strengths TEXT[],
  
  -- 问题列表
  issues JSONB DEFAULT '[]',
  -- [
  --   {
  --     "severity": "critical",  // critical, major, minor
  --     "category": "functionality",
  --     "title": "登录功能无法使用",
  --     "description": "...",
  --     "location": "pages/login.tsx:45",
  --     "suggestion": "检查API调用是否正确"
  --   }
  -- ]
  
  -- 改进建议
  recommendations TEXT[],
  
  -- AI推荐结果
  ai_recommendation VARCHAR(50) NOT NULL,
  -- 'approve' - 推荐通过
  -- 'minor_revisions' - 建议小幅修改
  -- 'major_revisions' - 需要大幅修改
  -- 'reject' - 推荐拒绝
  
  confidence_level DECIMAL(3,2) CHECK (confidence_level BETWEEN 0 AND 1),
  
  -- AI分析详情
  ai_analysis TEXT,
  
  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by VARCHAR(50) DEFAULT 'ai',  -- 'ai', 'human', 'hybrid'
  
  CONSTRAINT unique_task_review_version UNIQUE(task_id, review_version)
);

CREATE INDEX idx_ai_review_task ON ai_review_reports(task_id, review_version DESC);
CREATE INDEX idx_ai_review_recommendation ON ai_review_reports(ai_recommendation);
CREATE INDEX idx_ai_review_score ON ai_review_reports(overall_score DESC);

-- AI改进指引表
CREATE TABLE IF NOT EXISTS ai_revision_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),
  review_report_id UUID REFERENCES ai_review_reports(id),
  
  -- 企业驳回原因（原始输入）
  rejection_reason TEXT NOT NULL,
  rejection_details JSONB,
  
  -- AI转化的改进指引
  guide_version INTEGER NOT NULL DEFAULT 1,
  
  -- 结构化的改进步骤
  revision_steps JSONB NOT NULL,
  -- [
  --   {
  --     "step": 1,
  --     "title": "修复登录功能",
  --     "description": "具体操作说明",
  --     "files_to_modify": ["pages/login.tsx"],
  --     "estimated_time": "30分钟",
  --     "priority": "high",
  --     "examples": ["代码示例"]
  --   }
  -- ]
  
  -- 验收检查清单
  verification_checklist JSONB DEFAULT '[]',
  -- [
  --   {"item": "登录功能正常", "category": "functionality", "required": true},
  --   {"item": "代码符合规范", "category": "quality", "required": false}
  -- ]
  
  -- 预计修改工作量
  estimated_hours DECIMAL(4,1),
  difficulty_level VARCHAR(20),  -- 'easy', 'medium', 'hard'
  
  -- 学生反馈
  student_viewed BOOLEAN DEFAULT false,
  viewed_at TIMESTAMPTZ,
  student_feedback TEXT,
  helpfulness_rating INTEGER CHECK (helpfulness_rating BETWEEN 1 AND 5),
  
  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_revision_guides_task ON ai_revision_guides(task_id, guide_version DESC);
CREATE INDEX idx_revision_guides_report ON ai_revision_guides(review_report_id);

-- 审核历史视图
CREATE OR REPLACE VIEW review_history_overview AS
SELECT
  t.id as task_id,
  t.title as task_title,
  COUNT(arr.id) as total_reviews,
  MAX(arr.review_version) as latest_version,
  MAX(arr.overall_score) as highest_score,
  AVG(arr.overall_score) as avg_score,
  MAX(arr.created_at) as last_reviewed_at,
  COUNT(arg.id) as revision_guides_count,
  AVG(arg.helpfulness_rating) as avg_guide_helpfulness
FROM tasks t
LEFT JOIN ai_review_reports arr ON t.id = arr.task_id
LEFT JOIN ai_revision_guides arg ON t.id = arg.task_id
GROUP BY t.id, t.title;

-- 问题统计视图（用于质量分析）
CREATE OR REPLACE VIEW issue_statistics AS
SELECT
  task_id,
  jsonb_array_elements(issues)->>'severity' as severity,
  jsonb_array_elements(issues)->>'category' as category,
  COUNT(*) as issue_count
FROM ai_review_reports
WHERE issues IS NOT NULL
GROUP BY task_id, severity, category;

-- 触发器：创建审核报告后自动更新任务状态
CREATE OR REPLACE FUNCTION trigger_update_task_on_review()
RETURNS trigger AS $$
BEGIN
  -- 如果AI推荐通过，自动标记任务为待企业最终验收
  IF NEW.ai_recommendation = 'approve' AND NEW.overall_score >= 0.8 THEN
    UPDATE tasks
    SET status = 'pending_final_review',
        updated_at = NOW()
    WHERE id = NEW.task_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_review_update_task
AFTER INSERT ON ai_review_reports
FOR EACH ROW
EXECUTE FUNCTION trigger_update_task_on_review();

-- 注释
COMMENT ON TABLE ai_review_reports IS 'E-21: AI审核报告表，存储AI对交付物的审核结果';
COMMENT ON TABLE ai_revision_guides IS 'E-21: AI改进指引表，将企业驳回转化为学生可执行的改进步骤';
COMMENT ON VIEW review_history_overview IS 'E-21: 审核历史概览，追踪任务的审核迭代过程';
COMMENT ON VIEW issue_statistics IS 'E-21: 问题统计视图，分析常见质量问题';
