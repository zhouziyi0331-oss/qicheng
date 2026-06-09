-- 迁移094: 语义匹配系统
-- 创建日期: 2026-06-09
-- 说明: AI驱动的供需语义匹配引擎
-- 核心功能: 任务向量化、学生能力向量化、6维度匹配算法、启程老师翻译

-- ============================================================
-- 1. 学生能力画像表
-- ============================================================
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

  -- 学习轨迹
  tasks_completed INTEGER DEFAULT 0,
  avg_task_quality DECIMAL(3,2) CHECK (avg_task_quality >= 0 AND avg_task_quality <= 1),
  avg_client_satisfaction DECIMAL(3,2) CHECK (avg_client_satisfaction >= 0 AND avg_client_satisfaction <= 1),
  on_time_delivery_rate DECIMAL(3,2) CHECK (on_time_delivery_rate >= 0 AND on_time_delivery_rate <= 1),
  avg_response_time_hours DECIMAL(10,2),

  -- 成长速度
  quality_trend VARCHAR(50),              -- 'improving', 'stable', 'declining'
  growth_rate DECIMAL(3,2),
  skill_acquisition_rate DECIMAL(3,2),

  -- 工作偏好
  preferred_task_types TEXT[],
  work_style JSONB,
  max_hours_per_week INTEGER,

  -- OPC测评结果
  opc_openness INTEGER,
  opc_persistence INTEGER,
  opc_creativity INTEGER,
  personality_style VARCHAR(50),

  -- 元数据
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  vector_updated_at TIMESTAMPTZ,

  CONSTRAINT student_capabilities_unique UNIQUE (student_id)
);

CREATE INDEX idx_student_capabilities_student ON student_capabilities(student_id);
CREATE INDEX idx_student_capabilities_updated ON student_capabilities(updated_at DESC);

COMMENT ON TABLE student_capabilities IS '学生能力画像（向量化）';
COMMENT ON COLUMN student_capabilities.skill_vector IS '技能向量（1536维）';
COMMENT ON COLUMN student_capabilities.combined_vector IS '组合向量，用于快速相似度检索';
COMMENT ON COLUMN student_capabilities.skills IS '技能熟练度矩阵（JSON格式）';

-- ============================================================
-- 2. 任务-学生匹配记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS task_student_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 匹配分数（6个维度）
  overall_score DECIMAL(3,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 1),
  skill_match_score DECIMAL(3,2) CHECK (skill_match_score >= 0 AND skill_match_score <= 1),
  difficulty_match_score DECIMAL(3,2) CHECK (difficulty_match_score >= 0 AND difficulty_match_score <= 1),
  domain_match_score DECIMAL(3,2) CHECK (domain_match_score >= 0 AND domain_match_score <= 1),
  growth_potential_score DECIMAL(3,2) CHECK (growth_potential_score >= 0 AND growth_potential_score <= 1),
  reliability_score DECIMAL(3,2) CHECK (reliability_score >= 0 AND reliability_score <= 1),
  preference_score DECIMAL(3,2) CHECK (preference_score >= 0 AND preference_score <= 1),

  -- 匹配详情（JSON）
  match_breakdown JSONB,
  -- 示例: {
  --   "skill_match": {"React": 0.9, "Node.js": 0.7},
  --   "difficulty_gap": 0.2,
  --   "learning_value": 0.85,
  --   "reason": "你的React技能很匹配，这个任务能帮你提升后端能力"
  -- }

  -- 推送状态
  is_pushed BOOLEAN DEFAULT false,
  pushed_at TIMESTAMPTZ,
  student_viewed BOOLEAN DEFAULT false,
  viewed_at TIMESTAMPTZ,
  student_accepted BOOLEAN DEFAULT false,
  accepted_at TIMESTAMPTZ,
  student_rejected BOOLEAN DEFAULT false,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- 排名
  rank_in_task INTEGER,                   -- 在该任务中的排名

  -- 元数据
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT task_student_matches_unique UNIQUE (task_id, student_id)
);

CREATE INDEX idx_matches_task ON task_student_matches(task_id, overall_score DESC);
CREATE INDEX idx_matches_student ON task_student_matches(student_id, created_at DESC);
CREATE INDEX idx_matches_pushed ON task_student_matches(task_id, is_pushed, overall_score DESC);
CREATE INDEX idx_matches_rank ON task_student_matches(task_id, rank_in_task);

COMMENT ON TABLE task_student_matches IS '任务-学生匹配记录（6维度分数）';
COMMENT ON COLUMN task_student_matches.overall_score IS '综合匹配分数（0-1）';
COMMENT ON COLUMN task_student_matches.rank_in_task IS '在该任务中的排名（1=最匹配）';

