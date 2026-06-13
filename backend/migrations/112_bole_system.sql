-- E-11: 伯乐标签系统
-- 企业发现并推荐优秀学生，获得伯乐标签和奖励

-- 伯乐推荐记录表
CREATE TABLE talent_discoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discoverer_id UUID NOT NULL REFERENCES users(id),  -- 发现者（企业）
  student_id UUID NOT NULL REFERENCES users(id),     -- 被发现的学生

  -- 发现时的学生状态
  student_level_at_discovery INTEGER,
  tasks_completed_at_discovery INTEGER,

  -- 推荐理由
  discovery_reason TEXT NOT NULL,
  recommended_skills TEXT[] DEFAULT '{}',
  potential_rating DECIMAL(3,2),  -- 潜力评分 (0-1)

  -- 验证（学生后续表现）
  is_validated BOOLEAN DEFAULT false,
  validation_criteria JSONB,
  -- {
  --   "level_growth": 3,  // 等级提升
  --   "tasks_growth": 10,  // 任务增长
  --   "avg_rating": 4.5,  // 平均评分
  --   "months_passed": 6  // 经过月数
  -- }
  validated_at TIMESTAMPTZ,

  -- 奖励
  reward_points INTEGER DEFAULT 0,
  reward_amount DECIMAL(10,2) DEFAULT 0,
  reward_status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'approved', 'paid'
  reward_paid_at TIMESTAMPTZ,

  -- 状态
  status VARCHAR(50) DEFAULT 'active',  -- 'active', 'validated', 'expired'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(discoverer_id, student_id)
);

-- 伯乐标签表
CREATE TABLE bole_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES users(id),

  -- 标签等级
  badge_level VARCHAR(50) NOT NULL,  -- 'bronze', 'silver', 'gold', 'platinum'
  badge_name VARCHAR(100) NOT NULL,  -- '青铜伯乐', '白银伯乐', '黄金伯乐', '白金伯乐'

  -- 获得条件
  discoveries_required INTEGER NOT NULL,
  validated_discoveries_required INTEGER NOT NULL,

  -- 获得时间
  earned_at TIMESTAMPTZ DEFAULT NOW(),

  -- 标签权益
  benefits JSONB,
  -- {
  --   "priority_matching": true,  // 优先匹配
  --   "featured_profile": true,  // 企业主页突出展示
  --   "exclusive_students": 5,  // 独家学生名额
  --   "discount_rate": 0.03  // 额外折扣
  -- }

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 伯乐排行榜
CREATE TABLE bole_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES users(id),

  month VARCHAR(7) NOT NULL,  -- '2026-06'

  discoveries_count INTEGER DEFAULT 0,
  validated_count INTEGER DEFAULT 0,
  total_reward_points INTEGER DEFAULT 0,
  rank INTEGER,

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(company_id, month)
);

-- 学生成长追踪（验证伯乐推荐的准确性）
CREATE TABLE student_growth_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),

  -- 每月快照
  snapshot_month VARCHAR(7) NOT NULL,
  student_level INTEGER,
  tasks_completed INTEGER,
  avg_rating DECIMAL(3,2),
  total_earnings DECIMAL(10,2),

  -- 成长指标
  level_growth INTEGER DEFAULT 0,  -- 相比上月
  tasks_growth INTEGER DEFAULT 0,
  rating_trend VARCHAR(50),  -- 'improving', 'stable', 'declining'

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(student_id, snapshot_month)
);

-- 伯乐奖励配置表
CREATE TABLE bole_reward_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 发现奖励（基础）
  discovery_base_points INTEGER DEFAULT 10,
  discovery_base_amount DECIMAL(10,2) DEFAULT 0,

  -- 验证奖励（学生成长后）
  validation_points_multiplier DECIMAL(3,2) DEFAULT 2.0,
  validation_bonus_amount DECIMAL(10,2) DEFAULT 50.00,

  -- 学生等级系数
  student_level_multiplier JSONB,
  -- {"1-3": 1.0, "4-6": 1.5, "7-10": 2.0, "11+": 3.0}

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_discoveries_discoverer ON talent_discoveries(discoverer_id, created_at DESC);
CREATE INDEX idx_discoveries_student ON talent_discoveries(student_id);
CREATE INDEX idx_discoveries_status ON talent_discoveries(status, is_validated);
CREATE INDEX idx_bole_badges_company ON bole_badges(company_id, badge_level);
CREATE INDEX idx_leaderboard_month ON bole_leaderboard(month, rank);
CREATE INDEX idx_growth_tracking_student ON student_growth_tracking(student_id, snapshot_month DESC);

-- 学生成长达到验证条件时，自动验证伯乐推荐
CREATE OR REPLACE FUNCTION validate_talent_discoveries()
RETURNS TRIGGER AS $$
DECLARE
  discovery RECORD;
  months_passed INTEGER;
  level_growth INTEGER;
  tasks_growth INTEGER;
