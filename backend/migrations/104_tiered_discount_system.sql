-- E-13: 阶梯优惠系统
-- 根据企业月度发布任务数量，自动享受阶梯折扣

-- 折扣阶梯配置表
CREATE TABLE IF NOT EXISTS discount_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_level INTEGER UNIQUE NOT NULL,
  tasks_threshold INTEGER NOT NULL,  -- 任务数量阈值
  
  -- 折扣配置
  discount_rate DECIMAL(3,2) NOT NULL CHECK (discount_rate BETWEEN 0 AND 1),
  -- 0.05 = 5%折扣，0.1 = 10%折扣
  
  service_fee_rate DECIMAL(3,2) NOT NULL CHECK (service_fee_rate BETWEEN 0 AND 1),
  -- 平台服务费率（正常是5%）
  
  -- 阶梯信息
  tier_name VARCHAR(50) NOT NULL,
  tier_description TEXT,
  tier_color VARCHAR(20),  -- 用于UI展示
  tier_icon VARCHAR(50),
  
  -- 额外权益
  benefits JSONB DEFAULT '[]',
  -- [
  --   {"benefit": "优先推荐", "description": "任务优先推送给优质学生"},
  --   {"benefit": "专属客服", "description": "1对1专属客服支持"}
  -- ]
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_discount_tiers_level ON discount_tiers(tier_level) WHERE is_active = true;
CREATE INDEX idx_discount_tiers_threshold ON discount_tiers(tasks_threshold) WHERE is_active = true;

-- 企业月度统计表
CREATE TABLE IF NOT EXISTS company_monthly_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES users(id),
  
  -- 统计周期
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  
  -- 任务统计
  tasks_published INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  tasks_cancelled INTEGER DEFAULT 0,
  
  -- 金额统计
  total_spent DECIMAL(10,2) DEFAULT 0,
  total_saved DECIMAL(10,2) DEFAULT 0,  -- 通过折扣节省的金额
  
  -- 当前阶梯
  current_tier_level INTEGER DEFAULT 0,
  current_discount_rate DECIMAL(3,2) DEFAULT 0,
  
  -- 下一阶梯
  next_tier_level INTEGER,
  next_tier_threshold INTEGER,
  tasks_to_next_tier INTEGER,
  
  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_company_month UNIQUE(company_id, year, month)
);

CREATE INDEX idx_monthly_stats_company ON company_monthly_stats(company_id, year DESC, month DESC);
CREATE INDEX idx_monthly_stats_period ON company_monthly_stats(year, month);

-- 折扣应用记录表
CREATE TABLE IF NOT EXISTS discount_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),
  company_id UUID NOT NULL REFERENCES users(id),
  
  -- 应用的折扣
  tier_level INTEGER NOT NULL,
  discount_rate DECIMAL(3,2) NOT NULL,
  
  -- 金额
  original_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  final_amount DECIMAL(10,2) NOT NULL,
  
  -- 计算详情
  calculation_details JSONB,
  
  -- 元数据
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_discount_applications_company ON discount_applications(company_id, applied_at DESC);
CREATE INDEX idx_discount_applications_task ON discount_applications(task_id);

-- 初始化默认折扣阶梯
INSERT INTO discount_tiers (id, tier_level, tasks_threshold, discount_rate, service_fee_rate, tier_name, tier_description, tier_color, tier_icon, benefits) VALUES
(gen_random_uuid(), 0, 0, 0, 0.05, '新手', '刚开始使用平台', '#94A3B8', '🌱', '[]'::jsonb),
(gen_random_uuid(), 1, 5, 0.05, 0.045, '铜牌', '月发布5个任务', '#CD7F32', '🥉', '[{"benefit": "5%折扣", "description": "服务费从5%降至4.5%"}]'::jsonb),
(gen_random_uuid(), 2, 10, 0.10, 0.04, '银牌', '月发布10个任务', '#C0C0C0', '🥈', '[{"benefit": "10%折扣", "description": "服务费从5%降至4%"}, {"benefit": "优先推荐", "description": "任务优先推送"}]'::jsonb),
(gen_random_uuid(), 3, 20, 0.15, 0.035, '金牌', '月发布20个任务', '#FFD700', '🥇', '[{"benefit": "15%折扣", "description": "服务费从5%降至3.5%"}, {"benefit": "优先推荐", "description": "任务优先推送"}, {"benefit": "专属客服", "description": "1对1客服支持"}]'::jsonb),
(gen_random_uuid(), 4, 50, 0.20, 0.03, '白金', '月发布50个任务', '#E5E4E2', '💎', '[{"benefit": "20%折扣", "description": "服务费从5%降至3%"}, {"benefit": "优先推荐", "description": "任务优先推送"}, {"benefit": "专属客服", "description": "1对1客服支持"}, {"benefit": "数据分析", "description": "月度数据报告"}]'::jsonb)
ON CONFLICT (tier_level) DO NOTHING;

