-- ============================================================
-- 信任加速器模块 · Trust Accelerator
-- 学生完成同一商家任务2次后，触发解锁联系方式流程
-- ============================================================

-- ============================================================
-- ENUM 类型定义
-- ============================================================

CREATE TYPE verify_round AS ENUM ('round1', 'round2');

CREATE TYPE verify_result AS ENUM ('pass', 'retry', 'fail');

CREATE TYPE verify_session_status AS ENUM (
  'round1_pending',
  'round1_judging',
  'round1_pass',
  'round1_retry',
  'round1_fail',
  'round2_pending',
  'round2_judging',
  'all_pass',
  'failed',
  'paid_unlocked'
);

CREATE TYPE match_status AS ENUM ('pending', 'verifying', 'unlocked', 'skipped');

CREATE TYPE unlock_payment_status AS ENUM ('pending', 'paid', 'refunded', 'failed');

-- ============================================================
-- 01. merchant_contacts — 商家联系方式（加密存储）
-- ============================================================
CREATE TABLE merchant_contacts (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id        UUID NOT NULL REFERENCES users(id),
  contact_name_enc  TEXT NOT NULL,                    -- AES-256加密
  contact_phone_enc TEXT NOT NULL,                    -- AES-256加密
  contact_wechat_enc TEXT,                            -- AES-256加密
  contact_email_enc TEXT,                             -- AES-256加密
  max_unlocks       INT NOT NULL DEFAULT 10,          -- 最多允许解锁次数
  current_unlocks   INT NOT NULL DEFAULT 0,           -- 当前已解锁次数
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ,
  CONSTRAINT one_contact_per_company UNIQUE (company_id)
);

-- ============================================================
-- 02. student_company_matches — 学生-商家匹配记录
-- ============================================================
-- 记录学生与商家的合作次数，达到2次触发解锁资格
CREATE TABLE student_company_matches (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id        UUID NOT NULL REFERENCES users(id),
  company_id        UUID NOT NULL REFERENCES users(id),
  completed_tasks   INT NOT NULL DEFAULT 0,           -- 完成任务次数
  total_earnings    NUMERIC(10,2) NOT NULL DEFAULT 0, -- 累计收入
  unlock_eligible   BOOLEAN NOT NULL DEFAULT FALSE,   -- 是否有解锁资格（≥2次）
  unlock_triggered_at TIMESTAMPTZ,                    -- 触发解锁时间
  match_score       FLOAT,                            -- 匹配分数（0-1）
  match_reason      TEXT,                             -- 匹配原因说明
  status            match_status NOT NULL DEFAULT 'pending',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ,
  CONSTRAINT unique_student_company UNIQUE (student_id, company_id)
);

-- ============================================================
-- 03. verify_questions — 验证题库
-- ============================================================
-- 每个商家/赛道对应两轮验证题
CREATE TABLE verify_questions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id        UUID REFERENCES users(id),        -- NULL表示通用题
  track             track_type,                       -- 赛道（通用题用）
  round             verify_round NOT NULL,            -- round1/round2
  question_text     TEXT NOT NULL,                    -- 题目内容
  judge_criteria    JSONB NOT NULL,                   -- AI判断标准 {"pass":"...","fail":"..."}
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

-- ============================================================
-- 04. verify_sessions — 验证会话（状态机）
-- ============================================================
CREATE TABLE verify_sessions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id            UUID NOT NULL REFERENCES users(id),
  company_id            UUID NOT NULL REFERENCES users(id),
  match_id              UUID NOT NULL REFERENCES student_company_matches(id),
  status                verify_session_status NOT NULL DEFAULT 'round1_pending',

  -- 第一轮验证（能力验证）
  round1_question_id    UUID REFERENCES verify_questions(id),
  round1_answer         TEXT,
  round1_result         verify_result,
  round1_retry_count    INT NOT NULL DEFAULT 0,       -- 最多2次
  round1_ai_reason      TEXT,                         -- AI判断理由（内部）
  round1_retry_prompt   TEXT,                         -- 给学生的提示

  -- 第二轮验证（意愿验证）
  round2_question_id    UUID REFERENCES verify_questions(id),
  round2_answer         TEXT,
  round2_result         verify_result,
  round2_ai_reason      TEXT,                         -- AI判断理由（内部）

  expires_at            TIMESTAMPTZ NOT NULL,         -- 会话过期时间（24小时）
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at          TIMESTAMPTZ,
  deleted_at            TIMESTAMPTZ
);

