-- ============================================
-- 苏格拉底式PBL导师Agent系统
-- 数据库设计
-- ============================================

-- 1. 项目表（用户的真实工作项目）
CREATE TABLE pbl_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),

  -- 项目基本信息
  title TEXT NOT NULL,
  description TEXT,
  initial_problem TEXT NOT NULL,  -- 用户最初提出的问题
  domain TEXT,  -- 领域：AI、数据分析、产品设计等

  -- 项目状态
  status TEXT NOT NULL DEFAULT 'ideation',  -- ideation, planning, executing, reviewing, completed
  current_phase TEXT,  -- 当前所处阶段
  progress_percentage INTEGER DEFAULT 0,

  -- 项目目标
  learning_goals JSONB,  -- 学习目标
  deliverables JSONB,  -- 预期交付物
  success_criteria JSONB,  -- 成功标准

  -- 时间管理
  estimated_duration INTEGER,  -- 预计天数
  actual_duration INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 项目阶段表（动态生成的项目阶段）
CREATE TABLE pbl_project_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES pbl_projects(id) ON DELETE CASCADE,

  -- 阶段信息
  phase_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,

  -- 阶段目标
  objectives JSONB,  -- 本阶段的具体目标
  tasks JSONB,  -- 任务列表

  -- 阶段状态
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, in_progress, completed, blocked

  -- 导师引导
  socratic_questions JSONB,  -- 苏格拉底式问题列表
  hints JSONB,  -- 提示（当用户卡壳时）
  resources JSONB,  -- 推荐资源

  -- 时间
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 苏格拉底式对话记录
CREATE TABLE pbl_socratic_dialogues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES pbl_projects(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES pbl_project_phases(id) ON DELETE SET NULL,

  -- 对话内容
  role TEXT NOT NULL,  -- 'user' or 'agent'
  content TEXT NOT NULL,

  -- 对话类型
  dialogue_type TEXT,  -- question, answer, hint, challenge, reflection, summary

  -- 苏格拉底式技巧
  socratic_technique TEXT,  -- clarifying, probing, assumption, implication, viewpoint

  -- 上下文
  context JSONB,  -- 当前讨论的上下文

  -- 用户反应
  user_stuck BOOLEAN DEFAULT FALSE,  -- 用户是否卡壳
  breakthrough BOOLEAN DEFAULT FALSE,  -- 是否有突破性理解

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 任务拆解记录（用户自主拆解的任务）
CREATE TABLE pbl_task_decompositions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES pbl_projects(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES pbl_project_phases(id) ON DELETE SET NULL,
  parent_task_id UUID REFERENCES pbl_task_decompositions(id) ON DELETE CASCADE,

  -- 任务信息
  title TEXT NOT NULL,
  description TEXT,

  -- 拆解层级
  level INTEGER NOT NULL DEFAULT 1,  -- 拆解层级

  -- 任务状态
  status TEXT NOT NULL DEFAULT 'todo',  -- todo, in_progress, completed, blocked

  -- 导师评估
  agent_feedback TEXT,  -- Agent对拆解的反馈
  is_well_decomposed BOOLEAN,  -- 拆解是否合理
  suggested_improvements TEXT,  -- 改进建议

  -- 执行记录
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 最小可行方案（MVP）
CREATE TABLE pbl_mvp_solutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES pbl_projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES pbl_task_decompositions(id) ON DELETE CASCADE,

  -- 方案信息
  title TEXT NOT NULL,
  description TEXT,

  -- 方案类型
  solution_type TEXT,  -- code, tool, workflow, framework

  -- 方案内容
  implementation_steps JSONB,  -- 实现步骤
  code_snippets JSONB,  -- 代码片段
  tools_required JSONB,  -- 需要的工具
  estimated_time INTEGER,  -- 预计时间（分钟）

  -- 方案状态
  status TEXT NOT NULL DEFAULT 'suggested',  -- suggested, accepted, implemented, tested

  -- 用户反馈
  user_rating INTEGER,  -- 1-5星
  user_feedback TEXT,
  actually_used BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 文件上传记录
CREATE TABLE pbl_project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES pbl_projects(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES pbl_project_phases(id) ON DELETE SET NULL,

  -- 文件信息
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,  -- code, document, data, image, other
  file_size INTEGER,
  file_url TEXT NOT NULL,

  -- 文件用途
  purpose TEXT,  -- input, output, reference, deliverable

  -- AI处理
  ai_processed BOOLEAN DEFAULT FALSE,
  ai_analysis JSONB,  -- AI对文件的分析

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 代码执行记录
CREATE TABLE pbl_code_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES pbl_projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES pbl_task_decompositions(id) ON DELETE SET NULL,

  -- 代码信息
  language TEXT NOT NULL,  -- python, javascript, sql, etc.
  code TEXT NOT NULL,

  -- 执行结果
  status TEXT NOT NULL,  -- success, error, timeout
  output TEXT,
  error_message TEXT,
  execution_time INTEGER,  -- 毫秒

  -- 上下文
  context JSONB,  -- 执行上下文

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 项目成果
CREATE TABLE pbl_project_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES pbl_projects(id) ON DELETE CASCADE,

  -- 成果信息
  title TEXT NOT NULL,
  description TEXT,
  deliverable_type TEXT NOT NULL,  -- code, document, demo, presentation, report

  -- 成果内容
  content_url TEXT,
  content_text TEXT,
  metadata JSONB,

  -- 展示信息
  is_public BOOLEAN DEFAULT FALSE,
  showcase_url TEXT,

  -- 评估
  self_assessment TEXT,  -- 用户自评
  agent_assessment TEXT,  -- Agent评估
  quality_score INTEGER,  -- 1-10分

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. 反思日志
CREATE TABLE pbl_reflection_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES pbl_projects(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES pbl_project_phases(id) ON DELETE SET NULL,

  -- 反思类型
  reflection_type TEXT NOT NULL,  -- daily, phase_end, project_end, breakthrough, stuck

  -- 反思内容
  what_learned TEXT,  -- 学到了什么
  what_worked TEXT,  -- 什么有效
  what_didnt_work TEXT,  -- 什么无效
  what_surprised TEXT,  -- 什么让你惊讶
  next_steps TEXT,  -- 下一步计划

  -- 情感状态
  emotional_state TEXT,  -- excited, frustrated, confused, confident, etc.

  -- 导师引导的反思问题
  guided_questions JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Agent长期记忆
CREATE TABLE pbl_agent_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  project_id UUID REFERENCES pbl_projects(id) ON DELETE CASCADE,

  -- 记忆类型
  memory_type TEXT NOT NULL,  -- user_preference, learning_style, skill_level, project_pattern, breakthrough

  -- 记忆内容
  key TEXT NOT NULL,
  value JSONB NOT NULL,

  -- 记忆强度
  importance INTEGER DEFAULT 1,  -- 1-10
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,

  -- 记忆来源
  source TEXT,  -- observation, explicit, inferred

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. 苏格拉底式问题库
CREATE TABLE pbl_socratic_question_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 问题分类
  category TEXT NOT NULL,  -- clarifying, probing, assumption, implication, viewpoint
  subcategory TEXT,

  -- 问题模板
  question_template TEXT NOT NULL,

  -- 使用场景
  use_case TEXT,  -- when_stuck, when_assuming, when_planning, when_reflecting

  -- 示例
  example_context TEXT,
  example_question TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入苏格拉底式问题模板
INSERT INTO pbl_socratic_question_templates (category, subcategory, question_template, use_case) VALUES
-- 澄清类问题
('clarifying', 'goal', '你想通过这个项目解决什么核心问题？', 'when_planning'),
('clarifying', 'scope', '如果只能选择一个最重要的功能，你会选哪个？为什么？', 'when_planning'),
('clarifying', 'definition', '当你说"{term}"时，具体指的是什么？', 'when_stuck'),

-- 探究类问题
('probing', 'reasoning', '是什么让你这样认为的？', 'when_assuming'),
('probing', 'evidence', '你有什么证据支持这个想法？', 'when_assuming'),
('probing', 'alternatives', '还有其他可能的方法吗？', 'when_stuck'),

-- 假设类问题
('assumption', 'challenge', '你的这个方案基于什么假设？', 'when_planning'),
('assumption', 'validity', '如果这个假设不成立会怎样？', 'when_planning'),

-- 影响类问题
('implication', 'consequence', '如果这样做，会带来什么后果？', 'when_planning'),
('implication', 'tradeoff', '这个方案的代价是什么？', 'when_planning'),

-- 视角类问题
('viewpoint', 'user', '如果你是用户，你会怎么看这个方案？', 'when_reflecting'),
('viewpoint', 'expert', '一个有经验的工程师会如何处理这个问题？', 'when_stuck');

-- 索引
CREATE INDEX idx_pbl_projects_user ON pbl_projects(user_id);
CREATE INDEX idx_pbl_projects_status ON pbl_projects(status);
CREATE INDEX idx_pbl_dialogues_project ON pbl_socratic_dialogues(project_id);
CREATE INDEX idx_pbl_dialogues_created ON pbl_socratic_dialogues(created_at);
CREATE INDEX idx_pbl_tasks_project ON pbl_task_decompositions(project_id);
CREATE INDEX idx_pbl_memory_user ON pbl_agent_memory(user_id);
CREATE INDEX idx_pbl_memory_type ON pbl_agent_memory(memory_type);

-- 触发器：更新项目进度
CREATE OR REPLACE FUNCTION update_project_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE pbl_projects
  SET
    progress_percentage = (
      SELECT ROUND(
        (COUNT(*) FILTER (WHERE status = 'completed')::FLOAT /
         NULLIF(COUNT(*), 0) * 100)::NUMERIC, 0
      )
      FROM pbl_project_phases
      WHERE project_id = NEW.project_id
    ),
    updated_at = NOW()
  WHERE id = NEW.project_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_progress
AFTER INSERT OR UPDATE ON pbl_project_phases
FOR EACH ROW
EXECUTE FUNCTION update_project_progress();
