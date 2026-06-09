-- ============================================
-- 评价系统（双向评价+标签）
-- ============================================

-- 1. 评价标签库
CREATE TABLE IF NOT EXISTS rating_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 标签信息
  tag_name VARCHAR(50) NOT NULL UNIQUE,
  tag_category VARCHAR(50) NOT NULL, -- positive, negative, neutral
  applicable_to VARCHAR(20) NOT NULL, -- student, company, both

  -- 显示信息
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50), -- emoji或图标名称

  -- 统计
  usage_count INTEGER DEFAULT 0,

  -- 状态
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 插入预定义标签
INSERT INTO rating_tags (tag_name, tag_category, applicable_to, display_name, icon) VALUES
-- 学生正面标签
('professional', 'positive', 'student', '专业靠谱', '⭐'),
('fast_delivery', 'positive', 'student', '交付及时', '⚡'),
('high_quality', 'positive', 'student', '质量优秀', '💎'),
('good_communication', 'positive', 'student', '沟通顺畅', '💬'),
('creative', 'positive', 'student', '有创意', '💡'),
('responsible', 'positive', 'student', '责任心强', '🎯'),
('detail_oriented', 'positive', 'student', '注重细节', '🔍'),
('proactive', 'positive', 'student', '主动积极', '🚀'),

-- 学生负面标签
('slow_response', 'negative', 'student', '响应慢', '🐌'),
('poor_quality', 'negative', 'student', '质量不佳', '⚠️'),
('missed_deadline', 'negative', 'student', '延期交付', '⏰'),
('poor_communication', 'negative', 'student', '沟通不畅', '❌'),
('not_follow_requirements', 'negative', 'student', '未按要求', '📋'),

-- 企业正面标签
('clear_requirements', 'positive', 'company', '需求清晰', '📝'),
('prompt_payment', 'positive', 'company', '付款及时', '💰'),
('respectful', 'positive', 'company', '态度友好', '😊'),
('reasonable_expectations', 'positive', 'company', '要求合理', '✅'),
('good_feedback', 'positive', 'company', '反馈及时', '💬'),
('professional_company', 'positive', 'company', '专业企业', '🏢'),

-- 企业负面标签
('unclear_requirements', 'negative', 'company', '需求不清', '❓'),
('frequent_changes', 'negative', 'company', '频繁改需求', '🔄'),
('payment_delay', 'negative', 'company', '付款延迟', '⏳'),
('unreasonable_demands', 'negative', 'company', '要求过分', '⚠️'),
('poor_attitude', 'negative', 'company', '态度不佳', '😠');

CREATE INDEX idx_rating_tags_category ON rating_tags(tag_category);
CREATE INDEX idx_rating_tags_applicable ON rating_tags(applicable_to);

-- 2. 评价表（扩展现有ratings表）
-- 检查ratings表是否存在，如果不存在则创建
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

  -- 评价方和被评价方
  rater_id UUID NOT NULL REFERENCES users(id),
  rater_type VARCHAR(20) NOT NULL, -- student, company
  ratee_id UUID NOT NULL REFERENCES users(id),
  ratee_type VARCHAR(20) NOT NULL, -- student, company

  -- 评分
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),

  -- 评价内容
  comment TEXT,

  -- 是否匿名
  is_anonymous BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(task_id, rater_id, ratee_id)
);

-- 添加新字段到ratings表（如果不存在）
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS detailed_scores JSONB; -- 细分评分 {quality: 5, communication: 4, timeliness: 5}
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS edit_count INTEGER DEFAULT 0;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMP;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0; -- 有用数
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0; -- 举报数
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false; -- 是否已验证（真实合作）
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS response TEXT; -- 被评价方的回复
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS response_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_ratings_task ON ratings(task_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rater ON ratings(rater_id);
CREATE INDEX IF NOT EXISTS idx_ratings_ratee ON ratings(ratee_id);
CREATE INDEX IF NOT EXISTS idx_ratings_created ON ratings(created_at DESC);

-- 3. 评价标签关联表
CREATE TABLE IF NOT EXISTS rating_tag_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_id UUID NOT NULL REFERENCES ratings(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES rating_tags(id) ON DELETE CASCADE,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(rating_id, tag_id)
);

CREATE INDEX idx_rating_tag_relations_rating ON rating_tag_relations(rating_id);
CREATE INDEX idx_rating_tag_relations_tag ON rating_tag_relations(tag_id);

-- 4. 评价有用性记录表
CREATE TABLE IF NOT EXISTS rating_helpfulness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_id UUID NOT NULL REFERENCES ratings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),

  is_helpful BOOLEAN NOT NULL, -- true=有用, false=无用

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(rating_id, user_id)
);

