-- Phase 2.4: 真实案例库
-- 存储从学生经历中提取的案例，供AI导师引用和学生浏览

-- 案例库主表
CREATE TABLE IF NOT EXISTS case_library (
  id VARCHAR(255) PRIMARY KEY,
  case_type VARCHAR(50) NOT NULL, -- 'stuck', 'breakthrough', 'success'
  category VARCHAR(100), -- 任务类型或能力类型
  title VARCHAR(500) NOT NULL,
  situation TEXT NOT NULL, -- 遇到的情况描述
  solution TEXT, -- 解决方案（stuck案例必填）
  outcome TEXT, -- 结果（breakthrough/success案例）
  emotion VARCHAR(100), -- 当时的情绪
  time_to_resolve INTEGER, -- 花费时间（分钟）
  difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 5), -- 难度1-5
  helpfulness INTEGER DEFAULT 0, -- 有多少人觉得有帮助
  tags TEXT[], -- 标签数组
  source_observation_id VARCHAR(255), -- 来源observation ID
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 案例有帮助投票表
CREATE TABLE IF NOT EXISTS case_helpfulness_votes (
  id SERIAL PRIMARY KEY,
  case_id VARCHAR(255) NOT NULL REFERENCES case_library(id) ON DELETE CASCADE,
  student_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(case_id, student_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_case_library_type ON case_library(case_type);
CREATE INDEX IF NOT EXISTS idx_case_library_category ON case_library(category);
CREATE INDEX IF NOT EXISTS idx_case_library_tags ON case_library USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_case_library_helpfulness ON case_library(helpfulness DESC);
CREATE INDEX IF NOT EXISTS idx_case_library_created_at ON case_library(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_case_helpfulness_votes_case ON case_helpfulness_votes(case_id);
CREATE INDEX IF NOT EXISTS idx_case_helpfulness_votes_student ON case_helpfulness_votes(student_id);

-- 评论
COMMENT ON TABLE case_library IS '真实案例库，存储学生经历的卡点、突破和成功案例';
COMMENT ON COLUMN case_library.case_type IS '案例类型：stuck(卡点), breakthrough(突破), success(成功)';
COMMENT ON COLUMN case_library.category IS '案例分类（任务类型或能力类型）';
COMMENT ON COLUMN case_library.situation IS '遇到的情况描述';
COMMENT ON COLUMN case_library.solution IS '解决方案（针对stuck案例）';
COMMENT ON COLUMN case_library.outcome IS '结果描述（针对breakthrough/success案例）';
COMMENT ON COLUMN case_library.time_to_resolve IS '解决问题花费的时间（分钟）';
COMMENT ON COLUMN case_library.difficulty IS '难度等级 1-5';
COMMENT ON COLUMN case_library.helpfulness IS '有多少人标记为有帮助';
COMMENT ON COLUMN case_library.source_observation_id IS '来源的observation记录ID';
