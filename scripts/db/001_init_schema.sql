-- ============================================================
-- 启程 (Qicheng) · 完整数据库 Schema v7.0
-- PostgreSQL 15+ · pgvector 扩展
-- 软删除: 所有表含 deleted_at · 不物理删除任何数据
-- ============================================================

-- 扩展已在 000_extensions.sql 中安装

-- ============================================================
-- ENUM 类型定义
-- ============================================================

CREATE TYPE user_role AS ENUM ('student', 'company');

CREATE TYPE task_status AS ENUM (
  'draft', 'pending_review', 'active', 'assigned',
  'in_progress', 'submitted', 'completed', 'cancelled'
);

CREATE TYPE assignment_status AS ENUM (
  'pending', 'accepted', 'rejected', 'expired', 'completed'
);

CREATE TYPE submission_status AS ENUM (
  'pending', 'approved', 'rejected'
);

CREATE TYPE payment_status AS ENUM (
  'pending', 'escrowed', 'settled', 'withdrawn', 'refunded', 'failed'
);

CREATE TYPE withdrawal_status AS ENUM (
  'pending', 'processing', 'done', 'failed'
);

CREATE TYPE withdrawal_method AS ENUM ('wechat', 'alipay');

CREATE TYPE report_type AS ENUM ('R1', 'R2', 'R3', 'R4', 'R5', 'full');

CREATE TYPE report_status AS ENUM ('pending', 'generating', 'done', 'failed');

CREATE TYPE track_type AS ENUM ('A', 'B', 'AB');

CREATE TYPE level_type AS ENUM ('0', '1', '2', '3', '4', '5');

CREATE TYPE emotion_signal_type AS ENUM (
  'excited', 'calm', 'frustrated', 'cooling', 'identified'
);

CREATE TYPE timeline_event_type AS ENUM (
  'journey_start', 'first_task_done', 'level_up',
  'comeback', 'graduated', 'task_completed', 'first_earnings'
);

CREATE TYPE notification_channel AS ENUM ('app', 'wechat', 'sms');

CREATE TYPE sender_type AS ENUM ('student', 'company', 'ai', 'system');

CREATE TYPE admin_role AS ENUM ('super', 'ops', 'cs');

CREATE TYPE onboarding_step AS ENUM (
  'J1_test_start', 'J2_test_done', 'J3_opc_label_shared',
  'J4_first_task_assigned', 'J5_task_accepted',
  'J6_ai_first_step_shown', 'J7_task_submitted', 'J8_earnings_received'
);

-- ============================================================
-- 01. users — 用户基础信息
-- ============================================================
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role          user_role NOT NULL,                -- 注册时锁定，不可更改
  phone         VARCHAR(20) UNIQUE NOT NULL,
  wechat_openid VARCHAR(128) UNIQUE,
  password_hash VARCHAR(255),
  nickname      VARCHAR(64),
  avatar_url    TEXT,
  university    VARCHAR(128),
  city          VARCHAR(64),
  major         VARCHAR(128),
  grade         VARCHAR(32),
  source_channel VARCHAR(64),                      -- 来源渠道: scan/share/direct
  device_type   VARCHAR(16),                       -- ios/android
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  deleted_at    TIMESTAMPTZ,
  CONSTRAINT role_immutable CHECK (role IN ('student', 'company'))
);

-- ============================================================
-- 02. student_profiles — 学生能力档案
-- ============================================================
CREATE TABLE student_profiles (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id),
  track             track_type NOT NULL DEFAULT 'A',
  level_a           SMALLINT NOT NULL DEFAULT 0 CHECK (level_a BETWEEN 0 AND 5),
  level_b           SMALLINT NOT NULL DEFAULT 0 CHECK (level_b BETWEEN 0 AND 5),
  opc_label         VARCHAR(128),                  -- e.g. "隐藏的创作型执行者"
  opc_label_secondary VARCHAR(128),
  six_dim_scores    JSONB NOT NULL DEFAULT '{"d1":0,"d2":0,"d3":0,"d4":0,"d5":0,"d6":0}',
  -- d1:专业技能, d2:执行力, d3:新工具上手, d4:需求理解, d5:时间管理, d6:交付水平
  total_earnings    NUMERIC(10,2) NOT NULL DEFAULT 0,
  task_count        INT NOT NULL DEFAULT 0,
  first_task_id     UUID,
  graduated_at      TIMESTAMPTZ,
  onboarding_completed_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ,
  CONSTRAINT one_profile_per_student UNIQUE (user_id)
);

