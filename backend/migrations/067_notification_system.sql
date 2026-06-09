-- ============================================
-- 消息提醒系统数据库设计
-- ============================================

-- 1. 通知消息表
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_type VARCHAR(20) NOT NULL, -- student, company, platform

  -- 消息类型
  type VARCHAR(50) NOT NULL, -- mentor_message, task_update, milestone, warning, recommendation
  category VARCHAR(50) NOT NULL, -- chat, progress, achievement, alert, system

  -- 消息内容
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  icon VARCHAR(50), -- 🐱, ⏰, 🎉, ⚠️, 💡

  -- 额外数据（按钮、链接等）
  data JSONB DEFAULT '{}',
  actions JSONB DEFAULT '[]', -- 按钮配置

  -- 优先级
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent

  -- 状态
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  is_dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMP,

  -- 推送渠道
  channels JSONB DEFAULT '["in_app"]', -- in_app, wechat, sms, email
  push_status JSONB DEFAULT '{}', -- 各渠道推送状态

  -- 关联信息
  related_task_id UUID REFERENCES tasks(id),
  related_user_id UUID REFERENCES users(id),
  related_entity_type VARCHAR(50),
  related_entity_id UUID,

  -- 时间
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  scheduled_at TIMESTAMP -- 定时推送
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type, created_at DESC);
CREATE INDEX idx_notifications_priority ON notifications(priority, created_at DESC);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_at) WHERE scheduled_at IS NOT NULL;

-- 2. 消息模板表
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key VARCHAR(100) UNIQUE NOT NULL,
  template_name VARCHAR(200) NOT NULL,

  -- 模板内容
  title_template VARCHAR(200) NOT NULL,
  content_template TEXT NOT NULL,
  icon VARCHAR(50),

  -- 模板配置
  user_type VARCHAR(20) NOT NULL, -- student, company, platform
  type VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal',

  -- 推送配置
  default_channels JSONB DEFAULT '["in_app"]',

  -- 按钮配置
  actions_template JSONB DEFAULT '[]',

  -- 变量说明
  variables JSONB DEFAULT '[]', -- 模板变量列表

  -- 状态
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notification_templates_key ON notification_templates(template_key);
CREATE INDEX idx_notification_templates_type ON notification_templates(user_type, type);

-- 3. 用户通知设置表
CREATE TABLE IF NOT EXISTS user_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- 通知开关
  in_app_enabled BOOLEAN DEFAULT true,
  wechat_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  email_enabled BOOLEAN DEFAULT false,

  -- 分类开关
  mentor_messages_enabled BOOLEAN DEFAULT true,
  task_updates_enabled BOOLEAN DEFAULT true,
  milestones_enabled BOOLEAN DEFAULT true,
  warnings_enabled BOOLEAN DEFAULT true,
  recommendations_enabled BOOLEAN DEFAULT true,

  -- 免打扰时段
  do_not_disturb_start TIME,
  do_not_disturb_end TIME,

  -- 频率限制
  max_notifications_per_day INTEGER DEFAULT 50,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_notification_settings_user ON user_notification_settings(user_id);

-- 4. 消息推送日志表
CREATE TABLE IF NOT EXISTS notification_push_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,

  -- 推送渠道
  channel VARCHAR(20) NOT NULL, -- in_app, wechat, sms, email

  -- 推送状态
  status VARCHAR(20) NOT NULL, -- pending, sent, delivered, failed

  -- 推送详情
  provider VARCHAR(50), -- 服务商（如阿里云、腾讯云）
  provider_message_id VARCHAR(200), -- 服务商消息ID

  -- 错误信息
  error_code VARCHAR(50),
  error_message TEXT,

  -- 时间
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  failed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notification_push_logs_notification ON notification_push_logs(notification_id);
CREATE INDEX idx_notification_push_logs_status ON notification_push_logs(status, created_at DESC);

