-- ============================================
-- 启程平台核心语义匹配引擎 - 数据库Schema
-- Migration: 084
-- 创建日期: 2026-05-27
-- ============================================

-- 启用向量扩展（如果尚未启用）
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- 1. 学生能力画像表
-- ============================================

CREATE TABLE IF NOT EXISTS student_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 能力向量（4个维度）
  skill_vector vector(1536) NOT NULL,        -- 技能向量
  trajectory_vector vector(512) NOT NULL,    -- 学习轨迹向量
  quality_vector vector(512) NOT NULL,       -- 质量向量
  preference_vector vector(512) NOT NULL,    -- 偏好向量
  combined_vector vector(1536) NOT NULL,     -- 组合向量（用于快速检索）

  -- 技能熟练度矩阵（JSON）
  skills JSONB NOT NULL DEFAULT '{}',
  -- 示例结构：
  -- {
  --   "React": {"proficiency": 0.8, "confidence": 0.9, "lastPracticed": "2024-01-15"},
  --   "Node.js": {"proficiency": 0.7, "confidence": 0.85, "lastPracticed": "2024-01-10"}
  -- }

  -- 学习轨迹统计
  tasks_completed INTEGER DEFAULT 0,
  avg_task_quality DECIMAL(3,2) CHECK (avg_task_quality BETWEEN 0 AND 1),
  avg_client_satisfaction DECIMAL(3,2) CHECK (avg_client_satisfaction BETWEEN 0 AND 1),
  on_time_delivery_rate DECIMAL(3,2) CHECK (on_time_delivery_rate BETWEEN 0 AND 1),
  avg_response_time_hours DECIMAL(10,2),

  -- 成长速度指标
  quality_trend VARCHAR(50),  -- 'improving', 'stable', 'declining'
  growth_rate DECIMAL(3,2),
  skill_acquisition_rate DECIMAL(3,2),

  -- 工作偏好
  preferred_task_types TEXT[],
  work_style JSONB,
  max_hours_per_week INTEGER,

  -- OPC测评结果
  opc_openness INTEGER CHECK (opc_openness BETWEEN 1 AND 10),
  opc_persistence INTEGER CHECK (opc_persistence BETWEEN 1 AND 10),
  opc_creativity INTEGER CHECK (opc_creativity BETWEEN 1 AND 10),
  personality_style VARCHAR(50),

  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  vector_updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(student_id)
);

-- 索引
CREATE INDEX idx_student_capabilities_student ON student_capabilities(student_id);
CREATE INDEX idx_student_capabilities_vector ON student_capabilities
  USING ivfflat (combined_vector vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_student_capabilities_quality ON student_capabilities(avg_task_quality DESC NULLS LAST);
CREATE INDEX idx_student_capabilities_completed ON student_capabilities(tasks_completed DESC);

-- 注释
COMMENT ON TABLE student_capabilities IS '学生能力画像表 - 存储学生的技能向量、学习轨迹、质量指标等';
COMMENT ON COLUMN student_capabilities.skill_vector IS '技能向量 - 基于学生掌握的技能生成';
COMMENT ON COLUMN student_capabilities.trajectory_vector IS '学习轨迹向量 - 基于历史任务表现生成';
COMMENT ON COLUMN student_capabilities.quality_vector IS '质量向量 - 基于任务完成质量生成';
COMMENT ON COLUMN student_capabilities.preference_vector IS '偏好向量 - 基于学生的工作偏好生成';
COMMENT ON COLUMN student_capabilities.combined_vector IS '组合向量 - 用于快速检索的综合向量';

-- ============================================
-- 2. 任务学生匹配记录表
-- ============================================

CREATE TABLE IF NOT EXISTS task_student_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 匹配分数（6个维度）
  overall_score DECIMAL(3,2) NOT NULL CHECK (overall_score BETWEEN 0 AND 1),
  skill_match_score DECIMAL(3,2) CHECK (skill_match_score BETWEEN 0 AND 1),
  difficulty_match_score DECIMAL(3,2) CHECK (difficulty_match_score BETWEEN 0 AND 1),
  domain_match_score DECIMAL(3,2) CHECK (domain_match_score BETWEEN 0 AND 1),
  growth_potential_score DECIMAL(3,2) CHECK (growth_potential_score BETWEEN 0 AND 1),
  reliability_score DECIMAL(3,2) CHECK (reliability_score BETWEEN 0 AND 1),
  preference_score DECIMAL(3,2) CHECK (preference_score BETWEEN 0 AND 1),

  -- 匹配详情（JSON）
  match_breakdown JSONB,
  -- 示例结构：
  -- {
  --   "skillMatch": {"score": 0.85, "matchedSkills": ["React", "Node.js"], "missingSkills": ["Docker"]},
  --   "difficultyMatch": {"score": 0.9, "reason": "学生能力略高于任务难度，适合快速完成"},
  --   "domainMatch": {"score": 0.75, "reason": "学生在电商领域有2个项目经验"},
  --   "growthPotential": {"score": 0.8, "reason": "该任务可以帮助学生学习Docker"},
  --   "reliability": {"score": 0.95, "reason": "学生准时交付率95%"},
  --   "preference": {"score": 0.7, "reason": "学生偏好前端开发，该任务包含60%前端工作"}
  -- }

  -- 推送状态
  is_pushed BOOLEAN DEFAULT false,
  pushed_at TIMESTAMPTZ,
  student_viewed BOOLEAN DEFAULT false,
  viewed_at TIMESTAMPTZ,
  student_accepted BOOLEAN DEFAULT false,
  accepted_at TIMESTAMPTZ,

  -- 排名
  rank_in_task INTEGER,  -- 在该任务中的排名

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(task_id, student_id)
);

