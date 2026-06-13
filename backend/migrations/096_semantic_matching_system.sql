-- Migration: 096_semantic_matching_system.sql
-- Description: 语义匹配引擎核心表 - 学生能力画像、任务学生匹配、任务翻译
-- Created: 2026-06-11
-- Author: Claude Opus 4.7

-- =====================================================
-- 1. 学生能力画像表
-- =====================================================

CREATE TABLE IF NOT EXISTS student_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 能力向量（4个维度）
  skill_vector vector(1536),              -- 技能向量
  trajectory_vector vector(512),          -- 学习轨迹向量
  quality_vector vector(512),             -- 质量向量
  preference_vector vector(512),          -- 偏好向量
  combined_vector vector(1536),           -- 组合向量（用于快速检索）

  -- 技能熟练度矩阵（JSON）
  skills JSONB NOT NULL DEFAULT '{}',
  -- 示例: {
  --   "React": {"proficiency": 0.8, "confidence": 0.9, "lastPracticed": "2024-01-15"},
  --   "Node.js": {"proficiency": 0.7, "confidence": 0.85, "lastPracticed": "2024-01-10"}
  -- }

  -- 学习轨迹指标
  tasks_completed INTEGER DEFAULT 0,
  avg_task_quality DECIMAL(3,2) CHECK (avg_task_quality BETWEEN 0 AND 1),
  avg_client_satisfaction DECIMAL(3,2) CHECK (avg_client_satisfaction BETWEEN 0 AND 1),
  on_time_delivery_rate DECIMAL(3,2) CHECK (on_time_delivery_rate BETWEEN 0 AND 1),
  avg_response_time_hours DECIMAL(10,2),

  -- 成长速度指标
  quality_trend VARCHAR(50) CHECK (quality_trend IN ('improving', 'stable', 'declining', 'unknown')),
  growth_rate DECIMAL(3,2),                -- 成长率 (0-1)
  skill_acquisition_rate DECIMAL(3,2),    -- 技能获取速度

  -- 工作偏好
  preferred_task_types TEXT[],             -- 偏好的任务类型
  work_style JSONB DEFAULT '{}',           -- 工作风格偏好
  max_hours_per_week INTEGER,              -- 每周最大工作时长

  -- OPC测评结果
  opc_openness INTEGER CHECK (opc_openness BETWEEN 0 AND 100),
  opc_persistence INTEGER CHECK (opc_persistence BETWEEN 0 AND 100),
  opc_creativity INTEGER CHECK (opc_creativity BETWEEN 0 AND 100),
  personality_style VARCHAR(100),          -- 人格风格标签

  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  vector_updated_at TIMESTAMPTZ,           -- 向量最后更新时间

  -- 约束
  UNIQUE(student_id)
);

-- 创建索引
CREATE INDEX idx_student_capabilities_student ON student_capabilities(student_id);
CREATE INDEX idx_student_capabilities_quality ON student_capabilities(avg_task_quality DESC) WHERE avg_task_quality IS NOT NULL;
CREATE INDEX idx_student_capabilities_updated ON student_capabilities(updated_at DESC);

-- 向量索引（使用ivfflat进行相似度搜索）
CREATE INDEX idx_student_capabilities_combined_vector ON student_capabilities
  USING ivfflat (combined_vector vector_cosine_ops) WITH (lists = 100);

-- 添加表注释
COMMENT ON TABLE student_capabilities IS '学生能力画像表 - 存储学生的技能向量、学习轨迹、工作偏好等';
COMMENT ON COLUMN student_capabilities.combined_vector IS '组合向量，用于与任务向量进行余弦相似度匹配';
COMMENT ON COLUMN student_capabilities.skills IS 'JSON格式的技能熟练度矩阵，包含proficiency、confidence、lastPracticed等字段';

