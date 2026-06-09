-- AI导师系统 SaaS化数据库迁移
-- 创建时间: 2024-01-15

-- 1. 租户表
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  api_key VARCHAR(255) UNIQUE NOT NULL,
  plan_type VARCHAR(50) DEFAULT 'free', -- free/basic/pro/enterprise
  monthly_quota INTEGER DEFAULT 10000, -- 每月Token配额
  used_tokens INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_api_key ON tenants(api_key);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- 插入默认租户（启程平台）
INSERT INTO tenants (id, name, api_key, plan_type, monthly_quota, status)
VALUES (
  'default',
  '启程平台',
  'qicheng_default_key_' || gen_random_uuid()::text,
  'enterprise',
  999999999,
  'active'
) ON CONFLICT (id) DO NOTHING;

-- 2. AI导师配置表
CREATE TABLE IF NOT EXISTS mentor_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  mentor_name VARCHAR(100) DEFAULT '启程小猫',
  mentor_avatar_url TEXT,
  personality_type VARCHAR(50) DEFAULT 'warm_guide', -- warm_guide/strict_coach/curious_friend
  response_length VARCHAR(50) DEFAULT 'medium', -- short(100-200)/medium(300-500)/long(500-800)
  ai_model VARCHAR(50) DEFAULT 'claude-3-5-sonnet-20241022',
  temperature DECIMAL(3,2) DEFAULT 0.7,
  system_prompt TEXT,
  custom_rules JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentor_configs_tenant ON mentor_configs(tenant_id);

-- 插入默认配置
INSERT INTO mentor_configs (tenant_id, mentor_name, personality_type, response_length, ai_model, temperature)
VALUES (
  'default',
  '启程小猫',
  'warm_guide',
  'medium',
  'claude-3-5-sonnet-20241022',
  0.7
) ON CONFLICT DO NOTHING;

-- 3. 对话会话表
CREATE TABLE IF NOT EXISTS mentor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  student_id VARCHAR(255) NOT NULL,
  task_id VARCHAR(255),
  context_data JSONB, -- 学生信息、任务信息等上下文
  status VARCHAR(50) DEFAULT 'active', -- active/completed/archived
  started_at TIMESTAMP DEFAULT NOW(),
  last_message_at TIMESTAMP DEFAULT NOW(),
  message_count INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentor_sessions_student ON mentor_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_mentor_sessions_task ON mentor_sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_mentor_sessions_tenant ON mentor_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mentor_sessions_status ON mentor_sessions(status);
CREATE INDEX IF NOT EXISTS idx_mentor_sessions_last_message ON mentor_sessions(last_message_at DESC);

-- 4. 对话消息表
CREATE TABLE IF NOT EXISTS mentor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES mentor_sessions(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- student/mentor/system
  content TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  response_time_ms INTEGER,
  detected_signals JSONB, -- 检测到的信号：热情火花、穿越感等
  ai_metadata JSONB, -- AI返回的元数据
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentor_messages_session ON mentor_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_mentor_messages_created ON mentor_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mentor_messages_role ON mentor_messages(role);

-- 5. 使用统计表
CREATE TABLE IF NOT EXISTS usage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_messages INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, date)
);

CREATE INDEX IF NOT EXISTS idx_usage_stats_tenant_date ON usage_stats(tenant_id, date DESC);

-- 6. 学生里程碑表（如果不存在）
CREATE TABLE IF NOT EXISTS student_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id VARCHAR(255) NOT NULL,
  milestone_type VARCHAR(50) NOT NULL, -- new_tool/passion_spark/flow_moment/stuck_point
  milestone_data JSONB,
  task_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_milestones_student ON student_milestones(student_id);
CREATE INDEX IF NOT EXISTS idx_student_milestones_type ON student_milestones(milestone_type);
CREATE INDEX IF NOT EXISTS idx_student_milestones_created ON student_milestones(created_at DESC);

-- 7. 学生档案表（如果不存在）
CREATE TABLE IF NOT EXISTS student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  opc_label VARCHAR(100),
  life_question TEXT,
  level INTEGER DEFAULT 0,
  task_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_student_profiles_user ON student_profiles(user_id);

