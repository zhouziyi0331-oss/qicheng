-- ============================================
-- 任务分级和智能匹配系统
-- ============================================

-- 1. 任务等级定义表
CREATE TABLE IF NOT EXISTS task_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 等级信息
  level_code VARCHAR(20) NOT NULL UNIQUE, -- L1, L2, L3, L4, L5
  level_name VARCHAR(50) NOT NULL,
  level_order INTEGER NOT NULL UNIQUE,

  -- 等级要求
  min_complexity_score INTEGER NOT NULL, -- 最低复杂度分数
  max_complexity_score INTEGER NOT NULL, -- 最高复杂度分数
  min_price DECIMAL(10, 2),
  max_price DECIMAL(10, 2),
  estimated_hours_range VARCHAR(50), -- 如 "5-10小时"

  -- 学生要求
  min_student_level INTEGER, -- 学生最低等级要求
  required_completed_tasks INTEGER DEFAULT 0, -- 需要完成的任务数
  min_avg_rating DECIMAL(3, 2), -- 最低平均评分

  -- 描述
  description TEXT,
  examples TEXT, -- 示例任务类型

  -- 状态
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 插入预定义等级
INSERT INTO task_levels (level_code, level_name, level_order, min_complexity_score, max_complexity_score, min_price, max_price, estimated_hours_range, min_student_level, required_completed_tasks, min_avg_rating, description, examples) VALUES
('L1', '入门级', 1, 0, 30, 100, 300, '1-3小时', 1, 0, 0, '简单任务，适合新手练手', '简单数据录入、基础文案撰写、简单图片处理'),
('L2', '初级', 2, 31, 50, 300, 800, '3-8小时', 1, 2, 4.0, '需要一定技能的基础任务', '网页设计、Logo设计、简单编程任务、市场调研'),
('L3', '中级', 3, 51, 70, 800, 2000, '8-20小时', 2, 5, 4.2, '需要专业技能和经验', '完整网站开发、品牌设计、数据分析、内容策划'),
('L4', '高级', 4, 71, 85, 2000, 5000, '20-50小时', 3, 10, 4.5, '复杂项目，需要丰富经验', '大型系统开发、企业级设计、深度咨询、复杂算法'),
('L5', '专家级', 5, 86, 100, 5000, 20000, '50小时以上', 4, 20, 4.7, '顶级项目，需要专家级能力', '架构设计、战略咨询、创新研发、行业领军项目');

-- 2. 学生等级表
CREATE TABLE IF NOT EXISTS student_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- 当前等级
  current_level INTEGER DEFAULT 1, -- 1-5
  level_name VARCHAR(50) DEFAULT '新手',

  -- 经验值系统
  total_exp INTEGER DEFAULT 0,
  current_level_exp INTEGER DEFAULT 0,
  next_level_exp INTEGER DEFAULT 100,

  -- 任务统计
  total_tasks_completed INTEGER DEFAULT 0,
  total_tasks_failed INTEGER DEFAULT 0,
  success_rate DECIMAL(5, 2) DEFAULT 100,

  -- 各等级任务完成数
  l1_completed INTEGER DEFAULT 0,
  l2_completed INTEGER DEFAULT 0,
  l3_completed INTEGER DEFAULT 0,
  l4_completed INTEGER DEFAULT 0,
  l5_completed INTEGER DEFAULT 0,

  -- 评价统计
  avg_rating DECIMAL(3, 2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,

  -- 能力评分
  quality_score DECIMAL(5, 2) DEFAULT 0, -- 质量分
  speed_score DECIMAL(5, 2) DEFAULT 0, -- 速度分
  communication_score DECIMAL(5, 2) DEFAULT 0, -- 沟通分

  -- 可接任务等级
  max_task_level INTEGER DEFAULT 1, -- 最高可接任务等级

  -- 升级历史
  last_level_up_at TIMESTAMP,
  level_up_count INTEGER DEFAULT 0,

  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_student_levels_student ON student_levels(student_id);
CREATE INDEX idx_student_levels_level ON student_levels(current_level);

-- 3. 任务匹配分数表
CREATE TABLE IF NOT EXISTS task_match_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 匹配分数（0-100）
  total_score DECIMAL(5, 2) NOT NULL,

  -- 各维度分数
  level_match_score DECIMAL(5, 2), -- 等级匹配度
  skill_match_score DECIMAL(5, 2), -- 技能匹配度
  experience_match_score DECIMAL(5, 2), -- 经验匹配度
  availability_score DECIMAL(5, 2), -- 可用性分数
  location_score DECIMAL(5, 2), -- 地理位置分数
  price_match_score DECIMAL(5, 2), -- 价格匹配度
  history_score DECIMAL(5, 2), -- 历史合作分数

  -- 匹配原因
  match_reasons JSONB, -- [{reason: "技能完全匹配", weight: 0.3}]
  mismatch_reasons JSONB, -- 不匹配的原因

  -- 推荐等级
  recommendation_level VARCHAR(20), -- highly_recommended, recommended, suitable, not_recommended

  -- AI分析
  ai_analysis TEXT,

  -- 状态
  is_notified BOOLEAN DEFAULT false, -- 是否已通知学生
  notified_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(task_id, student_id)
);

