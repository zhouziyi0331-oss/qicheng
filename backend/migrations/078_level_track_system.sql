-- 等级与赛道体系
-- 实现六级等级 + 两条赛道（内容创作 / 工具开发）

-- 1. 等级配置表
CREATE TABLE IF NOT EXISTS level_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level SMALLINT NOT NULL CHECK (level BETWEEN 0 AND 5),
  name VARCHAR(50) NOT NULL,
  track VARCHAR(20) NOT NULL CHECK (track IN ('content', 'dev')),

  -- 升级条件
  required_orders INTEGER NOT NULL DEFAULT 0,
  min_rating DECIMAL(3,1) NOT NULL DEFAULT 0,

  -- 平台抽成
  platform_fee_rate DECIMAL(4,2) NOT NULL DEFAULT 0.20,

  -- 解锁功能
  unlocked_features JSONB DEFAULT '[]',

  -- 可接任务难度范围
  task_difficulty_range INTEGER[] NOT NULL DEFAULT '{1}',

  -- 等级描述
  description TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(level, track)
);

-- 2. 预置等级配置数据

-- 赛道A：内容创作
INSERT INTO level_configs (level, name, track, required_orders, min_rating, platform_fee_rate, task_difficulty_range, unlocked_features, description) VALUES
(0, '涉水者', 'content', 0, 0, 0.20, '{1}', '["查看基础任务"]', 'AI生成单张图片/简单图文'),
(1, '试流者', 'content', 3, 70, 0.20, '{1,2}', '["查看进阶任务","查看成长报告"]', 'AI生成系列图/短视频'),
(2, '行舟者', 'content', 5, 75, 0.18, '{2,3}', '["查看高级任务","导出作品集"]', 'AI生成完整视频/短剧'),
(3, '知向者', 'content', 8, 80, 0.18, '{3,4}', '["查看专家任务","申请跳级"]', 'AI生成长漫剧/系列内容'),
(4, '自流者', 'content', 10, 85, 0.15, '{4,5}', '["查看大师任务","创建作品集"]', '品牌内容矩阵/IP运营'),
(5, '河成者', 'content', 15, 90, 0.15, '{5}', '["创建队伍","发布招募","接大型项目"]', '内容战略/团队协作项目');

-- 赛道B：工具开发
INSERT INTO level_configs (level, name, track, required_orders, min_rating, platform_fee_rate, task_difficulty_range, unlocked_features, description) VALUES
(0, '涉水者', 'dev', 0, 0, 0.20, '{1}', '["查看基础任务"]', 'AI辅助简单文档/表格'),
(1, '试流者', 'dev', 3, 70, 0.20, '{1,2}', '["查看进阶任务","查看成长报告"]', 'AI生成简单小程序/工具'),
(2, '行舟者', 'dev', 5, 75, 0.18, '{2,3}', '["查看高级任务","导出代码库"]', 'AI搭建功能性小程序'),
(3, '知向者', 'dev', 8, 80, 0.18, '{3,4}', '["查看专家任务","申请跳级"]', 'AI搭建基础Agent'),
(4, '自流者', 'dev', 10, 85, 0.15, '{4,5}', '["查看大师任务","发布开源项目"]', '复杂Agent/自动化系统'),
(5, '河成者', 'dev', 15, 90, 0.15, '{5}', '["创建队伍","发布招募","接大型项目"]', '大型平台/产品级项目');

-- 3. 扩展users表：添加赛道和跳级相关字段
ALTER TABLE users
ADD COLUMN IF NOT EXISTS track VARCHAR(20) CHECK (track IN ('content', 'dev')),
ADD COLUMN IF NOT EXISTS current_level SMALLINT DEFAULT 0 CHECK (current_level BETWEEN 0 AND 5),
ADD COLUMN IF NOT EXISTS last_jump_attempt_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS jump_attempt_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS jump_success_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS jump_cooling_orders_needed INTEGER DEFAULT 0;

-- 4. 扩展tasks表：添加难度和等级要求
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS difficulty SMALLINT CHECK (difficulty BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS required_level SMALLINT CHECK (required_level BETWEEN 0 AND 5),
ADD COLUMN IF NOT EXISTS track VARCHAR(20) CHECK (track IN ('content', 'dev', 'mixed')),
ADD COLUMN IF NOT EXISTS is_team_project BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS min_team_size INTEGER,
ADD COLUMN IF NOT EXISTS max_team_size INTEGER;

-- 5. 扩展orders表：添加订单类型
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS order_type VARCHAR(50) DEFAULT 'normal' CHECK (order_type IN ('normal', 'jump_test', 'team_project'));

-- 6. 创建索引
CREATE INDEX IF NOT EXISTS idx_level_configs_track_level ON level_configs(track, level);
CREATE INDEX IF NOT EXISTS idx_users_track_level ON users(track, current_level);
CREATE INDEX IF NOT EXISTS idx_tasks_track_difficulty ON tasks(track, difficulty, required_level);
CREATE INDEX IF NOT EXISTS idx_orders_type ON orders(order_type);

-- 7. 注释
COMMENT ON TABLE level_configs IS '等级配置表：定义六级等级体系和两条赛道';
COMMENT ON COLUMN users.track IS '学生所属赛道：content=内容创作, dev=工具开发';
COMMENT ON COLUMN users.current_level IS '学生当前等级：0-5';
COMMENT ON COLUMN users.jump_cooling_orders_needed IS '跳级冷却期还需完成的订单数';
COMMENT ON COLUMN tasks.difficulty IS '任务难度：1-5';
COMMENT ON COLUMN tasks.required_level IS '任务要求的最低等级：0-5';
COMMENT ON COLUMN tasks.track IS '任务所属赛道：content/dev/mixed';
COMMENT ON COLUMN orders.order_type IS '订单类型：normal=普通订单, jump_test=跳级测试, team_project=组队项目';
