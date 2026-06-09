-- 消息中转系统数据库迁移
-- 用于实现AI导师作为中间人，防止跳单

-- =====================================================
-- 1. 任务消息表（所有消息都经过AI中转）
-- =====================================================
CREATE TABLE IF NOT EXISTS task_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES users(id),
  to_user_id UUID NOT NULL REFERENCES users(id),

  -- 消息内容
  original_message TEXT NOT NULL,  -- 原始消息
  filtered_message TEXT NOT NULL,  -- 过滤后的消息（屏蔽联系方式）

  -- 审核状态
  is_filtered BOOLEAN DEFAULT false,  -- 是否被过滤
  is_optimized BOOLEAN DEFAULT false,  -- 是否被优化语气
  filter_reason TEXT,  -- 过滤原因

  -- 元数据
  message_type VARCHAR(50) DEFAULT 'text',  -- text, image, file
  read_at TIMESTAMP,  -- 已读时间

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_task_msg_task ON task_messages(task_id);
CREATE INDEX idx_task_msg_from ON task_messages(from_user_id);
CREATE INDEX idx_task_msg_to ON task_messages(to_user_id);
CREATE INDEX idx_task_msg_created ON task_messages(created_at DESC);

-- =====================================================
-- 2. 合作历史表（追踪学生和企业的合作次数）
-- =====================================================
CREATE TABLE IF NOT EXISTS collaboration_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  company_id UUID NOT NULL REFERENCES users(id),
  task_id UUID NOT NULL REFERENCES tasks(id),

  -- 时间
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,

  -- 评分
  student_rating INTEGER,  -- 企业给学生的评分 (1-5)
  company_rating INTEGER,  -- 学生给企业的评分 (1-5)

  -- 状态
  status VARCHAR(50) DEFAULT 'in_progress',  -- in_progress, completed, cancelled

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_task_collaboration UNIQUE(task_id)
);

CREATE INDEX idx_collab_student_company ON collaboration_history(student_id, company_id);
CREATE INDEX idx_collab_completed ON collaboration_history(completed_at);
CREATE INDEX idx_collab_status ON collaboration_history(status);

-- =====================================================
-- 3. 联系方式交换请求表（第3次合作后）
-- =====================================================
CREATE TABLE IF NOT EXISTS contact_exchange_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  company_id UUID NOT NULL REFERENCES users(id),
  task_id UUID NOT NULL REFERENCES tasks(id),  -- 触发交换的任务

  -- 双方意愿
  student_agreed BOOLEAN DEFAULT false,
  company_agreed BOOLEAN DEFAULT false,
  student_agreed_at TIMESTAMP,
  company_agreed_at TIMESTAMP,

  -- 交换状态
  exchanged BOOLEAN DEFAULT false,
  exchanged_at TIMESTAMP,

  -- 合作次数（触发时的次数）
  collaboration_count INTEGER NOT NULL,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_student_company_exchange UNIQUE(student_id, company_id)
);

CREATE INDEX idx_exchange_student_company ON contact_exchange_requests(student_id, company_id);
CREATE INDEX idx_exchange_status ON contact_exchange_requests(exchanged);

-- =====================================================
-- 4. 联系方式屏蔽日志表（记录所有屏蔽行为）
-- =====================================================
CREATE TABLE IF NOT EXISTS contact_filter_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES task_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),

  -- 检测到的联系方式
  detected_type VARCHAR(50) NOT NULL,  -- phone, wechat, qq, email, other
  detected_value TEXT NOT NULL,  -- 检测到的具体值

  -- 上下文
  original_text TEXT NOT NULL,  -- 原始文本片段
  filtered_text TEXT NOT NULL,  -- 过滤后的文本

  -- 合作次数（屏蔽时的次数）
  collaboration_count INTEGER NOT NULL,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_filter_log_message ON contact_filter_logs(message_id);
CREATE INDEX idx_filter_log_user ON contact_filter_logs(user_id);
CREATE INDEX idx_filter_log_type ON contact_filter_logs(detected_type);
CREATE INDEX idx_filter_log_created ON contact_filter_logs(created_at DESC);