CREATE INDEX idx_match_scores_task ON task_match_scores(task_id);
CREATE INDEX idx_match_scores_student ON task_match_scores(student_id);
CREATE INDEX idx_match_scores_score ON task_match_scores(total_score DESC);
CREATE INDEX idx_match_scores_recommendation ON task_match_scores(recommendation_level);

-- 4. 匹配规则配置表
CREATE TABLE IF NOT EXISTS matching_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  rule_name VARCHAR(100) NOT NULL UNIQUE,
  rule_type VARCHAR(50) NOT NULL, -- level, skill, experience, availability, location, price, history

  -- 权重
  weight DECIMAL(5, 4) NOT NULL, -- 0-1

  -- 规则参数
  parameters JSONB,

  -- 描述
  description TEXT,

  -- 状态
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 插入默认匹配规则
INSERT INTO matching_rules (rule_name, rule_type, weight, description) VALUES
('level_match', 'level', 0.25, '任务等级与学生等级的匹配度'),
('skill_match', 'skill', 0.30, '所需技能与学生技能的匹配度'),
('experience_match', 'experience', 0.15, '任务经验要求与学生经验的匹配度'),
('availability', 'availability', 0.10, '学生的可用性和响应速度'),
('price_match', 'price', 0.10, '价格与学生期望的匹配度'),
('history_score', 'history', 0.10, '历史合作记录和评价');

