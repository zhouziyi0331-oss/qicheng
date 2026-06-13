-- E-22: 聊天AI超范围监测
-- 实时监测聊天内容，识别超出任务范围的请求

-- 聊天监测记录表
CREATE TABLE IF NOT EXISTS chat_scope_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),
  message_id UUID,  -- 关联聊天消息ID（如果有独立消息表）
  
  -- 发送方
  sender_id UUID NOT NULL REFERENCES users(id),
  sender_role VARCHAR(50) NOT NULL,  -- 'company', 'student'
  
  -- 消息内容
  message_content TEXT NOT NULL,
  
  -- 检测结果
  alert_type VARCHAR(50) NOT NULL,
  -- 'scope_creep' - 范围蔓延（加需求）
  -- 'private_deal' - 私下交易
  -- 'contact_request' - 索要联系方式
  -- 'inappropriate' - 不当内容
  -- 'deadline_change' - 修改截止日期
  -- 'price_negotiation' - 价格谈判
  
  severity VARCHAR(20) NOT NULL,  -- 'low', 'medium', 'high', 'critical'
  
  -- AI分析
  ai_analysis TEXT,
  confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
  
  -- 具体问题
  detected_issues JSONB DEFAULT '[]',
  -- [
  --   {"issue": "要求新增功能", "quote": "能不能再加个...", "severity": "high"},
  --   {"issue": "索要微信", "quote": "加个微信吧", "severity": "critical"}
  -- ]
  
  -- 建议
  suggested_response TEXT,
  prevention_tips TEXT[],
  
  -- 处理状态
  status VARCHAR(50) DEFAULT 'pending',
  -- 'pending' - 待处理
  -- 'acknowledged' - 已确认
  -- 'resolved' - 已解决
  -- 'dismissed' - 已忽略
  
  -- 用户响应
  user_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  user_action VARCHAR(50),  -- 'accepted', 'ignored', 'reported'
  
  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_chat_alerts_task ON chat_scope_alerts(task_id, created_at DESC);
CREATE INDEX idx_chat_alerts_sender ON chat_scope_alerts(sender_id);
CREATE INDEX idx_chat_alerts_type ON chat_scope_alerts(alert_type, severity);
CREATE INDEX idx_chat_alerts_status ON chat_scope_alerts(status) WHERE status = 'pending';

-- 监测规则配置表
CREATE TABLE IF NOT EXISTS scope_monitoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_code VARCHAR(50) UNIQUE NOT NULL,
  
  -- 规则信息
  alert_type VARCHAR(50) NOT NULL,
  rule_name VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- 检测关键词
  keywords TEXT[],
  patterns TEXT[],  -- 正则表达式模式
  
  -- 严重程度
  default_severity VARCHAR(20) NOT NULL,
  
  -- 建议响应
  suggested_response_template TEXT,
  prevention_tip TEXT,
  
  -- 规则状态
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  
  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_monitoring_rules_type ON scope_monitoring_rules(alert_type) WHERE is_active = true;
CREATE INDEX idx_monitoring_rules_priority ON scope_monitoring_rules(priority DESC) WHERE is_active = true;

-- 监测统计表
CREATE TABLE IF NOT EXISTS scope_monitoring_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),
  
  -- 统计数据
  total_alerts INTEGER DEFAULT 0,
  scope_creep_count INTEGER DEFAULT 0,
  private_deal_count INTEGER DEFAULT 0,
  contact_request_count INTEGER DEFAULT 0,
  
  -- 最近警报
  last_alert_at TIMESTAMPTZ,
  last_alert_type VARCHAR(50),
  
  -- 风险评分
  risk_score DECIMAL(3,2) DEFAULT 0,
  risk_level VARCHAR(20),  -- 'low', 'medium', 'high'
  
  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_task_stats UNIQUE(task_id)
);

CREATE INDEX idx_monitoring_stats_task ON scope_monitoring_stats(task_id);
CREATE INDEX idx_monitoring_stats_risk ON scope_monitoring_stats(risk_level) WHERE risk_level IN ('high', 'critical');

