-- ============================================
-- OPC测试结果到工作条件画像系统
-- Migration: 075
-- 描述: 存储学生的理想工作条件画像和项目的需求条件画像
-- ============================================

-- 1. 学生工作条件画像表
CREATE TABLE IF NOT EXISTS student_work_condition_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) UNIQUE,

  -- 六个维度的理想工作条件（JSONB存储详细分析）
  information_reception JSONB NOT NULL,
  -- {
  --   preference: "习惯先理解各部分之间的联系再动手",
  --   idealCondition: "项目开始时能看到整体框架",
  --   unsuitableCondition: "从零散的任务碎片开始",
  --   clientType: "能给出明确方向和参考案例的需求方"
  -- }

  creation_drive JSONB NOT NULL,
  -- {
  --   source: "灵感来源于视觉元素",
  --   motivation: "看到自己做出的东西好看、有冲击力",
  --   unsuitableTask: "纯文字分析、纯逻辑推演",
  --   projectType: "品牌视觉设计、社交媒体创意内容"
  -- }

  learning_approach JSONB NOT NULL,
  -- {
  --   style: "拿到新工具直接上手试",
  --   idealStart: "有明确的第一步可以立刻开始",
  --   unsuitableStart: "需要先看大量文档才能动手",
  --   mentorStyle: "给一个起点，让他边做边学"
  -- }

  execution_rhythm JSONB NOT NULL,
  -- {
  --   pattern: "喜欢先出一个快速版本看看方向",
  --   idealCycle: "周期包含概念稿→反馈→细化",
  --   unsuitableCycle: "必须一次做到完美",
  --   clientExpectation: "需求方能接受迭代的工作方式"
  -- }

  autonomy_need JSONB NOT NULL,
  -- {
  --   level: "自己负责一个完整模块，独立完成",
  --   idealCollaboration: "需求方给出方向，具体执行由自己独立完成",
  --   unsuitableCollaboration: "需要频繁沟通对齐每一个细节"
  -- }

  risk_tolerance JSONB NOT NULL,
  -- {
  --   attitude: "愿意接有挑战的项目，但会先评估可行性",
  --   idealChallenge: "有挑战但有参考案例",
  --   unsuitableChallenge: "完全从零探索、没有任何参考"
  -- }

  -- 综合画像文本（用于向量化）
  profile_text TEXT NOT NULL,
  -- "视觉叙事者。工作风格：习惯先理解各部分之间的联系再动手...核心优势：品牌视觉设计、社交媒体创意内容"

  -- 向量（用于语义匹配）
  profile_vector vector(1024),

  -- 核心优势（推导出的最适合项目类型）
  core_strengths TEXT[] NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_student_work_profiles_student ON student_work_condition_profiles(student_id);
CREATE INDEX idx_student_work_profiles_vector ON student_work_condition_profiles
  USING ivfflat (profile_vector vector_cosine_ops) WITH (lists = 100);

-- 2. 项目需求条件画像表
CREATE TABLE IF NOT EXISTS project_requirement_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) UNIQUE,

  -- 六个维度的需求条件（JSONB存储详细分析）
  information_reception_need JSONB NOT NULL,
  -- {
  --   condition: "有明确参考案例",
  --   requirement: "执行者需要先看到整体框架才能启动"
  -- }

  creation_drive_need JSONB NOT NULL,
  -- {
  --   outputType: "视觉内容",
  --   requirement: "执行者需要从视觉中获得动力"
  -- }

  learning_approach_need JSONB NOT NULL,
  -- {
  --   startingPoint: "有明确的第一步可以开始",
  --   requirement: "执行者需要拿到就能开始做的类型"
  -- }

  execution_rhythm_need JSONB NOT NULL,
  -- {
  --   cycle: "2周",
  --   flexibility: "接受迭代",
  --   requirement: "执行者需要习惯先出初稿再打磨"
  -- }

  autonomy_need JSONB NOT NULL,
  -- {
  --   communicationFrequency: "给方向后放手",
  --   requirement: "执行者需要独立执行型"
  -- }

  risk_level JSONB NOT NULL,
  -- {
  --   certainty: "有明确成功标准",
  --   requirement: "执行者需要审慎型"
  -- }

  -- 综合需求文本（用于向量化）
  requirement_text TEXT NOT NULL,
  -- "品牌视觉升级项目。需求特征：需要先从品牌整体调性入手...项目确定性：方向明确，有参考案例"

  -- 向量（用于语义匹配）
  requirement_vector vector(1024),

  -- 项目类型标签
  project_type VARCHAR(100),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_project_requirement_profiles_task ON project_requirement_profiles(task_id);
