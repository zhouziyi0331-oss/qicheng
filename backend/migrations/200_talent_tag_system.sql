-- ============================================
-- 基于天赋优势的标签系统
-- Migration: 200_talent_tag_system.sql
-- 日期: 2026-06-29
-- 说明: 看见学生的天赋、思维、特质，而不是工具技能
-- ============================================

-- ============================================
-- 1. 标签字典表
-- ============================================
CREATE TABLE IF NOT EXISTS talent_tags (
  id SERIAL PRIMARY KEY,
  
  -- 基础信息
  tag_name VARCHAR(100) NOT NULL UNIQUE,
  tag_name_en VARCHAR(100),
  category VARCHAR(50) NOT NULL, -- 'talent', 'thinking', 'style', 'learning'
  sub_category VARCHAR(50), -- 具体分类
  
  -- 标签描述
  description TEXT NOT NULL, -- 这个天赋/特质的含义
  manifestation TEXT, -- 如何表现出来
  task_performance TEXT, -- 在任务中如何体现
  suitable_tasks TEXT, -- 适合什么类型的任务
  
  -- 关联关系
  parent_id INTEGER REFERENCES talent_tags(id), -- 层级关系
  related_tags INTEGER[], -- 相关标签ID数组
  opposite_tag_id INTEGER REFERENCES talent_tags(id), -- 对立标签（如：快速行动派 vs 深思熟虑派）
  
  -- OPC映射
  opc_dimension VARCHAR(30), -- 对应的OPC维度
  opc_score_range JSONB, -- 分数范围 {"min": 60, "max": 100}
  opc_tendency VARCHAR(20), -- 对应的倾向
  
  -- 元数据
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0, -- 被使用的次数
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_talent_tags_category ON talent_tags(category);
CREATE INDEX idx_talent_tags_sub_category ON talent_tags(sub_category);
CREATE INDEX idx_talent_tags_opc ON talent_tags(opc_dimension);

-- 注释
COMMENT ON TABLE talent_tags IS '天赋特质标签字典';
COMMENT ON COLUMN talent_tags.category IS '大类: talent(天赋优势), thinking(思维方式), style(做事风格), learning(学习特质)';
COMMENT ON COLUMN talent_tags.sub_category IS '子类: strategic_thinking, relationship, influencing, executing';
COMMENT ON COLUMN talent_tags.manifestation IS '这个特质如何表现出来';
COMMENT ON COLUMN talent_tags.task_performance IS '在任务中如何体现';
COMMENT ON COLUMN talent_tags.suitable_tasks IS '适合什么类型的任务';

-- ============================================
-- 2. 学生天赋标签关联表
-- ============================================
CREATE TABLE IF NOT EXISTS student_talent_tags (
  id SERIAL PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES talent_tags(id),
  
  -- 标签强度
  strength VARCHAR(20) NOT NULL DEFAULT 'emerging', -- 'emerging'(初步显现), 'clear'(明确优势), 'prominent'(突出优势), 'core'(核心优势)
  confidence DECIMAL(3,2) DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1), -- 置信度
  
  -- 来源
  source VARCHAR(50) NOT NULL, -- 'opc_inferred'(OPC推断), 'task_inferred'(任务推断), 'manually_added'(手动添加)
  source_details JSONB, -- 来源详情 {"task_id": "xxx", "behavior": "xxx"}
  
  -- 验证
  verified_count INTEGER DEFAULT 0, -- 被验证的次数（从多少次任务中显现）
  last_verified_at TIMESTAMP, -- 最后一次验证时间
  first_observed_at TIMESTAMP DEFAULT NOW(), -- 首次观察到的时间
  
  -- 元数据
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(student_id, tag_id)
);

-- 索引
CREATE INDEX idx_student_talent_tags_student ON student_talent_tags(student_id);
CREATE INDEX idx_student_talent_tags_tag ON student_talent_tags(tag_id);
CREATE INDEX idx_student_talent_tags_strength ON student_talent_tags(strength);
CREATE INDEX idx_student_talent_tags_confidence ON student_talent_tags(confidence DESC);

