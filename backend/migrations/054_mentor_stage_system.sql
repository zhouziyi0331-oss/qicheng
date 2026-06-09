-- ============================================
-- AI导师4阶段系统
-- 创建时间: 2026-05-08
-- 描述: 实现需求理解、执行引导、质量审核、沟通桥梁4个阶段
-- ============================================

-- 1. 导师阶段会话表
CREATE TABLE IF NOT EXISTS mentor_stage_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 当前阶段
  current_stage VARCHAR(50) NOT NULL DEFAULT 'requirement_understanding',
  -- requirement_understanding, execution_guidance, quality_review, communication_bridge
  stage_status VARCHAR(50) NOT NULL DEFAULT 'in_progress',
  -- in_progress, completed, skipped

  -- 阶段1：需求理解
  requirement_understanding_score INTEGER CHECK (requirement_understanding_score >= 0 AND requirement_understanding_score <= 100),
  requirement_confirmed BOOLEAN DEFAULT false,
  product_framework TEXT,

  -- 阶段2：执行引导
  guidance_count INTEGER DEFAULT 0,
  encouragement_count INTEGER DEFAULT 0,
  tools_recommended JSONB DEFAULT '[]',

  -- 阶段3：质量审核
  pre_review_count INTEGER DEFAULT 0,
  pre_review_passed BOOLEAN DEFAULT false,
  final_review_score INTEGER CHECK (final_review_score >= 0 AND final_review_score <= 100),

  -- 阶段4：沟通桥梁
  translation_count INTEGER DEFAULT 0,
  communication_resolved BOOLEAN DEFAULT false,

  -- 统计
  total_messages INTEGER DEFAULT 0,
  total_tokens_used INTEGER DEFAULT 0,
  total_cost DECIMAL(10, 4) DEFAULT 0,

  -- 时间戳
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- 唯一约束：每个任务只有一个会话
  UNIQUE(task_id)
);

CREATE INDEX IF NOT EXISTS idx_mentor_stage_task ON mentor_stage_sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_mentor_stage_student ON mentor_stage_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_mentor_stage_current ON mentor_stage_sessions(current_stage);
CREATE INDEX IF NOT EXISTS idx_mentor_stage_status ON mentor_stage_sessions(stage_status);

COMMENT ON TABLE mentor_stage_sessions IS 'AI导师阶段会话表';
COMMENT ON COLUMN mentor_stage_sessions.current_stage IS '当前阶段：requirement_understanding, execution_guidance, quality_review, communication_bridge';
COMMENT ON COLUMN mentor_stage_sessions.requirement_understanding_score IS '需求理解准确度分数（0-100）';
COMMENT ON COLUMN mentor_stage_sessions.product_framework IS '生成的产品功能框架（PRD雏形）';

-- 2. 导师阶段消息表
CREATE TABLE IF NOT EXISTS mentor_stage_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES mentor_stage_sessions(id) ON DELETE CASCADE,
  stage VARCHAR(50) NOT NULL,

  role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'mentor', 'system')),
  content TEXT NOT NULL,

  -- AI调用信息
  model_used VARCHAR(50),
  tokens_used INTEGER,
  cost DECIMAL(10, 4),
  response_time_ms INTEGER,

  -- 元数据（存储额外信息，如准确度分数、工具推荐等）
  metadata JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stage_msg_session ON mentor_stage_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_stage_msg_created ON mentor_stage_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stage_msg_role ON mentor_stage_messages(role);

COMMENT ON TABLE mentor_stage_messages IS 'AI导师阶段消息表';
COMMENT ON COLUMN mentor_stage_messages.metadata IS '元数据（JSON格式），存储准确度分数、工具推荐、问题列表等';

-- 3. 导师Prompt模板表
CREATE TABLE IF NOT EXISTS mentor_prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage VARCHAR(50) NOT NULL,
  template_name VARCHAR(100) NOT NULL,
  -- default, initial, analysis, correction, encouragement, pre_check, translation, etc.

  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  variables JSONB,

  -- AI参数
  model_recommendation VARCHAR(20) DEFAULT 'sonnet' CHECK (model_recommendation IN ('opus', 'sonnet', 'haiku')),
  max_tokens INTEGER DEFAULT 2000,
  temperature DECIMAL(3, 2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 1),

  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prompt_stage_template ON mentor_prompt_templates(stage, template_name);
CREATE INDEX IF NOT EXISTS idx_prompt_active ON mentor_prompt_templates(is_active);

