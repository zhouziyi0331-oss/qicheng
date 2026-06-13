-- E-10: 人才优先锁定
-- 企业可以锁定优秀学生，获得优先匹配权或独家合作权

-- 人才锁定表
CREATE TABLE talent_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES users(id),
  student_id UUID NOT NULL REFERENCES users(id),

  -- 锁定类型
  lock_type VARCHAR(50) NOT NULL,  -- 'priority', 'exclusive'
  -- priority: 优先匹配权（任务优先推荐给该学生）
  -- exclusive: 独家合作（学生只接该企业的任务）

  -- 锁定期限
  duration_months INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- 费用
  monthly_fee DECIMAL(10,2) NOT NULL,
  total_fee DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'paid', 'overdue'

  -- 权益
  benefits JSONB,
  -- {
  --   "priority_level": 1,  // 优先级（1最高）
  --   "guaranteed_response_time": 2,  // 保证响应时间（小时）
  --   "discount_rate": 0.05,  // 额外折扣
  --   "exclusive_categories": ["前端开发", "UI设计"]  // 独家类别
  -- }

  -- 使用情况
  tasks_assigned INTEGER DEFAULT 0,  -- 已分配任务数
  tasks_completed INTEGER DEFAULT 0,  -- 完成任务数
  total_spent DECIMAL(10,2) DEFAULT 0,  -- 总消费

  -- 状态
  status VARCHAR(50) DEFAULT 'active',  -- 'active', 'paused', 'expired', 'cancelled'

  -- 续约
  auto_renew BOOLEAN DEFAULT false,
  renewal_count INTEGER DEFAULT 0,

  -- 备注
  notes TEXT,
  cancelled_reason TEXT,
  cancelled_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(company_id, student_id, lock_type)
);

-- 锁定历史记录
CREATE TABLE talent_lock_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lock_id UUID NOT NULL REFERENCES talent_locks(id),

  action VARCHAR(50) NOT NULL,  -- 'created', 'renewed', 'paused', 'resumed', 'cancelled', 'expired'
  action_by UUID REFERENCES users(id),
  action_reason TEXT,

  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 锁定申请表（学生需要同意）
CREATE TABLE talent_lock_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES users(id),
  student_id UUID NOT NULL REFERENCES users(id),

  lock_type VARCHAR(50) NOT NULL,
  duration_months INTEGER NOT NULL,
  monthly_fee DECIMAL(10,2) NOT NULL,
  benefits JSONB,

  -- 申请理由
  application_reason TEXT,

  -- 学生响应
  student_status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'accepted', 'rejected', 'negotiating'
  student_response TEXT,
  student_responded_at TIMESTAMPTZ,

  -- 谈判记录
  negotiation_messages JSONB DEFAULT '[]',

  -- 审批（平台审核独家锁定）
  platform_status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'approved', 'rejected'
  platform_notes TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 锁定价格配置表
CREATE TABLE talent_lock_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  lock_type VARCHAR(50) NOT NULL,
  student_level_min INTEGER NOT NULL,
  student_level_max INTEGER NOT NULL,

  base_monthly_fee DECIMAL(10,2) NOT NULL,
  duration_discount JSONB,  -- {3: 0.95, 6: 0.9, 12: 0.85}

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 锁定收益记录（学生获得的保底收益）
CREATE TABLE talent_lock_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lock_id UUID NOT NULL REFERENCES talent_locks(id),
  student_id UUID NOT NULL REFERENCES users(id),

  month VARCHAR(7) NOT NULL,  -- '2026-06'
  guaranteed_amount DECIMAL(10,2),  -- 保底收益
  actual_earnings DECIMAL(10,2),  -- 实际收益
  bonus_amount DECIMAL(10,2),  -- 额外奖金

  tasks_completed INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2),

  paid_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_locks_company ON talent_locks(company_id, status);
CREATE INDEX idx_locks_student ON talent_locks(student_id, status);
CREATE INDEX idx_locks_type ON talent_locks(lock_type, status);
CREATE INDEX idx_locks_end_date ON talent_locks(end_date) WHERE status = 'active';
CREATE INDEX idx_lock_history_lock ON talent_lock_history(lock_id, created_at DESC);
CREATE INDEX idx_lock_applications_company ON talent_lock_applications(company_id, created_at DESC);
CREATE INDEX idx_lock_applications_student ON talent_lock_applications(student_id, student_status);
CREATE INDEX idx_lock_earnings_lock ON talent_lock_earnings(lock_id, month);