-- 注释
COMMENT ON TABLE student_talent_tags IS '学生天赋特质标签关联';
COMMENT ON COLUMN student_talent_tags.strength IS '标签强度: emerging(1-2次), clear(3-5次), prominent(5-10次), core(10次+)';
COMMENT ON COLUMN student_talent_tags.source IS '标签来源: opc_inferred, task_inferred, manually_added';
COMMENT ON COLUMN student_talent_tags.verified_count IS '被验证的次数（从多少次任务中显现）';

-- ============================================
-- 3. 企业需求特质标签表
-- ============================================
CREATE TABLE IF NOT EXISTS task_requirement_traits (
  id SERIAL PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  trait_tag_id INTEGER NOT NULL REFERENCES talent_tags(id), -- 关联到天赋标签
  
  -- 需求强度
  importance VARCHAR(20) NOT NULL DEFAULT 'preferred', -- 'required'(必需), 'preferred'(优先), 'nice_to_have'(加分项)
  weight DECIMAL(3,2) DEFAULT 1.0 CHECK (weight >= 0 AND weight <= 1), -- 权重
  
  -- 描述
  requirement_description TEXT, -- 为什么需要这个特质
  example_behavior TEXT, -- 期望看到什么样的行为表现
  
  -- 元数据
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(task_id, trait_tag_id)
);

-- 索引
CREATE INDEX idx_task_requirement_traits_task ON task_requirement_traits(task_id);
CREATE INDEX idx_task_requirement_traits_tag ON task_requirement_traits(trait_tag_id);
CREATE INDEX idx_task_requirement_traits_importance ON task_requirement_traits(importance);

-- 注释
COMMENT ON TABLE task_requirement_traits IS '任务需求的特质要求';
COMMENT ON COLUMN task_requirement_traits.importance IS '重要性: required(必需), preferred(优先), nice_to_have(加分项)';
COMMENT ON COLUMN task_requirement_traits.example_behavior IS '期望看到什么样的行为表现';