-- =====================================================
-- 2. 任务学生匹配记录表
-- =====================================================

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
  match_breakdown JSONB DEFAULT '{}',
  -- 示例: {
  --   "skillMatches": ["React", "TypeScript"],
  --   "skillGaps": ["GraphQL"],
  --   "matchReasons": ["技能匹配度高", "成长潜力大"],
  --   "concerns": ["首次接触该领域"]
  -- }

  -- 推送状态
  is_pushed BOOLEAN DEFAULT false,         -- 是否已推送给学生
  pushed_at TIMESTAMPTZ,                   -- 推送时间
  student_viewed BOOLEAN DEFAULT false,    -- 学生是否已查看
  viewed_at TIMESTAMPTZ,                   -- 查看时间
  student_accepted BOOLEAN DEFAULT false,  -- 学生是否接受
  accepted_at TIMESTAMPTZ,                 -- 接受时间

  -- 排名
  rank_in_task INTEGER,                    -- 在该任务中的排名（1-N）

  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 约束
  UNIQUE(task_id, student_id)
);

-- 创建索引
CREATE INDEX idx_matches_task_score ON task_student_matches(task_id, overall_score DESC);
CREATE INDEX idx_matches_student_created ON task_student_matches(student_id, created_at DESC);
CREATE INDEX idx_matches_pushed ON task_student_matches(task_id, is_pushed, overall_score DESC)
  WHERE is_pushed = true;
CREATE INDEX idx_matches_rank ON task_student_matches(task_id, rank_in_task) WHERE rank_in_task IS NOT NULL;
CREATE INDEX idx_matches_accepted ON task_student_matches(student_accepted, accepted_at)
  WHERE student_accepted = true;

-- 添加表注释
COMMENT ON TABLE task_student_matches IS '任务学生匹配记录表 - 存储AI匹配的结果和6维度评分';
COMMENT ON COLUMN task_student_matches.overall_score IS '综合匹配分数 (0-1)，由6个维度加权计算得出';
COMMENT ON COLUMN task_student_matches.match_breakdown IS 'JSON格式的详细匹配分析，包含匹配原因、技能差距等';
COMMENT ON COLUMN task_student_matches.rank_in_task IS '在该任务的所有候选学生中的排名，1表示最匹配';

-- =====================================================
-- 3. 任务翻译表（启程老师）
-- =====================================================

CREATE TABLE IF NOT EXISTS task_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

  -- 任务拆解
  functional_modules JSONB NOT NULL DEFAULT '[]',
  -- 示例: [
  --   {
  --     "module": "用户登录",
  --     "description": "实现用户注册和登录功能",
  --     "skills": ["React", "JWT"],
  --     "difficulty": 3
  --   }
  -- ]

  -- 学生友好描述
  student_friendly_title VARCHAR(200),
  student_friendly_description TEXT,
  what_you_will_do TEXT,                  -- "你需要做什么"
  what_you_will_learn TEXT,               -- "你会学到什么"
  estimated_hours INTEGER,                -- 预估工作时长

  -- 技能要求（结构化）
  required_skills JSONB NOT NULL DEFAULT '[]',
  -- 示例: [
  --   {
  --     "skill": "React",
  --     "proficiency": 0.7,
  --     "weight": 0.4,
  --     "why": "需要构建用户界面"
  --   }
  -- ]

  -- 难度评估（1-10分）
  difficulty_technical DECIMAL(3,1) CHECK (difficulty_technical BETWEEN 1 AND 10),
  difficulty_cognitive DECIMAL(3,1) CHECK (difficulty_cognitive BETWEEN 1 AND 10),
  difficulty_execution DECIMAL(3,1) CHECK (difficulty_execution BETWEEN 1 AND 10),
  difficulty_communication DECIMAL(3,1) CHECK (difficulty_communication BETWEEN 1 AND 10),
  difficulty_overall DECIMAL(3,1) CHECK (difficulty_overall BETWEEN 1 AND 10),

  -- 成长价值
  learning_value DECIMAL(3,2) CHECK (learning_value BETWEEN 0 AND 1),    -- 学习价值
  career_impact DECIMAL(3,2) CHECK (career_impact BETWEEN 0 AND 1),      -- 职业影响

  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 约束
  UNIQUE(task_id)
);

-- 创建索引
CREATE INDEX idx_task_translations_task ON task_translations(task_id);
CREATE INDEX idx_task_translations_difficulty ON task_translations(difficulty_overall);
CREATE INDEX idx_task_translations_learning_value ON task_translations(learning_value DESC)
  WHERE learning_value IS NOT NULL;