COMMENT ON TABLE mentor_prompt_templates IS 'AI导师Prompt模板表';
COMMENT ON COLUMN mentor_prompt_templates.template_name IS '模板名称：default, initial, analysis, correction, encouragement, pre_check, translation等';
COMMENT ON COLUMN mentor_prompt_templates.system_prompt IS '系统提示词（定义AI角色和行为）';
COMMENT ON COLUMN mentor_prompt_templates.user_prompt_template IS '用户提示词模板（包含变量占位符）';
COMMENT ON COLUMN mentor_prompt_templates.variables IS '模板变量说明（JSON格式）';
COMMENT ON COLUMN mentor_prompt_templates.model_recommendation IS '推荐使用的模型：opus, sonnet, haiku';

-- 4. 修改tasks表，添加导师相关字段
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS mentor_stage VARCHAR(50);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS mentor_enabled BOOLEAN DEFAULT true;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS auto_triggered BOOLEAN DEFAULT false;

COMMENT ON COLUMN tasks.mentor_stage IS '当前导师阶段';
COMMENT ON COLUMN tasks.mentor_enabled IS '是否启用AI导师';
COMMENT ON COLUMN tasks.auto_triggered IS '是否已自动触发导师';

-- 5. 修改task_deliverables表，添加预审相关字段
ALTER TABLE task_deliverables ADD COLUMN IF NOT EXISTS mentor_pre_reviewed BOOLEAN DEFAULT false;
ALTER TABLE task_deliverables ADD COLUMN IF NOT EXISTS pre_review_score INTEGER CHECK (pre_review_score >= 0 AND pre_review_score <= 100);
ALTER TABLE task_deliverables ADD COLUMN IF NOT EXISTS pre_review_feedback TEXT;
ALTER TABLE task_deliverables ADD COLUMN IF NOT EXISTS pre_review_passed BOOLEAN;
ALTER TABLE task_deliverables ADD COLUMN IF NOT EXISTS pre_review_issues JSONB;

COMMENT ON COLUMN task_deliverables.mentor_pre_reviewed IS '是否已进行导师预审';
COMMENT ON COLUMN task_deliverables.pre_review_score IS '预审分数（0-100）';
COMMENT ON COLUMN task_deliverables.pre_review_feedback IS '预审总体反馈';
COMMENT ON COLUMN task_deliverables.pre_review_passed IS '预审是否通过';
COMMENT ON COLUMN task_deliverables.pre_review_issues IS '预审问题列表（JSON格式）';

-- 6. 创建企业反馈翻译表
CREATE TABLE IF NOT EXISTS mentor_feedback_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  submission_id INTEGER REFERENCES task_deliverables(id) ON DELETE SET NULL,

  original_feedback TEXT NOT NULL,
  translated_feedback TEXT NOT NULL,
  translation_type VARCHAR(50) NOT NULL,
  -- rejection, revision_request, clarification

  from_user_id UUID NOT NULL REFERENCES users(id),
  to_user_id UUID NOT NULL REFERENCES users(id),

  student_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feedback_trans_task ON mentor_feedback_translations(task_id);
CREATE INDEX IF NOT EXISTS idx_feedback_trans_submission ON mentor_feedback_translations(submission_id);
CREATE INDEX IF NOT EXISTS idx_feedback_trans_to_user ON mentor_feedback_translations(to_user_id);

COMMENT ON TABLE mentor_feedback_translations IS '企业反馈翻译表';
COMMENT ON COLUMN mentor_feedback_translations.translation_type IS '翻译类型：rejection, revision_request, clarification';

-- 7. 创建视图：导师效果统计
CREATE OR REPLACE VIEW mentor_effectiveness_stats AS
SELECT
  DATE(mss.created_at) as date,
  mss.current_stage,
  COUNT(DISTINCT mss.student_id) as active_students,
  COUNT(DISTINCT mss.task_id) as tasks_guided,
  AVG(mss.requirement_understanding_score) as avg_understanding_score,
  AVG(mss.guidance_count) as avg_guidance_count,
  AVG(mss.pre_review_count) as avg_pre_review_count,
  SUM(mss.total_tokens_used) as total_tokens,
  SUM(mss.total_cost) as total_cost,
  COUNT(*) FILTER (WHERE mss.pre_review_passed = true) as pre_reviews_passed,
  COUNT(*) FILTER (WHERE mss.stage_status = 'completed') as stages_completed
FROM mentor_stage_sessions mss
GROUP BY DATE(mss.created_at), mss.current_stage;

COMMENT ON VIEW mentor_effectiveness_stats IS 'AI导师效果统计视图';

