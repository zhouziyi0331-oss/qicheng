-- 032_opc_assessment_growth_report_system.sql
-- OPC测评和成长报告系统

-- 1. OPC测评题库表
CREATE TABLE IF NOT EXISTS opc_assessment_questions (
  id SERIAL PRIMARY KEY,
  dimension VARCHAR(50) NOT NULL,               -- openness/persistence/creativity
  question_text TEXT NOT NULL,
  question_type VARCHAR(20) NOT NULL,           -- single_choice/multiple_choice/scale
  options JSONB,                                -- 选项
  scoring_rule JSONB NOT NULL,                  -- 评分规则
  difficulty_level INTEGER DEFAULT 1,           -- 难度等级 1-5
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. OPC测评记录表
CREATE TABLE IF NOT EXISTS opc_assessments (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id),
  assessment_type VARCHAR(20) DEFAULT 'full',   -- full/quick/dimension_specific
  status VARCHAR(20) DEFAULT 'in_progress',     -- in_progress/completed/abandoned
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  total_questions INTEGER,
  answered_questions INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. OPC测评答案表
CREATE TABLE IF NOT EXISTS opc_assessment_answers (
  id SERIAL PRIMARY KEY,
  assessment_id INTEGER NOT NULL REFERENCES opc_assessments(id),
  question_id INTEGER NOT NULL REFERENCES opc_assessment_questions(id),
  answer JSONB NOT NULL,                        -- 用户答案
  score INTEGER,                                -- 得分
  answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. OPC测评结果表
CREATE TABLE IF NOT EXISTS opc_assessment_results (
  id SERIAL PRIMARY KEY,
  assessment_id INTEGER NOT NULL REFERENCES opc_assessments(id),
  student_id INTEGER NOT NULL REFERENCES users(id),

  -- 三维分数
  openness_score INTEGER NOT NULL,              -- 开放性分数 0-100
  persistence_score INTEGER NOT NULL,           -- 坚持性分数 0-100
  creativity_score INTEGER NOT NULL,            -- 创造性分数 0-100

  -- 综合评级
  overall_rating VARCHAR(10) NOT NULL,          -- S/A/B/C/D

  -- 详细分析
  strengths JSONB,                              -- 优势分析
  weaknesses JSONB,                             -- 劣势分析
  recommendations JSONB,                        -- 发展建议

  -- 对比数据
  percentile_rank INTEGER,                      -- 百分位排名

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(assessment_id)
);

-- 5. 成长报告表
CREATE TABLE IF NOT EXISTS growth_reports (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id),
  report_period VARCHAR(20) NOT NULL,           -- monthly/quarterly/yearly
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- 任务统计
  tasks_completed INTEGER DEFAULT 0,
  tasks_success_rate DECIMAL(5,2),
  total_earnings DECIMAL(10,2) DEFAULT 0,

  -- 能力变化
  ability_changes JSONB,                        -- 各维度能力变化
  level_changes JSONB,                          -- 等级变化

  -- 成长亮点
  highlights JSONB,                             -- 成长亮点
  milestones JSONB,                             -- 里程碑

  -- 雷达图数据
  radar_chart_data JSONB,                       -- 六维雷达图数据

  -- 趋势数据
  trend_data JSONB,                             -- 能力趋势数据

  -- AI分析
  ai_insights TEXT,                             -- AI洞察
  ai_suggestions TEXT,                          -- AI建议

  is_unlocked BOOLEAN DEFAULT FALSE,            -- 是否解锁（毕业生全解锁）
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. 能力快照表（用于趋势分析）
CREATE TABLE IF NOT EXISTS ability_snapshots (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- 六维能力
  technical_ability INTEGER,
  creative_ability INTEGER,
  communication_ability INTEGER,
  execution_ability INTEGER,
  learning_ability INTEGER,
  responsibility INTEGER,

  -- 等级信息
  current_level INTEGER,
  track VARCHAR(20),

  -- 任务统计
  total_tasks_completed INTEGER,
  total_earnings DECIMAL(10,2),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, snapshot_date)
);

-- 7. 成长里程碑表
CREATE TABLE IF NOT EXISTS growth_milestones (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id),
  milestone_type VARCHAR(50) NOT NULL,          -- first_task/level_up/earnings_milestone/skill_mastery
  milestone_name VARCHAR(200) NOT NULL,
  description TEXT,
  achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB,                               -- 额外数据
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. 能力标签表
CREATE TABLE IF NOT EXISTS ability_tags (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id),
  tag_name VARCHAR(100) NOT NULL,               -- 标签名称
  tag_category VARCHAR(50) NOT NULL,            -- skill/trait/achievement
  confidence_score DECIMAL(3,2),                -- 置信度
  source VARCHAR(50),                           -- ai_analysis/task_performance/assessment
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, tag_name)
);

