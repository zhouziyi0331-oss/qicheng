-- 跳级系统数据库表
-- 执行时间：请根据实际情况调整
-- 注意：执行前请备份数据库

-- 1. 跳级申请记录表
CREATE TABLE IF NOT EXISTS skip_level_applications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  from_level INT NOT NULL COMMENT '起始级别',
  target_level INT NOT NULL COMMENT '目标级别',
  track_name VARCHAR(50) NOT NULL COMMENT '赛道名称',
  status ENUM('pending', 'in_progress', 'submitted', 'passed', 'failed') DEFAULT 'pending' COMMENT '状态：待领取、进行中、已提交、已通过、已失败',
  task_id VARCHAR(50) UNIQUE COMMENT '任务ID',
  deadline DATETIME COMMENT '截止时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_student (student_id),
  INDEX idx_status (status),
  INDEX idx_deadline (deadline),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='跳级申请记录表';

-- 2. 跳级任务详情表
CREATE TABLE IF NOT EXISTS skip_level_tasks (
  id VARCHAR(50) PRIMARY KEY COMMENT '任务ID',
  application_id INT NOT NULL COMMENT '申请记录ID',
  name VARCHAR(200) NOT NULL COMMENT '任务名称',
  description TEXT COMMENT '任务描述',
  requirements JSON COMMENT '任务要求（JSON格式）',
  pass_score INT DEFAULT 80 COMMENT '通过分数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_application (application_id),
  FOREIGN KEY (application_id) REFERENCES skip_level_applications(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='跳级任务详情表';

-- 3. 任务进度表
CREATE TABLE IF NOT EXISTS skip_level_progress (
  id INT PRIMARY KEY AUTO_INCREMENT,
  task_id VARCHAR(50) NOT NULL COMMENT '任务ID',
  sub_task_id INT NOT NULL COMMENT '子任务ID',
  sub_task_name VARCHAR(200) COMMENT '子任务名称',
  status ENUM('done', 'active', 'locked') DEFAULT 'locked' COMMENT '状态：已完成、进行中、未解锁',
  progress INT DEFAULT 0 COMMENT '进度百分比 0-100',
  xp INT DEFAULT 0 COMMENT '经验值',
  completed_at TIMESTAMP NULL COMMENT '完成时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_task (task_id),
  INDEX idx_sub_task (task_id, sub_task_id),
  FOREIGN KEY (task_id) REFERENCES skip_level_tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='任务进度表';

-- 4. 作品提交表
CREATE TABLE IF NOT EXISTS skip_level_submissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  task_id VARCHAR(50) NOT NULL COMMENT '任务ID',
  submission_type ENUM('image', 'link') NOT NULL COMMENT '提交类型：图片、链接',
  content JSON NOT NULL COMMENT '提交内容（数组）',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_task (task_id),
  FOREIGN KEY (task_id) REFERENCES skip_level_tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='作品提交表';

-- 5. 评分结果表
CREATE TABLE IF NOT EXISTS skip_level_scores (
  id INT PRIMARY KEY AUTO_INCREMENT,
  task_id VARCHAR(50) UNIQUE NOT NULL COMMENT '任务ID',
  total_score INT NOT NULL COMMENT '总分',
  breakdown JSON NOT NULL COMMENT '分项评分（JSON格式）',
  mentor_id INT COMMENT '评分导师ID',
  mentor_comment TEXT COMMENT '导师点评',
  scored_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_task (task_id),
  INDEX idx_mentor (mentor_id),
  FOREIGN KEY (task_id) REFERENCES skip_level_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (mentor_id) REFERENCES mentors(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评分结果表';

-- 6. 失败冷却期表
CREATE TABLE IF NOT EXISTS skip_level_cooldowns (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL COMMENT '学员ID',
  levels_required INT NOT NULL COMMENT '需要升满的级别数',
  levels_completed INT DEFAULT 0 COMMENT '已完成的级别数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_student (student_id),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='失败冷却期表';

-- 7. 徽章表（如果不存在）
CREATE TABLE IF NOT EXISTS badges (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL COMMENT '学员ID',
  badge_type VARCHAR(50) NOT NULL COMMENT '徽章类型',
  badge_name VARCHAR(100) NOT NULL COMMENT '徽章名称',
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '获得时间',
  INDEX idx_student (student_id),
  INDEX idx_type (badge_type),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='徽章表';

-- 插入测试数据（可选，用于开发测试）
-- INSERT INTO skip_level_applications (student_id, from_level, target_level, track_name, task_id, deadline, status)
-- VALUES (1, 3, 4, '内容创作赛道', 'skip_task_test_1', DATE_ADD(NOW(), INTERVAL 7 DAY), 'pending');