-- 8. 创建视图：学生导师互动效果
CREATE OR REPLACE VIEW student_mentor_effectiveness AS
SELECT
  u.id as user_id,
  u.nickname,
  COUNT(DISTINCT mss.task_id) as tasks_with_mentor,
  AVG(mss.requirement_understanding_score) as avg_understanding,
  AVG(mss.final_review_score) as avg_quality_score,
  SUM(mss.guidance_count) as total_guidance_received,
  SUM(mss.encouragement_count) as total_encouragements,
  SUM(mss.total_cost) as total_ai_cost,
  COUNT(*) FILTER (WHERE mss.pre_review_passed = true) as successful_pre_reviews
FROM users u
LEFT JOIN student_profiles sp ON u.id = sp.user_id
LEFT JOIN mentor_stage_sessions mss ON u.id = mss.student_id
WHERE u.role = 'student'
GROUP BY u.id, u.nickname;

COMMENT ON VIEW student_mentor_effectiveness IS '学生导师互动效果视图';

-- 9. 插入初始Prompt模板（阶段1：需求理解）
INSERT INTO mentor_prompt_templates (stage, scenario, prompt_template, variables, max_tokens, temperature) VALUES
('requirement_understanding', 'initial',
'你是启程小猫，一个温暖的AI导师。学生刚接了任务《{{taskTitle}}》。

任务描述：{{taskDescription}}
验收标准：{{acceptanceCriteria}}

你的目标：
1. 让学生用自己的话复述需求（不要直接告诉答案）
2. 评估学生理解的准确度（0-100分）
3. 如果理解有偏差，用启发式提问引导纠正
4. 理解准确后，生成产品功能框架（PRD雏形）

请用温暖、启发式的语气，问学生：你理解这个任务要做什么吗？用你自己的话说说看。

回复要求：
- 300-400字
- 包含开放式提问
- 不直接给答案
- 鼓励学生思考',
'{"taskTitle": "任务标题", "taskDescription": "任务描述", "acceptanceCriteria": "验收标准"}',
2000, 0.7);

INSERT INTO mentor_prompt_templates (stage, scenario, prompt_template, variables, max_tokens, temperature) VALUES
('requirement_understanding', 'analysis',
'学生的理解：{{studentResponse}}

原始需求：{{taskDescription}}
验收标准：{{acceptanceCriteria}}

请分析：
1. 学生理解的准确度（0-100分）
2. 理解正确的部分
3. 理解偏差的部分
4. 如果有偏差，如何用启发式提问引导纠正

返回JSON格式：
{
  "accuracyScore": 85,
  "correctParts": ["理解了核心功能", "明确了目标用户"],
  "deviations": ["对技术实现有误解"],
  "guidanceQuestion": "你提到要用XX技术，能说说为什么选择这个吗？",
  "needsCorrection": true,
  "encouragement": "你已经理解了核心部分，很棒！"
}',
'{"studentResponse": "学生的回复", "taskDescription": "任务描述", "acceptanceCriteria": "验收标准"}',
2000, 0.3);

INSERT INTO mentor_prompt_templates (stage, scenario, prompt_template, variables, max_tokens, temperature) VALUES
('requirement_understanding', 'framework_generation',
'基于学生的正确理解，生成产品功能框架（PRD雏形）：

任务：{{taskTitle}}
学生理解：{{studentUnderstanding}}
验收标准：{{acceptanceCriteria}}

生成简洁的功能框架（200-300字）：
1. 核心功能列表
2. 用户流程
3. 关键验收点

用Markdown格式，清晰易懂。',
'{"taskTitle": "任务标题", "studentUnderstanding": "学生理解", "acceptanceCriteria": "验收标准"}',
2500, 0.7);

-- 10. 插入初始Prompt模板（阶段2：执行引导）
INSERT INTO mentor_prompt_templates (stage, scenario, prompt_template, variables, max_tokens, temperature) VALUES
('execution_guidance', 'question_response',
'学生在执行任务《{{taskTitle}}》时遇到问题：

学生问题：{{studentQuestion}}
当前进度：{{currentProgress}}
已完成步骤：{{completedSteps}}

你的回复策略：
1. 不直接给答案，用启发式提问引导思考
2. 推荐1-2个相关工具或方法
3. 分解问题为小步骤
4. 给予鼓励和正向反馈

回复要求：
- 350-450字
- 包含：理解→引导→工具推荐→鼓励→开放式提问
- 温暖、支持的语气',
'{"taskTitle": "任务标题", "studentQuestion": "学生问题", "currentProgress": "当前进度", "completedSteps": "已完成步骤"}',
2000, 0.7);