-- 添加表注释
COMMENT ON TABLE task_translations IS '任务翻译表 - 启程老师将企业任务翻译为学生易懂的语言';
COMMENT ON COLUMN task_translations.functional_modules IS 'JSON格式的功能模块拆解，帮助学生理解任务结构';
COMMENT ON COLUMN task_translations.required_skills IS 'JSON格式的技能要求，包含熟练度、权重、原因等';
COMMENT ON COLUMN task_translations.difficulty_overall IS '综合难度评分 (1-10)，由技术、认知、执行、沟通4个维度计算';

-- =====================================================
-- 4. 扩展tasks表
-- =====================================================

-- 添加匹配相关字段到tasks表
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS matching_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS matched_students_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS top_match_score DECIMAL(3,2),
  ADD COLUMN IF NOT EXISTS matching_completed_at TIMESTAMPTZ;

-- 添加字段注释
COMMENT ON COLUMN tasks.matching_enabled IS '是否启用AI匹配，false表示企业手动选择学生';
COMMENT ON COLUMN tasks.matched_students_count IS '已匹配的学生数量';
COMMENT ON COLUMN tasks.top_match_score IS '最高匹配分数，用于快速判断匹配质量';
COMMENT ON COLUMN tasks.matching_completed_at IS 'AI匹配完成时间';

-- 为新增字段创建索引
CREATE INDEX idx_tasks_matching_enabled ON tasks(matching_enabled) WHERE matching_enabled = true;
CREATE INDEX idx_tasks_matching_completed ON tasks(matching_completed_at DESC)
  WHERE matching_completed_at IS NOT NULL;

-- =====================================================
-- 5. 自动更新时间戳触发器
-- =====================================================

-- 为student_capabilities创建更新触发器
CREATE OR REPLACE FUNCTION update_student_capabilities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_student_capabilities_timestamp
  BEFORE UPDATE ON student_capabilities
  FOR EACH ROW
  EXECUTE FUNCTION update_student_capabilities_updated_at();

-- 为task_translations创建更新触发器
CREATE OR REPLACE FUNCTION update_task_translations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_task_translations_timestamp
  BEFORE UPDATE ON task_translations
  FOR EACH ROW
  EXECUTE FUNCTION update_task_translations_updated_at();

-- =====================================================
-- 6. 验证和统计视图
-- =====================================================

-- 创建学生匹配统计视图
CREATE OR REPLACE VIEW v_student_match_stats AS
SELECT
  s.student_id,
  u.name as student_name,
  COUNT(*) as total_matches,
  COUNT(*) FILTER (WHERE is_pushed = true) as pushed_count,
  COUNT(*) FILTER (WHERE student_accepted = true) as accepted_count,
  AVG(overall_score) as avg_match_score,
  MAX(overall_score) as best_match_score,
  MAX(created_at) as last_matched_at
FROM task_student_matches s
JOIN users u ON s.student_id = u.id
GROUP BY s.student_id, u.name;

COMMENT ON VIEW v_student_match_stats IS '学生匹配统计视图 - 汇总每个学生的匹配情况';

-- 创建任务匹配统计视图
CREATE OR REPLACE VIEW v_task_match_stats AS
SELECT
  t.task_id,
  tk.title as task_title,
  COUNT(*) as total_candidates,
  COUNT(*) FILTER (WHERE is_pushed = true) as pushed_count,
  COUNT(*) FILTER (WHERE student_accepted = true) as accepted_count,
  AVG(overall_score) as avg_match_score,
  MAX(overall_score) as top_match_score,
  MIN(created_at) as first_match_at,
  MAX(created_at) as last_match_at
FROM task_student_matches t
JOIN tasks tk ON t.task_id = tk.id
GROUP BY t.task_id, tk.title;

COMMENT ON VIEW v_task_match_stats IS '任务匹配统计视图 - 汇总每个任务的候选学生情况';

-- =====================================================
-- 7. 数据完整性检查
-- =====================================================

-- 检查pgvector扩展是否已安装
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    RAISE NOTICE 'Warning: pgvector extension not installed. Vector columns will not function properly.';
    RAISE NOTICE 'Please install with: CREATE EXTENSION vector;';
  END IF;
END $$;

-- =====================================================
-- Migration完成
-- =====================================================

-- 插入迁移记录（如果有migrations表）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'migrations') THEN
    INSERT INTO migrations (version, name, executed_at)
    VALUES ('096', 'semantic_matching_system', NOW())
    ON CONFLICT (version) DO NOTHING;
  END IF;
END $$;
