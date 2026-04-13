-- 031_ai_engine_system.sql
-- AI引擎系统

-- 1. AI需求确认对话表
CREATE TABLE IF NOT EXISTS ai_requirement_dialogues (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES users(id),
  task_draft_id INTEGER REFERENCES task_drafts(id), -- 关联草稿箱
  session_id VARCHAR(100) NOT NULL,              -- 对话会话ID
  message_type VARCHAR(20) NOT NULL,             -- user/assistant
  message_content TEXT NOT NULL,                 -- 消息内容
  extracted_info JSONB,                          -- AI提取的结构化信息
  confidence_score DECIMAL(3,2),                 -- 置信度
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. AI任务拆解记录表
CREATE TABLE IF NOT EXISTS ai_task_decompositions (
  id SERIAL PRIMARY KEY,
  parent_task_id INTEGER REFERENCES tasks(id),   -- 父任务ID
  original_description TEXT NOT NULL,            -- 原始任务描述
  decomposition_result JSONB NOT NULL,           -- 拆解结果
  subtask_count INTEGER NOT NULL,                -- 子任务数量
  estimated_total_hours INTEGER,                 -- 预估总工时
  ai_reasoning TEXT,                             -- AI拆解理由
  is_approved BOOLEAN DEFAULT FALSE,             -- 是否已批准
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 子任务表
CREATE TABLE IF NOT EXISTS subtasks (
  id SERIAL PRIMARY KEY,
  parent_task_id INTEGER NOT NULL REFERENCES tasks(id),
  decomposition_id INTEGER REFERENCES ai_task_decompositions(id),
  subtask_order INTEGER NOT NULL,                -- 子任务顺序
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  estimated_hours INTEGER,
  dependencies JSONB,                            -- 依赖的其他子任务ID
  status VARCHAR(20) DEFAULT 'pending',          -- pending/in_progress/completed
  assigned_student_id INTEGER REFERENCES users(id),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. AI任务审核记录表
CREATE TABLE IF NOT EXISTS ai_task_reviews (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id),
  review_type VARCHAR(20) NOT NULL,              -- initial/resubmit
  ai_review_result VARCHAR(20) NOT NULL,         -- approved/rejected/needs_human
  ai_score INTEGER,                              -- AI评分 (0-100)
  ai_feedback TEXT,                              -- AI反馈
  flagged_issues JSONB,                          -- 标记的问题
  human_review_required BOOLEAN DEFAULT FALSE,   -- 是否需要人工审核
  human_reviewer_id INTEGER REFERENCES users(id),
  human_review_result VARCHAR(20),               -- approved/rejected
  human_feedback TEXT,
  reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  human_reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. AI问答知识库表
CREATE TABLE IF NOT EXISTS ai_qa_knowledge_base (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL,                 -- task_related/platform_usage/payment/general
  question_pattern TEXT NOT NULL,                -- 问题模式（用于匹配）
  answer_template TEXT NOT NULL,                 -- 答案模板
  keywords JSONB,                                -- 关键词
  priority INTEGER DEFAULT 0,                    -- 优先级
  usage_count INTEGER DEFAULT 0,                 -- 使用次数
  helpful_count INTEGER DEFAULT 0,               -- 有帮助次数
  not_helpful_count INTEGER DEFAULT 0,           -- 无帮助次数
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. AI问答历史表
CREATE TABLE IF NOT EXISTS ai_qa_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  task_id INTEGER REFERENCES tasks(id),
  question TEXT NOT NULL,
  ai_answer TEXT,
  knowledge_base_id INTEGER REFERENCES ai_qa_knowledge_base(id),
  confidence_score DECIMAL(3,2),                 -- 置信度
  is_helpful BOOLEAN,                            -- 用户反馈
  forwarded_to_human BOOLEAN DEFAULT FALSE,      -- 是否转人工
  response_time_ms INTEGER,                      -- 响应时间（毫秒）
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. AI模型配置表
CREATE TABLE IF NOT EXISTS ai_model_configs (
  id SERIAL PRIMARY KEY,
  model_name VARCHAR(100) NOT NULL,              -- gpt-4/claude-3/etc
  model_type VARCHAR(50) NOT NULL,               -- requirement_analysis/task_decomposition/review/qa
  api_endpoint TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  model_parameters JSONB,                        -- 模型参数配置
  is_active BOOLEAN DEFAULT TRUE,
  daily_quota INTEGER,                           -- 每日配额
  used_today INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. AI使用统计表
CREATE TABLE IF NOT EXISTS ai_usage_stats (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  model_type VARCHAR(50) NOT NULL,
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER,
  total_tokens_used INTEGER DEFAULT 0,
  total_cost DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, model_type)
);

-- 索引
CREATE INDEX idx_ai_requirement_dialogues_company ON ai_requirement_dialogues(company_id);
CREATE INDEX idx_ai_requirement_dialogues_session ON ai_requirement_dialogues(session_id);
CREATE INDEX idx_ai_task_decompositions_parent ON ai_task_decompositions(parent_task_id);
CREATE INDEX idx_subtasks_parent ON subtasks(parent_task_id);
CREATE INDEX idx_subtasks_student ON subtasks(assigned_student_id);
CREATE INDEX idx_ai_task_reviews_task ON ai_task_reviews(task_id);
CREATE INDEX idx_ai_qa_history_user ON ai_qa_history(user_id);
CREATE INDEX idx_ai_qa_history_task ON ai_qa_history(task_id);
CREATE INDEX idx_ai_qa_knowledge_base_category ON ai_qa_knowledge_base(category);

-- 插入初始知识库数据
INSERT INTO ai_qa_knowledge_base (category, question_pattern, answer_template, keywords, priority) VALUES
('task_related', '任务要求|具体要求|需要什么', '根据任务描述，主要要求包括：{requirements}。建议您仔细阅读任务详情，如有疑问可以在沟通区向企业提问。', '["要求", "需求", "标准"]', 10),
('task_related', '时间|工期|多久完成', '该任务的预计完成时间为{duration}。请合理安排时间，确保按时提交。如遇特殊情况，请及时与企业沟通。', '["时间", "工期", "期限"]', 10),
('task_related', '报酬|费用|多少钱', '该任务的报酬为{payment}元。任务完成并通过验收后，款项将在7个工作日内结算到您的钱包。', '["报酬", "费用", "价格"]', 10),
('platform_usage', '如何接任务|怎么接单', '接任务的流程：1. 浏览任务大厅 2. 查看任务详情 3. 点击"接任务"按钮 4. 等待企业确认。建议选择匹配度高的任务，提高接单成功率。', '["接任务", "接单", "申请"]', 8),
('platform_usage', '如何提交|怎么交付', '提交作品的流程：1. 进入"我的任务" 2. 选择对应任务 3. 点击"提交作品" 4. 上传文件并填写说明 5. 等待企业验收。', '["提交", "交付", "上传"]', 8),
('payment', '提现|取钱|转账', '提现流程：1. 进入"钱包"页面 2. 点击"提现" 3. 输入金额和提现方式 4. 提交申请。提现最低金额10元，一般1-3个工作日到账。', '["提现", "取钱", "转账"]', 9),
('payment', '服务费|手续费|扣费', '平台收取15%的服务费，用于维护平台运营和提供技术支持。服务费在任务报酬结算时自动扣除。', '["服务费", "手续费", "扣费"]', 7),
('general', '联系客服|人工服务', '如需人工客服，请发送邮件至 support@qicheng.com 或在工作时间（9:00-18:00）拨打客服电话。我们会尽快为您解答。', '["客服", "人工", "联系"]', 5);

COMMENT ON TABLE ai_requirement_dialogues IS 'AI需求确认对话';
COMMENT ON TABLE ai_task_decompositions IS 'AI任务拆解记录';
COMMENT ON TABLE subtasks IS '子任务';
COMMENT ON TABLE ai_task_reviews IS 'AI任务审核记录';
COMMENT ON TABLE ai_qa_knowledge_base IS 'AI问答知识库';
COMMENT ON TABLE ai_qa_history IS 'AI问答历史';
COMMENT ON TABLE ai_model_configs IS 'AI模型配置';
COMMENT ON TABLE ai_usage_stats IS 'AI使用统计';