-- 5. 消息统计表
CREATE TABLE IF NOT EXISTS notification_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date DATE NOT NULL,
  user_type VARCHAR(20) NOT NULL,

  -- 发送统计
  total_sent INTEGER DEFAULT 0,
  in_app_sent INTEGER DEFAULT 0,
  wechat_sent INTEGER DEFAULT 0,
  sms_sent INTEGER DEFAULT 0,
  email_sent INTEGER DEFAULT 0,

  -- 阅读统计
  total_read INTEGER DEFAULT 0,
  read_rate DECIMAL(5, 2),
  avg_read_time_seconds INTEGER,

  -- 交互统计
  total_clicked INTEGER DEFAULT 0,
  click_rate DECIMAL(5, 2),

  -- 分类统计
  mentor_messages INTEGER DEFAULT 0,
  task_updates INTEGER DEFAULT 0,
  milestones INTEGER DEFAULT 0,
  warnings INTEGER DEFAULT 0,
  recommendations INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(stat_date, user_type)
);

CREATE INDEX idx_notification_statistics_date ON notification_statistics(stat_date DESC);

-- 6. 插入默认通知模板

-- 学生端模板
INSERT INTO notification_templates (template_key, template_name, title_template, content_template, icon, user_type, type, category, priority, default_channels, actions_template, variables) VALUES

-- 导师消息
('student_mentor_care', '导师主动关心', '🐱 启程小猫', '嗨，我注意到你的任务【{{task_name}}】已经进行了{{days}}天，进度怎么样了？\n\n有什么困难吗？我可以帮你。', '🐱', 'student', 'mentor_message', 'chat', 'high', '["in_app", "wechat"]', '[{"key": "reply", "label": "回复导师", "type": "primary"}, {"key": "later", "label": "稍后再说", "type": "default"}]', '["task_name", "days"]'),

('student_mentor_relay', '导师转达企业消息', '🐱 启程小猫（转达）', '企业【{{company_name}}】发来消息：\n\n"{{company_message}}"\n\n我的建议：\n{{mentor_suggestion}}', '🐱', 'student', 'mentor_message', 'chat', 'high', '["in_app", "wechat"]', '[{"key": "view_detail", "label": "查看详情", "type": "primary"}, {"key": "reply", "label": "回复企业", "type": "default"}]', '["company_name", "company_message", "mentor_suggestion"]'),

('student_mentor_tool', '导师工具推荐', '🐱 启程小猫', '我看你在做{{task_type}}，推荐一个工具给你：\n\n{{tool_icon}} {{tool_name}}\n{{tool_description}}', '🐱', 'student', 'mentor_message', 'chat', 'normal', '["in_app"]', '[{"key": "check_tool", "label": "去看看", "type": "primary"}, {"key": "dismiss", "label": "不需要", "type": "default"}]', '["task_type", "tool_icon", "tool_name", "tool_description"]'),

-- 任务进度
('student_task_deadline', '任务即将超期', '⏰ 任务提醒', '你的任务【{{task_name}}】还有{{hours}}小时就要到期了！\n\n当前进度：{{progress}}\n预计还需：{{estimated_time}}\n\n建议：\n1. 申请延期（我帮你和企业沟通）\n2. 加快进度（我给你一些建议）', '⏰', 'student', 'task_update', 'progress', 'urgent', '["in_app", "wechat", "sms"]', '[{"key": "request_extension", "label": "申请延期", "type": "primary"}, {"key": "view_suggestions", "label": "查看建议", "type": "default"}]', '["task_name", "hours", "progress", "estimated_time"]'),

('student_company_urge', '企业催进度', '🐱 启程小猫', '企业问了一下进度，我帮你回复说你正在做，预计{{deadline}}能完成。\n\n能按时完成吗？如果有困难，我可以帮你申请延期。', '🐱', 'student', 'task_update', 'progress', 'high', '["in_app", "wechat"]', '[{"key": "confirm", "label": "没问题", "type": "primary"}, {"key": "need_extension", "label": "需要延期", "type": "default"}]', '["deadline"]'),