-- ============================================================
-- 03. company_profiles — 企业档案
-- ============================================================
CREATE TABLE company_profiles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id),
  company_name        VARCHAR(256) NOT NULL,
  industry            VARCHAR(128),
  contact_name        VARCHAR(64) NOT NULL,
  contact_position    VARCHAR(64),
  contact_phone       VARCHAR(20),                 -- 仅管理员可见
  verified_at         TIMESTAMPTZ,                 -- NULL = 待审核
  total_tasks_posted  INT NOT NULL DEFAULT 0,
  total_paid          NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_blacklisted      BOOLEAN NOT NULL DEFAULT FALSE,
  blacklist_reason    TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,
  CONSTRAINT one_profile_per_company UNIQUE (user_id)
);

-- ============================================================
-- 04. test_results — 25题测试答案与结果
-- ============================================================
CREATE TABLE test_results (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL REFERENCES users(id),
  version              SMALLINT NOT NULL DEFAULT 1,  -- 测试版本
  attempt_number       INT NOT NULL DEFAULT 1,        -- 第几次测试
  answers_json         JSONB NOT NULL,                -- 完整答案
  -- 五维度评分 D1-D5 (0-100)
  d1_score             SMALLINT CHECK (d1_score BETWEEN 0 AND 100),
  d2_score             SMALLINT CHECK (d2_score BETWEEN 0 AND 100),
  d3_score             SMALLINT CHECK (d3_score BETWEEN 0 AND 100),
  d4_score             SMALLINT CHECK (d4_score BETWEEN 0 AND 100),
  d5_score             SMALLINT CHECK (d5_score BETWEEN 0 AND 100),
  opc_label            VARCHAR(128),
  opc_label_secondary  VARCHAR(128),
  recommended_track    track_type,
  recommended_level    SMALLINT CHECK (recommended_level BETWEEN 0 AND 2),
  share_card_caption   VARCHAR(30),                   -- 分享卡片文案, ≤20字
  share_card_data      JSONB,                         -- 卡片渲染数据
  open_answer_embedding VECTOR(1536),                 -- pgvector: 开放题语义向量
  ai_raw_response      TEXT,                          -- Claude原始输出
  is_current           BOOLEAN NOT NULL DEFAULT TRUE, -- 最新一次
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at           TIMESTAMPTZ
);

-- ============================================================
-- 05. tasks — 任务信息
-- ============================================================
CREATE TABLE tasks (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id        UUID NOT NULL REFERENCES users(id),
  title             VARCHAR(256) NOT NULL,
  description       TEXT NOT NULL,
  task_type         VARCHAR(64),                    -- ai_image/ai_video/ai_doc/tool/agent
  track             track_type NOT NULL DEFAULT 'A',
  level_required    SMALLINT NOT NULL DEFAULT 0 CHECK (level_required BETWEEN 0 AND 5),
  budget_gross      NUMERIC(10,2) NOT NULL,         -- 企业支付金额
  budget_net        NUMERIC(10,2) NOT NULL,         -- 学生实得 (gross - 平台抽成)
  platform_fee_rate NUMERIC(4,3) NOT NULL DEFAULT 0.20, -- 0.20/0.18/0.15
  acceptance_criteria TEXT NOT NULL,
  deadline          TIMESTAMPTZ,
  estimated_minutes INT,                            -- 预计完成时间(分钟)
  is_first_task     BOOLEAN NOT NULL DEFAULT FALSE, -- 平台预设首单
  payer             VARCHAR(16) NOT NULL DEFAULT 'company', -- 'company'/'platform'
  status            task_status NOT NULL DEFAULT 'draft',
  ai_confirmed_at   TIMESTAMPTZ,                   -- AI需求确认时间
  assigned_count    SMALLINT NOT NULL DEFAULT 0,   -- 已推送人数
  max_assignees     SMALLINT NOT NULL DEFAULT 3,   -- 最多推送2-3人
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

-- ============================================================
-- 06. task_assignments — 任务分配记录
-- ============================================================
CREATE TABLE task_assignments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id       UUID NOT NULL REFERENCES tasks(id),
  student_id    UUID NOT NULL REFERENCES users(id),
  status        assignment_status NOT NULL DEFAULT 'pending',
  match_score   NUMERIC(5,2),                      -- AI-02 匹配分
  match_reason  TEXT,                              -- AI-02 匹配理由(内部)
  assigned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at   TIMESTAMPTZ,
  rejected_at   TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ,                       -- 接单截止时间
  completed_at  TIMESTAMPTZ,
  deleted_at    TIMESTAMPTZ,
  CONSTRAINT unique_assignment UNIQUE (task_id, student_id)
);