-- =====================================================
-- 5. 语气优化日志表（记录AI优化语气的行为）
-- =====================================================
CREATE TABLE IF NOT EXISTS tone_optimization_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES task_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),

  -- 优化内容
  original_tone TEXT NOT NULL,  -- 原始语气
  optimized_tone TEXT NOT NULL,  -- 优化后的语气
  optimization_reason TEXT,  -- 优化原因

  -- AI调用信息
  model_used VARCHAR(50),
  tokens_used INTEGER,
  cost DECIMAL(10, 4),
  response_time_ms INTEGER,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tone_log_message ON tone_optimization_logs(message_id);
CREATE INDEX idx_tone_log_user ON tone_optimization_logs(user_id);
CREATE INDEX idx_tone_log_created ON tone_optimization_logs(created_at DESC);

-- =====================================================
-- 6. 扩展users表（存储联系方式）
-- =====================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS wechat VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS qq VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);

-- =====================================================
-- 7. 扩展tasks表（标记是否启用消息中转）
-- =====================================================
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS message_relay_enabled BOOLEAN DEFAULT true;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS total_messages INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS filtered_messages INTEGER DEFAULT 0;

-- =====================================================
-- 8. 创建视图：获取学生和企业的合作次数
-- =====================================================
CREATE OR REPLACE VIEW collaboration_counts AS
SELECT
  student_id,
  company_id,
  COUNT(*) as total_collaborations,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_collaborations,
  MAX(completed_at) as last_collaboration_date,
  AVG(student_rating) as avg_student_rating,
  AVG(company_rating) as avg_company_rating
FROM collaboration_history
GROUP BY student_id, company_id;

-- =====================================================
-- 9. 创建函数：获取合作次数
-- =====================================================
CREATE OR REPLACE FUNCTION get_collaboration_count(
  p_student_id UUID,
  p_company_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM collaboration_history
  WHERE student_id = p_student_id
    AND company_id = p_company_id
    AND status = 'completed';

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. 创建函数：检查是否可以交换联系方式
-- =====================================================
CREATE OR REPLACE FUNCTION can_exchange_contacts(
  p_student_id UUID,
  p_company_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
  v_already_exchanged BOOLEAN;
BEGIN
  -- 获取合作次数
  v_count := get_collaboration_count(p_student_id, p_company_id);

  -- 检查是否已经交换过
  SELECT exchanged INTO v_already_exchanged
  FROM contact_exchange_requests
  WHERE student_id = p_student_id
    AND company_id = p_company_id;

  -- 合作3次及以上，且未交换过
  RETURN v_count >= 3 AND (v_already_exchanged IS NULL OR v_already_exchanged = false);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 11. 创建触发器：任务完成时自动创建合作历史
-- =====================================================
CREATE OR REPLACE FUNCTION create_collaboration_history()
RETURNS TRIGGER AS $$
BEGIN
  -- 当任务状态变为completed时
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO collaboration_history (
      student_id,
      company_id,
      task_id,
      started_at,
      completed_at,
      status
    )
    SELECT
      NEW.student_id,
      NEW.company_id,
      NEW.id,
      NEW.accepted_at,
      NOW(),
      'completed'
    WHERE NOT EXISTS (
      SELECT 1 FROM collaboration_history WHERE task_id = NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_collaboration_history
AFTER UPDATE ON tasks
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION create_collaboration_history();

-- =====================================================
-- 12. 插入测试数据（可选，用于开发测试）
-- =====================================================
-- 注释掉，生产环境不需要

-- =====================================================
-- 完成
-- =====================================================
COMMENT ON TABLE task_messages IS '任务消息表 - 所有消息都经过AI中转';
COMMENT ON TABLE collaboration_history IS '合作历史表 - 追踪学生和企业的合作次数';
COMMENT ON TABLE contact_exchange_requests IS '联系方式交换请求表 - 第3次合作后可申请';
COMMENT ON TABLE contact_filter_logs IS '联系方式屏蔽日志表 - 记录所有屏蔽行为';
COMMENT ON TABLE tone_optimization_logs IS '语气优化日志表 - 记录AI优化语气的行为';
