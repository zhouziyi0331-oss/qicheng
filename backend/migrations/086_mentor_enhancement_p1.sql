-- ============================================
-- 启程平台AI导师功能增强 - P1级
-- Migration: 086
-- 创建日期: 2026-05-27
-- 功能：范例展示、提交前自查、项目复盘引导
-- ============================================

-- ============================================
-- 1. 项目复盘表
-- ============================================

CREATE TABLE IF NOT EXISTS mentor_retrospectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  -- 复盘问题和回答
  questions JSONB NOT NULL,
  -- {
  --   "question1": "这个项目最大的难点是什么？你是怎么解决的？",
  --   "question2": "如果下次接到类似项目，你会在哪里做得不一样？",
  --   "question3": "你在这个项目里用了哪些工具？哪个最顺手？"
  -- }

  answers JSONB,
  -- {
  --   "answer1": "学生回答1",
  --   "answer2": "学生回答2",
  --   "answer3": "学生回答3"
  -- }

  -- 状态
  status VARCHAR(20) DEFAULT 'pending',
  -- 'pending': 已发送问题，等待回答
  -- 'completed': 已完成回答
  -- 'skipped': 学生跳过

  -- 精华标记
  is_featured BOOLEAN DEFAULT false,
  featured_reason TEXT,

  -- 时间
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_order_retrospective UNIQUE(order_id),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'skipped'))
);

CREATE INDEX idx_retrospectives_student ON mentor_retrospectives(student_id, created_at DESC);
CREATE INDEX idx_retrospectives_status ON mentor_retrospectives(status);
CREATE INDEX idx_retrospectives_featured ON mentor_retrospectives(is_featured) WHERE is_featured = true;
CREATE INDEX idx_retrospectives_pending ON mentor_retrospectives(student_id, status) WHERE status = 'pending';

COMMENT ON TABLE mentor_retrospectives IS 'AI导师项目复盘记录表';
COMMENT ON COLUMN mentor_retrospectives.questions IS '复盘问题（3个问题的JSON）';
COMMENT ON COLUMN mentor_retrospectives.answers IS '学生回答（3个回答的JSON）';
COMMENT ON COLUMN mentor_retrospectives.status IS '状态：pending/completed/skipped';
COMMENT ON COLUMN mentor_retrospectives.is_featured IS '是否是精华复盘（进入知识中台）';

-- ============================================
-- 2. 扩展mentor_sessions表（支持新的触发类型）
-- ============================================

-- 检查trigger_type约束是否存在，如果存在则删除
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'mentor_sessions_trigger_type_check'
  ) THEN
    ALTER TABLE mentor_sessions DROP CONSTRAINT mentor_sessions_trigger_type_check;
  END IF;
END $$;

-- 添加新的触发类型约束
ALTER TABLE mentor_sessions
ADD CONSTRAINT mentor_sessions_trigger_type_check CHECK (
  trigger_type IN (
    'order_start',
    'stuck',
    'revision',
    'idle',
    'milestone',
    'risk_alert',
    'pre_submit',
    'team_collab',
    'user_message',
    'example_shown',      -- 新增：展示范例
    'retrospective'       -- 新增：项目复盘
  )
);

-- ============================================
-- 3. 性能优化
-- ============================================

-- 分析表以优化查询计划
ANALYZE mentor_retrospectives;

-- ============================================
-- 4. 权限设置
-- ============================================

-- 确保应用用户有权限访问新表
GRANT SELECT, INSERT, UPDATE, DELETE ON mentor_retrospectives TO qicheng_user;

-- ============================================
-- 5. 数据完整性检查
-- ============================================

-- 检查是否有已完成但未发送复盘的订单（可选：批量初始化）
-- 注意：这个查询只是检查，不自动发送，避免打扰用户
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM orders o
  WHERE o.status = 'completed'
    AND o.completed_at > NOW() - INTERVAL '7 days'
    AND NOT EXISTS (
      SELECT 1 FROM mentor_retrospectives mr
      WHERE mr.order_id = o.id
    );

  IF missing_count > 0 THEN
    RAISE NOTICE '发现 % 个已完成订单未发送复盘（最近7天）', missing_count;
    RAISE NOTICE '如需批量发送，请使用API: POST /api/v1/mentor/admin/batch-trigger-retrospectives';
  END IF;
END $$;

-- ============================================
-- 完成
-- ============================================

-- 记录迁移完成
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 086 completed successfully';
  RAISE NOTICE '   - Created mentor_retrospectives table';
  RAISE NOTICE '   - Extended mentor_sessions trigger types';
  RAISE NOTICE '   - Added indexes for performance';
  RAISE NOTICE '   - P1 features ready: Example Display, Pre-submit Check, Retrospective';
END $$;
