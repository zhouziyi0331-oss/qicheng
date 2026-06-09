-- ============================================================
-- 创建 user_ability_profiles 表
-- 用于存储学生的六维能力画像（版本化）
-- ============================================================

CREATE TABLE IF NOT EXISTS user_ability_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 六维能力分数
  information_processing INTEGER CHECK (information_processing BETWEEN 0 AND 100),
  creative_drive INTEGER CHECK (creative_drive BETWEEN 0 AND 100),
  tool_learning INTEGER CHECK (tool_learning BETWEEN 0 AND 100),
  task_execution INTEGER CHECK (task_execution BETWEEN 0 AND 100),
  collaboration_tendency INTEGER CHECK (collaboration_tendency BETWEEN 0 AND 100),
  risk_attitude INTEGER CHECK (risk_attitude BETWEEN 0 AND 100),

  -- 画像标签和总结
  personality_label VARCHAR(50),
  profile_summary TEXT,

  -- 版本控制（082迁移会添加这些字段）
  version INTEGER DEFAULT 1,
  is_current BOOLEAN DEFAULT true,
  updated_reason VARCHAR(200),
  dimension_descriptions JSONB,

  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_ability_profiles_user
ON user_ability_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_user_ability_profiles_current
ON user_ability_profiles(user_id, is_current)
WHERE is_current = true;

-- 从 student_capabilities 迁移初始数据
INSERT INTO user_ability_profiles (
  user_id,
  information_processing,
  creative_drive,
  tool_learning,
  task_execution,
  collaboration_tendency,
  risk_attitude,
  personality_label,
  profile_summary,
  created_at
)
SELECT
  sc.student_id,
  50, -- 默认初始分数
  50,
  50,
  50,
  50,
  50,
  sc.personality_style,
  sc.profile_summary,
  sc.created_at
FROM student_capabilities sc
WHERE NOT EXISTS (
  SELECT 1 FROM user_ability_profiles uap WHERE uap.user_id = sc.student_id
)
ON CONFLICT DO NOTHING;

-- 添加注释
COMMENT ON TABLE user_ability_profiles IS '学生六维能力画像（版本化）';
COMMENT ON COLUMN user_ability_profiles.version IS '画像版本号，每次更新+1';
COMMENT ON COLUMN user_ability_profiles.is_current IS '是否为当前有效版本';
COMMENT ON COLUMN user_ability_profiles.dimension_descriptions IS '每个维度的AI文字解读';

SELECT
  'user_ability_profiles表创建完成' as status,
  COUNT(*) as total_profiles
FROM user_ability_profiles;