-- 成长里程碑
('student_first_task', '完成第一个任务', '🎉 恭喜你！', '你完成了第一个任务！\n\n🏆 解锁成就：【初出茅庐】\n\n企业评分：{{rating}}/5.0\n获得收入：¥{{income}}\n\n我看到你从一开始的不确定，到现在完成了整个任务。这个过程你学到了很多 :)', '🎉', 'student', 'milestone', 'achievement', 'normal', '["in_app"]', '[{"key": "view_report", "label": "查看成长报告", "type": "primary"}, {"key": "next_task", "label": "接下一个任务", "type": "default"}]', '["rating", "income"]'),

-- 情绪关怀
('student_emotion_care', '情绪关怀', '🐱 启程小猫', '嗨，我感觉你有点焦虑...\n\n是任务太难了，还是时间不够？\n\n要不要我们聊聊？我可以帮你分析一下，或者给你一些建议。', '🐱', 'student', 'mentor_message', 'chat', 'high', '["in_app"]', '[{"key": "chat", "label": "和导师聊聊", "type": "primary"}, {"key": "dismiss", "label": "我没事", "type": "default"}]', '[]');

-- 企业端模板
INSERT INTO notification_templates (template_key, template_name, title_template, content_template, icon, user_type, type, category, priority, default_channels, actions_template, variables) VALUES

-- 导师消息
('company_mentor_relay', '导师转达学生消息', '🐱 启程小猫（转达）', '学生【{{student_name}}】发来消息：\n\n"{{student_message}}"\n\n我的评估：\n- 功能完整度：{{completeness}}%\n- 设计质量：{{quality}}%\n- 符合需求：{{meets_requirements}}\n\n建议：{{mentor_suggestion}}', '🐱', 'company', 'mentor_message', 'chat', 'high', '["in_app", "wechat"]', '[{"key": "view_work", "label": "查看作品", "type": "primary"}, {"key": "feedback", "label": "反馈意见", "type": "default"}]', '["student_name", "student_message", "completeness", "quality", "meets_requirements", "mentor_suggestion"]'),

('company_mentor_suggestion', '导师建议调整需求', '🐱 启程小猫', '我注意到您提出了一个新需求：\n"{{new_requirement}}"\n\n这个功能比较复杂，建议：\n\n方案1：当前任务不变，新功能另开任务（+¥{{price1}}）\n\n方案2：合并到当前任务，但需延期{{days}}天，加价¥{{price2}}\n\n学生倾向：{{student_preference}}', '🐱', 'company', 'mentor_message', 'chat', 'high', '["in_app", "wechat"]', '[{"key": "option1", "label": "选择方案1", "type": "primary"}, {"key": "option2", "label": "选择方案2", "type": "default"}]', '["new_requirement", "price1", "days", "price2", "student_preference"]'),

-- 任务进度
('company_task_submitted', '学生提交作品', '✅ 任务更新', '学生【{{student_name}}】已提交作品\n\n任务：{{task_name}}\n提交时间：{{submit_time}}\n\nAI质量预审：\n- 功能完整：{{function_complete}}\n- 代码质量：{{code_quality}}\n- 设计规范：{{design_standard}}\n\n建议：{{suggestion}}', '✅', 'company', 'task_update', 'progress', 'high', '["in_app", "wechat"]', '[{"key": "accept", "label": "立即验收", "type": "primary"}, {"key": "view_detail", "label": "查看详情", "type": "default"}]', '["student_name", "task_name", "submit_time", "function_complete", "code_quality", "design_standard", "suggestion"]'),

('company_task_deadline', '任务即将超期', '⏰ 任务提醒', '任务【{{task_name}}】还有{{hours}}小时到期\n\n当前状态：{{status}}\n完成度：约{{progress}}%\n\n学生申请延期{{extension_days}}天，理由：\n"{{extension_reason}}"\n\n我的建议：\n{{mentor_suggestion}}', '⏰', 'company', 'task_update', 'progress', 'high', '["in_app", "wechat"]', '[{"key": "approve", "label": "同意延期", "type": "primary"}, {"key": "reject", "label": "拒绝", "type": "default"}, {"key": "negotiate", "label": "协商", "type": "default"}]', '["task_name", "hours", "status", "progress", "extension_days", "extension_reason", "mentor_suggestion"]'),