-- 检查锁定过期的定时任务函数
CREATE OR REPLACE FUNCTION check_expired_talent_locks()
RETURNS void AS $$
BEGIN
  -- 标记过期的锁定
  UPDATE talent_locks
  SET status = 'expired',
      updated_at = NOW()
  WHERE status = 'active'
    AND end_date < CURRENT_DATE;

  -- 记录过期事件
  INSERT INTO talent_lock_history (id, lock_id, action)
  SELECT gen_random_uuid(), id, 'expired'
  FROM talent_locks
  WHERE status = 'expired'
    AND updated_at >= NOW() - INTERVAL '1 minute';
END;
$$ LANGUAGE plpgsql;

-- 任务分配时更新锁定统计
CREATE OR REPLACE FUNCTION update_talent_lock_stats_on_task()
RETURNS TRIGGER AS $$
BEGIN
  -- 任务分配给学生
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.student_id IS NOT NULL AND OLD.student_id IS NULL) THEN
    UPDATE talent_locks
    SET tasks_assigned = tasks_assigned + 1
    WHERE company_id = NEW.company_id
      AND student_id = NEW.student_id
      AND status = 'active';
  END IF;

  -- 任务完成
  IF TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE talent_locks
    SET tasks_completed = tasks_completed + 1,
        total_spent = total_spent + NEW.budget
    WHERE company_id = NEW.company_id
      AND student_id = NEW.student_id
      AND status = 'active';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_talent_lock_stats
AFTER INSERT OR UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_talent_lock_stats_on_task();

-- 扩展用户表，添加锁定相关字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_by_companies INTEGER DEFAULT 0;  -- 学生：被多少企业锁定
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_students INTEGER DEFAULT 0;  -- 企业：锁定了多少学生
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_lock_earnings DECIMAL(10,2) DEFAULT 0;  -- 学生：锁定总收益

-- 更新锁定数统计的触发器
CREATE OR REPLACE FUNCTION update_lock_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE users SET locked_students = locked_students + 1 WHERE id = NEW.company_id;
    UPDATE users SET locked_by_companies = locked_by_companies + 1 WHERE id = NEW.student_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'active' AND NEW.status != 'active' THEN
      UPDATE users SET locked_students = locked_students - 1 WHERE id = NEW.company_id;
      UPDATE users SET locked_by_companies = locked_by_companies - 1 WHERE id = NEW.student_id;
    ELSIF OLD.status != 'active' AND NEW.status = 'active' THEN
      UPDATE users SET locked_students = locked_students + 1 WHERE id = NEW.company_id;
      UPDATE users SET locked_by_companies = locked_by_companies + 1 WHERE id = NEW.student_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
    UPDATE users SET locked_students = locked_students - 1 WHERE id = OLD.company_id;
    UPDATE users SET locked_by_companies = locked_by_companies - 1 WHERE id = OLD.student_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lock_counts
AFTER INSERT OR UPDATE OR DELETE ON talent_locks
FOR EACH ROW
EXECUTE FUNCTION update_lock_counts();

-- 插入默认价格配置
INSERT INTO talent_lock_pricing (id, lock_type, student_level_min, student_level_max, base_monthly_fee, duration_discount) VALUES
  (gen_random_uuid(), 'priority', 1, 5, 199.00, '{"3": 0.95, "6": 0.9, "12": 0.85}'::jsonb),
  (gen_random_uuid(), 'priority', 6, 10, 299.00, '{"3": 0.95, "6": 0.9, "12": 0.85}'::jsonb),
  (gen_random_uuid(), 'priority', 11, 999, 499.00, '{"3": 0.95, "6": 0.9, "12": 0.85}'::jsonb),
  (gen_random_uuid(), 'exclusive', 1, 5, 999.00, '{"3": 0.95, "6": 0.9, "12": 0.85}'::jsonb),
  (gen_random_uuid(), 'exclusive', 6, 10, 1499.00, '{"3": 0.95, "6": 0.9, "12": 0.85}'::jsonb),
  (gen_random_uuid(), 'exclusive', 11, 999, 2499.00, '{"3": 0.95, "6": 0.9, "12": 0.85}'::jsonb);

COMMENT ON TABLE talent_locks IS 'E-10: 人才锁定，企业获得学生优先/独家合作权';
COMMENT ON TABLE talent_lock_history IS '锁定历史记录';
COMMENT ON TABLE talent_lock_applications IS '锁定申请（需要学生同意）';
COMMENT ON TABLE talent_lock_pricing IS '锁定价格配置';
COMMENT ON TABLE talent_lock_earnings IS '学生从锁定获得的收益';