-- ============================================================
-- 07. task_steps — 任务子步骤 (AI-03 生成)
-- ============================================================
CREATE TABLE task_steps (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id       UUID NOT NULL REFERENCES tasks(id),
  student_id    UUID NOT NULL REFERENCES users(id),
  step_num      SMALLINT NOT NULL,
  step_title    VARCHAR(256) NOT NULL,
  step_desc     TEXT NOT NULL,
  tool_hint     VARCHAR(128),                      -- 推荐工具
  est_minutes   INT,                              -- 预计分钟
  status        VARCHAR(16) NOT NULL DEFAULT 'pending', -- pending/done
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_step UNIQUE (task_id, student_id, step_num)
);

-- ============================================================
-- 08. task_submissions — 交付物记录
-- ============================================================
CREATE TABLE task_submissions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id           UUID NOT NULL REFERENCES tasks(id),
  student_id        UUID NOT NULL REFERENCES users(id),
  file_urls         JSONB NOT NULL DEFAULT '[]',
  submission_note   TEXT,
  -- AI审核 (AI-04)
  ai_score          SMALLINT CHECK (ai_score BETWEEN 0 AND 100),
  ai_feedback       TEXT,                          -- 成长信号格式, 禁"不合格"
  ai_review_count   SMALLINT NOT NULL DEFAULT 0,  -- 最多2次
  -- 企业验收
  company_score     SMALLINT CHECK (company_score BETWEEN 0 AND 100),
  company_feedback  TEXT,
  status            submission_status NOT NULL DEFAULT 'pending',
  submitted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at       TIMESTAMPTZ,
  approved_at       TIMESTAMPTZ,
  deleted_at        TIMESTAMPTZ
);

-- ============================================================
-- 09. payments — 支付记录
-- ============================================================
CREATE TABLE payments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id    UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(), -- 幂等键
  task_id       UUID REFERENCES tasks(id),
  student_id    UUID REFERENCES users(id),
  company_id    UUID REFERENCES users(id),
  payer         VARCHAR(16) NOT NULL DEFAULT 'company', -- 'company'/'platform'
  gross_amount  NUMERIC(10,2) NOT NULL,
  platform_fee  NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_amount    NUMERIC(10,2) NOT NULL,
  is_first_task BOOLEAN NOT NULL DEFAULT FALSE,
  status        payment_status NOT NULL DEFAULT 'pending',
  settled_at    TIMESTAMPTZ,
  version       INT NOT NULL DEFAULT 0,           -- 乐观锁
  external_tx_id VARCHAR(128),                    -- 微信/支付宝流水号
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ,
  CONSTRAINT version_non_negative CHECK (version >= 0)
);

-- ============================================================
-- 10. student_balances — 学生余额 (乐观锁)
-- ============================================================
CREATE TABLE student_balances (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL UNIQUE REFERENCES users(id),
  balance       NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_earned  NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_withdrawn NUMERIC(10,2) NOT NULL DEFAULT 0,
  version       INT NOT NULL DEFAULT 0,           -- 乐观锁: UPDATE ... WHERE version = ?
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 11. withdrawals — 提现记录
-- ============================================================
CREATE TABLE withdrawals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id),
  amount          NUMERIC(10,2) NOT NULL CHECK (amount >= 10), -- 最低¥10
  method          withdrawal_method NOT NULL,
  account_info    TEXT NOT NULL,                  -- 加密存储
  status          withdrawal_status NOT NULL DEFAULT 'pending',
  auto_processed  BOOLEAN NOT NULL DEFAULT FALSE, -- ≤¥1000自动处理
  processor_id    UUID REFERENCES users(id),      -- 审核管理员
  process_note    TEXT,
  requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at    TIMESTAMPTZ,
  deleted_at      TIMESTAMPTZ
);

