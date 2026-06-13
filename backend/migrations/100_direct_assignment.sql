-- E-08: 定向指定学生功能
-- 允许企业直接指定学生接单，跳过匹配流程

-- 定向邀请记录表
CREATE TABLE IF NOT EXISTS direct_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),
  company_id UUID NOT NULL REFERENCES users(id),
  student_id UUID NOT NULL REFERENCES users(id),
  
  -- 邀请信息
  invitation_message TEXT,
  offered_price DECIMAL(10,2),
  deadline DATE,
  
  -- 状态
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- 'pending' - 待学生响应
  -- 'accepted' - 学生接受
  -- 'declined' - 学生拒绝
  -- 'expired' - 已过期
  -- 'cancelled' - 企业取消
  
  -- 学生响应
  student_response TEXT,
  responded_at TIMESTAMPTZ,
  
  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- 唯一约束：同一任务同一学生只能有一个有效邀请
  CONSTRAINT unique_active_invitation UNIQUE(task_id, student_id)
);

CREATE INDEX idx_direct_invitations_task ON direct_invitations(task_id, status);
CREATE INDEX idx_direct_invitations_student ON direct_invitations(student_id, status, created_at DESC);
CREATE INDEX idx_direct_invitations_company ON direct_invitations(company_id, created_at DESC);
CREATE INDEX idx_direct_invitations_expires ON direct_invitations(status, expires_at) WHERE status = 'pending';

-- 企业收藏学生表（支持定向邀请）
CREATE TABLE IF NOT EXISTS company_favorite_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES users(id),
  student_id UUID NOT NULL REFERENCES users(id),
  
  -- 收藏标签
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  
  -- 合作历史统计
  total_tasks INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2),
  last_collaborated_at TIMESTAMPTZ,
  
  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_favorite UNIQUE(company_id, student_id)
);

CREATE INDEX idx_favorite_students_company ON company_favorite_students(company_id, created_at DESC);
CREATE INDEX idx_favorite_students_tags ON company_favorite_students USING gin(tags);

-- 定向邀请统计视图
CREATE OR REPLACE VIEW direct_invitation_stats AS
SELECT
  company_id,
  COUNT(*) as total_invitations,
  COUNT(*) FILTER (WHERE status = 'accepted') as accepted_count,
  COUNT(*) FILTER (WHERE status = 'declined') as declined_count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'accepted')::numeric / 
    NULLIF(COUNT(*) FILTER (WHERE status IN ('accepted', 'declined'))::numeric, 0) * 100,
    2
  ) as acceptance_rate
FROM direct_invitations
GROUP BY company_id;

-- 自动过期待处理邀请的函数
CREATE OR REPLACE FUNCTION expire_pending_invitations()
RETURNS void AS $$
BEGIN
  UPDATE direct_invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
  
  RAISE NOTICE 'Expired % pending invitations', (SELECT COUNT(*) FROM direct_invitations WHERE status = 'expired');
END;
$$ LANGUAGE plpgsql;

-- 定时任务：每小时检查过期邀请（需要配合cron job）
-- SELECT expire_pending_invitations();

-- 触发器：学生接受邀请后更新收藏统计
CREATE OR REPLACE FUNCTION update_favorite_stats_on_accept()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- 更新收藏统计
    UPDATE company_favorite_students
    SET total_tasks = total_tasks + 1,
        last_collaborated_at = NOW(),
        updated_at = NOW()
    WHERE company_id = NEW.company_id
      AND student_id = NEW.student_id;
    
    -- 如果不在收藏列表，自动添加
    INSERT INTO company_favorite_students (id, company_id, student_id, total_tasks, last_collaborated_at)
    VALUES (gen_random_uuid(), NEW.company_id, NEW.student_id, 1, NOW())
    ON CONFLICT (company_id, student_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_favorite_stats
AFTER UPDATE ON direct_invitations
FOR EACH ROW
WHEN (NEW.status = 'accepted')
EXECUTE FUNCTION update_favorite_stats_on_accept();

-- 注释
COMMENT ON TABLE direct_invitations IS 'E-08: 定向邀请记录表，企业直接指定学生接单';
COMMENT ON TABLE company_favorite_students IS 'E-08: 企业收藏学生表，支持快速定向邀请';
COMMENT ON VIEW direct_invitation_stats IS 'E-08: 定向邀请统计视图，企业邀请接受率等指标';