-- 学生推荐
('company_student_recommendation', '学生推荐', '🐱 启程小猫', '您的任务【{{task_name}}】已发布\n\n我为您推荐{{count}}位合适的学生：\n\n🥇 {{top_student_name}}（匹配度{{match_score}}%）\n   - 完成过{{completed_tasks}}个类似项目\n   - 平均评分{{rating}}/5.0\n   - {{highlight}}', '🐱', 'company', 'recommendation', 'system', 'normal', '["in_app"]', '[{"key": "invite", "label": "邀请{{top_student_name}}", "type": "primary"}, {"key": "view_more", "label": "查看更多", "type": "default"}]', '["task_name", "count", "top_student_name", "match_score", "completed_tasks", "rating", "highlight"]'),

-- 定价建议
('company_pricing_suggestion', '定价建议', '💡 定价建议', '您的任务定价：¥{{your_price}}\n\n我分析了类似任务：\n- 平均定价：¥{{avg_price}}\n- 您的定价偏{{deviation}}\n\n可能的影响：\n{{impact}}\n\n建议定价：¥{{suggested_min}}-{{suggested_max}}', '💡', 'company', 'recommendation', 'system', 'normal', '["in_app"]', '[{"key": "adjust", "label": "调整定价", "type": "primary"}, {"key": "keep", "label": "保持不变", "type": "default"}]', '["your_price", "avg_price", "deviation", "impact", "suggested_min", "suggested_max"]');

-- 平台端模板
INSERT INTO notification_templates (template_key, template_name, title_template, content_template, icon, user_type, type, category, priority, default_channels, actions_template, variables) VALUES

-- 异常预警
('platform_fraud_warning', '跳单风险预警', '⚠️ 风险预警', '检测到异常行为：\n\n学生：{{student_name}}\n企业：{{company_name}}\n任务：{{task_name}}\n\n异常内容：\n{{anomaly_description}}\n尝试次数：{{attempt_count}}次\n\n风险等级：{{risk_level}}\n\n建议操作：\n1. 人工介入沟通\n2. 加强监控', '⚠️', 'platform', 'warning', 'alert', 'high', '["in_app"]', '[{"key": "view_detail", "label": "查看详情", "type": "primary"}, {"key": "intervene", "label": "人工介入", "type": "default"}]', '["student_name", "company_name", "task_name", "anomaly_description", "attempt_count", "risk_level"]'),

('platform_fraud_critical', '刷单行为预警', '🚨 严重预警', '检测到疑似刷单：\n\n学生：{{student_name}}\n企业：{{company_name}}\n\n异常特征：\n{{anomaly_features}}\n\n风险等级：高\n\n建议操作：\n1. 立即冻结账户\n2. 人工审核', '🚨', 'platform', 'warning', 'alert', 'urgent', '["in_app", "wechat", "sms"]', '[{"key": "freeze", "label": "冻结账户", "type": "primary"}, {"key": "review", "label": "人工审核", "type": "default"}]', '["student_name", "company_name", "anomaly_features"]'),

-- 数据洞察
('platform_daily_report', '每日数据报告', '📊 今日数据', '今日数据（{{date}}）\n\n新增任务：{{new_tasks}}个 {{task_trend}}\n完成任务：{{completed_tasks}}个 {{completed_trend}}\n新增用户：{{new_users}}人 {{user_trend}}\n\n异常情况：\n{{anomalies}}\n\nAI建议：\n{{suggestions}}', '📊', 'platform', 'recommendation', 'system', 'normal', '["in_app"]', '[{"key": "view_detail", "label": "查看详情", "type": "primary"}, {"key": "execute", "label": "执行建议", "type": "default"}]', '["date", "new_tasks", "task_trend", "completed_tasks", "completed_trend", "new_users", "user_trend", "anomalies", "suggestions"]'),

