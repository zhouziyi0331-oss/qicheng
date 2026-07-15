-- Phase 3.1: 引路人机制
-- 让学生可以成为新人的引路人，建立传承关系

-- 引路人关系表
CREATE TABLE IF NOT EXISTS mentor_relationships (
  id VARCHAR(255) PRIMARY KEY,
  mentor_student_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  mentee_student_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) DEFAULT 'guide', -- 'guide'(引路人), 'senior'(学长), 'peer'(同伴)
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'inactive'
  matched_reason TEXT, -- 匹配原因（相似OPC、同赛道、同学校等）
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_interaction_at TIMESTAMP,
  total_interactions INTEGER DEFAULT 0,
  mentee_growth_score INTEGER DEFAULT 0, -- 被引导者的成长分数
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(mentor_student_id, mentee_student_id)
);

-- 引路人互动记录表
CREATE TABLE IF NOT EXISTS mentor_interactions (
  id SERIAL PRIMARY KEY,
  relationship_id VARCHAR(255) NOT NULL REFERENCES mentor_relationships(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50) NOT NULL, -- 'message', 'advice', 'encouragement', 'resource_share'
  content TEXT,
  mentor_student_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  mentee_student_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  context JSONB, -- 互动上下文（任务ID、话题等）
  helpfulness_rating INTEGER CHECK (helpfulness_rating >= 1 AND helpfulness_rating <= 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 引路人资格表
CREATE TABLE IF NOT EXISTS mentor_qualifications (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE UNIQUE,
  is_qualified BOOLEAN DEFAULT false,
  qualification_level INTEGER DEFAULT 1 CHECK (qualification_level >= 1 AND qualification_level <= 5), -- 1-5星引路人
  total_mentees INTEGER DEFAULT 0, -- 总共引导过的人数
  active_mentees INTEGER DEFAULT 0, -- 当前活跃的mentee数量
  avg_mentee_satisfaction DECIMAL(3, 2), -- 平均满意度评分
  total_interactions INTEGER DEFAULT 0,
  badges JSONB, -- 获得的徽章 [{type, name, earned_at}]
  bio TEXT, -- 引路人自我介绍
  specialties TEXT[], -- 擅长领域
  available_slots INTEGER DEFAULT 3, -- 可用名额（防止一个人带太多）
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 引路人申请表
CREATE TABLE IF NOT EXISTS mentor_applications (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  application_reason TEXT NOT NULL,
  experience_summary TEXT, -- 经验总结
  completed_tasks_count INTEGER,
  current_level INTEGER,
  avg_rating DECIMAL(3, 2),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by VARCHAR(255) REFERENCES users(user_id),
  reviewed_at TIMESTAMP,
  review_note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_mentor_relationships_mentor ON mentor_relationships(mentor_student_id);
CREATE INDEX IF NOT EXISTS idx_mentor_relationships_mentee ON mentor_relationships(mentee_student_id);
CREATE INDEX IF NOT EXISTS idx_mentor_relationships_status ON mentor_relationships(status);
CREATE INDEX IF NOT EXISTS idx_mentor_interactions_relationship ON mentor_interactions(relationship_id);
CREATE INDEX IF NOT EXISTS idx_mentor_interactions_created_at ON mentor_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mentor_qualifications_qualified ON mentor_qualifications(is_qualified) WHERE is_qualified = true;
CREATE INDEX IF NOT EXISTS idx_mentor_qualifications_level ON mentor_qualifications(qualification_level DESC);
CREATE INDEX IF NOT EXISTS idx_mentor_applications_status ON mentor_applications(status);

-- 评论
COMMENT ON TABLE mentor_relationships IS '引路人-新人关系表';
COMMENT ON COLUMN mentor_relationships.relationship_type IS '关系类型：guide(引路人), senior(学长), peer(同伴)';
COMMENT ON COLUMN mentor_relationships.matched_reason IS '匹配原因（相似OPC、同赛道等）';
COMMENT ON COLUMN mentor_relationships.mentee_growth_score IS '被引导者的成长分数';

COMMENT ON TABLE mentor_interactions IS '引路人互动记录';
COMMENT ON COLUMN mentor_interactions.interaction_type IS '互动类型：message, advice, encouragement, resource_share';

COMMENT ON TABLE mentor_qualifications IS '引路人资格表';
COMMENT ON COLUMN mentor_qualifications.qualification_level IS '引路人等级 1-5星';
COMMENT ON COLUMN mentor_qualifications.available_slots IS '可用名额，防止一个人带太多';

COMMENT ON TABLE mentor_applications IS '引路人申请表';
