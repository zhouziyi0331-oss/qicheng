-- 前端融合相关数据库表
-- Migration: 030_frontend_fusion_tables.sql

-- 1. 用户游戏化数据
CREATE TABLE IF NOT EXISTS user_gamification (
  user_id VARCHAR(255) PRIMARY KEY,
  thinking_points INT DEFAULT 0,
  streak INT DEFAULT 0,
  ability_fragments INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 每日任务
CREATE TABLE IF NOT EXISTS daily_tasks (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  reward INT DEFAULT 0,
  target INT DEFAULT 1,
  active BOOLEAN DEFAULT true,
  order_index INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_daily_tasks (
  user_id VARCHAR(255),
  task_id VARCHAR(255),
  date DATE,
  progress INT DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, task_id, date),
  FOREIGN KEY (task_id) REFERENCES daily_tasks(id) ON DELETE CASCADE
);

-- 3. 学习统计（可能需要根据现有表调整）
CREATE TABLE IF NOT EXISTS user_learning_stats (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  session_id VARCHAR(255),
  duration_hours DECIMAL(10,2) DEFAULT 0,
  deliverable_id VARCHAR(255),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. 用户活动记录
CREATE TABLE IF NOT EXISTS user_activities (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_activities_user_created ON user_activities(user_id, created_at DESC);

-- 5. 能力系统
CREATE TABLE IF NOT EXISTS abilities (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  max_level INT DEFAULT 10,
  experience_per_level INT DEFAULT 100,
  order_index INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_abilities (
  user_id VARCHAR(255),
  ability_id VARCHAR(255),
  level INT DEFAULT 0,
  experience INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, ability_id),
  FOREIGN KEY (ability_id) REFERENCES abilities(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ability_courses (
  ability_id VARCHAR(255),
  course_id VARCHAR(255),
  PRIMARY KEY (ability_id, course_id),
  FOREIGN KEY (ability_id) REFERENCES abilities(id) ON DELETE CASCADE
);

-- 6. 能力变化记录
CREATE TABLE IF NOT EXISTS user_ability_changes (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  ability_id VARCHAR(255) NOT NULL,
  session_id VARCHAR(255),
  old_level INT,
  new_level INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ability_id) REFERENCES abilities(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ability_changes_session ON user_ability_changes(session_id);

-- 7. 项目奖励
CREATE TABLE IF NOT EXISTS project_rewards (
  session_id VARCHAR(255) PRIMARY KEY,
  thinking_points INT DEFAULT 0,
  fragments INT DEFAULT 0,
  badges JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. 板块和赛道
CREATE TABLE IF NOT EXISTS sectors (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  bg_gradient VARCHAR(255),
  careers JSONB,
  order_index INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. 技能系统
CREATE TABLE IF NOT EXISTS skills (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS course_skills (
  course_id VARCHAR(255),
  skill_id VARCHAR(255),
  PRIMARY KEY (course_id, skill_id),
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

-- 10. 初始化一些默认数据
INSERT INTO daily_tasks (id, title, description, icon, reward, target, order_index) VALUES
  ('daily_login', '每日签到', '每天登录一次', '📅', 10, 1, 1),
  ('daily_learn', '完成学习', '完成一次学习会话', '📚', 20, 1, 2),
  ('daily_practice', '代码练习', '提交一次代码', '💻', 30, 1, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO abilities (id, name, description, icon, order_index) VALUES
  ('ai_prompting', 'AI提示工程', '掌握与AI对话的技巧', '🤖', 1),
  ('text_to_image', '文生图', '使用AI生成图像', '🎨', 2),
  ('code_generation', '代码生成', '使用AI辅助编程', '💻', 3),
  ('project_decomposition', '项目拆解', '将大项目拆解为小任务', '📋', 4)
ON CONFLICT (id) DO NOTHING;

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_gamification_updated_at BEFORE UPDATE ON user_gamification
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_abilities_updated_at BEFORE UPDATE ON user_abilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE user_gamification IS '用户游戏化数据';
COMMENT ON TABLE daily_tasks IS '每日任务配置';
COMMENT ON TABLE user_daily_tasks IS '用户每日任务完成记录';
COMMENT ON TABLE user_activities IS '用户活动时间线';
COMMENT ON TABLE abilities IS '能力定义';
COMMENT ON TABLE user_abilities IS '用户能力等级';
COMMENT ON TABLE project_rewards IS '项目完成奖励';
COMMENT ON TABLE sectors IS '职业板块';
