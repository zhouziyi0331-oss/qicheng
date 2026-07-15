-- 修复现有表字段，确保数据关联完整

-- 1. 确保 task_payments 表存在 client_rating 字段
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'task_assignments' AND column_name = 'client_rating'
  ) THEN
    ALTER TABLE task_assignments ADD COLUMN client_rating SMALLINT;
  END IF;
END $$;

-- 2. 确保 task_assignments 表有必要的统计字段
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'task_assignments' AND column_name = 'stuck_count'
  ) THEN
    ALTER TABLE task_assignments ADD COLUMN stuck_count INT DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'task_assignments' AND column_name = 'ai_help_count'
  ) THEN
    ALTER TABLE task_assignments ADD COLUMN ai_help_count INT DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'task_assignments' AND column_name = 'student_rating'
  ) THEN
    ALTER TABLE task_assignments ADD COLUMN student_rating SMALLINT;
  END IF;
END $$;

-- 3. 确保 student_profiles 表有必要字段
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'student_profiles' AND column_name = 'test_completed'
  ) THEN
    ALTER TABLE student_profiles ADD COLUMN test_completed BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'student_profiles' AND column_name = 'test_score'
  ) THEN
    ALTER TABLE student_profiles ADD COLUMN test_score SMALLINT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'student_profiles' AND column_name = 'onboarding_step'
  ) THEN
    ALTER TABLE student_profiles ADD COLUMN onboarding_step SMALLINT DEFAULT 0;
  END IF;
END $$;

-- 4. 确保 clients 表有联系方式字段（如果表存在）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'clients' AND column_name = 'contact_person'
    ) THEN
      ALTER TABLE clients ADD COLUMN contact_person VARCHAR(128);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'clients' AND column_name = 'wechat'
    ) THEN
      ALTER TABLE clients ADD COLUMN wechat VARCHAR(64);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'clients' AND column_name = 'phone'
    ) THEN
      ALTER TABLE clients ADD COLUMN phone VARCHAR(32);
    END IF;
  END IF;
END $$;

-- 5. 创建 task_payments 表（如果不存在）
CREATE TABLE IF NOT EXISTS task_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_assignment_id UUID REFERENCES task_assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(32) DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_payments_student ON task_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_task_payments_assignment ON task_payments(task_assignment_id);
CREATE INDEX IF NOT EXISTS idx_task_payments_status ON task_payments(student_id, status);

-- 添加注释
COMMENT ON COLUMN task_assignments.stuck_count IS '学生卡住次数';
COMMENT ON COLUMN task_assignments.ai_help_count IS 'AI帮助次数';
COMMENT ON COLUMN task_assignments.student_rating IS '学生对企业的评分';
COMMENT ON COLUMN task_assignments.client_rating IS '企业对学生的评分';