-- 索引
CREATE INDEX idx_matches_task ON task_student_matches(task_id, overall_score DESC);
CREATE INDEX idx_matches_student ON task_student_matches(student_id, created_at DESC);
CREATE INDEX idx_matches_pushed ON task_student_matches(task_id, is_pushed, overall_score DESC);
CREATE INDEX idx_matches_score ON task_student_matches(overall_score DESC);
CREATE INDEX idx_matches_rank ON task_student_matches(task_id, rank_in_task);

-- 注释
COMMENT ON TABLE task_student_matches IS '任务学生匹配记录表 - 存储每个任务与学生的匹配分数和详情';
COMMENT ON COLUMN task_student_matches.overall_score IS '综合匹配分数 - 6个维度的加权平均';
COMMENT ON COLUMN task_student_matches.skill_match_score IS '技能匹配分数 - 学生技能与任务要求的匹配度';
COMMENT ON COLUMN task_student_matches.difficulty_match_score IS '难度匹配分数 - 任务难度与学生能力的匹配度';
COMMENT ON COLUMN task_student_matches.domain_match_score IS '领域匹配分数 - 学生在该领域的经验';
COMMENT ON COLUMN task_student_matches.growth_potential_score IS '成长潜力分数 - 该任务对学生的学习价值';
COMMENT ON COLUMN task_student_matches.reliability_score IS '可靠性分数 - 学生的历史表现';
COMMENT ON COLUMN task_student_matches.preference_score IS '偏好匹配分数 - 任务与学生偏好的匹配度';

-- ============================================
-- 3. 任务翻译表（启程老师）
-- ============================================

CREATE TABLE IF NOT EXISTS task_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

  -- 任务拆解
  functional_modules JSONB NOT NULL,
  -- 示例结构：
  -- [
  --   {"module": "用户登录", "description": "实现用户注册和登录功能", "skills": ["React", "JWT"], "difficulty": 3},
  --   {"module": "商品展示", "description": "展示商品列表和详情", "skills": ["React", "API调用"], "difficulty": 2}
  -- ]

  -- 学生友好描述
  student_friendly_title VARCHAR(200),
  student_friendly_description TEXT,
  what_you_will_do TEXT,  -- "你需要做什么"
  what_you_will_learn TEXT,  -- "你会学到什么"
  estimated_hours INTEGER,

  -- 技能要求（结构化）
  required_skills JSONB NOT NULL,
  -- 示例结构：
  -- [
  --   {"skill": "React", "proficiency": 0.7, "weight": 0.4, "why": "需要构建用户界面"},
  --   {"skill": "Node.js", "proficiency": 0.6, "weight": 0.3, "why": "需要处理后端逻辑"}
  -- ]

  -- 难度评估（多维度）
  difficulty_technical DECIMAL(3,1) CHECK (difficulty_technical BETWEEN 1 AND 10),
  difficulty_cognitive DECIMAL(3,1) CHECK (difficulty_cognitive BETWEEN 1 AND 10),
  difficulty_execution DECIMAL(3,1) CHECK (difficulty_execution BETWEEN 1 AND 10),
  difficulty_communication DECIMAL(3,1) CHECK (difficulty_communication BETWEEN 1 AND 10),
  difficulty_overall DECIMAL(3,1) CHECK (difficulty_overall BETWEEN 1 AND 10),

  -- 成长价值
  learning_value DECIMAL(3,2) CHECK (learning_value BETWEEN 0 AND 1),
  career_impact DECIMAL(3,2) CHECK (career_impact BETWEEN 0 AND 1),

  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(task_id)
);

