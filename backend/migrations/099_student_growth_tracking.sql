-- E-07: 学生成长轨迹可视化
-- 记录学生的关键成长事件和里程碑

-- 学生成长事件表
CREATE TABLE IF NOT EXISTS student_growth_events ( 
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  
  -- 事件类型
  event_type VARCHAR(50) NOT NULL,
  -- 'level_up' - 等级提升
  -- 'skill_acquired' - 技能习得
  -- 'milestone_reached' - 里程碑达成
  -- 'task_completed' - 任务完成
  -- 'rating_improved' - 评分提升
  -- 'specialization' - 领域专精
  
  -- 事件详情
  title VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- 影响力评分（0-1）
  impact_score DECIMAL(3,2) CHECK (impact_score BETWEEN 0 AND 1),
  
  -- 关联数据
  related_task_id UUID REFERENCES tasks(id),
  related_skill VARCHAR(100),
  
  -- 数值变化
  metric_change JSONB,
  -- {
  --   "metric": "level",
  --   "from": 3,
  --   "to": 4,
  --   "improvement": "+1"
  -- }
  
  -- 元数据
  event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 索引
  CONSTRAINT unique_event_per_student UNIQUE(student_id, event_type, event_date)
);

CREATE INDEX idx_growth_events_student ON student_growth_events(student_id, event_date DESC);
CREATE INDEX idx_growth_events_type ON student_growth_events(student_id, event_type);
CREATE INDEX idx_growth_events_impact ON student_growth_events(student_id, impact_score DESC);

-- 学生里程碑表
CREATE TABLE IF NOT EXISTS student_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  
  -- 里程碑类型
  milestone_type VARCHAR(50) NOT NULL,
  -- 'first_task' - 首次完成任务
  -- 'tasks_10' - 完成10个任务
  -- 'tasks_50' - 完成50个任务
  -- 'perfect_rating' - 首次获得5星评价
  -- 'skill_master' - 技能精通
  -- 'collaboration_start' - 首次合作
  -- 'loyalty_reward' - 忠诚客户奖励
  
  -- 里程碑信息
  title VARCHAR(200) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  badge_color VARCHAR(20),
  
  -- 解锁条件
  unlock_condition JSONB,
  
  -- 奖励
  reward JSONB,
  -- {
  --   "type": "badge",
  --   "value": "首单达人",
  --   "exp": 100
  -- }
  
  -- 状态
  unlocked_at TIMESTAMPTZ NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_milestone UNIQUE(student_id, milestone_type)
);

CREATE INDEX idx_milestones_student ON student_milestones(student_id, unlocked_at DESC);
CREATE INDEX idx_milestones_featured ON student_milestones(student_id, is_featured) WHERE is_featured = true;

-- 学生技能进化表
CREATE TABLE IF NOT EXISTS student_skill_evolution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  skill_name VARCHAR(100) NOT NULL,
  
  -- 技能等级历史
  level_history JSONB NOT NULL DEFAULT '[]',
  -- [
  --   {"date": "2026-01-01", "level": 1, "proficiency": 0.3},
  --   {"date": "2026-02-01", "level": 2, "proficiency": 0.5}
  -- ]
  
  -- 当前状态
  current_level INTEGER NOT NULL DEFAULT 1,
  current_proficiency DECIMAL(3,2) CHECK (current_proficiency BETWEEN 0 AND 1),
  
  -- 实践记录
  practice_count INTEGER DEFAULT 0,
  last_practiced_at TIMESTAMPTZ,
  
  -- 成长趋势
  growth_rate DECIMAL(4,2),
  trend VARCHAR(20),  -- 'rising', 'stable', 'declining'
  
  -- 元数据
  first_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_student_skill UNIQUE(student_id, skill_name)
);

CREATE INDEX idx_skill_evolution_student ON student_skill_evolution(student_id, current_level DESC);
CREATE INDEX idx_skill_evolution_trend ON student_skill_evolution(student_id, trend) WHERE trend = 'rising';

-- 初始化函数：为现有学生创建成长事件
CREATE OR REPLACE FUNCTION initialize_student_growth_events()
RETURNS void AS $$
BEGIN
  -- 为所有已完成任务的学生创建任务完成事件
  INSERT INTO student_growth_events (student_id, event_type, title, description, impact_score, related_task_id, event_date)
  SELECT 
    t.student_id,
    'task_completed',
    '完成任务: ' || tk.title,
    '成功交付任务并获得' || t.client_rating || '星评价',
    CASE 
      WHEN t.client_rating >= 4.5 THEN 0.8
      WHEN t.client_rating >= 4.0 THEN 0.6
      ELSE 0.4
    END,
    t.task_id,
    t.completed_at
  FROM task_assignments t
  JOIN tasks tk ON t.task_id = tk.id
  WHERE t.status = 'completed'
    AND t.completed_at IS NOT NULL
  ON CONFLICT (student_id, event_type, event_date) DO NOTHING;
  
  RAISE NOTICE 'Student growth events initialized successfully';
END;
$$ LANGUAGE plpgsql;

-- 注释
COMMENT ON TABLE student_growth_events IS 'E-07: 学生成长事件记录表，追踪学生的关键成长时刻';
COMMENT ON TABLE student_milestones IS 'E-07: 学生里程碑表，记录学生达成的重要成就';
COMMENT ON TABLE student_skill_evolution IS 'E-07: 学生技能进化表，追踪技能随时间的成长';
