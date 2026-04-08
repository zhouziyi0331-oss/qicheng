-- ============================================================
-- 启程产品重构 - 数据库迁移脚本 v11
-- 补充缺失功能：跳级测试、转包机制、管理后台、六维能力等
-- ============================================================

-- ============================================================
-- 01. 修改 users 表 - 添加 user_type 字段
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='users' AND column_name='user_type') THEN
    ALTER TABLE users ADD COLUMN user_type VARCHAR(16);
    COMMENT ON COLUMN users.user_type IS '用户类型：student/company，注册时必填且不可更改';
  END IF;
END $$;

-- ============================================================
-- 02. 修改 tasks 表 - 添加任务类型和转包相关字段
-- ============================================================
DO $$
BEGIN
  -- 添加 task_type 字段（normal/invitation）
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='tasks' AND column_name='publish_type') THEN
    ALTER TABLE tasks ADD COLUMN publish_type VARCHAR(16) DEFAULT 'normal';
    COMMENT ON COLUMN tasks.publish_type IS '发布类型：normal=普通匹配任务, invitation=邀请指定任务';
  END IF;

  -- 添加转包相关字段
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='tasks' AND column_name='is_subcontracted') THEN
    ALTER TABLE tasks ADD COLUMN is_subcontracted BOOLEAN DEFAULT FALSE;
    ALTER TABLE tasks ADD COLUMN parent_task_id UUID REFERENCES tasks(id);
    ALTER TABLE tasks ADD COLUMN original_student_id UUID REFERENCES users(id);
    COMMENT ON COLUMN tasks.is_subcontracted IS '是否为转包任务';
    COMMENT ON COLUMN tasks.parent_task_id IS '父任务ID（转包时）';
    COMMENT ON COLUMN tasks.original_student_id IS '原始接单学生ID（转包时）';
  END IF;
END $$;

-- ============================================================
-- 03. 修改 test_results 表 - 支持六维能力评分
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='test_results' AND column_name='d6_score') THEN
    ALTER TABLE test_results ADD COLUMN d6_score SMALLINT CHECK (d6_score BETWEEN 0 AND 100);
    COMMENT ON COLUMN test_results.d6_score IS 'D6维度评分：交付水平';
  END IF;
END $$;

-- ============================================================
-- 04. 跳级挑战测试表
-- ============================================================
CREATE TABLE IF NOT EXISTS level_challenge_tests (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id),
  current_level     SMALLINT NOT NULL CHECK (current_level BETWEEN 0 AND 5),
  target_level      SMALLINT NOT NULL CHECK (target_level BETWEEN 0 AND 5),
  track             track_type NOT NULL,

  -- 测试题目和答案
  questions_json    JSONB NOT NULL,                    -- 10题测试题目
  answers_json      JSONB NOT NULL,                    -- 学生答案

  -- AI评分
  ai_score          SMALLINT CHECK (ai_score BETWEEN 0 AND 100),
  ai_feedback       TEXT,                              -- AI详细反馈
  pass_threshold    SMALLINT NOT NULL DEFAULT 80,      -- 通过阈值
  is_passed         BOOLEAN,                           -- 是否通过

  -- 结果
  new_level         SMALLINT,                          -- 通过后的新等级
  failed_reason     TEXT,                              -- 失败原因
  retry_allowed_at  TIMESTAMPTZ,                       -- 允许重试时间（失败后7天）

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at      TIMESTAMPTZ,
  deleted_at        TIMESTAMPTZ,

  CONSTRAINT target_higher_than_current CHECK (target_level > current_level)
);

CREATE INDEX idx_challenge_user ON level_challenge_tests(user_id, created_at DESC);
CREATE INDEX idx_challenge_status ON level_challenge_tests(user_id, is_passed) WHERE is_passed IS NULL;

COMMENT ON TABLE level_challenge_tests IS '跳级挑战测试记录';

