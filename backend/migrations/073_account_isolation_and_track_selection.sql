-- 账号隔离与赛道选择功能 - 数据库迁移
-- 迁移编号: 073
-- 创建时间: 2026-05-28
-- 优先级: P0

-- ============================================================
-- 1. 创建枚举类型
-- ============================================================

-- 账号类型枚举
CREATE TYPE account_type AS ENUM ('student', 'enterprise');

-- 赛道类型枚举
CREATE TYPE track_type_new AS ENUM ('content', 'dev');

-- ============================================================
-- 2. 修改 users 表
-- ============================================================

-- 添加账号类型字段
ALTER TABLE users
ADD COLUMN account_type account_type NOT NULL DEFAULT 'student';

-- 添加赛道选择字段
ALTER TABLE users
ADD COLUMN selected_track track_type_new;

-- 添加赛道选择时间
ALTER TABLE users
ADD COLUMN track_selected_at TIMESTAMPTZ;

-- 创建索引
CREATE INDEX idx_users_account_type ON users(account_type);
CREATE INDEX idx_users_selected_track ON users(selected_track);

-- ============================================================
-- 3. 修改 user_ability_profiles 表
-- ============================================================

-- 添加赛道分析字段
ALTER TABLE user_ability_profiles
ADD COLUMN track_analysis JSONB;

-- 创建索引
CREATE INDEX idx_user_ability_profiles_track_analysis ON user_ability_profiles USING gin(track_analysis);

-- ============================================================
-- 4. 数据迁移 - 更新现有数据
-- ============================================================

-- 根据 role 字段更新 account_type
UPDATE users
SET account_type = 'enterprise'
WHERE role = 'company';

-- 其他所有用户默认为 student (已通过 DEFAULT 设置)

-- 历史画像数据迁移：将 track_recommendation 同步到 selected_track（如果列存在）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_ability_profiles' AND column_name = 'track_recommendation'
  ) THEN
    UPDATE users u
    SET
      selected_track = CASE
        WHEN uap.track_recommendation = 'content' THEN 'content'::track_type_new
        WHEN uap.track_recommendation = 'dev' THEN 'dev'::track_type_new
        ELSE NULL
      END,
      track_selected_at = uap.created_at
    FROM user_ability_profiles uap
    WHERE u.id = uap.user_id
      AND uap.track_recommendation IN ('content', 'dev')
      AND u.selected_track IS NULL;

    RAISE NOTICE 'Migrated track_recommendation data to selected_track';
  ELSE
    RAISE NOTICE 'Column track_recommendation does not exist, skipping data migration';
  END IF;
END $$;

-- ============================================================
-- 5. 添加约束
-- ============================================================

-- 确保企业账号不能选择赛道
ALTER TABLE users
ADD CONSTRAINT check_enterprise_no_track
CHECK (
  (account_type = 'enterprise' AND selected_track IS NULL)
  OR account_type = 'student'
);

-- 确保选择赛道时必须有选择时间
ALTER TABLE users
ADD CONSTRAINT check_track_selected_at
CHECK (
  (selected_track IS NOT NULL AND track_selected_at IS NOT NULL)
  OR (selected_track IS NULL AND track_selected_at IS NULL)
);

-- ============================================================
-- 6. 创建辅助函数
-- ============================================================

-- 检查手机号是否已被其他账号类型注册
CREATE OR REPLACE FUNCTION check_phone_account_type(
  p_phone VARCHAR,
  p_account_type account_type
) RETURNS BOOLEAN AS $$
DECLARE
  existing_type account_type;
BEGIN
  SELECT account_type INTO existing_type
  FROM users
  WHERE phone = p_phone;

  IF existing_type IS NULL THEN
    -- 手机号未注册，可以使用
    RETURN TRUE;
  ELSIF existing_type = p_account_type THEN
    -- 已注册为相同类型，可以登录
    RETURN TRUE;
  ELSE
    -- 已注册为不同类型，不能使用
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 7. 创建视图 - 赛道统计
-- ============================================================

CREATE OR REPLACE VIEW track_statistics AS
SELECT
  selected_track,
  COUNT(*) as student_count,
  AVG(CASE
    WHEN uap.track_analysis->'content'->>'score' IS NOT NULL
    THEN (uap.track_analysis->'content'->>'score')::numeric
    ELSE NULL
  END) as avg_content_score,
  AVG(CASE
    WHEN uap.track_analysis->'dev'->>'score' IS NOT NULL
    THEN (uap.track_analysis->'dev'->>'score')::numeric
    ELSE NULL
  END) as avg_dev_score
FROM users u
LEFT JOIN user_ability_profiles uap ON u.id = uap.user_id
WHERE u.account_type = 'student'
  AND u.selected_track IS NOT NULL
GROUP BY selected_track;

-- ============================================================
-- 8. 添加注释
-- ============================================================

COMMENT ON COLUMN users.account_type IS '账号类型：student(学生) / enterprise(企业)，注册时锁定，不可修改';
COMMENT ON COLUMN users.selected_track IS '学生选择的赛道：content(AI内容创作) / dev(AI工具开发)';
COMMENT ON COLUMN users.track_selected_at IS '赛道选择时间';
COMMENT ON COLUMN user_ability_profiles.track_analysis IS '两条赛道的适配度分析JSON，包含score、reason、highlights、challenges';

-- ============================================================
-- 9. 验证迁移
-- ============================================================

-- 检查新增字段
DO $$
BEGIN
  -- 检查 users 表字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'account_type'
  ) THEN
    RAISE EXCEPTION 'Migration failed: account_type column not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'selected_track'
  ) THEN
    RAISE EXCEPTION 'Migration failed: selected_track column not created';
  END IF;

  -- 检查 user_ability_profiles 表字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_ability_profiles' AND column_name = 'track_analysis'
  ) THEN
    RAISE EXCEPTION 'Migration failed: track_analysis column not created';
  END IF;

  RAISE NOTICE 'Migration 073 completed successfully';
END $$;

-- ============================================================
-- 10. 回滚脚本 (如需回滚，执行以下语句)
-- ============================================================

/*
-- 删除约束
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_enterprise_no_track;
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_track_selected_at;

-- 删除视图
DROP VIEW IF EXISTS track_statistics;

-- 删除函数
DROP FUNCTION IF EXISTS check_phone_account_type;

-- 删除索引
DROP INDEX IF EXISTS idx_users_account_type;
DROP INDEX IF EXISTS idx_users_selected_track;
DROP INDEX IF EXISTS idx_user_ability_profiles_track_analysis;

-- 删除字段
ALTER TABLE users DROP COLUMN IF EXISTS account_type;
ALTER TABLE users DROP COLUMN IF EXISTS selected_track;
ALTER TABLE users DROP COLUMN IF EXISTS track_selected_at;
ALTER TABLE user_ability_profiles DROP COLUMN IF EXISTS track_analysis;

-- 删除枚举类型
DROP TYPE IF EXISTS account_type;
DROP TYPE IF EXISTS track_type_new;
*/