CREATE INDEX idx_rating_helpfulness_rating ON rating_helpfulness(rating_id);

-- 5. 评价举报表
CREATE TABLE IF NOT EXISTS rating_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_id UUID NOT NULL REFERENCES ratings(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES users(id),

  -- 举报原因
  reason VARCHAR(50) NOT NULL, -- fake, offensive, spam, irrelevant
  description TEXT,

  -- 处理状态
  status VARCHAR(50) DEFAULT 'pending', -- pending, reviewing, resolved, rejected
  admin_note TEXT,
  handled_by UUID REFERENCES users(id),
  handled_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(rating_id, reporter_id)
);

CREATE INDEX idx_rating_reports_rating ON rating_reports(rating_id);
CREATE INDEX idx_rating_reports_status ON rating_reports(status);

-- 6. 用户评价统计表
CREATE TABLE IF NOT EXISTS user_rating_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  user_type VARCHAR(20) NOT NULL, -- student, company

  -- 总体统计
  total_ratings_received INTEGER DEFAULT 0,
  avg_rating DECIMAL(3, 2) DEFAULT 0,

  -- 分数分布
  rating_5_count INTEGER DEFAULT 0,
  rating_4_count INTEGER DEFAULT 0,
  rating_3_count INTEGER DEFAULT 0,
  rating_2_count INTEGER DEFAULT 0,
  rating_1_count INTEGER DEFAULT 0,

  -- 细分评分平均值
  avg_quality_score DECIMAL(3, 2),
  avg_communication_score DECIMAL(3, 2),
  avg_timeliness_score DECIMAL(3, 2),

  -- 标签统计（最常被打的标签）
  top_positive_tags JSONB DEFAULT '[]', -- [{tag_id, tag_name, count}]
  top_negative_tags JSONB DEFAULT '[]',

  -- 时间统计
  last_rating_received_at TIMESTAMP,

  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_rating_stats_user ON user_rating_stats(user_id);
CREATE INDEX idx_user_rating_stats_avg ON user_rating_stats(avg_rating DESC);

