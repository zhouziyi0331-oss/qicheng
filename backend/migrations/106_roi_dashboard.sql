-- E-17: ROI投入产出看板
-- 提供企业投入产出分析，对比全职雇佣成本

-- 企业财务统计表
CREATE TABLE IF NOT EXISTS company_financial_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES users(id),
  
  -- 统计周期
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  
  -- 投入统计
  total_spent DECIMAL(10,2) DEFAULT 0,           -- 总花费
  platform_fees DECIMAL(10,2) DEFAULT 0,         -- 平台服务费
  task_payments DECIMAL(10,2) DEFAULT 0,         -- 任务支付
  
  -- 任务统计
  tasks_published INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  tasks_cancelled INTEGER DEFAULT 0,
  
  -- 平均成本
  avg_task_cost DECIMAL(10,2),
  avg_hourly_rate DECIMAL(10,2),
  
  -- ROI指标
  estimated_market_cost DECIMAL(10,2),           -- 市场参考价格
  cost_savings DECIMAL(10,2),                    -- 节省金额
  roi_percentage DECIMAL(5,2),                   -- ROI百分比
  
  -- 时间统计
  total_task_hours DECIMAL(10,2),
  avg_completion_days DECIMAL(5,1),
  
  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_company_month_stats UNIQUE(company_id, year, month)
);

CREATE INDEX idx_financial_stats_company ON company_financial_stats(company_id, year DESC, month DESC);
CREATE INDEX idx_financial_stats_period ON company_financial_stats(year, month);

-- 市场价格参考表
CREATE TABLE IF NOT EXISTS market_price_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 技能和级别
  skill_category VARCHAR(100) NOT NULL,
  skill_level VARCHAR(50) NOT NULL,  -- 'junior', 'intermediate', 'senior', 'expert'
  
  -- 市场价格（元/小时）
  market_hourly_rate DECIMAL(8,2) NOT NULL,
  platform_avg_rate DECIMAL(8,2),
  
  -- 全职成本参考（元/月）
  fulltime_monthly_cost DECIMAL(10,2),
  
  -- 有效期
  valid_from DATE NOT NULL,
  valid_to DATE,
  
  -- 数据来源
  source VARCHAR(100),
  region VARCHAR(50) DEFAULT '全国',
  
  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_skill_benchmark UNIQUE(skill_category, skill_level, valid_from)
);

CREATE INDEX idx_benchmarks_skill ON market_price_benchmarks(skill_category, skill_level);
CREATE INDEX idx_benchmarks_valid ON market_price_benchmarks(valid_from, valid_to);

-- 成本对比分析表
CREATE TABLE IF NOT EXISTS cost_comparison_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES users(id),
  
  -- 分析周期
  analysis_period VARCHAR(20) NOT NULL,  -- 'monthly', 'quarterly', 'yearly'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- 实际成本
  actual_total_cost DECIMAL(10,2) NOT NULL,
  actual_task_count INTEGER NOT NULL,
  actual_total_hours DECIMAL(10,2),
  
  -- 对比场景
  comparison_scenarios JSONB NOT NULL,
  -- {
  --   "fulltime_hire": {
  --     "cost": 50000,
  --     "description": "雇佣1名全职中级开发",
  --     "savings": 20000,
  --     "savings_percentage": 40
  --   },
  --   "outsourcing": {
  --     "cost": 40000,
  --     "description": "外包公司报价",
  --     "savings": 10000,
  --     "savings_percentage": 25
  --   }
  -- }
  
  -- ROI计算
  total_savings DECIMAL(10,2),
  roi_percentage DECIMAL(5,2),
  
  -- 效率指标
  efficiency_metrics JSONB,
  -- {
  --   "avg_response_time": "2小时",
  --   "avg_completion_time": "5天",
  --   "success_rate": 0.92
  -- }
  
  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cost_analyses_company ON cost_comparison_analyses(company_id, start_date DESC);
CREATE INDEX idx_cost_analyses_period ON cost_comparison_analyses(analysis_period, start_date);

