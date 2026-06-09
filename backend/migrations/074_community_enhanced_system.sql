-- 社区板块完整功能 - 数据库迁移
-- 迁移编号: 074
-- 创建时间: 2026-05-28
-- 优先级: P1 (组队招募) + P2 (技术交流)

-- ============================================================
-- 1. 扩展 community_posts 表
-- ============================================================

-- 添加新的帖子类型
DO $$
BEGIN
  -- 检查约束是否存在，如果存在则删除
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_post_type_new'
  ) THEN
    ALTER TABLE community_posts DROP CONSTRAINT chk_post_type_new;
  END IF;
END $$;

-- 添加新的帖子类型约束（包含新增的 skill_share 和 help）
ALTER TABLE community_posts
ADD CONSTRAINT chk_post_type_enhanced CHECK (
  type IN ('recruit', 'showcase', 'collab', 'skill_share', 'help', 'discussion', 'experience', 'question')
);

-- 添加新字段
ALTER TABLE community_posts
ADD COLUMN IF NOT EXISTS project_source VARCHAR(50),
ADD COLUMN IF NOT EXISTS my_skills JSONB,
ADD COLUMN IF NOT EXISTS required_skills_detail JSONB,
ADD COLUMN IF NOT EXISTS profit_split VARCHAR(50),
ADD COLUMN IF NOT EXISTS estimated_duration VARCHAR(50),
ADD COLUMN IF NOT EXISTS recruit_count INTEGER,
ADD COLUMN IF NOT EXISTS content_json JSONB,
ADD COLUMN IF NOT EXISTS ai_review_result JSONB,
ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS related_track VARCHAR(20),
ADD COLUMN IF NOT EXISTS related_levels INTEGER[];

-- 添加约束
ALTER TABLE community_posts
ADD CONSTRAINT chk_project_source CHECK (
  project_source IN ('platform_order', 'self_initiated', 'external', NULL)
);

ALTER TABLE community_posts
ADD CONSTRAINT chk_profit_split CHECK (
  profit_split IN ('equal', 'proportional', 'negotiable', NULL)
);

ALTER TABLE community_posts
ADD CONSTRAINT chk_related_track CHECK (
  related_track IN ('content', 'dev', 'both', NULL)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_community_posts_related_track ON community_posts(related_track);
CREATE INDEX IF NOT EXISTS idx_community_posts_is_hidden ON community_posts(is_hidden);
CREATE INDEX IF NOT EXISTS idx_community_posts_report_count ON community_posts(report_count);

-- 添加注释
COMMENT ON COLUMN community_posts.project_source IS '项目来源：platform_order(平台接单)/self_initiated(自发共创)/external(外部商单)';
COMMENT ON COLUMN community_posts.my_skills IS '发布者自身技能标签（招募帖专用）';
COMMENT ON COLUMN community_posts.required_skills_detail IS '需要的技能详情 [{skill_name, required_level: "must"/"plus"}]';
COMMENT ON COLUMN community_posts.profit_split IS '分润方式：equal(均分)/proportional(按权重)/negotiable(协商)';
COMMENT ON COLUMN community_posts.estimated_duration IS '预计周期（招募帖专用）';
COMMENT ON COLUMN community_posts.recruit_count IS '招募人数（招募帖专用）';
COMMENT ON COLUMN community_posts.content_json IS '富文本内容存储（技能分享/问题求助帖）';
COMMENT ON COLUMN community_posts.ai_review_result IS 'AI内容审核结果 {passed, confidence, flags, reason}';
COMMENT ON COLUMN community_posts.report_count IS '被举报次数';
COMMENT ON COLUMN community_posts.is_hidden IS '是否被自动隐藏（举报数≥3触发）';
COMMENT ON COLUMN community_posts.related_track IS '关联赛道：content/dev/both';
COMMENT ON COLUMN community_posts.related_levels IS '适合等级段';

-- ============================================================
-- 2. 创建 community_comments 表（评论表）
-- ============================================================

CREATE TABLE IF NOT EXISTS community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  like_count INTEGER DEFAULT 0,
  ai_review_result JSONB,
  report_count INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_community_comments_post ON community_comments(post_id, created_at DESC);
CREATE INDEX idx_community_comments_user ON community_comments(user_id, created_at DESC);
CREATE INDEX idx_community_comments_parent ON community_comments(parent_id);
CREATE INDEX idx_community_comments_is_hidden ON community_comments(is_hidden);

-- 添加注释
COMMENT ON TABLE community_comments IS '社区评论表';
COMMENT ON COLUMN community_comments.parent_id IS '父评论ID（二层嵌套）';
COMMENT ON COLUMN community_comments.like_count IS '点赞数';
COMMENT ON COLUMN community_comments.ai_review_result IS 'AI内容审核结果';
COMMENT ON COLUMN community_comments.report_count IS '被举报次数';
COMMENT ON COLUMN community_comments.is_hidden IS '是否被自动隐藏';

-- ============================================================
-- 3. 创建 community_likes 表（点赞表）
-- ============================================================

CREATE TABLE IF NOT EXISTS community_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);

-- 创建索引
CREATE INDEX idx_community_likes_target ON community_likes(target_type, target_id);
CREATE INDEX idx_community_likes_user ON community_likes(user_id, created_at DESC);

-- 添加注释
COMMENT ON TABLE community_likes IS '社区点赞表';
COMMENT ON COLUMN community_likes.target_type IS '点赞目标类型：post/comment';
COMMENT ON COLUMN community_likes.target_id IS '帖子ID或评论ID';