INSERT INTO mentor_prompt_templates (stage, scenario, prompt_template, variables, max_tokens, temperature) VALUES
('execution_guidance', 'progress_feedback',
'学生更新了进度：

进度描述：{{progressDescription}}
已完成：{{completedSteps}}
任务总体进度：{{overallProgress}}%

请提供反馈：
1. 肯定已完成的部分（具体指出亮点）
2. 建议下一步行动
3. 预判可能的卡点，提前给予提示
4. 鼓励继续前进

回复要求：
- 300-400字
- 真诚的鼓励（不空洞）
- 具体的下一步建议',
'{"progressDescription": "进度描述", "completedSteps": "已完成步骤", "overallProgress": "总体进度百分比"}',
2000, 0.7);

-- 11. 插入初始Prompt模板（阶段3：质量审核）
INSERT INTO mentor_prompt_templates (stage, scenario, prompt_template, variables, max_tokens, temperature) VALUES
('quality_review', 'pre_check',
'学生准备提交作品，请进行预审：

任务要求：{{taskDescription}}
验收标准：{{acceptanceCriteria}}
学生提交描述：{{submissionDescription}}
附件：{{attachments}}

评估维度：
1. 功能完整性（是否满足所有验收标准）
2. 质量水平（是否达到企业期望）
3. 细节完善度（是否有明显疏漏）

返回JSON：
{
  "passed": true/false,
  "score": 85,
  "issues": [
    { "severity": "critical/warning/suggestion", "description": "...", "suggestion": "..." }
  ],
  "strengths": ["亮点1", "亮点2"],
  "overallFeedback": "总体评价...",
  "shouldSubmit": true/false
}

评分标准：
- 90-100: 优秀，可直接提交
- 80-89: 良好，建议小幅优化
- 70-79: 及格，需要改进
- <70: 不及格，必须修改',
'{"taskDescription": "任务描述", "acceptanceCriteria": "验收标准", "submissionDescription": "提交描述", "attachments": "附件列表"}',
3000, 0.3);

INSERT INTO mentor_prompt_templates (stage, scenario, prompt_template, variables, max_tokens, temperature) VALUES
('quality_review', 'improvement_guidance',
'预审未通过，引导学生改进：

问题列表：{{issues}}
当前得分：{{score}}

请提供改进指导：
1. 优先级排序（先改什么）
2. 每个问题的具体改进建议
3. 预计改进时间
4. 鼓励的话

回复要求：
- 400-500字
- 具体可操作
- 保持鼓励，不打击信心',
'{"issues": "问题列表", "score": "当前分数"}',
2000, 0.7);

-- 12. 插入初始Prompt模板（阶段4：沟通桥梁）
INSERT INTO mentor_prompt_templates (stage, scenario, prompt_template, variables, max_tokens, temperature) VALUES
('communication_bridge', 'translate_feedback',
'企业对学生的提交有反馈，请翻译：

企业原始反馈：{{companyFeedback}}
任务背景：{{taskContext}}
学生提交：{{submissionDescription}}

翻译策略：
1. 保留核心意见，但用建设性语言
2. 将批评转化为改进建议
3. 明确指出需要修改的具体内容
4. 给予鼓励，强调可以改进

翻译后的反馈（300-400字）：
- 理解企业的关注点
- 具体的修改建议
- 鼓励和支持',
'{"companyFeedback": "企业反馈", "taskContext": "任务背景", "submissionDescription": "学生提交描述"}',
2000, 0.7);

INSERT INTO mentor_prompt_templates (stage, scenario, prompt_template, variables, max_tokens, temperature) VALUES
('communication_bridge', 'clarify_requirements',
'学生对企业反馈有疑问：

企业反馈：{{companyFeedback}}
学生疑问：{{studentQuestion}}

请澄清：
1. 解释企业的真实意图
2. 提供具体的修改方向
3. 如果需要，建议学生如何向企业提问

回复要求：
- 250-350字
- 清晰、具体
- 帮助双方达成共识',
'{"companyFeedback": "企业反馈", "studentQuestion": "学生疑问"}',
2000, 0.7);

-- 完成
COMMENT ON TABLE mentor_stage_sessions IS 'AI导师4阶段系统 - 会话表';
COMMENT ON TABLE mentor_stage_messages IS 'AI导师4阶段系统 - 消息表';
COMMENT ON TABLE mentor_prompt_templates IS 'AI导师4阶段系统 - Prompt模板表';
