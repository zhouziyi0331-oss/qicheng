-- Migration: 添加学生端缺失的数据库表
-- 用途: 支持跳级测试、资产仪表盘、引路人机制、成长时间线功能

-- 1. 跳级测试记录表
CREATE TABLE IF NOT EXISTS level_skip_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_level SMALLINT NOT NULL,
  test_type VARCHAR(50) DEFAULT 'skip',
  questions JSONB NOT NULL,
  answers JSONB,
  score SMALLINT,
  passed BOOLEAN,
  taken_at TIMESTAMPTZ DEFAULT NOW(),
  result_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_level_skip_tests_student ON level_skip_tests(student_id);
CREATE INDEX IF NOT EXISTS idx_level_skip_tests_result ON level_skip_tests(student_id, passed);

-- 2. 跳级测试重试记录表
CREATE TABLE IF NOT EXISTS level_skip_attempts (
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_level SMALLINT NOT NULL,
  attempt_count INT DEFAULT 0,
  last_failed_at TIMESTAMPTZ,
  tasks_completed_since_failure INT DEFAULT 0,
  can_retry_after INT DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (student_id, target_level)
);

-- 3. 学生技能表
CREATE TABLE IF NOT EXISTS student_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_name VARCHAR(128) NOT NULL,
  skill_level SMALLINT DEFAULT 1,
  hourly_rate NUMERIC(10,2) DEFAULT 0,
  case_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_skills_student ON student_skills(student_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_skills_unique ON student_skills(student_id, skill_name);

-- 4. 学生经验表
CREATE TABLE IF NOT EXISTS student_experiences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain VARCHAR(128) NOT NULL,
  case_count INT DEFAULT 0,
  avg_rating NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_experiences_student ON student_experiences(student_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_experiences_unique ON student_experiences(student_id, domain);

-- 5. 邀请码表
CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(32) UNIQUE NOT NULL,
  mentor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_invite_codes_mentor ON invite_codes(mentor_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);

-- 6. 师徒关系表
CREATE TABLE IF NOT EXISTS mentor_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mentor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mentee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invite_code VARCHAR(32),
  mentee_first_order_completed BOOLEAN DEFAULT FALSE,
  reward_paid BOOLEAN DEFAULT FALSE,
  reward_amount NUMERIC(10,2) DEFAULT 50.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentor_relationships_mentor ON mentor_relationships(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_relationships_mentee ON mentor_relationships(mentee_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mentor_relationships_unique ON mentor_relationships(mentor_id, mentee_id);

-- 7. 学生等级升级历史表
CREATE TABLE IF NOT EXISTS student_level_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level_a SMALLINT NOT NULL DEFAULT 0,
  level_b SMALLINT NOT NULL DEFAULT 0,
  previous_level_a SMALLINT,
  previous_level_b SMALLINT,
  upgrade_reason VARCHAR(255),
  level_upgraded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_level_history_student ON student_level_history(student_id);
CREATE INDEX IF NOT EXISTS idx_student_level_history_time ON student_level_history(student_id, level_upgraded_at DESC);

-- 添加注释
COMMENT ON TABLE level_skip_tests IS '学生跳级测试记录表';
COMMENT ON TABLE level_skip_attempts IS '学生跳级测试重试限制表';
COMMENT ON TABLE student_skills IS '学生技能资产表';
COMMENT ON TABLE student_experiences IS '学生经验资产表';
COMMENT ON TABLE invite_codes IS '引路人邀请码表';
COMMENT ON TABLE mentor_relationships IS '师徒关系表';
COMMENT ON TABLE student_level_history IS '学生等级升级历史表';
