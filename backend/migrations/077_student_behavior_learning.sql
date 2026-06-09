-- 学生行为学习系统
-- 用于记录学生的任务接受/拒绝行为，动态调整推荐权重

-- 学生行为记录表
CREATE TABLE IF NOT EXISTS student_behavior_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  task_id UUID NOT NULL REFERENCES tasks(id),

  -- 行为类型
  action_type VARCHAR(50) NOT NULL, -- 'viewed', 'accepted', 'rejected', 'completed', 'failed'

  -- 任务特征（快照，用于分析偏好）
  task_type VARCHAR(100),
  task_track VARCHAR(50),
  task_level INTEGER,
  task_budget DECIMAL(10,2),
  task_tags TEXT[],

  -- 匹配信息
  match_score DECIMAL(3,2), -- 当时的匹配度
  rank_in_recommendation INTEGER, -- 在推荐列表中的排名

  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 索引
  CONSTRAINT unique_student_task_action UNIQUE(student_id, task_id, action_type)
);

CREATE INDEX idx_behavior_logs_student ON student_behavior_logs(student_id, created_at DESC);
CREATE INDEX idx_behavior_logs_action ON student_behavior_logs(action_type);

-- 学生偏好画像表（从行为中学习）
CREATE TABLE IF NOT EXISTS student_preference_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) UNIQUE,

  -- 任务类型偏好（从行为中学习）
  preferred_task_types JSONB DEFAULT '{}',
  -- {
  --   "品牌视觉设计": {acceptance_rate: 0.8, avg_completion_quality: 4.5, count: 10},
  --   "UI设计": {acceptance_rate: 0.6, avg_completion_quality: 4.0, count: 5}
  -- }

  -- 预算偏好
  preferred_budget_range JSONB DEFAULT '{}',
  -- {min: 500, max: 2000, avg_accepted: 1200}

  -- 难度偏好
  preferred_difficulty_range JSONB DEFAULT '{}',
  -- {min_level: 2, max_level: 4, comfort_zone: 3}

  -- 拒绝模式分析
  rejection_patterns JSONB DEFAULT '{}',
  -- {
  --   "too_low_budget": 5,
  --   "too_high_difficulty": 3,
  --   "unfamiliar_domain": 2
  -- }

  -- 统计数据
  total_viewed INTEGER DEFAULT 0,
  total_accepted INTEGER DEFAULT 0,
  total_rejected INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  acceptance_rate DECIMAL(3,2),
  completion_rate DECIMAL(3,2),

  -- 更新时间
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_preference_profiles_student ON student_preference_profiles(student_id);

-- 触发器：自动更新偏好画像
CREATE OR REPLACE FUNCTION update_student_preference_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- 插入或更新偏好画像
  INSERT INTO student_preference_profiles (student_id, total_viewed, total_accepted, total_rejected)
  VALUES (NEW.student_id,
    CASE WHEN NEW.action_type = 'viewed' THEN 1 ELSE 0 END,
    CASE WHEN NEW.action_type = 'accepted' THEN 1 ELSE 0 END,
    CASE WHEN NEW.action_type = 'rejected' THEN 1 ELSE 0 END
  )
  ON CONFLICT (student_id) DO UPDATE SET
    total_viewed = student_preference_profiles.total_viewed +
      CASE WHEN NEW.action_type = 'viewed' THEN 1 ELSE 0 END,
    total_accepted = student_preference_profiles.total_accepted +
      CASE WHEN NEW.action_type = 'accepted' THEN 1 ELSE 0 END,
    total_rejected = student_preference_profiles.total_rejected +
      CASE WHEN NEW.action_type = 'rejected' THEN 1 ELSE 0 END,
    total_completed = student_preference_profiles.total_completed +
      CASE WHEN NEW.action_type = 'completed' THEN 1 ELSE 0 END,
    acceptance_rate = CASE
      WHEN (student_preference_profiles.total_viewed + 1) > 0
      THEN (student_preference_profiles.total_accepted + CASE WHEN NEW.action_type = 'accepted' THEN 1 ELSE 0 END)::DECIMAL /
           (student_preference_profiles.total_viewed + 1)
      ELSE 0
    END,
    completion_rate = CASE
      WHEN (student_preference_profiles.total_accepted + CASE WHEN NEW.action_type = 'accepted' THEN 1 ELSE 0 END) > 0
      THEN (student_preference_profiles.total_completed + CASE WHEN NEW.action_type = 'completed' THEN 1 ELSE 0 END)::DECIMAL /
           (student_preference_profiles.total_accepted + CASE WHEN NEW.action_type = 'accepted' THEN 1 ELSE 0 END)
      ELSE 0
    END,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_preference_profile
AFTER INSERT ON student_behavior_logs
FOR EACH ROW
EXECUTE FUNCTION update_student_preference_profile();

-- 注释
COMMENT ON TABLE student_behavior_logs IS '学生行为日志：记录学生对任务的所有交互行为';
COMMENT ON TABLE student_preference_profiles IS '学生偏好画像：从行为中学习的动态偏好';
COMMENT ON COLUMN student_behavior_logs.action_type IS 'viewed=查看, accepted=接受, rejected=拒绝, completed=完成, failed=失败';
