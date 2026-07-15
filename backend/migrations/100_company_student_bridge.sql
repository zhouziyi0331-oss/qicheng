-- Phase 3.3: 企业-学生端打通
-- 让企业看到学生的成长，学生获得来自企业的认可

-- 学生成长通知给企业表
CREATE TABLE IF NOT EXISTS student_growth_notifications (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  company_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL, -- 'level_up', 'skill_breakthrough', 'achievement_unlock', 'project_completed'
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB, -- 额外数据（等级、技能名称、成就等）
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 企业对学生的声誉标签表
CREATE TABLE IF NOT EXISTS company_student_reputation_tags (
  id SERIAL PRIMARY KEY,
  company_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  student_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  tag_type VARCHAR(50) NOT NULL, -- 'strength'(优势), 'potential'(潜力), 'concern'(关注点)
  tag_name VARCHAR(100) NOT NULL, -- 标签名称
  tag_description TEXT, -- 标签说明
  evidence TEXT, -- 支撑证据（来自哪个项目）
  source_task_id VARCHAR(255) REFERENCES tasks(id) ON DELETE SET NULL, -- 来源任务
  confidence_score DECIMAL(3, 2), -- 置信度 0-1
  is_visible_to_student BOOLEAN DEFAULT true, -- 是否对学生可见
  created_by VARCHAR(255) REFERENCES users(user_id), -- 创建人
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 企业关注学生的成长订阅表
CREATE TABLE IF NOT EXISTS company_student_subscriptions (
  id SERIAL PRIMARY KEY,
  company_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  student_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  subscription_type VARCHAR(50) DEFAULT 'normal', -- 'normal'(普通关注), 'priority'(重点关注), 'potential'(潜力关注)
  notification_preferences JSONB, -- 通知偏好 {level_up: true, skill_breakthrough: true, ...}
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, student_id)
);

-- 学生成长里程碑表
CREATE TABLE IF NOT EXISTS student_growth_milestones (
  id VARCHAR(255) PRIMARY KEY,
  student_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  milestone_type VARCHAR(50) NOT NULL, -- 'level_up', 'task_count', 'earning_milestone', 'skill_mastery'
  milestone_name VARCHAR(200) NOT NULL,
  milestone_description TEXT,
  achieved_value INTEGER, -- 达成的值（等级、任务数、收入等）
  metadata JSONB, -- 额外信息
  achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notified_companies INTEGER DEFAULT 0 -- 已通知的企业数
);

-- 企业对学生的评价记录表（扩展版）
CREATE TABLE IF NOT EXISTS company_student_evaluations (
  id SERIAL PRIMARY KEY,
  company_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  student_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  task_id VARCHAR(255) REFERENCES tasks(id) ON DELETE SET NULL,
  evaluation_type VARCHAR(50) DEFAULT 'project_review', -- 'project_review', 'periodic_review', 'talent_assessment'
  overall_rating DECIMAL(3, 2), -- 总体评价 1-5
  strengths TEXT[], -- 优势列表
  improvements TEXT[], -- 改进建议列表
  future_collaboration_willingness INTEGER CHECK (future_collaboration_willingness >= 1 AND future_collaboration_willingness <= 5), -- 未来合作意愿 1-5
  detailed_feedback TEXT,
  is_visible_to_student BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_student_growth_notifications_student ON student_growth_notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_student_growth_notifications_company ON student_growth_notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_student_growth_notifications_type ON student_growth_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_student_growth_notifications_read ON student_growth_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_student_growth_notifications_created_at ON student_growth_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_company_student_reputation_tags_company ON company_student_reputation_tags(company_id);
CREATE INDEX IF NOT EXISTS idx_company_student_reputation_tags_student ON company_student_reputation_tags(student_id);
CREATE INDEX IF NOT EXISTS idx_company_student_reputation_tags_type ON company_student_reputation_tags(tag_type);
CREATE INDEX IF NOT EXISTS idx_company_student_reputation_tags_visible ON company_student_reputation_tags(is_visible_to_student);

CREATE INDEX IF NOT EXISTS idx_company_student_subscriptions_company ON company_student_subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_company_student_subscriptions_student ON company_student_subscriptions(student_id);
CREATE INDEX IF NOT EXISTS idx_company_student_subscriptions_type ON company_student_subscriptions(subscription_type);

CREATE INDEX IF NOT EXISTS idx_student_growth_milestones_student ON student_growth_milestones(student_id);
CREATE INDEX IF NOT EXISTS idx_student_growth_milestones_type ON student_growth_milestones(milestone_type);
CREATE INDEX IF NOT EXISTS idx_student_growth_milestones_achieved_at ON student_growth_milestones(achieved_at DESC);

CREATE INDEX IF NOT EXISTS idx_company_student_evaluations_company ON company_student_evaluations(company_id);
CREATE INDEX IF NOT EXISTS idx_company_student_evaluations_student ON company_student_evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_company_student_evaluations_task ON company_student_evaluations(task_id);

-- 评论
COMMENT ON TABLE student_growth_notifications IS '学生成长通知给企业，让企业看到学生的成长';
COMMENT ON COLUMN student_growth_notifications.notification_type IS '通知类型：level_up(升级), skill_breakthrough(技能突破), achievement_unlock(成就解锁), project_completed(项目完成)';

COMMENT ON TABLE company_student_reputation_tags IS '企业对学生的声誉标签，记录企业对学生的评价和印象';
COMMENT ON COLUMN company_student_reputation_tags.tag_type IS '标签类型：strength(优势), potential(潜力), concern(关注点)';
COMMENT ON COLUMN company_student_reputation_tags.is_visible_to_student IS '是否对学生可见（有些内部评价不公开）';

COMMENT ON TABLE company_student_subscriptions IS '企业关注学生的成长订阅';
COMMENT ON COLUMN company_student_subscriptions.subscription_type IS '订阅类型：normal(普通), priority(重点), potential(潜力)';

COMMENT ON TABLE student_growth_milestones IS '学生成长里程碑记录';
COMMENT ON COLUMN student_growth_milestones.milestone_type IS '里程碑类型：level_up, task_count, earning_milestone, skill_mastery';
COMMENT ON COLUMN student_growth_milestones.notified_companies IS '已通知的企业数量';

COMMENT ON TABLE company_student_evaluations IS '企业对学生的评价记录（扩展版）';
COMMENT ON COLUMN company_student_evaluations.evaluation_type IS '评价类型：project_review(项目评价), periodic_review(定期评价), talent_assessment(人才评估)';