CREATE INDEX idx_project_requirement_profiles_vector ON project_requirement_profiles
  USING ivfflat (requirement_vector vector_cosine_ops) WITH (lists = 100);

-- 3. 工作条件匹配记录表
CREATE TABLE IF NOT EXISTS work_condition_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),
  student_id UUID NOT NULL REFERENCES users(id),

  -- 整体适配度
  overall_fit VARCHAR(20) NOT NULL, -- 'high', 'medium', 'low'
  fit_score DECIMAL(3,2) CHECK (fit_score BETWEEN 0 AND 1),

  -- 六个维度的匹配分析
  dimension_matches JSONB NOT NULL,
  -- {
  --   informationReception: {
  --     match: true,
  --     reason: "学生习惯先看整体框架，项目正好有明确参考案例"
  --   },
  --   creationDrive: {
  --     match: true,
  --     reason: "学生从视觉中获得动力，项目产出正是视觉内容"
  --   },
  --   ...
  -- }

  -- 匹配点
  match_points TEXT[] NOT NULL,
  -- ["学生习惯先出概念稿再打磨，项目正好接受迭代交付", ...]

  -- 可能的摩擦点
  friction_points TEXT[],
  -- ["学生偏好独立工作，但项目可能需要频繁沟通", ...]

  -- 调整建议
  adjustment_suggestions TEXT[],
  -- ["建议在项目开始时明确沟通节奏，减少不必要的频繁对齐", ...]

  -- 推荐理由（面向学生）
  recommendation_for_student TEXT,
  -- "你习惯先出概念稿再打磨，这个项目正好接受迭代交付——你们的执行节奏很匹配"

  -- 推荐理由（面向企业）
  recommendation_for_company TEXT,
  -- "这位学生善于从整体框架出发，你的项目有明确的品牌手册和参考案例，他能快速理解你的需求"

  -- 向量相似度（作为参考）
  vector_similarity DECIMAL(5,4),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(task_id, student_id)
);

CREATE INDEX idx_work_condition_matches_task ON work_condition_matches(task_id, fit_score DESC);
CREATE INDEX idx_work_condition_matches_student ON work_condition_matches(student_id, fit_score DESC);
CREATE INDEX idx_work_condition_matches_fit ON work_condition_matches(overall_fit, fit_score DESC);

-- 4. 添加注释
COMMENT ON TABLE student_work_condition_profiles IS '学生工作条件画像：从OPC测试结果推导出的理想工作条件';
COMMENT ON TABLE project_requirement_profiles IS '项目需求条件画像：从项目需求推导出的客观工作条件需求';
COMMENT ON TABLE work_condition_matches IS '工作条件匹配记录：基于六维度条件画像的智能匹配结果';

COMMENT ON COLUMN student_work_condition_profiles.profile_text IS '综合画像文本，用于生成向量进行语义匹配';
COMMENT ON COLUMN project_requirement_profiles.requirement_text IS '综合需求文本，用于生成向量进行语义匹配';
COMMENT ON COLUMN work_condition_matches.dimension_matches IS '六个维度的详细匹配分析，包含每个维度是否匹配及原因';