-- 7. 创建函数：更新用户评价统计
CREATE OR REPLACE FUNCTION update_user_rating_stats(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_user_type VARCHAR(20);
  v_stats RECORD;
BEGIN
  -- 获取用户类型
  SELECT role INTO v_user_type FROM users WHERE id = p_user_id;

  -- 计算统计数据
  SELECT
    COUNT(*) as total,
    AVG(rating) as avg_rating,
    COUNT(*) FILTER (WHERE rating = 5) as rating_5,
    COUNT(*) FILTER (WHERE rating = 4) as rating_4,
    COUNT(*) FILTER (WHERE rating = 3) as rating_3,
    COUNT(*) FILTER (WHERE rating = 2) as rating_2,
    COUNT(*) FILTER (WHERE rating = 1) as rating_1,
    AVG((detailed_scores->>'quality')::DECIMAL) as avg_quality,
    AVG((detailed_scores->>'communication')::DECIMAL) as avg_communication,
    AVG((detailed_scores->>'timeliness')::DECIMAL) as avg_timeliness,
    MAX(created_at) as last_rating
  INTO v_stats
  FROM ratings
  WHERE ratee_id = p_user_id;

  -- 获取最常见的正面标签（前5个）
  WITH positive_tags AS (
    SELECT
      rt.id as tag_id,
      rt.tag_name,
      rt.display_name,
      COUNT(*) as count
    FROM rating_tag_relations rtr
    JOIN rating_tags rt ON rtr.tag_id = rt.id
    JOIN ratings r ON rtr.rating_id = r.id
    WHERE r.ratee_id = p_user_id
      AND rt.tag_category = 'positive'
    GROUP BY rt.id, rt.tag_name, rt.display_name
    ORDER BY count DESC
    LIMIT 5
  ),
  negative_tags AS (
    SELECT
      rt.id as tag_id,
      rt.tag_name,
      rt.display_name,
      COUNT(*) as count
    FROM rating_tag_relations rtr
    JOIN rating_tags rt ON rtr.tag_id = rt.id
    JOIN ratings r ON rtr.rating_id = r.id
    WHERE r.ratee_id = p_user_id
      AND rt.tag_category = 'negative'
    GROUP BY rt.id, rt.tag_name, rt.display_name
    ORDER BY count DESC
    LIMIT 5
  )
  -- 插入或更新统计
  INSERT INTO user_rating_stats (
    user_id, user_type, total_ratings_received, avg_rating,
    rating_5_count, rating_4_count, rating_3_count, rating_2_count, rating_1_count,
    avg_quality_score, avg_communication_score, avg_timeliness_score,
    top_positive_tags, top_negative_tags, last_rating_received_at, updated_at
  ) VALUES (
    p_user_id, v_user_type, v_stats.total, v_stats.avg_rating,
    v_stats.rating_5, v_stats.rating_4, v_stats.rating_3, v_stats.rating_2, v_stats.rating_1,
    v_stats.avg_quality, v_stats.avg_communication, v_stats.avg_timeliness,
    (SELECT jsonb_agg(row_to_json(positive_tags)) FROM positive_tags),
    (SELECT jsonb_agg(row_to_json(negative_tags)) FROM negative_tags),
    v_stats.last_rating, NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_ratings_received = EXCLUDED.total_ratings_received,
    avg_rating = EXCLUDED.avg_rating,
    rating_5_count = EXCLUDED.rating_5_count,
    rating_4_count = EXCLUDED.rating_4_count,
    rating_3_count = EXCLUDED.rating_3_count,
    rating_2_count = EXCLUDED.rating_2_count,
    rating_1_count = EXCLUDED.rating_1_count,
    avg_quality_score = EXCLUDED.avg_quality_score,
    avg_communication_score = EXCLUDED.avg_communication_score,
    avg_timeliness_score = EXCLUDED.avg_timeliness_score,
    top_positive_tags = EXCLUDED.top_positive_tags,
    top_negative_tags = EXCLUDED.top_negative_tags,
    last_rating_received_at = EXCLUDED.last_rating_received_at,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 8. 创建触发器：评价创建/更新后自动更新统计
CREATE OR REPLACE FUNCTION trigger_update_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- 更新被评价方的统计
  PERFORM update_user_rating_stats(NEW.ratee_id);

  -- 更新标签使用次数
  IF TG_OP = 'INSERT' THEN
    UPDATE rating_tags
    SET usage_count = usage_count + 1
    WHERE id IN (
      SELECT tag_id FROM rating_tag_relations WHERE rating_id = NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_rating_stats_update
AFTER INSERT OR UPDATE ON ratings
FOR EACH ROW
EXECUTE FUNCTION trigger_update_rating_stats();

-- 9. 创建视图：评价详情（包含标签）
CREATE OR REPLACE VIEW rating_details AS
SELECT
  r.*,
  rater.username as rater_username,
  ratee.username as ratee_username,
  t.title as task_title,
  COALESCE(
    (SELECT jsonb_agg(jsonb_build_object(
      'tag_id', rt.id,
      'tag_name', rt.tag_name,
      'display_name', rt.display_name,
      'category', rt.tag_category,
      'icon', rt.icon
    ))
    FROM rating_tag_relations rtr
    JOIN rating_tags rt ON rtr.tag_id = rt.id
    WHERE rtr.rating_id = r.id),
    '[]'::jsonb
  ) as tags
FROM ratings r
JOIN users rater ON r.rater_id = rater.id
JOIN users ratee ON r.ratee_id = ratee.id
JOIN tasks t ON r.task_id = t.id;

-- 10. 创建函数：检查是否可以评价
CREATE OR REPLACE FUNCTION can_rate_task(
  p_task_id UUID,
  p_rater_id UUID,
  p_ratee_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_task RECORD;
  v_existing_rating INTEGER;
BEGIN
  -- 检查任务是否存在且已完成
  SELECT * INTO v_task FROM tasks WHERE id = p_task_id;

  IF v_task IS NULL THEN
    RETURN false;
  END IF;

  IF v_task.status != 'completed' THEN
    RETURN false;
  END IF;

  -- 检查评价方是否是任务参与者
  IF p_rater_id != v_task.company_id AND p_rater_id != v_task.accepted_student_id THEN
    RETURN false;
  END IF;

  -- 检查被评价方是否是任务参与者
  IF p_ratee_id != v_task.company_id AND p_ratee_id != v_task.accepted_student_id THEN
    RETURN false;
  END IF;

  -- 检查是否已经评价过
  SELECT COUNT(*) INTO v_existing_rating
  FROM ratings
  WHERE task_id = p_task_id
    AND rater_id = p_rater_id
    AND ratee_id = p_ratee_id;

  IF v_existing_rating > 0 THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE rating_tags IS '评价标签库 - 预定义的评价标签';
COMMENT ON TABLE rating_tag_relations IS '评价标签关联 - 评价与标签的多对多关系';
COMMENT ON TABLE rating_helpfulness IS '评价有用性 - 用户对评价的有用性投票';
COMMENT ON TABLE rating_reports IS '评价举报 - 用户举报不当评价';
COMMENT ON TABLE user_rating_stats IS '用户评价统计 - 汇总用户收到的所有评价';
COMMENT ON FUNCTION update_user_rating_stats IS '更新用户的评价统计数据';
COMMENT ON FUNCTION can_rate_task IS '检查用户是否可以对任务进行评价';
