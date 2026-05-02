-- OPC孵化计划
-- Lv.4（自流者）解锁，帮助学生独立发展

-- OPC孵化表
CREATE TABLE IF NOT EXISTS opc_incubation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'applying', -- 'applying', 'incubating', 'graduated'
  passion_direction TEXT, -- 热情方向
  team_members UUID[], -- 联合体成员ID数组
  monthly_updates JSONB[] DEFAULT '{}', -- 每月更新记录
  graduation_date TIMESTAMP, -- 毕业时间
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id)
);

-- 孵化月度更新记录
CREATE TABLE IF NOT EXISTS incubation_monthly_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incubation_id UUID NOT NULL REFERENCES opc_incubation(id) ON DELETE CASCADE,
  update_month VARCHAR(7) NOT NULL, -- 格式：2024-01
  growth_summary TEXT, -- 成长总结
  exploration_stories TEXT, -- 探索故事
  challenges_faced TEXT, -- 遇到的挑战
  next_month_plan TEXT, -- 下月计划
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 孵化资源对接记录
CREATE TABLE IF NOT EXISTS incubation_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incubation_id UUID NOT NULL REFERENCES opc_incubation(id) ON DELETE CASCADE,
  resource_type VARCHAR(50) NOT NULL, -- 'investor', 'mentor', 'venue', 'tool'
  resource_name VARCHAR(200) NOT NULL,
  resource_description TEXT,
  contact_info TEXT,
  connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_opc_incubation_student ON opc_incubation(student_id);
CREATE INDEX IF NOT EXISTS idx_opc_incubation_status ON opc_incubation(status);
CREATE INDEX IF NOT EXISTS idx_incubation_monthly_updates_incubation ON incubation_monthly_updates(incubation_id);
CREATE INDEX IF NOT EXISTS idx_incubation_resources_incubation ON incubation_resources(incubation_id);

-- 触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_opc_incubation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS opc_incubation_updated_at_trigger ON opc_incubation;
CREATE TRIGGER opc_incubation_updated_at_trigger
BEFORE UPDATE ON opc_incubation
FOR EACH ROW
EXECUTE FUNCTION update_opc_incubation_updated_at();