-- 初始化监测规则
INSERT INTO scope_monitoring_rules (id, rule_code, alert_type, rule_name, description, keywords, default_severity, suggested_response_template, prevention_tip) VALUES
(gen_random_uuid(), 'SCOPE_ADD_FEATURE', 'scope_creep', '新增功能需求', '检测要求增加原任务范围外的功能', ARRAY['再加个', '能不能加', '顺便做', '还想要', '另外做个'], 'medium', '感谢您的建议！不过这个功能不在原任务范围内。如果需要，我们可以创建新的任务。', '明确任务范围，额外需求需另行协商'),
(gen_random_uuid(), 'SCOPE_EXPAND', 'scope_creep', '扩大工作范围', '检测要求扩大原定工作范围', ARRAY['多做一些', '全部都', '所有的', '整个系统', '完整的'], 'high', '原任务的范围是[具体范围]。如需扩展，建议讨论新的预算和工期。', '在任务开始前明确边界'),
(gen_random_uuid(), 'PRIVATE_WECHAT', 'private_deal', '索要微信', '检测索要微信联系方式', ARRAY['微信', 'WeChat', '加个微信', '微信号'], 'critical', '为了保障双方权益，请通过平台聊天沟通。平台提供完整的交易保护。', '通过平台沟通，保障交易安全'),
(gen_random_uuid(), 'PRIVATE_PHONE', 'contact_request', '索要电话', '检测索要电话号码', ARRAY['电话', '手机号', '联系方式', '打个电话'], 'critical', '建议继续使用平台聊天。平台记录所有沟通，保护双方利益。', '避免线下交易风险'),
(gen_random_uuid(), 'PRIVATE_PAYMENT', 'private_deal', '私下交易', '检测私下付款意图', ARRAY['私下', '转账', '直接付', '线下给', '现金'], 'critical', '请务必通过平台托管付款。私下交易无法获得平台保障。', '使用平台托管，资金安全有保障'),
(gen_random_uuid(), 'DEADLINE_EXTEND', 'deadline_change', '延长工期', '检测延长截止日期的请求', ARRAY['延长', '多给点时间', '晚几天', '推迟', '宽限'], 'medium', '如需调整工期，请在任务详情中正式提交变更申请。', '工期变更需双方确认'),
(gen_random_uuid(), 'PRICE_LOWER', 'price_negotiation', '降低价格', '检测要求降价', ARRAY['便宜点', '降价', '少收点', '打折', '能不能少'], 'medium', '任务价格已在发布时确定。如有疑问，请参考任务详情。', '价格应在任务发布前商定'),
(gen_random_uuid(), 'INAPPROPRIATE', 'inappropriate', '不当内容', '检测不礼貌或不当言论', ARRAY['垃圾', '骗子', '差劲', '投诉', '举报'], 'high', '请保持专业沟通。如有问题，可联系平台客服协助。', '保持专业礼貌的沟通')
ON CONFLICT (rule_code) DO NOTHING;

-- 触发器：创建警报时更新统计
CREATE OR REPLACE FUNCTION trigger_update_monitoring_stats()
RETURNS trigger AS $$
BEGIN
  -- 更新或创建任务的监测统计
  INSERT INTO scope_monitoring_stats (id, task_id, total_alerts, last_alert_at, last_alert_type)
  VALUES (gen_random_uuid(), NEW.task_id, 1, NEW.created_at, NEW.alert_type)
  ON CONFLICT (task_id) DO UPDATE
  SET total_alerts = scope_monitoring_stats.total_alerts + 1,
      last_alert_at = NEW.created_at,
      last_alert_type = NEW.alert_type,
      updated_at = NOW();
  
  -- 更新具体类型计数
  IF NEW.alert_type = 'scope_creep' THEN
    UPDATE scope_monitoring_stats SET scope_creep_count = scope_creep_count + 1 WHERE task_id = NEW.task_id;
  ELSIF NEW.alert_type = 'private_deal' THEN
    UPDATE scope_monitoring_stats SET private_deal_count = private_deal_count + 1 WHERE task_id = NEW.task_id;
  ELSIF NEW.alert_type = 'contact_request' THEN
    UPDATE scope_monitoring_stats SET contact_request_count = contact_request_count + 1 WHERE task_id = NEW.task_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_chat_alert_update_stats
AFTER INSERT ON chat_scope_alerts
FOR EACH ROW
EXECUTE FUNCTION trigger_update_monitoring_stats();

-- 注释
COMMENT ON TABLE chat_scope_alerts IS 'E-22: 聊天监测警报表，记录超范围检测结果';
COMMENT ON TABLE scope_monitoring_rules IS 'E-22: 监测规则配置表，定义检测规则';
COMMENT ON TABLE scope_monitoring_stats IS 'E-22: 监测统计表，追踪任务的警报情况';
