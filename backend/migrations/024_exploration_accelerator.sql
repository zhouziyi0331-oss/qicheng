-- 探索模式加速器
-- 为任务添加探索标签和探索反思

-- 任务探索标签表
CREATE TABLE IF NOT EXISTS task_exploration_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_type VARCHAR(50) NOT NULL, -- 'new_tool', 'new_style', 'new_collaboration', 'new_thinking'
  tag_label VARCHAR(100) NOT NULL, -- 标签显示文本
  exploration_description TEXT, -- 这个项目可能帮你探索什么
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 探索反思记录表
CREATE TABLE IF NOT EXISTS exploration_reflections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  reflection_type VARCHAR(50) NOT NULL, -- 'new_pattern', 'better_way', 'life_application'
  reflection_text TEXT NOT NULL, -- 反思内容
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 探索模式库（学生发现的新模式）
CREATE TABLE IF NOT EXISTS exploration_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pattern_name VARCHAR(200) NOT NULL, -- 模式名称
  pattern_description TEXT, -- 模式描述
  discovered_in_task_id UUID REFERENCES tasks(id), -- 在哪个任务中发现的
  applied_count INTEGER DEFAULT 0, -- 应用次数
  want_apply_to_life BOOLEAN DEFAULT false, -- 是否想应用到生活中
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_task_exploration_tags_task ON task_exploration_tags(task_id);
CREATE INDEX IF NOT EXISTS idx_exploration_reflections_student ON exploration_reflections(student_id);
CREATE INDEX IF NOT EXISTS idx_exploration_reflections_task ON exploration_reflections(task_id);
CREATE INDEX IF NOT EXISTS idx_exploration_patterns_student ON exploration_patterns(student_id);