-- 索引
CREATE INDEX idx_task_translations_task ON task_translations(task_id);
CREATE INDEX idx_task_translations_difficulty ON task_translations(difficulty_overall);
CREATE INDEX idx_task_translations_learning_value ON task_translations(learning_value DESC);

-- 注释
COMMENT ON TABLE task_translations IS '任务翻译表 - 启程老师将企业任务翻译成学生能理解的语言';
COMMENT ON COLUMN task_translations.functional_modules IS '功能模块拆解 - 将任务拆解成具体的功能模块';
COMMENT ON COLUMN task_translations.student_friendly_title IS '学生友好标题 - 用学生能理解的语言重写任务标题';
COMMENT ON COLUMN task_translations.required_skills IS '技能要求 - 结构化的技能要求列表';
COMMENT ON COLUMN task_translations.difficulty_technical IS '技术难度 - 技术实现的难度';
COMMENT ON COLUMN task_translations.difficulty_cognitive IS '认知难度 - 理解和设计的难度';
COMMENT ON COLUMN task_translations.difficulty_execution IS '执行难度 - 完成任务的工作量';
COMMENT ON COLUMN task_translations.difficulty_communication IS '沟通难度 - 与企业沟通的难度';

-- ============================================
-- 4. 扩展 tasks 表
-- ============================================

-- 添加匹配相关字段
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS matching_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS matched_students_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS top_match_score DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS matching_completed_at TIMESTAMPTZ;

-- 索引
CREATE INDEX IF NOT EXISTS idx_tasks_matching_enabled ON tasks(matching_enabled) WHERE matching_enabled = true;
CREATE INDEX IF NOT EXISTS idx_tasks_matching_completed ON tasks(matching_completed_at DESC NULLS LAST);

-- 注释
COMMENT ON COLUMN tasks.matching_enabled IS '是否启用AI匹配 - 企业可以选择关闭AI匹配';
COMMENT ON COLUMN tasks.matched_students_count IS '匹配的学生数量 - 系统找到的匹配学生总数';
COMMENT ON COLUMN tasks.top_match_score IS '最高匹配分数 - 最匹配学生的分数';
COMMENT ON COLUMN tasks.matching_completed_at IS '匹配完成时间 - AI匹配完成的时间';

-- ============================================
-- 5. 自动更新触发器
-- ============================================

-- 更新 student_capabilities 的 updated_at
CREATE OR REPLACE FUNCTION update_student_capabilities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_student_capabilities_updated_at
  BEFORE UPDATE ON student_capabilities
  FOR EACH ROW
  EXECUTE FUNCTION update_student_capabilities_updated_at();

-- 更新 task_translations 的 updated_at
CREATE OR REPLACE FUNCTION update_task_translations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_task_translations_updated_at
  BEFORE UPDATE ON task_translations
  FOR EACH ROW
  EXECUTE FUNCTION update_task_translations_updated_at();

-- ============================================
-- 6. 辅助函数
-- ============================================

-- 计算向量余弦相似度
CREATE OR REPLACE FUNCTION cosine_similarity(vec1 vector, vec2 vector)
RETURNS DECIMAL AS $$
  SELECT 1 - (vec1 <=> vec2);
$$ LANGUAGE SQL IMMUTABLE STRICT;

COMMENT ON FUNCTION cosine_similarity IS '计算两个向量的余弦相似度 - 返回值在0-1之间，1表示完全相同';

-- ============================================
-- 7. 视图：学生匹配概览
-- ============================================

