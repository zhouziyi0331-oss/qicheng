-- Phase 3.4: 需求自动拆解推送
-- 企业发布大需求，系统自动拆解成小任务，精准推送给合适的学生

-- 需求拆解记录表
CREATE TABLE IF NOT EXISTS demand_decompositions (
  id VARCHAR(255) PRIMARY KEY,
  original_demand_id VARCHAR(255) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  company_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  decomposition_strategy VARCHAR(50) DEFAULT 'ai_based', -- 'ai_based', 'template_based', 'manual'
  total_subtasks INTEGER DEFAULT 0,
  completed_subtasks INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'cancelled'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 子任务表
CREATE TABLE IF NOT EXISTS subtasks (
  id VARCHAR(255) PRIMARY KEY,
  decomposition_id VARCHAR(255) NOT NULL REFERENCES demand_decompositions(id) ON DELETE CASCADE,
  parent_task_id VARCHAR(255) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  subtask_title VARCHAR(500) NOT NULL,
  subtask_description TEXT NOT NULL,
  subtask_type VARCHAR(100), -- 任务类型（前端、后端、设计等）
  required_skills TEXT[], -- 所需技能
  difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  estimated_hours DECIMAL(5, 2), -- 预计工时
  subtask_order INTEGER, -- 任务顺序
  dependencies TEXT[], -- 依赖的其他子任务ID
  budget_allocation DECIMAL(10, 2), -- 分配的预算
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'pushed', 'accepted', 'in_progress', 'completed', 'failed'
  assigned_student_id VARCHAR(255) REFERENCES users(user_id) ON DELETE SET NULL,
  push_count INTEGER DEFAULT 0, -- 推送次数
  acceptance_rate DECIMAL(3, 2), -- 接受率
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 子任务推送记录表
CREATE TABLE IF NOT EXISTS subtask_push_records (
  id SERIAL PRIMARY KEY,
  subtask_id VARCHAR(255) NOT NULL REFERENCES subtasks(id) ON DELETE CASCADE,
  student_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  match_score DECIMAL(5, 2), -- 匹配分数 0-100
  match_reasons JSONB, -- 匹配原因详情
  push_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  response_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'ignored'
  response_time TIMESTAMP,
  rejection_reason TEXT
);

-- 推送策略配置表
CREATE TABLE IF NOT EXISTS push_strategies (
  id SERIAL PRIMARY KEY,
  company_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  strategy_name VARCHAR(200) NOT NULL,
  strategy_config JSONB NOT NULL, -- 推送策略配置
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 任务拆解模板表
CREATE TABLE IF NOT EXISTS decomposition_templates (
  id SERIAL PRIMARY KEY,
  template_name VARCHAR(200) NOT NULL,
  task_category VARCHAR(100) NOT NULL, -- 任务类别
  template_structure JSONB NOT NULL, -- 模板结构
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(3, 2), -- 成功率
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_demand_decompositions_original ON demand_decompositions(original_demand_id);
CREATE INDEX IF NOT EXISTS idx_demand_decompositions_company ON demand_decompositions(company_id);
CREATE INDEX IF NOT EXISTS idx_demand_decompositions_status ON demand_decompositions(status);

CREATE INDEX IF NOT EXISTS idx_subtasks_decomposition ON subtasks(decomposition_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_parent_task ON subtasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_status ON subtasks(status);
CREATE INDEX IF NOT EXISTS idx_subtasks_assigned_student ON subtasks(assigned_student_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_skills ON subtasks USING GIN(required_skills);

CREATE INDEX IF NOT EXISTS idx_subtask_push_records_subtask ON subtask_push_records(subtask_id);
CREATE INDEX IF NOT EXISTS idx_subtask_push_records_student ON subtask_push_records(student_id);
CREATE INDEX IF NOT EXISTS idx_subtask_push_records_response_status ON subtask_push_records(response_status);
CREATE INDEX IF NOT EXISTS idx_subtask_push_records_push_time ON subtask_push_records(push_time DESC);

CREATE INDEX IF NOT EXISTS idx_push_strategies_company ON push_strategies(company_id);
CREATE INDEX IF NOT EXISTS idx_push_strategies_active ON push_strategies(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_decomposition_templates_category ON decomposition_templates(task_category);

-- 评论
COMMENT ON TABLE demand_decompositions IS '需求拆解记录表，记录大需求如何被拆解成小任务';
COMMENT ON COLUMN demand_decompositions.decomposition_strategy IS '拆解策略：ai_based(AI拆解), template_based(模板拆解), manual(人工拆解)';

COMMENT ON TABLE subtasks IS '子任务表，存储拆解后的小任务';
COMMENT ON COLUMN subtasks.dependencies IS '依赖的其他子任务ID数组';
COMMENT ON COLUMN subtasks.acceptance_rate IS '该子任务被推送后的接受率';

COMMENT ON TABLE subtask_push_records IS '子任务推送记录，记录每次推送给学生的情况';
COMMENT ON COLUMN subtask_push_records.match_score IS '匹配分数 0-100，越高越匹配';
COMMENT ON COLUMN subtask_push_records.match_reasons IS '匹配原因JSON：{opc_match: 30, skill_match: 40, experience_match: 20, availability: 10}';

COMMENT ON TABLE push_strategies IS '推送策略配置表';
COMMENT ON COLUMN push_strategies.strategy_config IS '推送策略配置JSON';

COMMENT ON TABLE decomposition_templates IS '任务拆解模板表，存储常用的拆解模式';
COMMENT ON COLUMN decomposition_templates.template_structure IS '模板结构JSON，定义如何拆解任务';
