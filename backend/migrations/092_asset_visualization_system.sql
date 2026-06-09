-- 迁移092: 资产可视化系统
-- 创建日期: 2026-06-09
-- 说明: 个人资产仪表盘、成长对比卡片、升级通关仪式

-- 1. 能力标签与市场估值表
CREATE TABLE IF NOT EXISTS skill_valuations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 能力信息
  skill_name VARCHAR(100) NOT NULL UNIQUE, -- 'AI生图', '文案改写', '客户沟通'
  skill_category VARCHAR(50) NOT NULL, -- 'technical', 'creative', 'communication', 'analysis'

  -- 市场估值（基于真实市场数据）
  market_min_price DECIMAL(10,2), -- 最低市场价
  market_max_price DECIMAL(10,2), -- 最高市场价
  market_avg_price DECIMAL(10,2), -- 平均市场价
  price_unit VARCHAR(20) DEFAULT 'per_task', -- 'per_task', 'per_hour', 'per_project'

  -- 熟练度门槛
  mastery_level_threshold INTEGER DEFAULT 5, -- 需要完成多少单才算"熟练"

  -- 元数据
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT skill_valuations_category_check
    CHECK (skill_category IN ('technical', 'creative', 'communication', 'analysis'))
);

CREATE INDEX idx_skill_valuations_active ON skill_valuations(is_active);
CREATE INDEX idx_skill_valuations_category ON skill_valuations(skill_category);

COMMENT ON TABLE skill_valuations IS '能力标签与市场估值（基于真实市场数据）';
COMMENT ON COLUMN skill_valuations.market_avg_price IS '平均市场价（用于能力估值计算）';

-- 2. 学生能力档案表
CREATE TABLE IF NOT EXISTS student_skill_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_name VARCHAR(100) NOT NULL REFERENCES skill_valuations(skill_name),

  -- 能力掌握度
  mastery_level VARCHAR(20) DEFAULT 'beginner', -- 'beginner', 'intermediate', 'proficient', 'expert'
  completed_tasks_count INTEGER DEFAULT 0, -- 完成任务数
  average_rating DECIMAL(3,2), -- 平均评分

  -- 进步速度
  first_task_date TIMESTAMPTZ,
  latest_task_date TIMESTAMPTZ,
  fastest_completion_days INTEGER, -- 最快完成天数

  -- 元数据
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT student_skill_profiles_unique UNIQUE (student_id, skill_name),
  CONSTRAINT student_skill_profiles_mastery_check
    CHECK (mastery_level IN ('beginner', 'intermediate', 'proficient', 'expert'))
);

CREATE INDEX idx_student_skill_profiles_student ON student_skill_profiles(student_id);
CREATE INDEX idx_student_skill_profiles_mastery ON student_skill_profiles(mastery_level);

COMMENT ON TABLE student_skill_profiles IS '学生能力档案（用于仪表盘展示）';
COMMENT ON COLUMN student_skill_profiles.mastery_level IS '熟练度：入门/中级/熟练/专家';

-- 3. 成长对比卡片记录表
CREATE TABLE IF NOT EXISTS growth_comparison_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 触发条件
  trigger_type VARCHAR(50) NOT NULL, -- '5th_task', '10th_task', '20th_task', 'level_up', 'overcome_stuck'
  trigger_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,

  -- 对比数据
  first_task_data JSONB NOT NULL, -- {duration_days, stuck_count, main_fear}
  current_task_data JSONB NOT NULL, -- {duration_days, stuck_count, improvement}

  -- AI生成的对比文案
  comparison_message TEXT NOT NULL,

  -- 卡片图片
  card_image_url TEXT,

  -- 分享追踪
  shared BOOLEAN DEFAULT false,
  shared_at TIMESTAMPTZ,
  share_platform VARCHAR(50),

  -- 元数据
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT growth_comparison_cards_trigger_check
    CHECK (trigger_type IN ('5th_task', '10th_task', '20th_task', 'level_up', 'overcome_stuck'))
);

CREATE INDEX idx_growth_comparison_cards_student ON growth_comparison_cards(student_id);
CREATE INDEX idx_growth_comparison_cards_trigger ON growth_comparison_cards(trigger_type);
CREATE INDEX idx_growth_comparison_cards_shared ON growth_comparison_cards(shared);

COMMENT ON TABLE growth_comparison_cards IS '成长对比卡片记录（第1单 vs 第N单）';
COMMENT ON COLUMN growth_comparison_cards.comparison_message IS 'AI生成的对比文案（温暖具体）';