-- 索引
CREATE INDEX idx_opc_assessments_student ON opc_assessments(student_id);
CREATE INDEX idx_opc_assessment_answers_assessment ON opc_assessment_answers(assessment_id);
CREATE INDEX idx_opc_assessment_results_student ON opc_assessment_results(student_id);
CREATE INDEX idx_growth_reports_student ON growth_reports(student_id);
CREATE INDEX idx_growth_reports_period ON growth_reports(period_start, period_end);
CREATE INDEX idx_ability_snapshots_student ON ability_snapshots(student_id);
CREATE INDEX idx_ability_snapshots_date ON ability_snapshots(snapshot_date);
CREATE INDEX idx_growth_milestones_student ON growth_milestones(student_id);
CREATE INDEX idx_ability_tags_student ON ability_tags(student_id);

-- 插入示例测评题目
INSERT INTO opc_assessment_questions (dimension, question_text, question_type, options, scoring_rule) VALUES
('openness', '当面对一个全新的技术领域时，你会：', 'single_choice',
 '["A. 立即开始学习，充满好奇", "B. 先观望一下再决定", "C. 感到有些抗拒", "D. 完全不感兴趣"]',
 '{"A": 10, "B": 6, "C": 3, "D": 0}'),

('openness', '你更喜欢：', 'single_choice',
 '["A. 尝试新的工作方法", "B. 使用熟悉的方法", "C. 两者结合", "D. 看情况而定"]',
 '{"A": 10, "B": 4, "C": 7, "D": 6}'),

('persistence', '遇到困难的任务时，你通常会：', 'single_choice',
 '["A. 坚持到底，直到解决", "B. 尝试一段时间后放弃", "C. 立即寻求帮助", "D. 选择放弃"]',
 '{"A": 10, "B": 5, "C": 7, "D": 0}'),

('persistence', '你认为自己的毅力水平是：', 'scale',
 '{"min": 1, "max": 10, "label": "1=很低, 10=很高"}',
 '{"formula": "score * 10"}'),

('creativity', '在解决问题时，你更倾向于：', 'single_choice',
 '["A. 寻找创新的解决方案", "B. 使用标准的解决方法", "C. 参考他人的方案", "D. 等待指导"]',
 '{"A": 10, "B": 5, "C": 6, "D": 2}'),

('creativity', '你认为自己的创造力如何：', 'scale',
 '{"min": 1, "max": 10, "label": "1=很低, 10=很高"}',
 '{"formula": "score * 10"}');

COMMENT ON TABLE opc_assessment_questions IS 'OPC测评题库';
COMMENT ON TABLE opc_assessments IS 'OPC测评记录';
COMMENT ON TABLE opc_assessment_answers IS 'OPC测评答案';
COMMENT ON TABLE opc_assessment_results IS 'OPC测评结果';
COMMENT ON TABLE growth_reports IS '成长报告';
COMMENT ON TABLE ability_snapshots IS '能力快照';
COMMENT ON TABLE growth_milestones IS '成长里程碑';
COMMENT ON TABLE ability_tags IS '能力标签';