BEGIN
  -- 查找所有未验证的推荐
  FOR discovery IN
    SELECT td.*, u.student_level, u.tasks_completed
    FROM talent_discoveries td
    JOIN users u ON td.student_id = u.id
    WHERE td.student_id = NEW.id
      AND td.is_validated = false
      AND td.status = 'active'
  LOOP
    -- 计算成长
    months_passed := EXTRACT(MONTH FROM AGE(NOW(), discovery.created_at));
    level_growth := NEW.student_level - discovery.student_level_at_discovery;

    -- 从tasks表获取任务增长
    SELECT COUNT(*) INTO tasks_growth
    FROM tasks
    WHERE student_id = NEW.id
      AND status = 'completed'
      AND completed_at > discovery.created_at;

    -- 验证条件：6个月内，等级+2，任务+5
    IF months_passed >= 6 AND level_growth >= 2 AND tasks_growth >= 5 THEN
      UPDATE talent_discoveries
      SET is_validated = true,
          validated_at = NOW(),
          validation_criteria = jsonb_build_object(
            'level_growth', level_growth,
            'tasks_growth', tasks_growth,
            'months_passed', months_passed,
            'current_level', NEW.student_level
          ),
          status = 'validated',
          reward_points = reward_points * 2,  -- 验证后奖励翻倍
          reward_amount = reward_amount + 50.00
      WHERE id = discovery.id;

      -- 更新企业伯乐统计
      UPDATE users
      SET validated_discoveries = validated_discoveries + 1
      WHERE id = discovery.discoverer_id;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_discoveries
AFTER UPDATE ON users
FOR EACH ROW
WHEN (NEW.role = 'student' AND (NEW.student_level IS DISTINCT FROM OLD.student_level))
EXECUTE FUNCTION validate_talent_discoveries();

-- 记录学生成长快照（每月）
CREATE OR REPLACE FUNCTION create_student_growth_snapshot()
RETURNS void AS $$
DECLARE
  current_month VARCHAR(7);
BEGIN
  current_month := TO_CHAR(NOW(), 'YYYY-MM');

  INSERT INTO student_growth_tracking (
    id,
    student_id,
    snapshot_month,
    student_level,
    tasks_completed,
    avg_rating,
    total_earnings
  )
  SELECT
    gen_random_uuid(),
    u.id,
    current_month,
    u.student_level,
    (SELECT COUNT(*) FROM tasks WHERE student_id = u.id AND status = 'completed'),
    (SELECT AVG(client_rating) FROM tasks WHERE student_id = u.id AND status = 'completed'),
    (SELECT COALESCE(SUM(budget), 0) FROM tasks WHERE student_id = u.id AND status = 'completed')
  FROM users u
  WHERE u.role = 'student'
  ON CONFLICT (student_id, snapshot_month) DO UPDATE
  SET student_level = EXCLUDED.student_level,
      tasks_completed = EXCLUDED.tasks_completed,
      avg_rating = EXCLUDED.avg_rating,
      total_earnings = EXCLUDED.total_earnings;
END;
$$ LANGUAGE plpgsql;

-- 更新伯乐排行榜
CREATE OR REPLACE FUNCTION update_bole_leaderboard()
RETURNS void AS $$
DECLARE
  current_month VARCHAR(7);
BEGIN
  current_month := TO_CHAR(NOW(), 'YYYY-MM');

  -- 插入或更新排行榜数据
  INSERT INTO bole_leaderboard (
    id,
    company_id,
    month,
    discoveries_count,
    validated_count,
    total_reward_points
  )
  SELECT
    gen_random_uuid(),
    discoverer_id,
    current_month,
    COUNT(*),
    COUNT(*) FILTER (WHERE is_validated = true),
    SUM(reward_points)
  FROM talent_discoveries
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
    AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
  GROUP BY discoverer_id
  ON CONFLICT (company_id, month) DO UPDATE
  SET discoveries_count = EXCLUDED.discoveries_count,
      validated_count = EXCLUDED.validated_count,
      total_reward_points = EXCLUDED.total_reward_points,
      updated_at = NOW();

  -- 更新排名
  WITH ranked AS (
    SELECT company_id,
           ROW_NUMBER() OVER (ORDER BY validated_count DESC, discoveries_count DESC) as new_rank
    FROM bole_leaderboard
    WHERE month = current_month
  )
  UPDATE bole_leaderboard bl
  SET rank = ranked.new_rank
  FROM ranked
  WHERE bl.company_id = ranked.company_id AND bl.month = current_month;
END;
$$ LANGUAGE plpgsql;

-- 扩展用户表，添加伯乐统计
ALTER TABLE users ADD COLUMN IF NOT EXISTS students_discovered INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS validated_discoveries INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bole_points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bole_badge_level VARCHAR(50);

-- 更新企业伯乐统计的触发器
CREATE OR REPLACE FUNCTION update_company_bole_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users
    SET students_discovered = students_discovered + 1,
        bole_points = bole_points + NEW.reward_points
    WHERE id = NEW.discoverer_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.is_validated = true AND OLD.is_validated = false THEN
    UPDATE users
    SET bole_points = bole_points + (NEW.reward_points - OLD.reward_points)
    WHERE id = NEW.discoverer_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_company_bole_stats
AFTER INSERT OR UPDATE ON talent_discoveries
FOR EACH ROW
EXECUTE FUNCTION update_company_bole_stats();

-- 插入默认奖励配置
INSERT INTO bole_reward_config (
  id,
  discovery_base_points,
  discovery_base_amount,
  validation_points_multiplier,
  validation_bonus_amount,
  student_level_multiplier
) VALUES (
  gen_random_uuid(),
  10,
  0,
  2.0,
  50.00,
  '{"1-3": 1.0, "4-6": 1.5, "7-10": 2.0, "11+": 3.0}'::jsonb
);

COMMENT ON TABLE talent_discoveries IS 'E-11: 伯乐推荐记录，企业发现优秀学生';
COMMENT ON TABLE bole_badges IS '伯乐标签';
COMMENT ON TABLE bole_leaderboard IS '伯乐排行榜';
COMMENT ON TABLE student_growth_tracking IS '学生成长追踪';
COMMENT ON TABLE bole_reward_config IS '伯乐奖励配置';