-- 计算企业当前阶梯的函数
CREATE OR REPLACE FUNCTION calculate_company_tier(p_company_id UUID, p_year INTEGER, p_month INTEGER)
RETURNS TABLE(
  tier_level INTEGER,
  tier_name VARCHAR,
  discount_rate DECIMAL,
  tasks_count INTEGER,
  next_tier_threshold INTEGER,
  tasks_to_next INTEGER
) AS $$
DECLARE
  v_tasks_count INTEGER;
  v_current_tier RECORD;
  v_next_tier RECORD;
BEGIN
  -- 获取当月任务数
  SELECT COALESCE(tasks_published, 0) INTO v_tasks_count
  FROM company_monthly_stats
  WHERE company_id = p_company_id AND year = p_year AND month = p_month;
  
  IF v_tasks_count IS NULL THEN
    v_tasks_count := 0;
  END IF;
  
  -- 找到当前阶梯（任务数>=阈值的最高阶梯）
  SELECT * INTO v_current_tier
  FROM discount_tiers
  WHERE is_active = true AND tasks_threshold <= v_tasks_count
  ORDER BY tier_level DESC
  LIMIT 1;
  
  IF v_current_tier IS NULL THEN
    -- 如果没有匹配，使用0级
    SELECT * INTO v_current_tier FROM discount_tiers WHERE tier_level = 0 LIMIT 1;
  END IF;
  
  -- 找到下一阶梯
  SELECT * INTO v_next_tier
  FROM discount_tiers
  WHERE is_active = true AND tier_level > v_current_tier.tier_level
  ORDER BY tier_level ASC
  LIMIT 1;
  
  RETURN QUERY SELECT
    v_current_tier.tier_level,
    v_current_tier.tier_name,
    v_current_tier.discount_rate,
    v_tasks_count,
    v_next_tier.tasks_threshold,
    GREATEST(0, v_next_tier.tasks_threshold - v_tasks_count);
END;
$$ LANGUAGE plpgsql;

-- 触发器：任务发布时更新月度统计
CREATE OR REPLACE FUNCTION trigger_update_monthly_stats_on_publish()
RETURNS trigger AS $$
DECLARE
  v_year INTEGER;
  v_month INTEGER;
BEGIN
  v_year := EXTRACT(YEAR FROM NOW());
  v_month := EXTRACT(MONTH FROM NOW());
  
  -- 插入或更新月度统计
  INSERT INTO company_monthly_stats (id, company_id, year, month, tasks_published)
  VALUES (gen_random_uuid(), NEW.company_id, v_year, v_month, 1)
  ON CONFLICT (company_id, year, month) DO UPDATE
  SET tasks_published = company_monthly_stats.tasks_published + 1,
      updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_task_publish_update_stats
AFTER INSERT ON tasks
FOR EACH ROW
WHEN (NEW.status = 'published')
EXECUTE FUNCTION trigger_update_monthly_stats_on_publish();

-- 视图：企业折扣进度概览
CREATE OR REPLACE VIEW company_discount_progress AS
SELECT
  cms.company_id,
  cms.year,
  cms.month,
  cms.tasks_published,
  cms.current_tier_level,
  dt.tier_name as current_tier_name,
  dt.discount_rate as current_discount_rate,
  dt.tier_icon as current_tier_icon,
  cms.total_saved,
  cms.next_tier_level,
  cms.next_tier_threshold,
  cms.tasks_to_next_tier,
  ndt.tier_name as next_tier_name,
  ndt.discount_rate as next_discount_rate
FROM company_monthly_stats cms
LEFT JOIN discount_tiers dt ON cms.current_tier_level = dt.tier_level
LEFT JOIN discount_tiers ndt ON cms.next_tier_level = ndt.tier_level;

-- 注释
COMMENT ON TABLE discount_tiers IS 'E-13: 折扣阶梯配置表，定义不同任务量的折扣等级';
COMMENT ON TABLE company_monthly_stats IS 'E-13: 企业月度统计表，追踪任务数和折扣进度';
COMMENT ON TABLE discount_applications IS 'E-13: 折扣应用记录表，记录每次折扣使用';
COMMENT ON VIEW company_discount_progress IS 'E-13: 企业折扣进度视图，展示当前等级和下一等级';