-- ============================================================
-- 4. 创建 community_reports 表（举报表）
-- ============================================================

CREATE TABLE IF NOT EXISTS community_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id UUID NOT NULL,
  reason VARCHAR(50) NOT NULL CHECK (reason IN ('spam', 'harassment', 'company_complaint', 'student_attack', 'false_info', 'other')),
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reporter_id, target_type, target_id)
);

-- 创建索引
CREATE INDEX idx_community_reports_target ON community_reports(target_type, target_id);
CREATE INDEX idx_community_reports_status ON community_reports(status, created_at DESC);
CREATE INDEX idx_community_reports_reporter ON community_reports(reporter_id);

-- 添加注释
COMMENT ON TABLE community_reports IS '社区举报表';
COMMENT ON COLUMN community_reports.reason IS '举报原因：spam(广告)/harassment(骚扰)/company_complaint(吐槽企业)/student_attack(攻击学生)/false_info(虚假信息)/other(其他)';
COMMENT ON COLUMN community_reports.status IS '处理状态：pending(待处理)/reviewed(已审核)/resolved(已解决)/dismissed(已驳回)';

-- ============================================================
-- 5. 创建 community_user_restrictions 表（用户限制表）
-- ============================================================

CREATE TABLE IF NOT EXISTS community_user_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restriction_type VARCHAR(50) NOT NULL CHECK (restriction_type IN ('comment_ban', 'post_ban', 'full_ban')),
  reason TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_community_user_restrictions_user ON community_user_restrictions(user_id, expires_at);
CREATE INDEX idx_community_user_restrictions_type ON community_user_restrictions(restriction_type);

-- 添加注释
COMMENT ON TABLE community_user_restrictions IS '社区用户限制表（禁言、禁止发帖等）';
COMMENT ON COLUMN community_user_restrictions.restriction_type IS '限制类型：comment_ban(禁止评论)/post_ban(禁止发帖)/full_ban(完全禁止)';
COMMENT ON COLUMN community_user_restrictions.expires_at IS '限制到期时间';

-- ============================================================
-- 6. 创建触发器 - 自动隐藏被举报内容
-- ============================================================

-- 帖子举报触发器
CREATE OR REPLACE FUNCTION auto_hide_reported_post()
RETURNS TRIGGER AS $$
BEGIN
  -- 当举报数达到3次时自动隐藏
  IF NEW.report_count >= 3 THEN
    UPDATE community_posts
    SET is_hidden = TRUE
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_hide_post
AFTER UPDATE OF report_count ON community_posts
FOR EACH ROW
WHEN (NEW.report_count >= 3 AND OLD.report_count < 3)
EXECUTE FUNCTION auto_hide_reported_post();

-- 评论举报触发器
CREATE OR REPLACE FUNCTION auto_hide_reported_comment()
RETURNS TRIGGER AS $$
BEGIN
  -- 当举报数达到3次时自动隐藏
  IF NEW.report_count >= 3 THEN
    UPDATE community_comments
    SET is_hidden = TRUE
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_hide_comment
AFTER UPDATE OF report_count ON community_comments
FOR EACH ROW
WHEN (NEW.report_count >= 3 AND OLD.report_count < 3)
EXECUTE FUNCTION auto_hide_reported_comment();

-- ============================================================
-- 7. 创建触发器 - 更新点赞数
-- ============================================================

-- 点赞时更新计数
CREATE OR REPLACE FUNCTION update_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 新增点赞
    IF NEW.target_type = 'post' THEN
      UPDATE community_posts SET like_count = like_count + 1 WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'comment' THEN
      UPDATE community_comments SET like_count = like_count + 1 WHERE id = NEW.target_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- 取消点赞
    IF OLD.target_type = 'post' THEN
      UPDATE community_posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.target_id;
    ELSIF OLD.target_type = 'comment' THEN
      UPDATE community_comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.target_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_like_count
AFTER INSERT OR DELETE ON community_likes
FOR EACH ROW
EXECUTE FUNCTION update_like_count();

-- ============================================================
-- 8. 创建视图 - 社区统计
-- ============================================================

CREATE OR REPLACE VIEW community_statistics AS
SELECT
  type,
  related_track,
  COUNT(*) as post_count,
  SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_count,
  SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_count,
  SUM(CASE WHEN is_hidden THEN 1 ELSE 0 END) as hidden_count,
  AVG(like_count) as avg_likes,
  AVG(reply_count) as avg_replies
FROM community_posts
GROUP BY type, related_track;

COMMENT ON VIEW community_statistics IS '社区统计视图';

-- ============================================================
-- 9. 添加 like_count 字段到 community_posts（如果不存在）
-- ============================================================

ALTER TABLE community_posts
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;

-- ============================================================
-- 10. 验证迁移
-- ============================================================

DO $$
BEGIN
  -- 检查 community_posts 表字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'community_posts' AND column_name = 'ai_review_result'
  ) THEN
    RAISE EXCEPTION 'Migration failed: ai_review_result column not created';
  END IF;

  -- 检查 community_comments 表
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'community_comments'
  ) THEN
    RAISE EXCEPTION 'Migration failed: community_comments table not created';
  END IF;

  -- 检查 community_likes 表
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'community_likes'
  ) THEN
    RAISE EXCEPTION 'Migration failed: community_likes table not created';
  END IF;

  -- 检查 community_reports 表
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'community_reports'
  ) THEN
    RAISE EXCEPTION 'Migration failed: community_reports table not created';
  END IF;

  RAISE NOTICE 'Migration 074 completed successfully';
END $$;
