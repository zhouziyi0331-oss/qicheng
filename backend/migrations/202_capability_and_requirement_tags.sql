-- ============================================
-- Phase 3 & 4: 能力积累标签 + 需求拆解标签
-- Migration: 202_capability_and_requirement_tags.sql
-- 说明: 动态标签系统，从任务中生成
-- ============================================

-- ============================================
-- 1. 能力积累标签表 (Phase 3)
-- ============================================

-- 1.1 工具使用记录表
CREATE TABLE IF NOT EXISTS student_tool_usage (
  id SERIAL PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 工具信息
  tool_name VARCHAR(100) NOT NULL, -- 'ChatGPT', 'Midjourney', '剪映', 'Excel'...
  tool_category VARCHAR(50), -- 'ai_tool', 'design_tool', 'office_tool', 'dev_tool'
  
  -- 使用情况
  proficiency_level VARCHAR(20) DEFAULT 'basic', -- 'basic', 'intermediate', 'advanced', 'expert'
  usage_count INTEGER DEFAULT 1,
  total_hours DECIMAL(10, 2) DEFAULT 0,
  
  -- 具体能力点
  capabilities JSONB, -- {"prompt_design": true, "few_shot": true, "multi_round": false}
  
  -- 最近使用
  first_used_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP DEFAULT NOW(),
  
  -- 验证来源
  verified_by_tasks UUID[], -- 通过哪些任务验证的
  
  UNIQUE(student_id, tool_name)
);

CREATE INDEX idx_student_tool_student ON student_tool_usage(student_id);
CREATE INDEX idx_student_tool_name ON student_tool_usage(tool_name);
CREATE INDEX idx_student_tool_proficiency ON student_tool_usage(proficiency_level);

COMMENT ON TABLE student_tool_usage IS '学生工具使用记录（从任务中动态积累）';
COMMENT ON COLUMN student_tool_usage.capabilities IS '具体能力点（JSONB），如ChatGPT的prompt设计、few-shot等';

-- 1.2 案例经验表
CREATE TABLE IF NOT EXISTS student_case_experience (
  id SERIAL PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 案例分类
  case_category VARCHAR(50) NOT NULL, -- 'ecommerce', 'content', 'agent', 'data_analysis'
  case_subcategory VARCHAR(100), -- 'ecommerce_product_selection', 'video_editing'
  case_type VARCHAR(200), -- '电商_淘宝_选品_母婴类', '短视频_美食探店_剪辑'
  
  -- 经验积累
  experience_count INTEGER DEFAULT 1, -- 做过几次
  quality_avg DECIMAL(3, 2), -- 平均质量评分 0-5
  
  -- 相关任务
  task_ids UUID[], -- 相关任务ID数组
  
  -- 元数据
  first_done_at TIMESTAMP DEFAULT NOW(),
  last_done_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(student_id, case_type)
);

CREATE INDEX idx_case_experience_student ON student_case_experience(student_id);
CREATE INDEX idx_case_experience_category ON student_case_experience(case_category);
CREATE INDEX idx_case_experience_type ON student_case_experience(case_type);

COMMENT ON TABLE student_case_experience IS '学生案例经验（从完成的任务中提取）';
COMMENT ON COLUMN student_case_experience.case_type IS '具体案例类型，如"电商_淘宝_选品_母婴类"';

-- 1.3 业务理解深度表
CREATE TABLE IF NOT EXISTS student_domain_understanding (
  id SERIAL PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 业务领域
  domain VARCHAR(100) NOT NULL, -- 'ecommerce', 'content_creation', 'agent_application'
  domain_aspect VARCHAR(200), -- '电商选品逻辑', '短视频算法理解', 'Agent工作流设计'
  
  -- 理解深度
  understanding_level VARCHAR(20) DEFAULT 'basic', -- 'basic', 'intermediate', 'advanced', 'expert'
  confidence DECIMAL(3, 2) DEFAULT 0.5,
  
  -- 从哪些任务中体现
  demonstrated_in_tasks UUID[], -- 任务ID数组
  
  -- 元数据
  first_demonstrated_at TIMESTAMP DEFAULT NOW(),
  last_demonstrated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(student_id, domain, domain_aspect)
);

CREATE INDEX idx_domain_understanding_student ON student_domain_understanding(student_id);
CREATE INDEX idx_domain_understanding_domain ON student_domain_understanding(domain);
CREATE INDEX idx_domain_understanding_level ON student_domain_understanding(understanding_level);

COMMENT ON TABLE student_domain_understanding IS '学生业务理解深度（从任务表现推断）';