-- ============================================================
-- 05. 转包记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS task_subcontracts (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_task_id    UUID NOT NULL REFERENCES tasks(id),
  new_task_id         UUID NOT NULL REFERENCES tasks(id),
  original_student_id UUID NOT NULL REFERENCES users(id),
  new_student_id      UUID NOT NULL REFERENCES users(id),

  -- 转包原因
  reason              TEXT NOT NULL,                   -- 学生填写的转包原因
  ai_approved         BOOLEAN DEFAULT FALSE,           -- AI是否批准
  ai_feedback         TEXT,                            -- AI反馈

  -- 费用分配
  original_budget     NUMERIC(10,2) NOT NULL,          -- 原任务预算
  subcontract_budget  NUMERIC(10,2) NOT NULL,          -- 转包任务预算
  price_difference    NUMERIC(10,2) NOT NULL,          -- 差价（原学生获得）

  status              VARCHAR(16) NOT NULL DEFAULT 'pending', -- pending/approved/rejected/completed
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at         TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_subcontract_original ON task_subcontracts(original_student_id, created_at DESC);
CREATE INDEX idx_subcontract_new ON task_subcontracts(new_student_id, created_at DESC);

COMMENT ON TABLE task_subcontracts IS '任务转包记录';

-- ============================================================
-- 06. 管理员表
-- ============================================================
CREATE TABLE IF NOT EXISTS admins (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL UNIQUE REFERENCES users(id),
  admin_role      admin_role NOT NULL DEFAULT 'cs',    -- super/ops/cs
  permissions     JSONB NOT NULL DEFAULT '[]',         -- 权限列表
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deactivated_at  TIMESTAMPTZ,
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_admin_user ON admins(user_id);
CREATE INDEX idx_admin_role ON admins(admin_role, is_active);

COMMENT ON TABLE admins IS '管理员账号表';

-- ============================================================
-- 07. 六维能力历史记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS six_dim_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id),
  task_id         UUID REFERENCES tasks(id),

  -- 六维评分变化
  d1_before       SMALLINT NOT NULL,
  d1_after        SMALLINT NOT NULL,
  d2_before       SMALLINT NOT NULL,
  d2_after        SMALLINT NOT NULL,
  d3_before       SMALLINT NOT NULL,
  d3_after        SMALLINT NOT NULL,
  d4_before       SMALLINT NOT NULL,
  d4_after        SMALLINT NOT NULL,
  d5_before       SMALLINT NOT NULL,
  d5_after        SMALLINT NOT NULL,
  d6_before       SMALLINT NOT NULL,
  d6_after        SMALLINT NOT NULL,

  -- 变化原因
  change_reason   VARCHAR(64) NOT NULL,                -- task_completed/test_passed/manual_adjust
  change_detail   TEXT,                                -- 详细说明

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_six_dim_user ON six_dim_history(user_id, created_at DESC);
CREATE INDEX idx_six_dim_task ON six_dim_history(task_id);

COMMENT ON TABLE six_dim_history IS '六维能力变化历史记录';

-- ============================================================
-- 08. 任务审核队列表（管理后台）
-- ============================================================
CREATE TABLE IF NOT EXISTS task_review_queue (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id         UUID NOT NULL REFERENCES tasks(id),
  review_type     VARCHAR(32) NOT NULL,                -- content_check/price_check/quality_check
  priority        SMALLINT NOT NULL DEFAULT 5,         -- 1-10，数字越小优先级越高

  assigned_to     UUID REFERENCES users(id),           -- 分配给哪个管理员
  status          VARCHAR(16) NOT NULL DEFAULT 'pending', -- pending/in_review/approved/rejected

  review_notes    TEXT,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_review_queue_status ON task_review_queue(status, priority, created_at);
CREATE INDEX idx_review_queue_assigned ON task_review_queue(assigned_to, status);

COMMENT ON TABLE task_review_queue IS '任务审核队列（管理后台）';

-- ============================================================
-- 09. 学生黑名单表
-- ============================================================
CREATE TABLE IF NOT EXISTS student_blacklist (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID NOT NULL UNIQUE REFERENCES users(id),
  reason          TEXT NOT NULL,
  evidence        JSONB,                               -- 证据材料
  banned_by       UUID NOT NULL REFERENCES users(id), -- 操作管理员
  banned_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unban_at        TIMESTAMPTZ,                         -- 解封时间（NULL=永久）
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_blacklist_student ON student_blacklist(student_id, is_active);

COMMENT ON TABLE student_blacklist IS '学生黑名单';

-- ============================================================
-- 10. 企业黑名单表
-- ============================================================
CREATE TABLE IF NOT EXISTS company_blacklist (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID NOT NULL UNIQUE REFERENCES users(id),
  reason          TEXT NOT NULL,
  evidence        JSONB,                               -- 证据材料
  banned_by       UUID NOT NULL REFERENCES users(id), -- 操作管理员
  banned_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unban_at        TIMESTAMPTZ,                         -- 解封时间（NULL=永久）
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_company_blacklist ON company_blacklist(company_id, is_active);

COMMENT ON TABLE company_blacklist IS '企业黑名单';

-- ============================================================
-- 11. 系统配置表
-- ============================================================
CREATE TABLE IF NOT EXISTS system_configs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_key      VARCHAR(128) NOT NULL UNIQUE,
  config_value    JSONB NOT NULL,
  description     TEXT,
  updated_by      UUID REFERENCES users(id),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_config_key ON system_configs(config_key);

COMMENT ON TABLE system_configs IS '系统配置表（平台抽成比例、跳级阈值等）';

-- 插入默认配置
INSERT INTO system_configs (config_key, config_value, description) VALUES
  ('platform_fee_rate', '{"default": 0.20, "level_3_plus": 0.18, "level_5": 0.15}', '平台抽成比例'),
  ('challenge_pass_threshold', '{"default": 80}', '跳级测试通过阈值'),
  ('challenge_retry_days', '{"default": 7}', '跳级测试失败后重试等待天数'),
  ('subcontract_min_price_diff', '{"default": 50}', '转包最低差价（元）'),
  ('first_task_budget', '{"default": 100}', '首单任务预算（元）'),
  ('withdrawal_min_amount', '{"default": 10}', '最低提现金额（元）'),
  ('withdrawal_auto_limit', '{"default": 1000}', '自动提现上限（元）')
ON CONFLICT (config_key) DO NOTHING;

-- ============================================================
-- 12. 毕业发展建议报告表
-- ============================================================
CREATE TABLE IF NOT EXISTS graduation_reports (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id),

  -- 报告内容
  career_suggestions TEXT NOT NULL,                    -- 职业发展建议
  skill_analysis     JSONB NOT NULL,                   -- 技能分析
  growth_trajectory  JSONB NOT NULL,                   -- 成长轨迹
  recommended_paths  JSONB NOT NULL,                   -- 推荐发展路径

  -- 付费信息
  is_paid           BOOLEAN NOT NULL DEFAULT FALSE,
  paid_amount       NUMERIC(8,2),
  paid_at           TIMESTAMPTZ,
  payment_id        UUID REFERENCES payments(id),

  -- 生成信息
  status            report_status NOT NULL DEFAULT 'pending',
  ai_raw_response   TEXT,
  generated_at      TIMESTAMPTZ,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

CREATE INDEX idx_graduation_user ON graduation_reports(user_id, created_at DESC);

COMMENT ON TABLE graduation_reports IS '毕业发展建议报告（付费解锁）';

-- ============================================================
-- 13. 组队接单表
-- ============================================================
CREATE TABLE IF NOT EXISTS team_tasks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id         UUID NOT NULL REFERENCES tasks(id),
  team_leader_id  UUID NOT NULL REFERENCES users(id), -- 队长
  max_members     SMALLINT NOT NULL DEFAULT 3,         -- 最多3人
  current_members SMALLINT NOT NULL DEFAULT 1,

  status          VARCHAR(16) NOT NULL DEFAULT 'recruiting', -- recruiting/full/in_progress/completed
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_team_task ON team_tasks(task_id);
CREATE INDEX idx_team_leader ON team_tasks(team_leader_id);

COMMENT ON TABLE team_tasks IS '组队接单任务';

-- ============================================================
-- 14. 团队成员表
-- ============================================================
CREATE TABLE IF NOT EXISTS team_members (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_task_id    UUID NOT NULL REFERENCES team_tasks(id),
  student_id      UUID NOT NULL REFERENCES users(id),
  role            VARCHAR(32) NOT NULL DEFAULT 'member', -- leader/member
  contribution    SMALLINT CHECK (contribution BETWEEN 0 AND 100), -- 贡献度
  earnings_share  NUMERIC(10,2),                       -- 收益分配

  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at         TIMESTAMPTZ,
  deleted_at      TIMESTAMPTZ,

  CONSTRAINT unique_team_member UNIQUE (team_task_id, student_id)
);

CREATE INDEX idx_team_member_student ON team_members(student_id, joined_at DESC);

COMMENT ON TABLE team_members IS '团队成员表';

-- ============================================================
-- 15. AI任务拆解记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_task_breakdowns (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id         UUID NOT NULL REFERENCES tasks(id),
  student_id      UUID NOT NULL REFERENCES users(id),

  -- AI拆解结果
  breakdown_json  JSONB NOT NULL,                      -- 拆解步骤JSON
  estimated_time  INT,                                 -- 预计总时长（分钟）
  difficulty_level SMALLINT CHECK (difficulty_level BETWEEN 1 AND 5),
  required_tools  JSONB,                               -- 需要的工具列表

  -- AI分析
  ai_confidence   NUMERIC(3,2) CHECK (ai_confidence BETWEEN 0 AND 1),
  ai_raw_response TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_breakdown_task ON ai_task_breakdowns(task_id, student_id);

COMMENT ON TABLE ai_task_breakdowns IS 'AI任务拆解记录';

-- ============================================================
-- 完成迁移
-- ============================================================
COMMENT ON SCHEMA public IS '启程数据库 v11 - 产品重构完成';
