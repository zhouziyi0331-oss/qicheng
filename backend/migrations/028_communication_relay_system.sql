-- 任务沟通中转系统
-- 功能：企业补充说明、学生问AI、联系方式屏蔽、平台邮件中转

-- 任务补充说明表（企业可以补充任务细节）
CREATE TABLE IF NOT EXISTS task_clarifications (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  company_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]', -- 附件列表 [{url, name, type}]
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_task_clarifications_task ON task_clarifications(task_id);
CREATE INDEX idx_task_clarifications_company ON task_clarifications(company_id);

-- 学生提问表（学生向AI或企业提问）
CREATE TABLE IF NOT EXISTS task_questions (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_type VARCHAR(20) NOT NULL DEFAULT 'ai', -- 'ai' | 'company'
  ai_answer TEXT, -- AI回答
  ai_confidence DECIMAL(3,2), -- AI置信度 0-1
  company_answer TEXT, -- 企业回答
  answered_by INTEGER REFERENCES users(id), -- 回答者ID
  answered_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending' | 'answered' | 'forwarded'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_task_questions_task ON task_questions(task_id);
CREATE INDEX idx_task_questions_student ON task_questions(student_id);
CREATE INDEX idx_task_questions_status ON task_questions(status);

-- 平台中转消息表（屏蔽双方联系方式）
CREATE TABLE IF NOT EXISTS relay_messages (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  original_content TEXT NOT NULL, -- 原始内容（包含可能的联系方式）
  filtered_keywords JSONB DEFAULT '[]', -- 被过滤的关键词
  attachments JSONB DEFAULT '[]',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_relay_messages_task ON relay_messages(task_id);
CREATE INDEX idx_relay_messages_sender ON relay_messages(sender_id);
CREATE INDEX idx_relay_messages_receiver ON relay_messages(receiver_id);
CREATE INDEX idx_relay_messages_read ON relay_messages(is_read);

-- 联系方式过滤规则表
CREATE TABLE IF NOT EXISTS contact_filter_rules (
  id SERIAL PRIMARY KEY,
  rule_type VARCHAR(20) NOT NULL, -- 'phone' | 'email' | 'wechat' | 'qq' | 'url'
  pattern TEXT NOT NULL, -- 正则表达式
  replacement TEXT DEFAULT '[已屏蔽]',
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0, -- 优先级，数字越大越优先
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认过滤规则
INSERT INTO contact_filter_rules (rule_type, pattern, replacement, priority) VALUES
('phone', '1[3-9]\d{9}', '[手机号已屏蔽]', 100),
('email', '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', '[邮箱已屏蔽]', 90),
('wechat', '(微信|WeChat|wx|VX)[：:]\s*[a-zA-Z0-9_-]+', '[微信号已屏蔽]', 80),
('qq', '[Qq]{2}[：:]\s*\d{5,12}', '[QQ号已屏蔽]', 80),
('url', 'https?://[^\s]+', '[链接已屏蔽]', 70);

-- AI问答知识库表（存储常见问题和答案）
CREATE TABLE IF NOT EXISTS ai_qa_knowledge (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL, -- 'task_requirement' | 'platform_rule' | 'payment' | 'technical'
  question_keywords TEXT[] NOT NULL, -- 问题关键词数组
  answer TEXT NOT NULL,
  confidence_threshold DECIMAL(3,2) DEFAULT 0.8, -- 置信度阈值
  usage_count INTEGER DEFAULT 0, -- 使用次数
  helpful_count INTEGER DEFAULT 0, -- 有帮助次数
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_qa_knowledge_category ON ai_qa_knowledge(category);

-- 插入一些默认的AI问答知识
INSERT INTO ai_qa_knowledge (category, question_keywords, answer, confidence_threshold) VALUES
('platform_rule', ARRAY['如何', '接任务', '流程'], '接任务流程：1. 浏览任务列表，查看匹配度 2. 点击"我要接单" 3. 等待企业确认 4. 确认后开始工作 5. 提交作品 6. 等待验收 7. 验收通过后获得报酬', 0.8),
('platform_rule', ARRAY['报酬', '多久', '到账', '结算'], '报酬结算规则：任务验收通过后，报酬会进入"待结算"状态，7天后自动转为"可提现"。您可以在钱包页面申请提现，最低提现金额10元。', 0.8),
('platform_rule', ARRAY['提现', '手续费', '多久'], '提现说明：平台抽成15%，提现到账时间1-3个工作日。支持微信和支付宝提现，单笔最低10元。', 0.8),
('task_requirement', ARRAY['任务', '要求', '不清楚', '不明白'], '如果任务要求不清楚，建议：1. 查看任务详情中的"补充说明" 2. 点击"向AI提问"获取智能解答 3. 如果AI无法解答，可以"转发给企业"，企业会在24小时内回复', 0.7),
('technical', ARRAY['软件', '工具', '推荐'], '根据任务类型，我们推荐：AI生图任务使用Midjourney/Stable Diffusion，AI视频使用Runway/Pika，AI编程使用Cursor/GitHub Copilot。具体工具选择请参考任务详情。', 0.7);

-- 消息转发记录表（记录哪些问题被转发给企业）
CREATE TABLE IF NOT EXISTS question_forwards (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES task_questions(id) ON DELETE CASCADE,
  forwarded_by INTEGER NOT NULL REFERENCES users(id), -- 转发者（通常是系统或学生）
  forwarded_to INTEGER NOT NULL REFERENCES users(id), -- 接收者（企业）
  reason TEXT, -- 转发原因
  forwarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_question_forwards_question ON question_forwards(question_id);

-- 更新时间触发器
CREATE OR REPLACE FUNCTION update_communication_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_task_clarifications_timestamp
  BEFORE UPDATE ON task_clarifications
  FOR EACH ROW
  EXECUTE FUNCTION update_communication_timestamp();

CREATE TRIGGER update_ai_qa_knowledge_timestamp
  BEFORE UPDATE ON ai_qa_knowledge
  FOR EACH ROW
  EXECUTE FUNCTION update_communication_timestamp();