-- 5. 扩展tasks表
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_level VARCHAR(20); -- L1, L2, L3, L4, L5
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS complexity_score INTEGER; -- 0-100
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS auto_matched BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS match_count INTEGER DEFAULT 0; -- 匹配到的学生数量
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS best_match_student_id UUID REFERENCES users(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS best_match_score DECIMAL(5, 2);

-- 6. 创建函数：计算任务等级
CREATE OR REPLACE FUNCTION calculate_task_level(p_task_id UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
  v_complexity INTEGER;
  v_level VARCHAR(20);
BEGIN
  -- 获取任务复杂度
  SELECT complexity_score INTO v_complexity FROM tasks WHERE id = p_task_id;

  IF v_complexity IS NULL THEN
    -- 如果没有复杂度分数，计算一个
    SELECT calculate_task_complexity(
      description, requirements, deliverables, estimated_hours
    ) INTO v_complexity
    FROM tasks WHERE id = p_task_id;

    -- 更新任务的复杂度分数
    UPDATE tasks SET complexity_score = v_complexity WHERE id = p_task_id;
  END IF;

  -- 根据复杂度确定等级
  SELECT level_code INTO v_level
  FROM task_levels
  WHERE v_complexity BETWEEN min_complexity_score AND max_complexity_score
    AND is_active = true
  ORDER BY level_order
  LIMIT 1;

  RETURN COALESCE(v_level, 'L2');
END;
$$ LANGUAGE plpgsql;

-- 7. 创建函数：计算学生可接最高任务等级
CREATE OR REPLACE FUNCTION calculate_max_task_level(p_student_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_student RECORD;
  v_max_level INTEGER := 1;
BEGIN
  SELECT * INTO v_student FROM student_levels WHERE student_id = p_student_id;

  IF v_student IS NULL THEN
    RETURN 1;
  END IF;

  -- 基于完成任务数和评分确定最高等级
  IF v_student.total_tasks_completed >= 20 AND v_student.avg_rating >= 4.7 THEN
    v_max_level := 5;
  ELSIF v_student.total_tasks_completed >= 10 AND v_student.avg_rating >= 4.5 THEN
    v_max_level := 4;
  ELSIF v_student.total_tasks_completed >= 5 AND v_student.avg_rating >= 4.2 THEN
    v_max_level := 3;
  ELSIF v_student.total_tasks_completed >= 2 AND v_student.avg_rating >= 4.0 THEN
    v_max_level := 2;
  ELSE
    v_max_level := 1;
  END IF;

  RETURN v_max_level;
END;
$$ LANGUAGE plpgsql;

-- 8. 创建函数：更新学生等级
CREATE OR REPLACE FUNCTION update_student_level(p_student_id UUID)
RETURNS void AS $$
DECLARE
  v_stats RECORD;
  v_new_level INTEGER;
  v_level_name VARCHAR(50);
  v_exp INTEGER;
BEGIN
  -- 获取学生统计数据
  SELECT
    COUNT(*) FILTER (WHERE status = 'completed') as completed,
    COUNT(*) FILTER (WHERE status = 'failed' OR status = 'cancelled') as failed,
    COALESCE(AVG(rating), 0) as avg_rating,
    COUNT(*) FILTER (WHERE status = 'completed' AND task_level = 'L1') as l1,
    COUNT(*) FILTER (WHERE status = 'completed' AND task_level = 'L2') as l2,
    COUNT(*) FILTER (WHERE status = 'completed' AND task_level = 'L3') as l3,
    COUNT(*) FILTER (WHERE status = 'completed' AND task_level = 'L4') as l4,
    COUNT(*) FILTER (WHERE status = 'completed' AND task_level = 'L5') as l5
  INTO v_stats
  FROM tasks
  WHERE accepted_student_id = p_student_id;

  -- 计算经验值（每完成一个任务获得经验）
  v_exp := v_stats.completed * 10 + v_stats.l2 * 5 + v_stats.l3 * 10 + v_stats.l4 * 20 + v_stats.l5 * 50;

  -- 计算新等级
  IF v_exp >= 1000 THEN
    v_new_level := 5;
    v_level_name := '大师';
  ELSIF v_exp >= 500 THEN
    v_new_level := 4;
    v_level_name := '专家';
  ELSIF v_exp >= 200 THEN
    v_new_level := 3;
    v_level_name := '熟练';
  ELSIF v_exp >= 50 THEN
    v_new_level := 2;
    v_level_name := '进阶';
  ELSE
    v_new_level := 1;
    v_level_name := '新手';
  END IF;

  -- 计算成功率
  DECLARE
    v_success_rate DECIMAL(5, 2);
  BEGIN
    IF (v_stats.completed + v_stats.failed) > 0 THEN
      v_success_rate := (v_stats.completed::DECIMAL / (v_stats.completed + v_stats.failed)) * 100;
    ELSE
      v_success_rate := 100;
    END IF;

    -- 插入或更新学生等级
    INSERT INTO student_levels (
      student_id, current_level, level_name, total_exp,
      total_tasks_completed, total_tasks_failed, success_rate,
      l1_completed, l2_completed, l3_completed, l4_completed, l5_completed,
      avg_rating, max_task_level, updated_at
    ) VALUES (
      p_student_id, v_new_level, v_level_name, v_exp,
      v_stats.completed, v_stats.failed, v_success_rate,
      v_stats.l1, v_stats.l2, v_stats.l3, v_stats.l4, v_stats.l5,
      v_stats.avg_rating, calculate_max_task_level(p_student_id), NOW()
    )
    ON CONFLICT (student_id) DO UPDATE SET
      current_level = v_new_level,
      level_name = v_level_name,
      total_exp = v_exp,
      total_tasks_completed = v_stats.completed,
      total_tasks_failed = v_stats.failed,
      success_rate = v_success_rate,
      l1_completed = v_stats.l1,
      l2_completed = v_stats.l2,
      l3_completed = v_stats.l3,
      l4_completed = v_stats.l4,
      l5_completed = v_stats.l5,
      avg_rating = v_stats.avg_rating,
      max_task_level = calculate_max_task_level(p_student_id),
      updated_at = NOW();
  END;
END;
$$ LANGUAGE plpgsql;

-- 9. 创建触发器：任务完成后更新学生等级
CREATE OR REPLACE FUNCTION trigger_update_student_level()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.accepted_student_id IS NOT NULL THEN
    PERFORM update_student_level(NEW.accepted_student_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_student_level_update
AFTER UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION trigger_update_student_level();

-- 10. 创建触发器：任务创建时自动计算等级
CREATE OR REPLACE FUNCTION trigger_calculate_task_level()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.task_level IS NULL THEN
    NEW.task_level := calculate_task_level(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_task_level_calculation
BEFORE INSERT ON tasks
FOR EACH ROW
EXECUTE FUNCTION trigger_calculate_task_level();

-- 11. 创建视图：学生匹配推荐
CREATE OR REPLACE VIEW student_match_recommendations AS
SELECT
  tms.*,
  t.title as task_title,
  t.category as task_category,
  t.budget_max as task_budget,
  t.task_level,
  s.username as student_username,
  sl.current_level as student_level,
  sl.avg_rating as student_rating
FROM task_match_scores tms
JOIN tasks t ON tms.task_id = t.id
JOIN users s ON tms.student_id = s.id
LEFT JOIN student_levels sl ON tms.student_id = sl.student_id
WHERE t.status = 'open'
  AND tms.total_score >= 60
ORDER BY tms.total_score DESC;

COMMENT ON TABLE task_levels IS '任务等级定义 - L1到L5的等级标准';
COMMENT ON TABLE student_levels IS '学生等级 - 学生的等级、经验值和统计';
COMMENT ON TABLE task_match_scores IS '任务匹配分数 - 任务与学生的匹配度';
COMMENT ON TABLE matching_rules IS '匹配规则配置 - 智能匹配的规则和权重';
COMMENT ON FUNCTION calculate_task_level IS '计算任务等级（L1-L5）';
COMMENT ON FUNCTION calculate_max_task_level IS '计算学生可接的最高任务等级';
COMMENT ON FUNCTION update_student_level IS '更新学生等级和统计数据';