-- ============================================
-- 2. 需求拆解标签表 (Phase 4)
-- ============================================

-- 2.1 任务需求拆解表（3层结构）
CREATE TABLE IF NOT EXISTS task_requirement_breakdown (
  id SERIAL PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  
  -- 拆解层级
  level INTEGER NOT NULL CHECK (level IN (1, 2, 3)), -- 1:模块, 2:子任务, 3:具体步骤
  parent_id INTEGER REFERENCES task_requirement_breakdown(id), -- 上级ID
  
  -- 拆解内容
  requirement_name VARCHAR(200) NOT NULL,
  requirement_description TEXT,
  
  -- 顺序和依赖
  sequence_order INTEGER, -- 执行顺序
  dependencies INTEGER[], -- 依赖的其他需求ID
  
  -- 预估
  estimated_hours DECIMAL(5, 2), -- 预估工时
  difficulty_level VARCHAR(20), -- 'easy', 'medium', 'hard', 'expert'
  
  -- 需要的能力
  required_capabilities JSONB, -- 需要什么能力
  /* 示例:
  {
    "talents": ["分析思维强", "细节敏感"],
    "tools": ["ChatGPT", "Excel"],
    "domain_knowledge": ["电商业务流程"],
    "case_experience": ["电商选品"]
  }
  */
  
  -- 状态
  is_mandatory BOOLEAN DEFAULT true, -- 是否必需
  can_be_learned BOOLEAN DEFAULT true, -- 是否可以边做边学
  
  -- 元数据
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_requirement_breakdown_task ON task_requirement_breakdown(task_id);
CREATE INDEX idx_requirement_breakdown_level ON task_requirement_breakdown(level);
CREATE INDEX idx_requirement_breakdown_parent ON task_requirement_breakdown(parent_id);

COMMENT ON TABLE task_requirement_breakdown IS '任务需求3层拆解';
COMMENT ON COLUMN task_requirement_breakdown.level IS '拆解层级: 1=主模块, 2=子任务, 3=具体步骤';
COMMENT ON COLUMN task_requirement_breakdown.required_capabilities IS '需要的能力（JSONB），包括天赋、工具、领域知识、案例经验';

-- 2.2 业务场景标签表（预定义 + 动态扩展）
CREATE TABLE IF NOT EXISTS business_scenario_tags (
  id SERIAL PRIMARY KEY,
  
  -- 场景分类
  category VARCHAR(50) NOT NULL, -- 'ecommerce', 'agent', 'content', 'data', 'marketing'
  subcategory VARCHAR(100), -- 'ecommerce_taobao', 'agent_customer_service'
  
  -- 场景名称
  scenario_name VARCHAR(200) NOT NULL UNIQUE, -- '电商_淘宝_选品_数据选品'
  scenario_name_en VARCHAR(200),
  
  -- 场景描述
  description TEXT,
  typical_deliverables TEXT, -- 典型交付物
  typical_workflow TEXT, -- 典型工作流程
  
  -- 难度和要求
  difficulty_level VARCHAR(20), -- 'beginner', 'intermediate', 'advanced', 'expert'
  estimated_hours_range VARCHAR(50), -- '2-4小时', '1-2天'
  
  -- 需要的能力
  required_talents TEXT[], -- 需要的天赋特质
  required_tools TEXT[], -- 需要的工具
  required_domain_knowledge TEXT[], -- 需要的领域知识
  
  -- 适合人群
  suitable_for TEXT[], -- '零基础小白', '有电商经验', '需要数据分析能力'
  
  -- 标签层级
  parent_id INTEGER REFERENCES business_scenario_tags(id),
  
  -- 使用统计
  usage_count INTEGER DEFAULT 0, -- 被多少任务使用
  
  -- 元数据
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_business_scenario_category ON business_scenario_tags(category);
CREATE INDEX idx_business_scenario_name ON business_scenario_tags(scenario_name);
CREATE INDEX idx_business_scenario_parent ON business_scenario_tags(parent_id);

COMMENT ON TABLE business_scenario_tags IS '业务场景标签（预定义 + 动态扩展）';
COMMENT ON COLUMN business_scenario_tags.scenario_name IS '场景名称，如"电商_淘宝_选品_数据选品"';

-- 2.3 任务场景关联表
CREATE TABLE IF NOT EXISTS task_scenario_tags (
  id SERIAL PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  scenario_tag_id INTEGER NOT NULL REFERENCES business_scenario_tags(id),
  
  -- 权重
  weight DECIMAL(3, 2) DEFAULT 1.0,
  
  -- 元数据
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(task_id, scenario_tag_id)
);

CREATE INDEX idx_task_scenario_task ON task_scenario_tags(task_id);
CREATE INDEX idx_task_scenario_tag ON task_scenario_tags(scenario_tag_id);

-- ============================================
-- 3. 标签提取和匹配辅助表
-- ============================================

-- 3.1 标签提取规则表
CREATE TABLE IF NOT EXISTS tag_extraction_rules (
  id SERIAL PRIMARY KEY,
  
  -- 规则类型
  rule_type VARCHAR(50) NOT NULL, -- 'tool_detection', 'case_extraction', 'domain_inference'
  
  -- 触发条件
  trigger_keywords TEXT[], -- 关键词数组
  trigger_patterns TEXT[], -- 正则表达式数组
  
  -- 提取目标
  extract_to VARCHAR(50) NOT NULL, -- 'tool_usage', 'case_experience', 'domain_understanding'
  extracted_value VARCHAR(200), -- 提取出的值
  
  -- 置信度
  confidence DECIMAL(3, 2) DEFAULT 0.7,
  
  -- 描述
  rule_description TEXT,
  
  -- 元数据
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_extraction_rules_type ON tag_extraction_rules(rule_type);

COMMENT ON TABLE tag_extraction_rules IS '标签提取规则（从任务描述/交付物中自动提取标签）';

-- ============================================
-- 4. 初始数据：业务场景标签
-- ============================================

-- 电商场景标签
INSERT INTO business_scenario_tags (category, subcategory, scenario_name, description, difficulty_level, required_talents, required_tools, suitable_for) VALUES
('ecommerce', 'taobao', '电商_淘宝_选品', '淘宝店铺选品分析', 'beginner', ARRAY['分析思维强', '数据敏感'], ARRAY['ChatGPT', 'Excel'], ARRAY['零基础小白']),
('ecommerce', 'taobao', '电商_淘宝_选品_数据选品', '使用数据分析进行选品', 'intermediate', ARRAY['分析思维强', '数据敏感', '逻辑推理'], ARRAY['ChatGPT', 'Excel', '生意参谋'], ARRAY['有基础经验']),
('ecommerce', 'taobao', '电商_淘宝_选品_趋势选品', '根据市场趋势选品', 'intermediate', ARRAY['远见洞察', '模式识别'], ARRAY['ChatGPT', '数据分析工具'], ARRAY['有基础经验']),
('ecommerce', 'taobao', '电商_淘宝_运营_详情页优化', '优化商品详情页', 'intermediate', ARRAY['用户共情', '细节敏感'], ARRAY['Photoshop', 'ChatGPT'], ARRAY['有设计基础或文案基础']),
('ecommerce', 'taobao', '电商_淘宝_运营_主图设计', '设计商品主图', 'intermediate', ARRAY['创意想象', '视觉审美'], ARRAY['Photoshop', 'Canva', 'Midjourney'], ARRAY['有设计基础']),
('ecommerce', 'taobao', '电商_淘宝_数据分析', '分析店铺数据', 'intermediate', ARRAY['分析思维强', '结构化思维'], ARRAY['Excel', '生意参谋'], ARRAY['有数据分析基础']);

-- Agent应用场景标签
INSERT INTO business_scenario_tags (category, subcategory, scenario_name, description, difficulty_level, required_talents, required_tools, suitable_for) VALUES
('agent', 'customer_service', 'Agent_客服_需求分析', '分析客服场景需求', 'intermediate', ARRAY['用户共情', '系统思考', '结构化思维'], ARRAY['ChatGPT'], ARRAY['有业务理解能力']),
('agent', 'customer_service', 'Agent_客服_知识库搭建', '搭建客服知识库', 'intermediate', ARRAY['结构化思维', '细节敏感'], ARRAY['ChatGPT', 'Excel'], ARRAY['有整理能力']),
('agent', 'customer_service', 'Agent_客服_对话流程设计', '设计客服对话流程', 'intermediate', ARRAY['逻辑推理', '用户共情'], ARRAY['ChatGPT', '流程图工具'], ARRAY['有逻辑思维']),
('agent', 'customer_service', 'Agent_客服_Prompt设计', '设计客服Agent的Prompt', 'advanced', ARRAY['深度思考', '批判性思考', '迭代思维'], ARRAY['ChatGPT'], ARRAY['有AI工具经验']),
('agent', 'content', 'Agent_内容生成_商品描述', '生成商品描述', 'beginner', ARRAY['清晰表达', '用户共情'], ARRAY['ChatGPT'], ARRAY['零基础小白']),
('agent', 'content', 'Agent_内容生成_小红书笔记', '生成小红书笔记', 'beginner', ARRAY['创意想象', '用户共情'], ARRAY['ChatGPT'], ARRAY['零基础小白']);

-- 内容创作场景标签
INSERT INTO business_scenario_tags (category, subcategory, scenario_name, description, difficulty_level, required_talents, required_tools, suitable_for) VALUES
('content', 'short_video', '内容_短视频_脚本策划', '短视频脚本策划', 'intermediate', ARRAY['创意想象', '结构化思维'], ARRAY['ChatGPT'], ARRAY['有创意思维']),
('content', 'short_video', '内容_短视频_剪辑', '短视频剪辑', 'intermediate', ARRAY['细节敏感', '注意力集中'], ARRAY['剪映', 'CapCut'], ARRAY['零基础可学']),
('content', 'short_video', '内容_短视频_美食探店_脚本', '美食探店短视频脚本', 'beginner', ARRAY['创意想象', '用户共情'], ARRAY['ChatGPT'], ARRAY['零基础小白']),
('content', 'article', '内容_图文_小红书笔记', '小红书图文笔记', 'beginner', ARRAY['清晰表达', '用户共情'], ARRAY['ChatGPT'], ARRAY['零基础小白']),
('content', 'article', '内容_图文_公众号文章', '公众号文章撰写', 'intermediate', ARRAY['清晰表达', '结构化思维'], ARRAY['ChatGPT', 'Word'], ARRAY['有写作基础']);

-- 数据分析场景标签
INSERT INTO business_scenario_tags (category, subcategory, scenario_name, description, difficulty_level, required_talents, required_tools, suitable_for) VALUES
('data', 'analysis', '数据_数据清洗', '数据清洗和处理', 'intermediate', ARRAY['细节敏感', '逻辑推理'], ARRAY['Excel', 'ChatGPT'], ARRAY['有Excel基础']),
('data', 'analysis', '数据_数据可视化', '制作数据可视化图表', 'intermediate', ARRAY['结构化思维', '视觉审美'], ARRAY['Excel', 'Tableau'], ARRAY['有数据基础']),
('data', 'analysis', '数据_报表制作', '制作数据分析报表', 'intermediate', ARRAY['结构化思维', '清晰表达'], ARRAY['Excel', 'PPT'], ARRAY['有数据分析经验']);

-- ============================================
-- 5. 初始数据：标签提取规则
-- ============================================

-- 工具检测规则
INSERT INTO tag_extraction_rules (rule_type, trigger_keywords, extract_to, extracted_value, confidence, rule_description) VALUES
('tool_detection', ARRAY['ChatGPT', 'GPT', 'AI对话'], 'tool_usage', 'ChatGPT', 0.9, '检测ChatGPT使用'),
('tool_detection', ARRAY['Midjourney', 'MJ', 'AI绘画'], 'tool_usage', 'Midjourney', 0.9, '检测Midjourney使用'),
('tool_detection', ARRAY['剪映', '视频剪辑', 'CapCut'], 'tool_usage', '剪映', 0.85, '检测剪映使用'),
('tool_detection', ARRAY['Excel', '表格', '数据透视'], 'tool_usage', 'Excel', 0.85, '检测Excel使用'),
('tool_detection', ARRAY['Photoshop', 'PS', '图片处理'], 'tool_usage', 'Photoshop', 0.9, '检测PS使用');

-- 案例提取规则
INSERT INTO tag_extraction_rules (rule_type, trigger_keywords, extract_to, extracted_value, confidence, rule_description) VALUES
('case_extraction', ARRAY['选品', '产品选择'], 'case_experience', '电商_选品', 0.8, '提取选品案例'),
('case_extraction', ARRAY['详情页', '商品详情'], 'case_experience', '电商_详情页优化', 0.8, '提取详情页案例'),
('case_extraction', ARRAY['短视频', '视频剪辑'], 'case_experience', '短视频_剪辑', 0.8, '提取短视频案例'),
('case_extraction', ARRAY['客服', '客户服务'], 'case_experience', 'Agent_客服', 0.75, '提取客服案例'),
('case_extraction', ARRAY['数据分析', '数据报表'], 'case_experience', '数据_分析', 0.8, '提取数据分析案例');

-- ============================================
-- 触发器：自动更新 updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_capability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_business_scenario_updated_at
  BEFORE UPDATE ON business_scenario_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_capability_updated_at();

CREATE TRIGGER trigger_requirement_breakdown_updated_at
  BEFORE UPDATE ON task_requirement_breakdown
  FOR EACH ROW
  EXECUTE FUNCTION update_capability_updated_at();

-- ============================================
-- 完成
-- ============================================