-- 8. 创建视图：学生对话统计
CREATE OR REPLACE VIEW student_conversation_stats AS
SELECT
  ms.student_id,
  COUNT(DISTINCT ms.id) as total_sessions,
  COUNT(mm.id) as total_messages,
  SUM(ms.total_tokens) as total_tokens,
  COUNT(*) FILTER (WHERE mm.detected_signals->>'passionSpark' = 'true') as passion_sparks,
  COUNT(*) FILTER (WHERE mm.detected_signals->>'flowMoment' = 'true') as flow_moments,
  COUNT(*) FILTER (WHERE mm.detected_signals->>'stuckPoint' = 'true') as stuck_points,
  MAX(ms.last_message_at) as last_conversation_at
FROM mentor_sessions ms
LEFT JOIN mentor_messages mm ON ms.id = mm.session_id
GROUP BY ms.student_id;

-- 9. 创建函数：更新租户Token使用量
CREATE OR REPLACE FUNCTION update_tenant_token_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'mentor' AND NEW.tokens_used > 0 THEN
    UPDATE tenants
    SET used_tokens = used_tokens + NEW.tokens_used,
        updated_at = NOW()
    WHERE id = (
      SELECT tenant_id FROM mentor_sessions WHERE id = NEW.session_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_update_tenant_token_usage ON mentor_messages;
CREATE TRIGGER trigger_update_tenant_token_usage
AFTER INSERT ON mentor_messages
FOR EACH ROW
EXECUTE FUNCTION update_tenant_token_usage();

-- 10. 创建函数：自动归档旧会话
CREATE OR REPLACE FUNCTION archive_old_sessions()
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  UPDATE mentor_sessions
  SET status = 'archived',
      updated_at = NOW()
  WHERE status = 'active'
    AND last_message_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- 11. 创建每日统计聚合函数
CREATE OR REPLACE FUNCTION aggregate_daily_usage_stats(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO usage_stats (tenant_id, date, total_messages, total_tokens, total_sessions, avg_response_time_ms)
  SELECT
    ms.tenant_id,
    target_date,
    COUNT(mm.id) as total_messages,
    SUM(mm.tokens_used) as total_tokens,
    COUNT(DISTINCT ms.id) as total_sessions,
    AVG(mm.response_time_ms)::INTEGER as avg_response_time_ms
  FROM mentor_sessions ms
  LEFT JOIN mentor_messages mm ON ms.id = mm.session_id
  WHERE DATE(mm.created_at) = target_date
  GROUP BY ms.tenant_id
  ON CONFLICT (tenant_id, date)
  DO UPDATE SET
    total_messages = EXCLUDED.total_messages,
    total_tokens = EXCLUDED.total_tokens,
    total_sessions = EXCLUDED.total_sessions,
    avg_response_time_ms = EXCLUDED.avg_response_time_ms;
END;
$$ LANGUAGE plpgsql;

-- 12. 添加注释
COMMENT ON TABLE tenants IS 'AI导师系统租户表，支持多租户SaaS架构';
COMMENT ON TABLE mentor_configs IS 'AI导师配置表，每个租户可自定义导师行为';
COMMENT ON TABLE mentor_sessions IS '对话会话表，记录学生与AI导师的对话会话';
COMMENT ON TABLE mentor_messages IS '对话消息表，记录每条消息及检测到的信号';
COMMENT ON TABLE usage_stats IS '使用统计表，用于计费和分析';
COMMENT ON COLUMN mentor_messages.detected_signals IS 'JSON格式：{passionSpark, flowMoment, stuckPoint, lifeQuestionConnection}';
COMMENT ON COLUMN mentor_configs.personality_type IS 'warm_guide=温暖引导者, strict_coach=严格教练, curious_friend=好奇朋友';
COMMENT ON COLUMN mentor_configs.response_length IS 'short=100-200字, medium=300-500字, long=500-800字';

-- 完成
SELECT 'AI导师系统数据库迁移完成！' as status;