-- 4. 升级事件记录表
CREATE TABLE IF NOT EXISTS level_up_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 升级信息
  from_level INTEGER NOT NULL,
  to_level INTEGER NOT NULL,

  -- AI生成的导师留言
  mentor_personal_message TEXT NOT NULL, -- AI-04基于学生成长数据生成

  -- 解锁内容
  unlocked_abilities JSONB, -- ["可以接品牌矩阵类任务", "可以申请导师认证"]
  unlocked_task_types VARCHAR(100)[],

  -- 下一级目标
  next_level_requirements JSONB, -- {tasks_needed, earnings_needed, skills_needed}

  -- 元数据
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_level_up_events_student ON level_up_events(student_id);
CREATE INDEX idx_level_up_events_to_level ON level_up_events(to_level);

COMMENT ON TABLE level_up_events IS '升级事件记录（含AI生成的导师留言）';
COMMENT ON COLUMN level_up_events.mentor_personal_message IS '导师专属留言（必须引用具体数据）';

-- 5. 学生资产快照表（用于仪表盘）
CREATE TABLE IF NOT EXISTS student_asset_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 当前等级
  current_level INTEGER NOT NULL,

  -- 能力估值
  total_skill_valuation DECIMAL(10,2), -- 总能力估值（市场月薪估值）
  skill_breakdown JSONB, -- [{skill_name, mastery_level, estimated_value}]

  -- 累计数据
  total_completed_tasks INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  total_stuck_count INTEGER DEFAULT 0,
  total_resolved_stuck_count INTEGER DEFAULT 0,
  total_tools_used INTEGER DEFAULT 0,

  -- 进步最快的能力
  fastest_improving_skill VARCHAR(100),

  -- 快照时间
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- 元数据
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT student_asset_snapshots_unique UNIQUE (student_id, snapshot_date)
);

CREATE INDEX idx_student_asset_snapshots_student ON student_asset_snapshots(student_id);
CREATE INDEX idx_student_asset_snapshots_date ON student_asset_snapshots(snapshot_date DESC);

COMMENT ON TABLE student_asset_snapshots IS '学生资产快照（每日生成，用于仪表盘）';
COMMENT ON COLUMN student_asset_snapshots.total_skill_valuation IS '总能力估值（基于市场数据）';

-- 6. 插入初始能力估值数据（基于真实市场价格）
INSERT INTO skill_valuations (skill_name, skill_category, market_min_price, market_max_price, market_avg_price, price_unit, mastery_level_threshold) VALUES
  ('AI生图', 'technical', 300, 500, 400, 'per_task', 5),
  ('文案改写', 'creative', 200, 400, 300, 'per_task', 5),
  ('视频剪辑', 'technical', 500, 1000, 750, 'per_task', 8),
  ('数据分析', 'analysis', 400, 800, 600, 'per_task', 10),
  ('客户沟通', 'communication', 0, 0, 0, 'per_task', 3), -- 软技能不直接估值
  ('项目管理', 'communication', 0, 0, 0, 'per_task', 5),
  ('Prompt工程', 'technical', 300, 600, 450, 'per_task', 5),
  ('品牌设计', 'creative', 800, 1500, 1150, 'per_project', 10),
  ('内容策划', 'creative', 400, 800, 600, 'per_project', 8),
  ('社媒运营', 'creative', 300, 600, 450, 'per_task', 5);

-- 7. 触发器：更新updated_at
CREATE TRIGGER student_skill_profiles_updated_at
  BEFORE UPDATE ON student_skill_profiles
  FOR EACH ROW EXECUTE FUNCTION update_mentor_updated_at();

-- 8. 创建视图：学生能力估值汇总
CREATE OR REPLACE VIEW student_valuation_summary AS
SELECT
  ssp.student_id,
  COUNT(DISTINCT ssp.skill_name) as total_skills,
  SUM(CASE WHEN ssp.mastery_level IN ('proficient', 'expert') THEN sv.market_avg_price ELSE 0 END) as total_valuation,
  SUM(ssp.completed_tasks_count) as total_tasks,
  AVG(ssp.average_rating) as overall_rating,
  MAX(ssp.updated_at) as last_skill_update
FROM student_skill_profiles ssp
LEFT JOIN skill_valuations sv ON ssp.skill_name = sv.skill_name
WHERE sv.is_active = true
GROUP BY ssp.student_id;

COMMENT ON VIEW student_valuation_summary IS '学生能力估值汇总视图（用于仪表盘快速查询）';
