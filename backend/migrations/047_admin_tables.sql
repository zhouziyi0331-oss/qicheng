-- 管理端核心表
-- 创建时间：2026-04-16

-- 1. 角色表（先创建，因为admin_users需要引用它）
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name VARCHAR(50) UNIQUE NOT NULL,
  role_code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 管理员账号表
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  real_name VARCHAR(50),
  email VARCHAR(100),
  phone VARCHAR(20),
  role_id UUID REFERENCES admin_roles(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  last_login_at TIMESTAMP,
  last_login_ip VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES admin_users(id),
  updated_by UUID REFERENCES admin_users(id)
);

-- 3. 权限表（可选，如果需要更细粒度的权限控制）
CREATE TABLE IF NOT EXISTS admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_name VARCHAR(100) NOT NULL,
  permission_code VARCHAR(100) UNIQUE NOT NULL,
  module VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. AI调用日志表（用于成本统计和效果评估）
CREATE TABLE IF NOT EXISTS ai_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engine_name VARCHAR(50) NOT NULL, -- AI-01 到 AI-06
  model_name VARCHAR(100) NOT NULL, -- deepseek-chat, gpt-4o-mini 等
  user_id UUID REFERENCES users(id),
  user_type VARCHAR(20), -- student/company/system
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  cost_yuan DECIMAL(10, 4), -- 成本（元）
  duration_ms INTEGER, -- 耗时（毫秒）
  status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed')),
  error_message TEXT,
  request_data JSONB, -- 输入内容
  response_data JSONB, -- 输出内容
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. 导师工具提示库表
CREATE TABLE IF NOT EXISTS mentor_tool_hints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_type VARCHAR(50), -- 项目类型
  task_stage VARCHAR(50), -- 任务阶段
  tool_name VARCHAR(100) NOT NULL, -- 工具名称
  hint_content TEXT NOT NULL, -- 提示内容
  example_prompt TEXT, -- 示例Prompt
  priority INTEGER DEFAULT 0, -- 优先级
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES admin_users(id)
);

-- 6. 导师成长观察记录表
CREATE TABLE IF NOT EXISTS mentor_growth_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) NOT NULL,
  task_id UUID REFERENCES tasks(id),
  observation_type VARCHAR(50) NOT NULL, -- stuck_point/breakthrough/pattern
  observation_content TEXT NOT NULL,
  context JSONB, -- 上下文信息
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. 收入流水表（如果不存在）
CREATE TABLE IF NOT EXISTS income_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  task_id UUID REFERENCES tasks(id),
  amount DECIMAL(10, 2) NOT NULL,
  type VARCHAR(50) NOT NULL, -- income/withdrawal/platform_advance
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'settled', 'withdrawn')),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  settled_at TIMESTAMP,
  withdrawn_at TIMESTAMP
);

-- 8. 系统配置表（如果不存在，但你已有system_config）
-- 跳过，使用现有的system_config表

-- 9. 公告表
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  target_audience VARCHAR(50) DEFAULT 'all' CHECK (target_audience IN ('all', 'student', 'company')),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  publish_at TIMESTAMP,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_count INTEGER DEFAULT 0
);

-- 10. 帮助文档表
CREATE TABLE IF NOT EXISTS help_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  view_count INTEGER DEFAULT 0
);

-- 创建索引
CREATE INDEX idx_admin_users_username ON admin_users(username);
CREATE INDEX idx_admin_users_role_id ON admin_users(role_id);
CREATE INDEX idx_admin_users_status ON admin_users(status);

CREATE INDEX idx_ai_call_logs_engine ON ai_call_logs(engine_name);
CREATE INDEX idx_ai_call_logs_user ON ai_call_logs(user_id);
CREATE INDEX idx_ai_call_logs_created_at ON ai_call_logs(created_at);
CREATE INDEX idx_ai_call_logs_status ON ai_call_logs(status);

CREATE INDEX idx_mentor_tool_hints_project_type ON mentor_tool_hints(project_type);
CREATE INDEX idx_mentor_tool_hints_tool_name ON mentor_tool_hints(tool_name);

CREATE INDEX idx_mentor_growth_observations_student ON mentor_growth_observations(student_id);
CREATE INDEX idx_mentor_growth_observations_task ON mentor_growth_observations(task_id);
CREATE INDEX idx_mentor_growth_observations_type ON mentor_growth_observations(observation_type);

CREATE INDEX idx_income_records_user ON income_records(user_id);
CREATE INDEX idx_income_records_task ON income_records(task_id);
CREATE INDEX idx_income_records_type ON income_records(type);
CREATE INDEX idx_income_records_status ON income_records(status);

CREATE INDEX idx_announcements_status ON announcements(status);
CREATE INDEX idx_announcements_target ON announcements(target_audience);
CREATE INDEX idx_announcements_publish_at ON announcements(publish_at);

CREATE INDEX idx_help_documents_category ON help_documents(category);
CREATE INDEX idx_help_documents_status ON help_documents(status);

-- 插入默认角色
INSERT INTO admin_roles (role_name, role_code, description, permissions) VALUES
('超级管理员', 'super_admin', '拥有全部权限', '["*"]'),
('运营专员', 'operator', '负责学生/企业管理、项目审核、订单监控', '["student:*", "company:*", "task:*", "order:*", "content:*"]'),
('审核专员', 'reviewer', '负责企业认证、项目审核、内容审核', '["company:review", "task:review", "content:review"]'),
('财务专员', 'finance', '负责财务管理、提现审核', '["finance:*"]'),
('技术专员', 'tech', '负责AI引擎管理、系统配置', '["ai:*", "system:*"]')
ON CONFLICT (role_code) DO NOTHING;

-- 插入默认超级管理员账号（密码：admin123456，需要在应用层用bcrypt加密）
-- 注意：这里的password_hash需要在应用层生成
-- INSERT INTO admin_users (username, password_hash, real_name, role_id, status)
-- SELECT 'admin', '$2a$10$...', '系统管理员', id, 'active'
-- FROM admin_roles WHERE role_code = 'super_admin';

COMMENT ON TABLE admin_users IS '管理员账号表';
COMMENT ON TABLE admin_roles IS '管理员角色表';
COMMENT ON TABLE admin_permissions IS '权限表';
COMMENT ON TABLE ai_call_logs IS 'AI调用日志表，用于成本统计和效果评估';
COMMENT ON TABLE mentor_tool_hints IS '导师工具提示库';
COMMENT ON TABLE mentor_growth_observations IS '导师成长观察记录';
COMMENT ON TABLE income_records IS '收入流水表';
COMMENT ON TABLE announcements IS '公告表';
COMMENT ON TABLE help_documents IS '帮助文档表';