-- 初始化市场价格基准
INSERT INTO market_price_benchmarks (id, skill_category, skill_level, market_hourly_rate, platform_avg_rate, fulltime_monthly_cost, valid_from, source) VALUES
(gen_random_uuid(), '前端开发', 'junior', 80, 60, 8000, '2024-01-01', '市场调研'),
(gen_random_uuid(), '前端开发', 'intermediate', 120, 90, 12000, '2024-01-01', '市场调研'),
(gen_random_uuid(), '前端开发', 'senior', 180, 130, 18000, '2024-01-01', '市场调研'),
(gen_random_uuid(), '后端开发', 'junior', 90, 70, 9000, '2024-01-01', '市场调研'),
(gen_random_uuid(), '后端开发', 'intermediate', 130, 100, 13000, '2024-01-01', '市场调研'),
(gen_random_uuid(), '后端开发', 'senior', 200, 150, 20000, '2024-01-01', '市场调研'),
(gen_random_uuid(), 'UI设计', 'junior', 70, 50, 7000, '2024-01-01', '市场调研'),
(gen_random_uuid(), 'UI设计', 'intermediate', 110, 80, 11000, '2024-01-01', '市场调研'),
(gen_random_uuid(), 'UI设计', 'senior', 160, 120, 16000, '2024-01-01', '市场调研'),
(gen_random_uuid(), '全栈开发', 'intermediate', 150, 110, 15000, '2024-01-01', '市场调研'),
(gen_random_uuid(), '全栈开发', 'senior', 220, 160, 22000, '2024-01-01', '市场调研'),
(gen_random_uuid(), '移动开发', 'intermediate', 140, 105, 14000, '2024-01-01', '市场调研'),
(gen_random_uuid(), '移动开发', 'senior', 210, 155, 21000, '2024-01-01', '市场调研')
ON CONFLICT (skill_category, skill_level, valid_from) DO NOTHING;

-- ROI看板视图
CREATE OR REPLACE VIEW roi_dashboard_view AS
SELECT
  cfs.company_id,
  cfs.year,
  cfs.month,
  cfs.total_spent,
  cfs.tasks_completed,
  cfs.avg_task_cost,
  cfs.estimated_market_cost,
  cfs.cost_savings,
  cfs.roi_percentage,
  cfs.total_task_hours,
  c.company_name,
  -- 累计统计
  SUM(cfs.total_spent) OVER (PARTITION BY cfs.company_id ORDER BY cfs.year, cfs.month) as cumulative_spent,
  SUM(cfs.cost_savings) OVER (PARTITION BY cfs.company_id ORDER BY cfs.year, cfs.month) as cumulative_savings
FROM company_financial_stats cfs
JOIN users c ON cfs.company_id = c.id;

-- 触发器：任务完成时更新财务统计
CREATE OR REPLACE FUNCTION trigger_update_financial_stats()
RETURNS trigger AS $$
DECLARE
  v_year INTEGER;
  v_month INTEGER;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    v_year := EXTRACT(YEAR FROM NEW.completed_at);
    v_month := EXTRACT(MONTH FROM NEW.completed_at);
    
    -- 更新或创建月度统计
    INSERT INTO company_financial_stats (id, company_id, year, month, total_spent, task_payments, tasks_completed)
    VALUES (gen_random_uuid(), NEW.company_id, v_year, v_month, NEW.budget, NEW.budget, 1)
    ON CONFLICT (company_id, year, month) DO UPDATE
    SET total_spent = company_financial_stats.total_spent + NEW.budget,
        task_payments = company_financial_stats.task_payments + NEW.budget,
        tasks_completed = company_financial_stats.tasks_completed + 1,
        updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_task_completion_update_stats
AFTER UPDATE ON tasks
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION trigger_update_financial_stats();

-- 注释
COMMENT ON TABLE company_financial_stats IS 'E-17: 企业财务统计表，追踪投入产出数据';
COMMENT ON TABLE market_price_benchmarks IS 'E-17: 市场价格参考表，用于成本对比';
COMMENT ON TABLE cost_comparison_analyses IS 'E-17: 成本对比分析表，生成ROI报告';
COMMENT ON VIEW roi_dashboard_view IS 'E-17: ROI看板视图，展示投入产出概览';