-- 用户流失预警
('platform_user_churn', '用户流失预警', '🔔 用户流失预警', '学生【{{student_name}}】{{days}}天未登录\n\n用户画像：\n- 完成任务：{{completed_tasks}}个\n- 平均评分：{{rating}}/5.0\n- 累计收入：¥{{total_income}}\n- 用户等级：{{user_level}}\n\n流失原因预测：\n{{churn_reasons}}\n\nAI已执行：\n- 发送召回消息\n- 赠送优惠券', '🔔', 'platform', 'warning', 'alert', 'normal', '["in_app"]', '[{"key": "follow_up", "label": "人工跟进", "type": "primary"}, {"key": "dismiss", "label": "暂不处理", "type": "default"}]', '["student_name", "days", "completed_tasks", "rating", "total_income", "user_level", "churn_reasons"]');

-- 7. 创建函数：发送通知
CREATE OR REPLACE FUNCTION send_notification(
  p_user_id UUID,
  p_template_key VARCHAR(100),
  p_variables JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_template RECORD;
  v_notification_id UUID;
  v_title TEXT;
  v_content TEXT;
  v_key TEXT;
  v_value TEXT;
BEGIN
  -- 获取模板
  SELECT * INTO v_template FROM notification_templates
  WHERE template_key = p_template_key AND is_active = true;

  IF v_template IS NULL THEN
    RAISE EXCEPTION 'Template not found: %', p_template_key;
  END IF;

  -- 替换变量
  v_title := v_template.title_template;
  v_content := v_template.content_template;

  FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_variables)
  LOOP
    v_title := REPLACE(v_title, '{{' || v_key || '}}', v_value);
    v_content := REPLACE(v_content, '{{' || v_key || '}}', v_value);
  END LOOP;

  -- 创建通知
  INSERT INTO notifications (
    user_id, user_type, type, category, title, content, icon,
    data, actions, priority, channels
  ) VALUES (
    p_user_id, v_template.user_type, v_template.type, v_template.category,
    v_title, v_content, v_template.icon,
    p_variables, v_template.actions_template, v_template.priority,
    v_template.default_channels
  ) RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- 8. 创建函数：标记已读
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications
  SET is_read = true, read_at = NOW()
  WHERE id = p_notification_id AND is_read = false;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 9. 创建函数：批量标记已读
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET is_read = true, read_at = NOW()
  WHERE user_id = p_user_id AND is_read = false;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- 10. 创建视图：未读消息统计
CREATE OR REPLACE VIEW user_unread_notifications AS
SELECT
  user_id,
  user_type,
  COUNT(*) as unread_count,
  COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_count,
  COUNT(*) FILTER (WHERE priority = 'high') as high_count,
  COUNT(*) FILTER (WHERE category = 'chat') as chat_count,
  COUNT(*) FILTER (WHERE category = 'progress') as progress_count,
  COUNT(*) FILTER (WHERE category = 'achievement') as achievement_count,
  COUNT(*) FILTER (WHERE category = 'alert') as alert_count
FROM notifications
WHERE is_read = false AND (expires_at IS NULL OR expires_at > NOW())
GROUP BY user_id, user_type;

COMMENT ON TABLE notifications IS '通知消息表';
COMMENT ON TABLE notification_templates IS '消息模板表';
COMMENT ON TABLE user_notification_settings IS '用户通知设置表';
COMMENT ON TABLE notification_push_logs IS '消息推送日志表';
COMMENT ON TABLE notification_statistics IS '消息统计表';
COMMENT ON FUNCTION send_notification IS '发送通知（基于模板）';
COMMENT ON FUNCTION mark_notification_read IS '标记通知已读';
COMMENT ON FUNCTION mark_all_notifications_read IS '批量标记通知已读';