-- ============================================================
-- 12. contact_unlocks — 联系方式解锁
-- ============================================================
CREATE TABLE contact_unlocks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID NOT NULL REFERENCES users(id),
  company_id      UUID NOT NULL REFERENCES users(id),
  task_count      SMALLINT NOT NULL DEFAULT 2,
  unlock_reason   VARCHAR(32) NOT NULL DEFAULT 'two_tasks',
  unlocked_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_unlock UNIQUE (student_id, company_id)
);

-- ============================================================
-- 13. opc_reports — OPC成长报告
-- ============================================================
CREATE TABLE opc_reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id),
  report_type     report_type NOT NULL,
  status          report_status NOT NULL DEFAULT 'pending',
  content_json    JSONB,                           -- 报告内容
  preview_hook    JSONB,                           -- 预览钩子数据
  paid_amount     NUMERIC(8,2),
  paid_at         TIMESTAMPTZ,
  payment_id      UUID REFERENCES payments(id),
  generation_started_at TIMESTAMPTZ,
  generated_at    TIMESTAMPTZ,
  ai_raw_response TEXT,
  reviewed_by     UUID REFERENCES users(id),       -- 人工审核
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

-- ============================================================
-- 14. growth_timeline — 能力成长时间线 [v7新增]
-- ============================================================
CREATE TABLE growth_timeline (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id),
  event_type    timeline_event_type NOT NULL,
  event_title   VARCHAR(256) NOT NULL,
  event_desc    TEXT,                             -- 具体成长描述
  event_data    JSONB NOT NULL DEFAULT '{}',      -- 附加数据
  -- level_up事件专用
  level_before  SMALLINT,
  level_after   SMALLINT,
  level_before_label VARCHAR(64),                 -- "探索者"
  level_after_label  VARCHAR(64),                 -- "入门者"
  growth_comparison  TEXT,                        -- "你上个月还不会做X，现在完成了Y"
  -- comeback事件专用
  task_id       UUID REFERENCES tasks(id),
  is_milestone  BOOLEAN NOT NULL DEFAULT FALSE,
  share_card_generated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

-- ============================================================
-- 15. emotion_signals — 情绪状态信号 [v7新增]
-- ============================================================
CREATE TABLE emotion_signals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id),
  signal_type     emotion_signal_type NOT NULL,
  signal_value    SMALLINT NOT NULL DEFAULT 1 CHECK (signal_value BETWEEN 1 AND 10),
  trigger_event   VARCHAR(128),                   -- 触发事件描述
  triggered_action VARCHAR(128),                  -- 已触发的推送动作
  resolved_at     TIMESTAMPTZ,
  detected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

-- ============================================================
-- 16. story_wall_posts — OPC故事墙 [v7新增]
-- RULE: NO LEADERBOARD — 永远不按likes排序 (See PRD Ch.09 & Ch.24)
-- ============================================================
CREATE TABLE story_wall_posts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id),
  is_anonymous  BOOLEAN NOT NULL DEFAULT FALSE,
  track         track_type,
  level         SMALLINT,
  task_type     VARCHAR(64),
  earnings      NUMERIC(8,2),                     -- 可选展示收入
  content       TEXT NOT NULL,
  likes         INT NOT NULL DEFAULT 0,           -- 仅存储，绝不用于排序
  status        VARCHAR(16) NOT NULL DEFAULT 'pending', -- pending/approved/rejected
  ai_reviewed   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