-- ============================================================
-- 3. 任务翻译表（启程老师）
-- ============================================================
CREATE TABLE IF NOT EXISTS task_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

  -- 任务拆解
  functional_modules JSONB NOT NULL,
  -- 示例: [
  --   {"module": "用户登录", "description": "实现用户注册和登录功能", "skills": ["React", "JWT"], "difficulty": 3},
  --   {"module": "商品展示", "description": "展示商品列表和详情", "skills": ["React", "API调用"], "difficulty": 2}
  -- ]

  -- 学生友好描述
  student_friendly_title VARCHAR(200),
  student_friendly_description TEXT,
  what_you_will_do TEXT,                  -- "你需要做什么"
  what_you_will_learn TEXT,               -- "你会学到什么"
  estimated_hours INTEGER,

  -- 技能要求（结构化）
  required_skills JSONB NOT NULL,
  -- 示例: [
  --   {"skill": "React", "proficiency": 0.7, "weight": 0.4, "why": "需要构建用户界面"},
  --   {"skill": "Node.js", "proficiency": 0.6, "weight": 0.3, "why": "需要处理后端逻辑"}
  -- ]

  -- 难度评估
  difficulty_technical DECIMAL(3,1) CHECK (difficulty_technical >= 1 AND difficulty_technical <= 10),
  difficulty_cognitive DECIMAL(3,1) CHECK (difficulty_cognitive >= 1 AND difficulty_cognitive <= 10),
  difficulty_execution DECIMAL(3,1) CHECK (difficulty_execution >= 1 AND difficulty_execution <= 10),
  difficulty_communication DECIMAL(3,1) CHECK (difficulty_communication >= 1 AND difficulty_communication <= 10),
  difficulty_overall DECIMAL(3,1) CHECK (difficulty_overall >= 1 AND difficulty_overall <= 10),

  -- 成长价值
  learning_value DECIMAL(3,2) CHECK (learning_value >= 0 AND learning_value <= 1),
  career_impact DECIMAL(3,2) CHECK (career_impact >= 0 AND career_impact <= 1),

  -- 元数据
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT task_translations_unique UNIQUE (task_id)
);

CREATE INDEX idx_task_translations_task ON task_translations(task_id);
CREATE INDEX idx_task_translations_difficulty ON task_translations(difficulty_overall);

COMMENT ON TABLE task_translations IS '任务翻译表（启程老师将企业任务翻译为学生友好描述）';
COMMENT ON COLUMN task_translations.functional_modules IS '功能模块拆解（JSON数组）';
COMMENT ON COLUMN task_translations.student_friendly_description IS '学生能听懂的任务描述';
COMMENT ON COLUMN task_translations.required_skills IS '结构化的技能要求（JSON数组）';

-- ============================================================
-- 4. 扩展现有tasks表
-- ============================================================
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS matching_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS matched_students_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS top_match_score DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS matching_completed_at TIMESTAMPTZ;

COMMENT ON COLUMN tasks.matching_enabled IS '是否启用AI匹配（默认true）';
COMMENT ON COLUMN tasks.matched_students_count IS '已匹配的学生数量';
COMMENT ON COLUMN tasks.top_match_score IS '最高匹配分数';
COMMENT ON COLUMN tasks.matching_completed_at IS '匹配完成时间';

-- ============================================================
-- 5. 触发器：更新updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER student_capabilities_updated_at
  BEFORE UPDATE ON student_capabilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER task_translations_updated_at
  BEFORE UPDATE ON task_translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. 视图：学生能力总览
-- ============================================================
CREATE OR REPLACE VIEW student_capability_summary AS
SELECT
  sc.student_id,
  u.name as student_name,
  sc.tasks_completed,
  sc.avg_task_quality,
  sc.avg_client_satisfaction,
  sc.on_time_delivery_rate,
  sc.quality_trend,
  sc.personality_style,
  sc.vector_updated_at,
  CASE
    WHEN sc.combined_vector IS NOT NULL THEN true
    ELSE false
  END as has_vector
FROM student_capabilities sc
JOIN users u ON sc.student_id = u.id;

COMMENT ON VIEW student_capability_summary IS '学生能力总览（包含向量状态）';

-- ============================================================
-- 7. 视图：任务匹配状态总览
-- ============================================================
CREATE OR REPLACE VIEW task_matching_status AS
SELECT
  t.id as task_id,
  t.title as task_title,
  t.status as task_status,
  t.matching_enabled,
  t.matched_students_count,
  t.top_match_score,
  t.matching_completed_at,
  COUNT(DISTINCT tsm.student_id) FILTER (WHERE tsm.is_pushed = true) as pushed_count,
  COUNT(DISTINCT tsm.student_id) FILTER (WHERE tsm.student_accepted = true) as accepted_count,
  CASE
    WHEN t.combined_embedding IS NOT NULL THEN true
    ELSE false
  END as has_embedding,
  CASE
    WHEN tt.id IS NOT NULL THEN true
    ELSE false
  END as has_translation
FROM tasks t
LEFT JOIN task_student_matches tsm ON t.id = tsm.task_id
LEFT JOIN task_translations tt ON t.id = tt.task_id
GROUP BY t.id, t.title, t.status, t.matching_enabled, t.matched_students_count,
         t.top_match_score, t.matching_completed_at, t.combined_embedding, tt.id;

COMMENT ON VIEW task_matching_status IS '任务匹配状态总览（包含推送和接受统计）';