-- ============================================================
-- 05. ai_judge_logs — AI判断日志
-- ============================================================
CREATE TABLE ai_judge_logs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id        UUID NOT NULL REFERENCES verify_sessions(id),
  round             verify_round NOT NULL,
  model_used        VARCHAR(50) NOT NULL,             -- deepseek-chat/gpt-4o-mini
  prompt_tokens     INT,
  completion_tokens INT,
  result            verify_result NOT NULL,
  reason            TEXT,
  latency_ms        INT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 06. unlock_payments — 解锁支付记录
-- ============================================================
CREATE TABLE unlock_payments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id        UUID NOT NULL REFERENCES users(id),
  session_id        UUID NOT NULL REFERENCES verify_sessions(id),
  amount_fen        INT NOT NULL,                     -- 金额（分），如1900=¥19
  wx_out_trade_no   VARCHAR(64) UNIQUE NOT NULL,      -- 微信商户订单号（幂等键）
  wx_transaction_id VARCHAR(64),                      -- 微信支付交易号
  status            unlock_payment_status NOT NULL DEFAULT 'pending',
  paid_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

-- ============================================================
-- 07. unlock_records — 解锁记录
-- ============================================================
CREATE TABLE unlock_records (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id            UUID NOT NULL REFERENCES users(id),
  company_id            UUID NOT NULL REFERENCES users(id),
  session_id            UUID NOT NULL REFERENCES verify_sessions(id),
  payment_id            UUID NOT NULL REFERENCES unlock_payments(id),

  -- 联系方式（解密后明文存储，仅此记录可见）
  contact_name          VARCHAR(64),
  contact_phone         VARCHAR(20),
  contact_wechat        VARCHAR(64),
  contact_email         VARCHAR(128),

  contact_viewed_at     TIMESTAMPTZ,                   -- 学生查看时间
  student_contacted     BOOLEAN,                       -- 学生是否联系（自报）
  merchant_contacted    BOOLEAN,                       -- 商家是否收到（自报）
  feedback_collected_at TIMESTAMPTZ,
  certificate_url       TEXT,                          -- 启程证书图片URL

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

-- ============================================================
-- 08. threshold_configs — AI判断阈值配置
-- ============================================================
CREATE TABLE threshold_configs (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track                 track_type,                    -- NULL表示全局默认
  round1_pass_threshold FLOAT NOT NULL DEFAULT 0.7,
  round2_pass_threshold FLOAT NOT NULL DEFAULT 0.75,
  calibration_reason    TEXT,
  approved_by           UUID REFERENCES users(id),     -- 管理员审核人
  effective_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 索引
-- ============================================================

-- 学生-商家匹配查询
CREATE INDEX idx_matches_student ON student_company_matches(student_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_matches_company ON student_company_matches(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_matches_eligible ON student_company_matches(unlock_eligible) WHERE deleted_at IS NULL AND unlock_eligible = TRUE;

-- 验证会话查询
CREATE INDEX idx_verify_sessions_student ON verify_sessions(student_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_verify_sessions_status ON verify_sessions(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_verify_sessions_expires ON verify_sessions(expires_at) WHERE deleted_at IS NULL;

-- AI判断日志查询
CREATE INDEX idx_ai_judge_logs_session ON ai_judge_logs(session_id);
CREATE INDEX idx_ai_judge_logs_created ON ai_judge_logs(created_at DESC);

-- 解锁记录查询
CREATE INDEX idx_unlock_records_student ON unlock_records(student_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_unlock_records_company ON unlock_records(company_id) WHERE deleted_at IS NULL;

-- 支付记录查询
CREATE INDEX idx_unlock_payments_student ON unlock_payments(student_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_unlock_payments_status ON unlock_payments(status) WHERE deleted_at IS NULL;

-- ============================================================
-- 初始化默认阈值配置
-- ============================================================
INSERT INTO threshold_configs (track, round1_pass_threshold, round2_pass_threshold, calibration_reason, effective_at)
VALUES
  (NULL, 0.7, 0.75, '全局默认阈值', NOW()),
  ('A', 0.7, 0.75, 'A赛道默认阈值', NOW()),
  ('B', 0.7, 0.75, 'B赛道默认阈值', NOW()),
  ('AB', 0.7, 0.75, 'AB赛道默认阈值', NOW());

COMMENT ON TABLE merchant_contacts IS '商家联系方式（加密存储）';
COMMENT ON TABLE student_company_matches IS '学生-商家匹配记录，完成2次任务触发解锁资格';
COMMENT ON TABLE verify_questions IS '验证题库，两轮AI验证题目';
COMMENT ON TABLE verify_sessions IS '验证会话状态机';
COMMENT ON TABLE ai_judge_logs IS 'AI判断日志，用于阈值校准';
COMMENT ON TABLE unlock_payments IS '解锁支付记录';
COMMENT ON TABLE unlock_records IS '解锁记录，含解密后的联系方式';
COMMENT ON TABLE threshold_configs IS 'AI判断阈值动态配置';
