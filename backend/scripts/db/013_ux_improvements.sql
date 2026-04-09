-- 用户体验改进相关表
-- 包括：草稿箱、申诉机制、风险提示、任务模板

-- 1. 草稿箱表
CREATE TABLE IF NOT EXISTS task_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  draft_type VARCHAR(20) NOT NULL, -- 'publish'(发布草稿) 或 'submit'(提交草稿)
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE, -- 提交草稿关联的任务ID
  content JSONB NOT NULL, -- 草稿内容（JSON格式）
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_task_drafts_user ON task_drafts(user_id, draft_type);
CREATE INDEX idx_task_drafts_task ON task_drafts(task_id);

-- 2. 申诉/纠纷处理表
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  initiator_id UUID NOT NULL REFERENCES users(id), -- 发起人（学生或企业）
  initiator_type VARCHAR(20) NOT NULL, -- 'student' 或 'company'
  dispute_type VARCHAR(50) NOT NULL, -- 'unfair_rejection'(不公平拒绝), 'payment_issue'(支付问题), 'requirement_change'(需求变更), 'other'
  description TEXT NOT NULL, -- 申诉描述
  evidence_urls TEXT[], -- 证据文件URL数组
  status VARCHAR(20) DEFAULT 'pending', -- 'pending'(待处理), 'investigating'(调查中), 'resolved'(已解决), 'rejected'(驳回)
  admin_response TEXT, -- 管理员回复
  resolution TEXT, -- 解决方案
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES users(id) -- 处理的管理员ID
);

CREATE INDEX idx_disputes_task ON disputes(task_id);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_initiator ON disputes(initiator_id);

-- 3. 任务模板表（企业端快速发布）
CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_name VARCHAR(100) NOT NULL, -- 模板名称
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT NOT NULL,
  budget_range VARCHAR(50), -- 预算范围（如"100-300"）
  level VARCHAR(20), -- 推荐等级
  track VARCHAR(10), -- 赛道
  tags TEXT[], -- 标签数组
  estimated_days INTEGER, -- 预计天数
  is_public BOOLEAN DEFAULT false, -- 是否公开（其他企业可用）
  use_count INTEGER DEFAULT 0, -- 使用次数
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_task_templates_company ON task_templates(company_id);
CREATE INDEX idx_task_templates_public ON task_templates(is_public);

-- 4. 风险提示记录表（记录用户已阅读的风险提示）
CREATE TABLE IF NOT EXISTS risk_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  risk_type VARCHAR(50) NOT NULL, -- 'first_task'(首次接单), 'high_budget'(高预算任务), 'tight_deadline'(紧急任务), 'complex_task'(复杂任务)
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_risk_ack_user ON risk_acknowledgments(user_id, risk_type);

-- 5. 任务追加需求表
CREATE TABLE IF NOT EXISTS task_amendments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES users(id),
  amendment_type VARCHAR(20) NOT NULL, -- 'extend_deadline'(延长时间), 'add_requirement'(追加需求), 'increase_budget'(增加预算)
  description TEXT NOT NULL, -- 追加说明
  original_deadline TIMESTAMP, -- 原截止时间
  new_deadline TIMESTAMP, -- 新截止时间
  original_budget DECIMAL(10, 2), -- 原预算
  new_budget DECIMAL(10, 2), -- 新预算
  status VARCHAR(20) DEFAULT 'pending', -- 'pending'(待学生确认), 'accepted'(学生接受), 'rejected'(学生拒绝)
  student_response TEXT, -- 学生回复
  created_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP
);

CREATE INDEX idx_task_amendments_task ON task_amendments(task_id);
CREATE INDEX idx_task_amendments_status ON task_amendments(status);

-- 6. AI智能定价建议缓存表
CREATE TABLE IF NOT EXISTS pricing_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_description TEXT NOT NULL,
  task_level VARCHAR(20),
  task_track VARCHAR(10),
  estimated_hours DECIMAL(5, 1), -- AI估算工时
  suggested_min_price DECIMAL(10, 2), -- 建议最低价
  suggested_max_price DECIMAL(10, 2), -- 建议最高价
  market_avg_price DECIMAL(10, 2), -- 市场平均价
  reasoning TEXT, -- AI推理过程
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '7 days' -- 7天后过期
);

CREATE INDEX idx_pricing_suggestions_expires ON pricing_suggestions(expires_at);

-- 7. 用户反馈表（收集产品改进建议）
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feedback_type VARCHAR(50) NOT NULL, -- 'bug'(问题反馈), 'feature'(功能建议), 'experience'(体验反馈)
  page_url VARCHAR(200), -- 反馈页面URL
  content TEXT NOT NULL,
  screenshots TEXT[], -- 截图URL数组
  contact_info VARCHAR(100), -- 联系方式（可选）
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'resolved', 'closed'
  admin_notes TEXT, -- 管理员备注
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_feedback_user ON user_feedback(user_id);
CREATE INDEX idx_user_feedback_status ON user_feedback(status);
CREATE INDEX idx_user_feedback_type ON user_feedback(feedback_type);

-- 添加注释
COMMENT ON TABLE task_drafts IS '草稿箱：自动保存用户填写的表单内容';
COMMENT ON TABLE disputes IS '申诉/纠纷处理：学生或企业对任务结果不满时发起申诉';
COMMENT ON TABLE task_templates IS '任务模板：企业可保存常用任务模板快速发布';
COMMENT ON TABLE risk_acknowledgments IS '风险提示确认：记录用户已阅读的风险提示';
COMMENT ON TABLE task_amendments IS '任务追加需求：企业可在任务进行中追加需求或延长时间';
COMMENT ON TABLE pricing_suggestions IS 'AI智能定价建议：帮助企业合理定价';
COMMENT ON TABLE user_feedback IS '用户反馈：收集产品改进建议';
