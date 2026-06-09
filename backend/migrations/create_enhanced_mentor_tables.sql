-- 启程小猫 - 增强版AI导师系统数据库表

-- 1. 需求确认会话表
CREATE TABLE IF NOT EXISTS requirement_confirmation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),
  student_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(50) NOT NULL DEFAULT 'in_progress', -- in_progress, confirmed, failed
  accuracy_score INTEGER, -- 学生理解准确度 0-100
  product_framework TEXT, -- AI生成的产品功能框架
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_req_confirm_task ON requirement_confirmation_sessions(task_id);
CREATE INDEX idx_req_confirm_student ON requirement_confirmation_sessions(student_id);

-- 2. AI提交审核表
CREATE TABLE IF NOT EXISTS ai_submission_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),
  student_id UUID NOT NULL REFERENCES users(id),
  submission_id UUID REFERENCES task_submissions(id),
  review_result JSONB NOT NULL, -- 完整的审核结果
  pass_review BOOLEAN NOT NULL, -- 是否通过审核
  score INTEGER NOT NULL, -- 评分 0-100
  issues JSONB, -- 问题列表
  strengths JSONB, -- 优点列表
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_review_task ON ai_submission_reviews(task_id);
CREATE INDEX idx_ai_review_student ON ai_submission_reviews(student_id);
CREATE INDEX idx_ai_review_pass ON ai_submission_reviews(pass_review);

-- 3. 任务沟通记录表（企业-学生双向沟通）
CREATE TABLE IF NOT EXISTS task_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),
  from_user_id UUID NOT NULL REFERENCES users(id),
  to_user_id UUID NOT NULL REFERENCES users(id),
  message TEXT NOT NULL, -- 原始消息
  translated_message TEXT, -- AI翻译后的消息
  message_type VARCHAR(50) NOT NULL, -- question, feedback, clarification
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_task_comm_task ON task_communications(task_id);
CREATE INDEX idx_task_comm_from ON task_communications(from_user_id);
CREATE INDEX idx_task_comm_to ON task_communications(to_user_id);

-- 4. 增强版导师对话表（扩展原有表）
ALTER TABLE mentor_conversations ADD COLUMN IF NOT EXISTS stage VARCHAR(50); -- requirement_confirmation, execution_guidance, quality_review, communication_bridge
ALTER TABLE mentor_conversations ADD COLUMN IF NOT EXISTS student_message TEXT; -- 学生的消息
ALTER TABLE mentor_conversations ADD COLUMN IF NOT EXISTS analysis_result JSONB; -- AI分析结果
ALTER TABLE mentor_conversations ADD COLUMN IF NOT EXISTS accuracy_score INTEGER; -- 准确度评分
ALTER TABLE mentor_conversations ADD COLUMN IF NOT EXISTS original_feedback TEXT; -- 原始反馈（用于翻译场景）

-- 5. 任务进度表（扩展）
ALTER TABLE task_progress ADD COLUMN IF NOT EXISTS help_requests INTEGER DEFAULT 0; -- 求助次数
ALTER TABLE task_progress ADD COLUMN IF NOT EXISTS ai_guidance_count INTEGER DEFAULT 0; -- AI引导次数
ALTER TABLE task_progress ADD COLUMN IF NOT EXISTS revision_count INTEGER DEFAULT 0; -- 修改次数

-- 6. 任务提交表（扩展）
ALTER TABLE task_submissions ADD COLUMN IF NOT EXISTS ai_review_passed BOOLEAN; -- AI审核是否通过
ALTER TABLE task_submissions ADD COLUMN IF NOT EXISTS ai_review_score INTEGER; -- AI审核评分
ALTER TABLE task_submissions ADD COLUMN IF NOT EXISTS ai_review_feedback TEXT; -- AI审核反馈

-- 7. 创建视图：AI导师工作台数据
CREATE OR REPLACE VIEW mentor_dashboard_stats AS
SELECT 
  DATE(mc.created_at) as date,
  COUNT(DISTINCT mc.student_id) as active_students,
  COUNT(*) as total_conversations,
  COUNT(*) FILTER (WHERE mc.stage = 'requirement_confirmation') as requirement_confirmations,
  COUNT(*) FILTER (WHERE mc.stage = 'execution_guidance') as guidance_sessions,
  COUNT(*) FILTER (WHERE mc.stage = 'quality_review') as quality_reviews,
  AVG(mc.accuracy_score) FILTER (WHERE mc.accuracy_score IS NOT NULL) as avg_accuracy,
  COUNT(DISTINCT mc.task_id) as tasks_with_guidance
FROM mentor_conversations mc
GROUP BY DATE(mc.created_at)
ORDER BY date DESC;

-- 8. 创建视图：学生AI导师互动统计
CREATE OR REPLACE VIEW student_mentor_stats AS
SELECT 
  s.user_id,
  s.nickname,
  s.opc_label,
  s.level,
  COUNT(DISTINCT mc.task_id) as tasks_with_mentor,
  COUNT(*) FILTER (WHERE mc.stage = 'execution_guidance') as help_requests,
  AVG(rcs.accuracy_score) as avg_understanding_accuracy,
  COUNT(DISTINCT asr.id) as submissions_reviewed,
  AVG(asr.score) FILTER (WHERE asr.pass_review = true) as avg_submission_score
FROM student_profiles s
LEFT JOIN mentor_conversations mc ON s.user_id = mc.student_id
LEFT JOIN requirement_confirmation_sessions rcs ON s.user_id = rcs.student_id
LEFT JOIN ai_submission_reviews asr ON s.user_id = asr.student_id
GROUP BY s.user_id, s.nickname, s.opc_label, s.level;

-- 9. 创建视图：任务AI导师介入情况
CREATE OR REPLACE VIEW task_mentor_involvement AS
SELECT 
  t.id as task_id,
  t.title,
  t.status,
  COUNT(DISTINCT mc.student_id) as students_with_guidance,
  COUNT(*) FILTER (WHERE mc.stage = 'requirement_confirmation') as requirement_checks,
  COUNT(*) FILTER (WHERE mc.stage = 'execution_guidance') as guidance_sessions,
  COUNT(*) FILTER (WHERE mc.stage = 'quality_review') as quality_reviews,
  AVG(rcs.accuracy_score) as avg_understanding_accuracy,
  COUNT(DISTINCT asr.id) as ai_reviews_count,
  COUNT(*) FILTER (WHERE asr.pass_review = true) as passed_reviews,
  COUNT(*) FILTER (WHERE asr.pass_review = false) as failed_reviews
FROM tasks t
LEFT JOIN mentor_conversations mc ON t.id = mc.task_id
LEFT JOIN requirement_confirmation_sessions rcs ON t.id = rcs.task_id
LEFT JOIN ai_submission_reviews asr ON t.id = asr.task_id
GROUP BY t.id, t.title, t.status;

COMMENT ON TABLE requirement_confirmation_sessions IS '需求确认会话 - 记录学生对任务需求的理解过程';
COMMENT ON TABLE ai_submission_reviews IS 'AI提交审核 - AI导师审核学生作品的记录';
COMMENT ON TABLE task_communications IS '任务沟通记录 - 企业和学生之间的双向沟通';
COMMENT ON VIEW mentor_dashboard_stats IS 'AI导师工作台统计数据';
COMMENT ON VIEW student_mentor_stats IS '学生与AI导师互动统计';
COMMENT ON VIEW task_mentor_involvement IS '任务AI导师介入情况统计';
