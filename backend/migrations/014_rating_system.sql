-- 任务评价系统数据库迁移
-- 创建时间：2024年

-- 1. 创建评价表
CREATE TABLE IF NOT EXISTS task_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rater_type VARCHAR(20) NOT NULL CHECK (rater_type IN ('student', 'company')),
  ratee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ratee_type VARCHAR(20) NOT NULL CHECK (ratee_type IN ('student', 'company')),

  -- 评分（1-5星）
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),

  -- 学生评价企业的维度
  requirement_clarity INTEGER CHECK (requirement_clarity >= 1 AND requirement_clarity <= 5), -- 需求清晰度
  communication_quality INTEGER CHECK (communication_quality >= 1 AND communication_quality <= 5), -- 沟通质量
  payment_timeliness INTEGER CHECK (payment_timeliness >= 1 AND payment_timeliness <= 5), -- 付款及时性

  -- 企业评价学生的维度
  work_quality INTEGER CHECK (work_quality >= 1 AND work_quality <= 5), -- 作品质量
  delivery_timeliness INTEGER CHECK (delivery_timeliness >= 1 AND delivery_timeliness <= 5), -- 交付及时性
  professional_attitude INTEGER CHECK (professional_attitude >= 1 AND professional_attitude <= 5), -- 专业态度

  -- 文字评价
  comment TEXT,

  -- 标签（JSON数组）
  tags JSONB DEFAULT '[]',

  -- 是否匿名
  is_anonymous BOOLEAN DEFAULT false,

  -- 是否公开显示
  is_public BOOLEAN DEFAULT true,

  -- 企业回复（仅学生评价企业时）
  company_reply TEXT,
  company_reply_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- 确保每个任务每个用户只能评价一次
  UNIQUE(task_id, rater_id)
);

-- 2. 创建用户评分统计表
CREATE TABLE IF NOT EXISTS user_rating_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('student', 'company')),

  -- 总体统计
  total_ratings INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,

  -- 学生统计
  avg_work_quality DECIMAL(3,2) DEFAULT 0.00,
  avg_delivery_timeliness DECIMAL(3,2) DEFAULT 0.00,
  avg_professional_attitude DECIMAL(3,2) DEFAULT 0.00,

  -- 企业统计
  avg_requirement_clarity DECIMAL(3,2) DEFAULT 0.00,
  avg_communication_quality DECIMAL(3,2) DEFAULT 0.00,
  avg_payment_timeliness DECIMAL(3,2) DEFAULT 0.00,

  -- 星级分布
  five_star_count INTEGER DEFAULT 0,
  four_star_count INTEGER DEFAULT 0,
  three_star_count INTEGER DEFAULT 0,
  two_star_count INTEGER DEFAULT 0,
  one_star_count INTEGER DEFAULT 0,

  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 创建评价标签预设表
CREATE TABLE IF NOT EXISTS rating_tag_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_type VARCHAR(20) NOT NULL CHECK (tag_type IN ('student_positive', 'student_negative', 'company_positive', 'company_negative')),
  tag_name VARCHAR(50) NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. 插入预设标签
INSERT INTO rating_tag_presets (tag_type, tag_name, display_order) VALUES
-- 学生正面标签
('student_positive', '作品优秀', 1),
('student_positive', '交付及时', 2),
('student_positive', '沟通顺畅', 3),
('student_positive', '态度认真', 4),
('student_positive', '超出预期', 5),
('student_positive', '响应迅速', 6),
('student_positive', '专业能力强', 7),
('student_positive', '理解能力好', 8),

-- 学生负面标签
('student_negative', '交付延迟', 1),
('student_negative', '质量不达标', 2),
('student_negative', '沟通不畅', 3),
('student_negative', '态度消极', 4),
('student_negative', '理解偏差', 5),
('student_negative', '响应缓慢', 6),

-- 企业正面标签
('company_positive', '需求清晰', 1),
('company_positive', '付款及时', 2),
('company_positive', '沟通友好', 3),
('company_positive', '反馈及时', 4),
('company_positive', '尊重学生', 5),
('company_positive', '要求合理', 6),
('company_positive', '验收公正', 7),

-- 企业负面标签
('company_negative', '需求模糊', 1),
('company_negative', '付款延迟', 2),
('company_negative', '频繁改需求', 3),
('company_negative', '沟通困难', 4),
('company_negative', '要求过高', 5),
('company_negative', '验收苛刻', 6);

-- 5. 创建索引
CREATE INDEX idx_task_ratings_task_id ON task_ratings(task_id);
CREATE INDEX idx_task_ratings_rater_id ON task_ratings(rater_id);
CREATE INDEX idx_task_ratings_ratee_id ON task_ratings(ratee_id);
CREATE INDEX idx_task_ratings_overall_rating ON task_ratings(overall_rating);
CREATE INDEX idx_task_ratings_created_at ON task_ratings(created_at DESC);
CREATE INDEX idx_task_ratings_is_public ON task_ratings(is_public);