CREATE OR REPLACE VIEW student_matching_overview AS
SELECT
  u.id as student_id,
  u.nickname,
  u.avatar_url,
  u.student_level,
  sc.tasks_completed,
  sc.avg_task_quality,
  sc.avg_client_satisfaction,
  sc.on_time_delivery_rate,
  sc.quality_trend,
  sc.growth_rate,
  sc.opc_openness,
  sc.opc_persistence,
  sc.opc_creativity,
  sc.personality_style,
  sc.skills,
  sc.preferred_task_types,
  sc.vector_updated_at,
  COUNT(tsm.id) FILTER (WHERE tsm.is_pushed = true) as pushed_tasks_count,
  COUNT(tsm.id) FILTER (WHERE tsm.student_accepted = true) as accepted_tasks_count,
  AVG(tsm.overall_score) FILTER (WHERE tsm.is_pushed = true) as avg_match_score
FROM users u
LEFT JOIN student_capabilities sc ON u.id = sc.student_id
LEFT JOIN task_student_matches tsm ON u.id = tsm.student_id
WHERE u.role = 'student'
GROUP BY u.id, u.nickname, u.avatar_url, u.student_level,
         sc.tasks_completed, sc.avg_task_quality, sc.avg_client_satisfaction,
         sc.on_time_delivery_rate, sc.quality_trend, sc.growth_rate,
         sc.opc_openness, sc.opc_persistence, sc.opc_creativity,
         sc.personality_style, sc.skills, sc.preferred_task_types,
         sc.vector_updated_at;

COMMENT ON VIEW student_matching_overview IS '学生匹配概览 - 汇总学生的能力、匹配历史等信息';

-- ============================================
-- 8. 视图：任务匹配概览
-- ============================================

CREATE OR REPLACE VIEW task_matching_overview AS
SELECT
  t.id as task_id,
  t.title,
  t.description,
  t.track,
  t.difficulty,
  t.status,
  t.matching_enabled,
  t.matched_students_count,
  t.top_match_score,
  t.matching_completed_at,
  tt.student_friendly_title,
  tt.difficulty_overall,
  tt.learning_value,
  tt.career_impact,
  tt.required_skills,
  COUNT(tsm.id) as total_matches,
  COUNT(tsm.id) FILTER (WHERE tsm.is_pushed = true) as pushed_count,
  COUNT(tsm.id) FILTER (WHERE tsm.student_viewed = true) as viewed_count,
  COUNT(tsm.id) FILTER (WHERE tsm.student_accepted = true) as accepted_count,
  AVG(tsm.overall_score) as avg_match_score
FROM tasks t
LEFT JOIN task_translations tt ON t.id = tt.task_id
LEFT JOIN task_student_matches tsm ON t.id = tsm.task_id
GROUP BY t.id, t.title, t.description, t.track, t.difficulty, t.status,
         t.matching_enabled, t.matched_students_count, t.top_match_score,
         t.matching_completed_at, tt.student_friendly_title,
         tt.difficulty_overall, tt.learning_value, tt.career_impact,
         tt.required_skills;

COMMENT ON VIEW task_matching_overview IS '任务匹配概览 - 汇总任务的匹配情况、推送情况等';

-- ============================================
-- 完成
-- ============================================

-- 输出统计信息
DO $$
BEGIN
  RAISE NOTICE '✅ 语义匹配系统数据库Schema创建完成！';
  RAISE NOTICE '📊 创建的表：';
  RAISE NOTICE '  - student_capabilities (学生能力画像表)';
  RAISE NOTICE '  - task_student_matches (任务学生匹配记录表)';
  RAISE NOTICE '  - task_translations (任务翻译表)';
  RAISE NOTICE '📊 扩展的表：';
  RAISE NOTICE '  - tasks (添加匹配相关字段)';
  RAISE NOTICE '📊 创建的视图：';
  RAISE NOTICE '  - student_matching_overview (学生匹配概览)';
  RAISE NOTICE '  - task_matching_overview (任务匹配概览)';
  RAISE NOTICE '📊 创建的函数：';
  RAISE NOTICE '  - cosine_similarity (余弦相似度计算)';
  RAISE NOTICE '  - update_student_capabilities_updated_at (自动更新时间戳)';
  RAISE NOTICE '  - update_task_translations_updated_at (自动更新时间戳)';
END $$;
