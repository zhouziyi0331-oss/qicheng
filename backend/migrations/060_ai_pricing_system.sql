-- ============================================
-- AI智能定价建议系统
-- ============================================

-- 1. 定价历史表（用于训练和改进AI模型）
CREATE TABLE IF NOT EXISTS pricing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES users(id),

  -- 任务特征
  task_category VARCHAR(100),
  task_difficulty VARCHAR(50),
  task_description_length INTEGER,
  requirements_complexity INTEGER, -- 1-10，需求复杂度
  estimated_hours INTEGER,
  required_abilities JSONB,

  -- AI建议
  ai_suggested_min DECIMAL(10, 2),
  ai_suggested_max DECIMAL(10, 2),
  ai_reasoning TEXT,
  ai_confidence_score INTEGER, -- 0-100

  -- 企业实际定价
  actual_budget_min DECIMAL(10, 2),
  actual_budget_max DECIMAL(10, 2),

  -- 市场反馈
  application_count INTEGER DEFAULT 0, -- 收到多少申请
  accepted_student_id UUID REFERENCES users(id),
  final_price DECIMAL(10, 2), -- 最终成交价
  task_completed BOOLEAN DEFAULT false,
  completion_quality_score INTEGER, -- 1-5，完成质量

  -- 偏差分析
  price_deviation DECIMAL(10, 2), -- 实际价格与AI建议的偏差
  market_response VARCHAR(50), -- hot（申请多）, normal, cold（申请少）

  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),
  task_published_at TIMESTAMP,
  task_completed_at TIMESTAMP
);

CREATE INDEX idx_pricing_history_task ON pricing_history(task_id);
CREATE INDEX idx_pricing_history_company ON pricing_history(company_id);
CREATE INDEX idx_pricing_history_category ON pricing_history(task_category);
CREATE INDEX idx_pricing_history_created ON pricing_history(created_at DESC);

-- 2. 市场价格基准表
CREATE TABLE IF NOT EXISTS market_price_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 分类维度
  category VARCHAR(100) NOT NULL,
  difficulty_level VARCHAR(50) NOT NULL, -- beginner, intermediate, advanced, expert

  -- 价格统计
  avg_price DECIMAL(10, 2),
  median_price DECIMAL(10, 2),
  min_price DECIMAL(10, 2),
  max_price DECIMAL(10, 2),
  price_std_dev DECIMAL(10, 2), -- 标准差

  -- 市场数据
  sample_count INTEGER, -- 样本数量
  avg_completion_time_hours INTEGER,
  avg_quality_score DECIMAL(3, 2),

  -- 时间范围
  period_start DATE,
  period_end DATE,

  -- 更新时间
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(category, difficulty_level, period_start, period_end)
);

CREATE INDEX idx_benchmarks_category ON market_price_benchmarks(category);
CREATE INDEX idx_benchmarks_difficulty ON market_price_benchmarks(difficulty_level);
CREATE INDEX idx_benchmarks_period ON market_price_benchmarks(period_start, period_end);

-- 3. 定价因子权重表（AI模型参数）
CREATE TABLE IF NOT EXISTS pricing_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  factor_name VARCHAR(100) NOT NULL UNIQUE,
  factor_type VARCHAR(50) NOT NULL, -- complexity, urgency, skill_level, market_demand

  -- 权重和影响
  weight DECIMAL(5, 4) NOT NULL, -- 0-1之间
  impact_direction VARCHAR(20) NOT NULL, -- positive, negative

  -- 描述
  description TEXT,
  calculation_method TEXT,

  -- 状态
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 插入初始定价因子
INSERT INTO pricing_factors (factor_name, factor_type, weight, impact_direction, description) VALUES
('task_complexity', 'complexity', 0.25, 'positive', '任务复杂度：需求描述长度、技术难度、交付物数量'),
('required_skills', 'skill_level', 0.20, 'positive', '所需技能等级：初级、中级、高级、专家'),
('urgency', 'urgency', 0.15, 'positive', '紧急程度：截止日期距离当前时间'),
('market_demand', 'market_demand', 0.15, 'positive', '市场需求：该类别任务的供需比'),
('company_reputation', 'reputation', 0.10, 'positive', '企业信誉：历史评分、合作次数'),
('estimated_hours', 'time', 0.15, 'positive', '预计工时：任务预计耗时');

-- 4. 定价调整记录表
CREATE TABLE IF NOT EXISTS pricing_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES users(id),

  -- 调整信息
  original_min DECIMAL(10, 2),
  original_max DECIMAL(10, 2),
  adjusted_min DECIMAL(10, 2),
  adjusted_max DECIMAL(10, 2),

  adjustment_reason VARCHAR(50), -- ai_suggestion, market_feedback, manual
  adjustment_note TEXT,

  -- AI建议（如果是AI触发的调整）
  ai_recommendation TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_adjustments_task ON pricing_adjustments(task_id);
CREATE INDEX idx_adjustments_company ON pricing_adjustments(company_id);

-- 5. 扩展tasks表
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS ai_pricing_applied BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS ai_pricing_confidence INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS pricing_history_id UUID REFERENCES pricing_history(id);

