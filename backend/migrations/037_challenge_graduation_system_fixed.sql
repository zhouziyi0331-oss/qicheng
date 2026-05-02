-- 跳级挑战与毕业系统数据库迁移（修复版）
-- 创建时间: 2026-04-13
-- 功能：实现跳级挑战、毕业申请、毕业权益
-- 修复：使用UUID类型匹配现有users表

-- ============================================
-- 1. 跳级挑战记录表
-- ============================================
CREATE TABLE IF NOT EXISTS level_challenge_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_level INTEGER NOT NULL CHECK (current_level >= 0 AND current_level <= 4),
  target_level INTEGER NOT NULL CHECK (target_level >= 1 AND target_level <= 5),

  -- 挑战任务信息
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  challenge_description TEXT NOT NULL,
  required_abilities JSONB NOT NULL,

  -- 状态
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'approved', 'rejected')),

  -- 提交内容
  submission_url TEXT,
  submission_description TEXT,

  -- 审核信息
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  approved BOOLEAN,
  feedback TEXT,

  -- 冷却期（挑战失败后30天）
  cooldown_until TIMESTAMP WITH TIME ZONE,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. 毕业申请表
-- ============================================
CREATE TABLE IF NOT EXISTS graduation_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  current_level INTEGER NOT NULL CHECK (current_level = 4), -- 必须达到Lv.4

  -- 成就信息
  completed_tasks_count INTEGER NOT NULL,
  total_earnings DECIMAL(10,2) NOT NULL,
  portfolio_url TEXT,
  achievements TEXT,
  future_goals TEXT,

  -- 状态
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

  -- 审核信息
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  feedback TEXT,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. 毕业生权益表
-- ============================================
CREATE TABLE IF NOT EXISTS graduation_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  graduation_application_id UUID NOT NULL REFERENCES graduation_applications(id) ON DELETE CASCADE,

  -- 权益内容
  full_report_unlocked BOOLEAN DEFAULT TRUE,
  all_contacts_unlocked BOOLEAN DEFAULT TRUE,
  graduate_badge_granted BOOLEAN DEFAULT TRUE,
  investment_resources_unlocked BOOLEAN DEFAULT TRUE,

  -- 生效时间
  effective_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE, -- 永久权益则为NULL

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. 毕业生展示配置表
-- ============================================
CREATE TABLE IF NOT EXISTS graduate_showcase_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- 展示开关
  show_on_portfolio BOOLEAN DEFAULT FALSE,
  show_on_community BOOLEAN DEFAULT FALSE,
  show_contact_info BOOLEAN DEFAULT FALSE,

  -- 展示内容
  display_name VARCHAR(100),
  showcase_title VARCHAR(200),
  showcase_description TEXT,
  showcase_image_url TEXT,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. 创建索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_level_challenge_attempts_student_id ON level_challenge_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_level_challenge_attempts_status ON level_challenge_attempts(status);
CREATE INDEX IF NOT EXISTS idx_graduation_applications_status ON graduation_applications(status);
CREATE INDEX IF NOT EXISTS idx_graduation_benefits_student_id ON graduation_benefits(student_id);

-- ============================================
-- 6. 添加注释
-- ============================================
COMMENT ON TABLE level_challenge_attempts IS '跳级挑战记录表';
COMMENT ON TABLE graduation_applications IS '毕业申请表';
COMMENT ON TABLE graduation_benefits IS '毕业生权益表';
COMMENT ON TABLE graduate_showcase_settings IS '毕业生展示配置表';