-- 6. 创建触发器：自动更新updated_at
CREATE OR REPLACE FUNCTION update_rating_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_task_ratings_updated_at
  BEFORE UPDATE ON task_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_rating_updated_at();

CREATE TRIGGER trigger_update_user_rating_stats_updated_at
  BEFORE UPDATE ON user_rating_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_rating_updated_at();

-- 7. 创建触发器：自动更新用户评分统计
CREATE OR REPLACE FUNCTION update_user_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_user_type VARCHAR(20);
BEGIN
  -- 确定被评价的用户
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    v_user_id := NEW.ratee_id;
    v_user_type := NEW.ratee_type;
  ELSIF TG_OP = 'DELETE' THEN
    v_user_id := OLD.ratee_id;
    v_user_type := OLD.ratee_type;
  END IF;

  -- 插入或更新统计记录
  INSERT INTO user_rating_stats (user_id, user_type)
  VALUES (v_user_id, v_user_type)
  ON CONFLICT (user_id) DO NOTHING;

  -- 重新计算统计数据
  UPDATE user_rating_stats
  SET
    total_ratings = (
      SELECT COUNT(*) FROM task_ratings WHERE ratee_id = v_user_id
    ),
    average_rating = (
      SELECT COALESCE(AVG(overall_rating), 0) FROM task_ratings WHERE ratee_id = v_user_id
    ),
    avg_work_quality = (
      SELECT COALESCE(AVG(work_quality), 0) FROM task_ratings WHERE ratee_id = v_user_id AND work_quality IS NOT NULL
    ),
    avg_delivery_timeliness = (
      SELECT COALESCE(AVG(delivery_timeliness), 0) FROM task_ratings WHERE ratee_id = v_user_id AND delivery_timeliness IS NOT NULL
    ),
    avg_professional_attitude = (
      SELECT COALESCE(AVG(professional_attitude), 0) FROM task_ratings WHERE ratee_id = v_user_id AND professional_attitude IS NOT NULL
    ),
    avg_requirement_clarity = (
      SELECT COALESCE(AVG(requirement_clarity), 0) FROM task_ratings WHERE ratee_id = v_user_id AND requirement_clarity IS NOT NULL
    ),
    avg_communication_quality = (
      SELECT COALESCE(AVG(communication_quality), 0) FROM task_ratings WHERE ratee_id = v_user_id AND communication_quality IS NOT NULL
    ),
    avg_payment_timeliness = (
      SELECT COALESCE(AVG(payment_timeliness), 0) FROM task_ratings WHERE ratee_id = v_user_id AND payment_timeliness IS NOT NULL
    ),
    five_star_count = (
      SELECT COUNT(*) FROM task_ratings WHERE ratee_id = v_user_id AND overall_rating = 5
    ),
    four_star_count = (
      SELECT COUNT(*) FROM task_ratings WHERE ratee_id = v_user_id AND overall_rating = 4
    ),
    three_star_count = (
      SELECT COUNT(*) FROM task_ratings WHERE ratee_id = v_user_id AND overall_rating = 3
    ),
    two_star_count = (
      SELECT COUNT(*) FROM task_ratings WHERE ratee_id = v_user_id AND overall_rating = 2
    ),
    one_star_count = (
      SELECT COUNT(*) FROM task_ratings WHERE ratee_id = v_user_id AND overall_rating = 1
    ),
    updated_at = CURRENT_TIMESTAMP
  WHERE user_id = v_user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_rating_stats_on_insert
  AFTER INSERT ON task_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_rating_stats();

CREATE TRIGGER trigger_update_user_rating_stats_on_update
  AFTER UPDATE ON task_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_rating_stats();

CREATE TRIGGER trigger_update_user_rating_stats_on_delete
  AFTER DELETE ON task_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_rating_stats();

-- 8. 在tasks表中添加评价状态字段
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS student_rated BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS company_rated BOOLEAN DEFAULT false;

-- 9. 创建评价提醒表
CREATE TABLE IF NOT EXISTS rating_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('student', 'company')),
  reminder_count INTEGER DEFAULT 0,
  last_reminded_at TIMESTAMP,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(task_id, user_id)
);

CREATE INDEX idx_rating_reminders_task_id ON rating_reminders(task_id);
CREATE INDEX idx_rating_reminders_user_id ON rating_reminders(user_id);
CREATE INDEX idx_rating_reminders_is_completed ON rating_reminders(is_completed);

COMMENT ON TABLE task_ratings IS '任务评价表';
COMMENT ON TABLE user_rating_stats IS '用户评分统计表';
COMMENT ON TABLE rating_tag_presets IS '评价标签预设表';
COMMENT ON TABLE rating_reminders IS '评价提醒表';