-- 6. 创建函数：计算任务复杂度分数
CREATE OR REPLACE FUNCTION calculate_task_complexity(
  p_description TEXT,
  p_requirements TEXT,
  p_deliverables TEXT,
  p_estimated_hours INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  complexity_score INTEGER := 0;
BEGIN
  -- 描述长度（最多30分）
  complexity_score := complexity_score + LEAST(LENGTH(p_description) / 50, 30);

  -- 需求长度（最多25分）
  IF p_requirements IS NOT NULL THEN
    complexity_score := complexity_score + LEAST(LENGTH(p_requirements) / 40, 25);
  END IF;

  -- 交付物长度（最多20分）
  IF p_deliverables IS NOT NULL THEN
    complexity_score := complexity_score + LEAST(LENGTH(p_deliverables) / 30, 20);
  END IF;

  -- 预计工时（最多25分）
  IF p_estimated_hours IS NOT NULL THEN
    complexity_score := complexity_score + LEAST(p_estimated_hours / 2, 25);
  END IF;

  RETURN LEAST(complexity_score, 100);
END;
$$ LANGUAGE plpgsql;

-- 7. 创建函数：获取市场基准价格
CREATE OR REPLACE FUNCTION get_market_benchmark(
  p_category VARCHAR(100),
  p_difficulty VARCHAR(50)
)
RETURNS TABLE(
  avg_price DECIMAL(10, 2),
  median_price DECIMAL(10, 2),
  min_price DECIMAL(10, 2),
  max_price DECIMAL(10, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.avg_price,
    b.median_price,
    b.min_price,
    b.max_price
  FROM market_price_benchmarks b
  WHERE b.category = p_category
    AND b.difficulty_level = p_difficulty
    AND b.period_end >= CURRENT_DATE - INTERVAL '90 days'
  ORDER BY b.period_end DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 8. 创建函数：更新市场基准价格（定期执行）
CREATE OR REPLACE FUNCTION update_market_benchmarks()
RETURNS void AS $$
DECLARE
  cat RECORD;
BEGIN
  -- 遍历所有分类和难度组合
  FOR cat IN
    SELECT DISTINCT category, difficulty_level
    FROM tasks
    WHERE status = 'completed'
      AND completed_at >= CURRENT_DATE - INTERVAL '90 days'
  LOOP
    -- 插入或更新基准价格
    INSERT INTO market_price_benchmarks (
      category,
      difficulty_level,
      avg_price,
      median_price,
      min_price,
      max_price,
      price_std_dev,
      sample_count,
      avg_completion_time_hours,
      avg_quality_score,
      period_start,
      period_end
    )
    SELECT
      cat.category,
      cat.difficulty_level,
      AVG(budget_max),
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY budget_max),
      MIN(budget_max),
      MAX(budget_max),
      STDDEV(budget_max),
      COUNT(*),
      AVG(EXTRACT(EPOCH FROM (completed_at - accepted_at)) / 3600),
      AVG(COALESCE((SELECT AVG(rating) FROM ratings WHERE task_id = tasks.id), 4.0)),
      CURRENT_DATE - INTERVAL '90 days',
      CURRENT_DATE
    FROM tasks
    WHERE category = cat.category
      AND difficulty_level = cat.difficulty_level
      AND status = 'completed'
      AND completed_at >= CURRENT_DATE - INTERVAL '90 days'
    ON CONFLICT (category, difficulty_level, period_start, period_end)
    DO UPDATE SET
      avg_price = EXCLUDED.avg_price,
      median_price = EXCLUDED.median_price,
      min_price = EXCLUDED.min_price,
      max_price = EXCLUDED.max_price,
      price_std_dev = EXCLUDED.price_std_dev,
      sample_count = EXCLUDED.sample_count,
      avg_completion_time_hours = EXCLUDED.avg_completion_time_hours,
      avg_quality_score = EXCLUDED.avg_quality_score,
      updated_at = NOW();
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 9. 创建触发器：任务完成后更新定价历史
CREATE OR REPLACE FUNCTION update_pricing_history_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE pricing_history
    SET task_completed = true,
        task_completed_at = NOW(),
        final_price = NEW.budget_max,
        completion_quality_score = (
          SELECT AVG(rating)::INTEGER
          FROM ratings
          WHERE task_id = NEW.id
        )
    WHERE task_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pricing_history
AFTER UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_pricing_history_on_completion();

-- 10. 创建视图：定价准确度分析
CREATE OR REPLACE VIEW pricing_accuracy_analysis AS
SELECT
  ph.task_category,
  ph.task_difficulty,
  COUNT(*) as total_tasks,
  AVG(ph.ai_confidence_score) as avg_confidence,
  AVG(ABS(ph.price_deviation)) as avg_deviation,
  AVG(CASE WHEN ph.market_response = 'hot' THEN 1 ELSE 0 END) as hot_rate,
  AVG(CASE WHEN ph.task_completed THEN 1 ELSE 0 END) as completion_rate,
  AVG(ph.completion_quality_score) as avg_quality
FROM pricing_history ph
WHERE ph.created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY ph.task_category, ph.task_difficulty;

COMMENT ON TABLE pricing_history IS '定价历史记录 - 用于AI模型训练和改进';
COMMENT ON TABLE market_price_benchmarks IS '市场价格基准 - 各类别任务的市场价格统计';
COMMENT ON TABLE pricing_factors IS '定价因子权重 - AI定价模型的参数';
COMMENT ON FUNCTION calculate_task_complexity IS '计算任务复杂度分数（0-100）';
COMMENT ON FUNCTION get_market_benchmark IS '获取指定分类和难度的市场基准价格';
COMMENT ON FUNCTION update_market_benchmarks IS '更新市场基准价格（定期执行）';
