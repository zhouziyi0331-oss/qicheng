-- 迁移093: 引路人机制
-- 创建日期: 2026-06-09
-- 说明: 邀请追踪、脱敏进度展示、引路人成就

-- 1. 引路人邀请关系表（已存在referrals表，这里扩展）
CREATE TABLE IF NOT EXISTS referral_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 邀请信息
  referral_code VARCHAR(20) NOT NULL UNIQUE,
  invitation_url TEXT NOT NULL,

  -- 邀请限制
  max_invitations INTEGER DEFAULT 1, -- 最多可邀请人数（完成5单后=1，10单后=3，20单后=5）
  used_invitations INTEGER DEFAULT 0,

  -- 元数据
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMPTZ -- 可设置邀请链接过期时间
);

CREATE INDEX idx_referral_invitations_referrer ON referral_invitations(referrer_id);
CREATE INDEX idx_referral_invitations_code ON referral_invitations(referral_code);

COMMENT ON TABLE referral_invitations IS '引路人邀请信息';
COMMENT ON COLUMN referral_invitations.max_invitations IS '最多可邀请人数（根据完成订单数动态调整）';

-- 2. 被邀请人进度表（脱敏展示）
CREATE TABLE IF NOT EXISTS referral_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_code VARCHAR(20) NOT NULL,

  -- 被邀请人脱敏信息
  referee_nickname_masked VARCHAR(100), -- "张**"

  -- 进度信息（脱敏）
  registration_completed BOOLEAN DEFAULT false,
  opc_test_completed BOOLEAN DEFAULT false,
  first_task_accepted BOOLEAN DEFAULT false,
  first_task_completed BOOLEAN DEFAULT false,

  -- 完成任务数（不显示具体收入）
  total_completed_tasks INTEGER DEFAULT 0,

  -- 当前状态
  current_status VARCHAR(50) DEFAULT 'registered', -- 'registered', 'testing', 'active', 'inactive'
  last_activity_at TIMESTAMPTZ,

  -- 元数据
  registered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  first_task_completed_at TIMESTAMPTZ,

  CONSTRAINT referral_progress_unique UNIQUE (referrer_id, referee_id),
  CONSTRAINT referral_progress_status_check
    CHECK (current_status IN ('registered', 'testing', 'active', 'inactive'))
);

CREATE INDEX idx_referral_progress_referrer ON referral_progress(referrer_id);
CREATE INDEX idx_referral_progress_referee ON referral_progress(referee_id);
CREATE INDEX idx_referral_progress_status ON referral_progress(current_status);

COMMENT ON TABLE referral_progress IS '被邀请人进度（脱敏展示给引路人）';
COMMENT ON COLUMN referral_progress.referee_nickname_masked IS '脱敏昵称（如：张**）';

-- 3. 引路人成就表
CREATE TABLE IF NOT EXISTS referrer_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 成就统计
  total_invitations_sent INTEGER DEFAULT 0,
  total_registrations INTEGER DEFAULT 0,
  total_first_tasks_completed INTEGER DEFAULT 0, -- 多少个新人完成了首单

  -- 当前引导中的人数
  currently_guiding INTEGER DEFAULT 0,

  -- 成就标签
  achievement_badges JSONB, -- ["首次引路人", "成功引导5人", "百人导师"]

  -- 主页展示文案
  homepage_display TEXT, -- "曾指引过X个人开始"

  -- 元数据
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT referrer_achievements_unique UNIQUE (referrer_id)
);

CREATE INDEX idx_referrer_achievements_referrer ON referrer_achievements(referrer_id);

COMMENT ON TABLE referrer_achievements IS '引路人成就记录';
COMMENT ON COLUMN referrer_achievements.total_first_tasks_completed IS '成功引导多少人完成首单';

-- 4. 引路人鼓励消息表（新人卡住时可以发）
CREATE TABLE IF NOT EXISTS referrer_encouragement_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 消息内容
  message TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'encouragement', -- 'encouragement', 'congratulation'

  -- 触发场景
  trigger_context VARCHAR(100), -- '新人卡住时', '新人完成首单时'

  -- 元数据
  sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_referrer_encouragement_referrer ON referrer_encouragement_messages(referrer_id);
CREATE INDEX idx_referrer_encouragement_referee ON referrer_encouragement_messages(referee_id);

COMMENT ON TABLE referrer_encouragement_messages IS '引路人鼓励消息（不是指导，是鼓励）';

-- 5. 触发器：更新updated_at
CREATE TRIGGER referrer_achievements_updated_at
  BEFORE UPDATE ON referrer_achievements
  FOR EACH ROW EXECUTE FUNCTION update_mentor_updated_at();

-- 6. 函数：生成脱敏昵称
CREATE OR REPLACE FUNCTION mask_nickname(nickname TEXT)
RETURNS TEXT AS $$
BEGIN
  IF LENGTH(nickname) <= 1 THEN
    RETURN nickname;
  ELSIF LENGTH(nickname) = 2 THEN
    RETURN SUBSTRING(nickname FROM 1 FOR 1) || '*';
  ELSE
    RETURN SUBSTRING(nickname FROM 1 FOR 1) || REPEAT('*', LENGTH(nickname) - 2) || SUBSTRING(nickname FROM LENGTH(nickname) FOR 1);
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION mask_nickname IS '生成脱敏昵称（如：张三 -> 张*，张小三 -> 张*三）';

-- 7. 视图：引路人主页数据
CREATE OR REPLACE VIEW referrer_homepage_view AS
SELECT
  ra.referrer_id,
  ra.total_first_tasks_completed,
  ra.homepage_display,
  ra.achievement_badges,
  COUNT(DISTINCT rp.referee_id) FILTER (WHERE rp.current_status = 'active') as currently_active_count
FROM referrer_achievements ra
LEFT JOIN referral_progress rp ON ra.referrer_id = rp.referrer_id
GROUP BY ra.referrer_id, ra.total_first_tasks_completed, ra.homepage_display, ra.achievement_badges;

COMMENT ON VIEW referrer_homepage_view IS '引路人主页数据汇总';