-- ============================================================
-- 17. user_tags — 用户标签
-- ============================================================
CREATE TABLE user_tags (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id),
  tag_category  VARCHAR(64) NOT NULL,             -- ability/track/level/emotion/identity/income/preference
  tag_value     VARCHAR(128) NOT NULL,
  confidence    NUMERIC(3,2) NOT NULL DEFAULT 1.0 CHECK (confidence BETWEEN 0 AND 1),
  source        VARCHAR(32) NOT NULL DEFAULT 'system', -- system/manual
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_tag UNIQUE (user_id, tag_category, tag_value)
);

-- ============================================================
-- 18. notifications — 通知记录
-- ============================================================
CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id),
  type          VARCHAR(64) NOT NULL,             -- first_earnings/level_up/task_assigned/comeback等
  channel       notification_channel NOT NULL DEFAULT 'app',
  title         VARCHAR(256) NOT NULL,
  content       TEXT NOT NULL,
  action_url    VARCHAR(512),
  is_read       BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at       TIMESTAMPTZ,
  read_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

-- ============================================================
-- 19. chat_messages — 沟通中转消息
-- ============================================================
CREATE TABLE chat_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id         UUID NOT NULL REFERENCES tasks(id),
  sender_id       UUID REFERENCES users(id),
  sender_type     sender_type NOT NULL,
  content         TEXT NOT NULL,
  is_filtered     BOOLEAN NOT NULL DEFAULT FALSE, -- 含联系方式已过滤
  original_content TEXT,                          -- 过滤前原始内容(加密)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

-- ============================================================
-- 20. portfolio_items — 作品集
-- ============================================================
CREATE TABLE portfolio_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id),
  task_id       UUID REFERENCES tasks(id),
  title         VARCHAR(256) NOT NULL,
  description   TEXT,
  cover_url     TEXT,
  file_urls     JSONB NOT NULL DEFAULT '[]',
  track         track_type,
  is_public     BOOLEAN NOT NULL DEFAULT FALSE,
  view_count    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

-- ============================================================
-- 21. admin_operation_logs — 后台操作日志 (不可删除，不可修改)
-- ============================================================
CREATE TABLE admin_operation_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id      UUID NOT NULL REFERENCES users(id),
  action        VARCHAR(128) NOT NULL,
  target_type   VARCHAR(64) NOT NULL,             -- user/task/payment/tag等
  target_id     UUID,
  detail        JSONB NOT NULL DEFAULT '{}',
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- 无 deleted_at · 无 updated_at · 不可修改
);

-- ============================================================
-- 22. onboarding_status — J1-J8 Onboarding 状态
-- ============================================================
CREATE TABLE onboarding_status (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL UNIQUE REFERENCES users(id),
  current_step    VARCHAR(32) NOT NULL DEFAULT 'J1_test_start',
  completed_steps JSONB NOT NULL DEFAULT '[]',
  j1_completed_at TIMESTAMPTZ,
  j2_completed_at TIMESTAMPTZ,
  j3_completed_at TIMESTAMPTZ,
  j4_completed_at TIMESTAMPTZ,
  j5_completed_at TIMESTAMPTZ,
  j6_completed_at TIMESTAMPTZ,
  j7_completed_at TIMESTAMPTZ,
  j8_completed_at TIMESTAMPTZ,  -- 首单到账 = 完成onboarding
  is_completed    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 23. refresh_tokens — JWT刷新令牌
-- ============================================================
CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id),
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  device_info TEXT,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 触发器: updated_at 自动更新
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_student_profiles_updated_at
  BEFORE UPDATE ON student_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_company_profiles_updated_at
  BEFORE UPDATE ON company_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_student_balances_updated_at
  BEFORE UPDATE ON student_balances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_story_wall_posts_updated_at
  BEFORE UPDATE ON story_wall_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_portfolio_items_updated_at
  BEFORE UPDATE ON portfolio_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_onboarding_status_updated_at
  BEFORE UPDATE ON onboarding_status
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Row Security Policy: admin_operation_logs 不可删除/修改
-- ============================================================
ALTER TABLE admin_operation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY no_update_admin_logs ON admin_operation_logs
  FOR UPDATE USING (FALSE);  -- 任何人不得 UPDATE

CREATE POLICY no_delete_admin_logs ON admin_operation_logs
  FOR DELETE USING (FALSE);  -- 任何人不得 DELETE
