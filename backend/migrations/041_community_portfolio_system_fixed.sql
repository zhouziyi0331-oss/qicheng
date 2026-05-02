-- 社区与作品集系统数据库迁移(修复版)
-- 创建时间: 2026-04-13
-- 功能:实现社区动态、作品集展示、互动功能
-- 修复:使用UUID类型匹配现有users表

-- ============================================
-- 1. 社区帖子表
-- ============================================
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_role VARCHAR(20) NOT NULL CHECK (author_role IN ('student', 'company')),

  -- 帖子内容
  post_type VARCHAR(20) NOT NULL CHECK (post_type IN ('experience', 'question', 'showcase', 'discussion')),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  images JSONB, -- 图片URL数组
  tags VARCHAR(50)[] DEFAULT '{}',

  -- 关联任务
  related_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,

  -- 可见性
  visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'followers_only', 'private')),

  -- 统计数据
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,

  -- 状态
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'hidden', 'deleted')),

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. 帖子评论表
-- ============================================
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 评论内容
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE, -- 支持回复评论

  -- 统计数据
  like_count INTEGER DEFAULT 0,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. 帖子点赞表
-- ============================================
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- 唯一约束:每个用户对每个帖子只能点赞一次
  UNIQUE(post_id, user_id)
);

-- ============================================
-- 4. 评论点赞表
-- ============================================
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- 唯一约束
  UNIQUE(comment_id, user_id)
);

-- ============================================
-- 5. 作品集表
-- ============================================
CREATE TABLE IF NOT EXISTS portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- 基本信息
  display_name VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,
  cover_image_url TEXT,

  -- 联系方式(可选公开)
  public_email VARCHAR(100),
  public_website TEXT,
  social_links JSONB, -- 社交媒体链接

  -- 展示配置
  show_opc_score BOOLEAN DEFAULT FALSE,
  show_completed_tasks BOOLEAN DEFAULT TRUE,
  show_earnings BOOLEAN DEFAULT FALSE,
  show_growth_report BOOLEAN DEFAULT FALSE,

  -- 可见性
  visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),

  -- 统计数据
  view_count INTEGER DEFAULT 0,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. 作品集项目表
-- ============================================
CREATE TABLE IF NOT EXISTS portfolio_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,

  -- 项目信息
  project_title VARCHAR(200) NOT NULL,
  project_description TEXT NOT NULL,
  project_images JSONB, -- 项目图片
  project_url TEXT,
  technologies VARCHAR(50)[] DEFAULT '{}',

  -- 展示顺序
  display_order INTEGER DEFAULT 0,

  -- 是否精选
  is_featured BOOLEAN DEFAULT FALSE,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 7. 用户关注表
-- ============================================
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- 唯一约束
  UNIQUE(follower_id, following_id),

  -- 防止自己关注自己
  CHECK (follower_id != following_id)
);

-- ============================================
-- 8. 创建索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_community_posts_author_id ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_status ON community_posts(status);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_tags ON community_posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_author_id ON post_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_student_id ON portfolios(student_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_visibility ON portfolios(visibility);
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_portfolio_id ON portfolio_projects(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_display_order ON portfolio_projects(display_order);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON user_follows(following_id);

-- ============================================
-- 9. 添加注释
-- ============================================
COMMENT ON TABLE community_posts IS '社区帖子表';
COMMENT ON TABLE post_comments IS '帖子评论表';
COMMENT ON TABLE post_likes IS '帖子点赞表';
COMMENT ON TABLE comment_likes IS '评论点赞表';
COMMENT ON TABLE portfolios IS '作品集表';
COMMENT ON TABLE portfolio_projects IS '作品集项目表';
COMMENT ON TABLE user_follows IS '用户关注表';