-- ============================================
-- 4. 任务表现记录表（用于推断天赋）
-- ============================================
CREATE TABLE IF NOT EXISTS task_performance_records (
  id SERIAL PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 表现记录
  response_time_minutes INTEGER, -- 首次响应时间（分钟）
  requirement_clarifications INTEGER DEFAULT 0, -- 需求确认次数
  proactive_reports INTEGER DEFAULT 0, -- 主动汇报次数
  revision_count INTEGER DEFAULT 0, -- 返工次数
  delivery_status VARCHAR(20), -- 'early'(提前), 'on_time'(准时), 'late_1d'(延期1天内), 'late_more'(延期超1天)
  delivery_completeness VARCHAR(20), -- 'exceeded'(超预期), 'met'(完全符合), 'mostly_met'(基本符合), 'partial'(部分遗漏)
  problem_handling VARCHAR(50), -- 'proactive_solved'(主动发现并解决), 'proactive_feedback'(主动反馈寻求帮助), 'passive'(被动等待), 'delayed'(问题拖延)
  optimization_awareness VARCHAR(30), -- 'proactive_suggestions'(主动提建议), 'noted_improvements'(指出可优化点), 'as_required'(按要求执行), 'no_thinking'(未思考优化)
  
  -- 企业评价
  enterprise_rating DECIMAL(2,1) CHECK (enterprise_rating >= 0 AND enterprise_rating <= 5), -- 企业评分 0-5
  enterprise_feedback TEXT, -- 企业反馈文本
  enterprise_feedback_keywords TEXT[], -- 提取的关键词
  
  -- AI推断的天赋标签
  inferred_talent_tags INTEGER[], -- 推断出的天赋标签ID数组
  inference_confidence JSONB, -- 每个标签的置信度 {"tag_id": confidence}
  inference_reasoning TEXT, -- AI推断的理由
  
  -- 元数据
  created_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_task_performance_student ON task_performance_records(student_id);
CREATE INDEX idx_task_performance_task ON task_performance_records(task_id);
CREATE INDEX idx_task_performance_rating ON task_performance_records(enterprise_rating DESC);

-- 注释
COMMENT ON TABLE task_performance_records IS '任务表现记录，用于推断学生天赋';
COMMENT ON COLUMN task_performance_records.response_time_minutes IS '首次响应时间（分钟）';
COMMENT ON COLUMN task_performance_records.inferred_talent_tags IS 'AI从表现推断出的天赋标签ID数组';

-- ============================================
-- 5. 天赋标签推断规则表
-- ============================================
CREATE TABLE IF NOT EXISTS talent_inference_rules (
  id SERIAL PRIMARY KEY,
  
  -- 规则定义
  rule_name VARCHAR(100) NOT NULL UNIQUE,
  talent_tag_id INTEGER NOT NULL REFERENCES talent_tags(id),
  
  -- 触发条件（JSONB灵活配置）
  conditions JSONB NOT NULL,
  /* 示例:
  {
    "response_time_minutes": {"max": 60},
    "delivery_status": ["early", "on_time"],
    "enterprise_rating": {"min": 4.0},
    "min_occurrences": 3
  }
  */
  
  -- 置信度
  base_confidence DECIMAL(3,2) DEFAULT 0.6, -- 基础置信度
  confidence_increment DECIMAL(3,2) DEFAULT 0.1, -- 每次验证增加的置信度
  
  -- 描述
  rule_description TEXT,
  example_scenario TEXT,
  
  -- 元数据
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_talent_inference_tag ON talent_inference_rules(talent_tag_id);

-- 注释
COMMENT ON TABLE talent_inference_rules IS '天赋标签推断规则';
COMMENT ON COLUMN talent_inference_rules.conditions IS '触发条件（JSONB），如响应时间、评分、交付状态等';

-- ============================================
-- 6. OPC维度到天赋标签的映射表
-- ============================================
CREATE TABLE IF NOT EXISTS opc_to_talent_mapping (
  id SERIAL PRIMARY KEY,
  
  -- OPC维度
  opc_dimension VARCHAR(30) NOT NULL,
  opc_tendency VARCHAR(20) NOT NULL,
  score_min INTEGER NOT NULL,
  score_max INTEGER NOT NULL,
  
  -- 映射到的天赋标签
  talent_tag_ids INTEGER[] NOT NULL, -- 推断出的天赋标签ID数组
  confidence DECIMAL(3,2) DEFAULT 0.8,
  
  -- 描述
  mapping_description TEXT,
  
  -- 元数据
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(opc_dimension, opc_tendency, score_min, score_max)
);

-- 索引
CREATE INDEX idx_opc_mapping_dimension ON opc_to_talent_mapping(opc_dimension);

-- 注释
COMMENT ON TABLE opc_to_talent_mapping IS 'OPC维度分数到天赋标签的映射';
COMMENT ON COLUMN opc_to_talent_mapping.talent_tag_ids IS '映射到的天赋标签ID数组';

-- ============================================
-- 7. 学生兴趣偏好表（从行为推断）
-- ============================================
CREATE TABLE IF NOT EXISTS student_interest_preferences (
  id SERIAL PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 内容类型偏好
  content_type_preferences JSONB, -- {"data_analysis": 0.8, "content_creation": 0.3, ...}
  
  -- 业务领域偏好
  domain_preferences JSONB, -- {"ecommerce": 0.7, "education": 0.5, ...}
  
  -- 工作方式偏好
  work_style_preferences JSONB, -- {"independent": 0.8, "collaborative": 0.4, ...}
  
  -- 推断依据
  based_on_task_count INTEGER DEFAULT 0, -- 基于多少次任务推断
  last_updated_task_id UUID, -- 最后更新时的任务ID
  
  -- 元数据
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(student_id)
);

-- 索引
CREATE INDEX idx_student_interest_student ON student_interest_preferences(student_id);

-- 注释
COMMENT ON TABLE student_interest_preferences IS '学生兴趣偏好（从任务选择和表现推断）';
COMMENT ON COLUMN student_interest_preferences.content_type_preferences IS '内容类型偏好（JSONB），值为0-1的偏好度';

-- ============================================
-- 8. 标签变更历史表
-- ============================================
CREATE TABLE IF NOT EXISTS student_talent_tag_history (
  id SERIAL PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES talent_tags(id),
  
  -- 变更内容
  change_type VARCHAR(20) NOT NULL, -- 'added', 'strength_increased', 'confidence_increased', 'removed'
  old_value JSONB, -- 旧值
  new_value JSONB, -- 新值
  
  -- 触发原因
  trigger_source VARCHAR(50), -- 'opc_test', 'task_performance', 'manual_adjustment'
  trigger_task_id UUID REFERENCES tasks(id), -- 触发的任务ID（如果有）
  trigger_details TEXT, -- 详细说明
  
  -- 元数据
  created_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_talent_history_student ON student_talent_tag_history(student_id);
CREATE INDEX idx_talent_history_tag ON student_talent_tag_history(tag_id);
CREATE INDEX idx_talent_history_time ON student_talent_tag_history(created_at DESC);

-- 注释
COMMENT ON TABLE student_talent_tag_history IS '学生天赋标签变更历史';
COMMENT ON COLUMN student_talent_tag_history.change_type IS '变更类型: added, strength_increased, confidence_increased, removed';

-- ============================================
-- 触发器：自动更新 updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_talent_tags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_talent_tags_updated_at
  BEFORE UPDATE ON talent_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_talent_tags_updated_at();

CREATE TRIGGER trigger_student_talent_tags_updated_at
  BEFORE UPDATE ON student_talent_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_talent_tags_updated_at();

CREATE TRIGGER trigger_student_interest_updated_at
  BEFORE UPDATE ON student_interest_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_talent_tags_updated_at();

-- ============================================
-- 初始数据：核心天赋标签
-- ============================================

-- 插入核心天赋标签（示例，完整数据需要后续导入）

-- 战略思维类 - 分析型天赋
INSERT INTO talent_tags (tag_name, tag_name_en, category, sub_category, description, manifestation, task_performance, suitable_tasks, opc_dimension, opc_score_range, opc_tendency) VALUES
('分析思维强', 'analytical_thinking', 'talent', 'strategic_thinking', '喜欢找规律、找原因、找逻辑', '在任务中能够快速识别数据背后的规律，善于追根溯源', '能快速识别数据背后的规律，提出数据驱动的建议', '数据分析、问题诊断、竞品分析', 'info_processing', '{"min": 0, "max": 40}', 'analytical'),

('全局视野', 'holistic_vision', 'talent', 'strategic_thinking', '喜欢先看整体、找关联', '能理解需求背后的业务全景，关注整体而非局部', '能理解需求背后的业务背景，提出系统性建议', '系统设计、整体规划、需求分析', 'info_processing', '{"min": 60, "max": 100}', 'integrative'),

('快速学习', 'rapid_learning', 'talent', 'strategic_thinking', '对新事物充满好奇、上手快', '遇到新工具新领域能快速掌握基本用法', '能快速掌握新工具、新领域，学习曲线陡峭', '探索性任务、新工具试用、跨领域任务', 'tool_learning', '{"min": 60, "max": 100}', 'exploratory'),

('深度思考', 'deep_thinking', 'talent', 'strategic_thinking', '喜欢深入研究、刨根问底', '不满足表面方案，追求本质理解', '提出的方案有深度，考虑到本质问题', '复杂问题解决、深度分析、原理研究', NULL, NULL, NULL);

-- 关系建立类 - 沟通天赋
INSERT INTO talent_tags (tag_name, tag_name_en, category, sub_category, description, manifestation, task_performance, suitable_tasks) VALUES
('用户共情', 'user_empathy', 'talent', 'relationship', '能站在用户角度思考', '理解用户痛点、使用场景，设身处地思考', '产出的内容/方案能真正解决用户痛点', '需求理解、用户体验优化、客服话术设计'),

('清晰表达', 'clear_communication', 'talent', 'relationship', '说话有条理、写字清楚', '需求确认准确、汇报逻辑清晰', '沟通效率高、很少因为表达不清造成误解', '文档编写、方案讲解、需求沟通'),

('有效提问', 'effective_questioning', 'talent', 'relationship', '知道问什么、怎么问', '提问切中要害，能快速澄清模糊需求', '通过提问快速理解需求，少走弯路', '需求澄清、问题诊断、访谈调研');

-- 执行力类 - 专注型天赋
INSERT INTO talent_tags (tag_name, tag_name_en, category, sub_category, description, manifestation, task_performance, suitable_tasks) VALUES
('细节敏感', 'detail_oriented', 'talent', 'executing', '能注意到别人忽略的细节', '对数据、格式、规范有很高的敏感度', '数据准确、格式规范、无遗漏', '数据处理、文档编写、质量把控'),

('责任心强', 'strong_responsibility', 'talent', 'executing', '答应的事一定做到', '准时交付、对结果负责', '准时交付、对结果负责、让人放心', '重要任务、有deadline的项目'),

('抗压能力', 'stress_resistance', 'talent', 'executing', '压力下不崩溃、能扛事', '紧急情况下稳定发挥', '在紧急任务、高压环境下依然稳定输出', '紧急任务、高压项目');

-- 影响力类 - 主动性天赋
INSERT INTO talent_tags (tag_name, tag_name_en, category, sub_category, description, manifestation, task_performance, suitable_tasks) VALUES
('自驱力强', 'self_motivated', 'talent', 'influencing', '不用push，自己会主动做', '主动汇报、主动优化、主动学习', '不需要催促，主动推进任务进度', '长期项目、需要自律的任务'),

('行动导向', 'action_oriented', 'talent', 'influencing', '想到就做，执行力强', '不拖延、快速响应', '响应快、执行快，不拖延', '紧急任务、快节奏项目');

-- 思维方式标签
INSERT INTO talent_tags (tag_name, tag_name_en, category, sub_category, description, manifestation, task_performance, suitable_tasks, opc_dimension, opc_score_range, opc_tendency) VALUES
('拆解型思维', 'decomposition_thinking', 'thinking', 'information_processing', '喜欢把大问题切成小块', '能把复杂需求拆成可执行步骤', '能有效拆解复杂任务，执行清晰', '复杂任务拆解、流程设计', 'info_processing', '{"min": 0, "max": 40}', 'analytical'),
('整合型思维', 'integrative_thinking', 'thinking', 'information_processing', '喜欢先看全局、找关联', '能理解各部分的关系和相互影响', '能提出系统性方案，考虑整体影响', '系统设计、整体规划', 'info_processing', '{"min": 60, "max": 100}', 'integrative'),
('结构化思维', 'structured_thinking', 'thinking', 'problem_solving', '思考有框架、表达有逻辑', '方案有层次、文档有结构', '输出的内容结构清晰、逻辑严密', '方案设计、文档编写、汇报讲解', NULL, NULL, NULL);

-- 做事风格标签
INSERT INTO talent_tags (tag_name, tag_name_en, category, sub_category, description, manifestation, task_performance, suitable_tasks, opc_dimension, opc_score_range, opc_tendency, opposite_tag_id) VALUES
('快速行动派', 'fast_executor', 'style', 'pace', '速度优先、边做边调整', '执行快、响应快', '能快速交付，响应速度快', '紧急任务、快节奏项目', 'task_execution', '{"min": 0, "max": 40}', 'iterative', NULL),
('深思熟虑派', 'thoughtful_planner', 'style', 'pace', '想清楚再动手', '方案完整、考虑周全', '方案完整，考虑到各种情况', '复杂任务、重要项目', 'task_execution', '{"min": 60, "max": 100}', 'planning', NULL),
('完美主义', 'perfectionism', 'style', 'quality', '追求极致、不容瑕疵', '质量高、细节好', '交付质量高，细节把控好', '高质量要求的任务', NULL, NULL, NULL, NULL),
('快速迭代', 'rapid_iteration', 'style', 'quality', '先完成再完美', '速度快、迭代快', '快速交付，持续优化', '快速试错、敏捷项目', NULL, NULL, NULL, NULL);

-- 更新对立标签关系
UPDATE talent_tags SET opposite_tag_id = (SELECT id FROM talent_tags WHERE tag_name = '深思熟虑派') WHERE tag_name = '快速行动派';
UPDATE talent_tags SET opposite_tag_id = (SELECT id FROM talent_tags WHERE tag_name = '快速行动派') WHERE tag_name = '深思熟虑派';
UPDATE talent_tags SET opposite_tag_id = (SELECT id FROM talent_tags WHERE tag_name = '快速迭代') WHERE tag_name = '完美主义';
UPDATE talent_tags SET opposite_tag_id = (SELECT id FROM talent_tags WHERE tag_name = '完美主义') WHERE tag_name = '快速迭代';

-- ============================================
-- 完成
-- ============================================
