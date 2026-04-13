-- 033_community_portfolio_system.sql
-- 社群和作品展示系统

-- 1. 社群表
CREATE TABLE IF NOT EXISTS communities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  community_type VARCHAR(50) NOT NULL,          -- track_based/level_based/interest_based/project_based
  track VARCHAR(20),                            -- A/B (如果是赛道社群)
  level_range VARCHAR(20),                      -- 例如 "0-1" 或 "2-3"
  cover_image VARCHAR(500),
  member_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 社群成员表
CREATE TABLE IF NOT EXISTS community_members (
  id SERIAL PRIMARY KEY,
  community_id INTEGER NOT NULL REFERENCES communities(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  role VARCHAR(20) DEFAULT 'member',            -- admin/moderator/member
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active_at TIMESTAMP,
  post_count INTEGER DEFAULT 0,
  UNIQUE(community_id, user_id)
);

-- 3. 社群帖子表
CREATE TABLE IF NOT EXISTS community_posts (
  id SERIAL PRIMARY KEY,
  community_id INTEGER NOT NULL REFERENCES communities(id),
  author_id INTEGER NOT NULL REFERENCES users(id),
  post_type VARCHAR(20) DEFAULT 'discussion',   -- discussion/showcase/question/announcement
  title VARCHAR(500),
  content TEXT NOT NULL,
  images JSONB,                                 -- 图片数组
  attachments JSONB,                            -- 附件数组
  tags JSONB,                                   -- 标签数组

  -- 互动数据
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,

  -- 状态
  is_pinned BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'published',       -- draft/published/hidden/deleted

  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. 帖子评论表
CREATE TABLE IF NOT EXISTS post_comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES community_posts(id),
  author_id INTEGER NOT NULL REFERENCES users(id),
  parent_comment_id INTEGER REFERENCES post_comments(id),
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. 帖子点赞表
CREATE TABLE IF NOT EXISTS post_likes (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES community_posts(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id)
);

-- 6. 作品集表
CREATE TABLE IF NOT EXISTS portfolios (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  portfolio_type VARCHAR(50) NOT NULL,          -- ai_image/ai_video/ai_comic/miniapp/agent/automation/platform
  track VARCHAR(20),                            -- A/B

  -- 作品内容
  cover_image VARCHAR(500),
  media_files JSONB,                            -- 媒体文件数组
  demo_url VARCHAR(500),                        -- 演示链接
  source_code_url VARCHAR(500),                 -- 源码链接

  -- 技术栈
  tech_stack JSONB,                             -- 技术栈数组
  tools_used JSONB,                             -- 使用的工具

  -- 项目信息
  difficulty_level INTEGER,                     -- 难度等级
  completion_time INTEGER,                      -- 完成时长（小时）
  related_task_id INTEGER REFERENCES tasks(id), -- 关联任务

  -- 互动数据
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,

  -- 展示状态
  is_featured BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,
  status VARCHAR(20) DEFAULT 'published',       -- draft/published/hidden

  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. 作品评论表
CREATE TABLE IF NOT EXISTS portfolio_comments (
  id SERIAL PRIMARY KEY,
  portfolio_id INTEGER NOT NULL REFERENCES portfolios(id),
  author_id INTEGER NOT NULL REFERENCES users(id),
  parent_comment_id INTEGER REFERENCES portfolio_comments(id),
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. 作品点赞表
CREATE TABLE IF NOT EXISTS portfolio_likes (
  id SERIAL PRIMARY KEY,
  portfolio_id INTEGER NOT NULL REFERENCES portfolios(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(portfolio_id, user_id)
);

-- 9. 作品标签表
CREATE TABLE IF NOT EXISTS portfolio_tags (
  id SERIAL PRIMARY KEY,
  tag_name VARCHAR(100) NOT NULL UNIQUE,
  tag_category VARCHAR(50),                     -- tech/style/industry/tool
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. 作品-标签关联表
CREATE TABLE IF NOT EXISTS portfolio_tag_relations (
  id SERIAL PRIMARY KEY,
  portfolio_id INTEGER NOT NULL REFERENCES portfolios(id),
  tag_id INTEGER NOT NULL REFERENCES portfolio_tags(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(portfolio_id, tag_id)
);

-- 11. 精选作品表
CREATE TABLE IF NOT EXISTS featured_portfolios (
  id SERIAL PRIMARY KEY,
  portfolio_id INTEGER NOT NULL REFERENCES portfolios(id),
  featured_reason TEXT,
  featured_by INTEGER REFERENCES users(id),
  display_order INTEGER DEFAULT 0,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. 社群活动表
CREATE TABLE IF NOT EXISTS community_events (
  id SERIAL PRIMARY KEY,
  community_id INTEGER NOT NULL REFERENCES communities(id),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  event_type VARCHAR(50),                       -- workshop/competition/showcase/meetup
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  location VARCHAR(500),                        -- 线上/线下地址
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  cover_image VARCHAR(500),
  status VARCHAR(20) DEFAULT 'upcoming',        -- upcoming/ongoing/completed/cancelled
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. 活动参与表
CREATE TABLE IF NOT EXISTS event_participants (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES community_events(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  registration_status VARCHAR(20) DEFAULT 'registered', -- registered/attended/cancelled
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  attended_at TIMESTAMP,
  UNIQUE(event_id, user_id)
);

-- 索引
CREATE INDEX idx_communities_type ON communities(community_type);
CREATE INDEX idx_community_members_user ON community_members(user_id);
CREATE INDEX idx_community_members_community ON community_members(community_id);
CREATE INDEX idx_community_posts_community ON community_posts(community_id);
CREATE INDEX idx_community_posts_author ON community_posts(author_id);
CREATE INDEX idx_community_posts_type ON community_posts(post_type);
CREATE INDEX idx_post_comments_post ON post_comments(post_id);
CREATE INDEX idx_post_likes_post ON post_likes(post_id);
CREATE INDEX idx_portfolios_student ON portfolios(student_id);
CREATE INDEX idx_portfolios_type ON portfolios(portfolio_type);
CREATE INDEX idx_portfolios_track ON portfolios(track);
CREATE INDEX idx_portfolio_comments_portfolio ON portfolio_comments(portfolio_id);
CREATE INDEX idx_portfolio_likes_portfolio ON portfolio_likes(portfolio_id);
CREATE INDEX idx_portfolio_tag_relations_portfolio ON portfolio_tag_relations(portfolio_id);
CREATE INDEX idx_portfolio_tag_relations_tag ON portfolio_tag_relations(tag_id);
CREATE INDEX idx_featured_portfolios_portfolio ON featured_portfolios(portfolio_id);
CREATE INDEX idx_community_events_community ON community_events(community_id);
CREATE INDEX idx_event_participants_event ON event_participants(event_id);
CREATE INDEX idx_event_participants_user ON event_participants(user_id);

-- 插入默认社群
INSERT INTO communities (name, description, community_type, track) VALUES
('AI内容创作者社群', '专注于AI生图、AI视频、AI长漫剧等内容创作的学习交流社群', 'track_based', 'A'),
('AI工具开发者社群', '专注于AI小程序、AI Agent、自动化系统等工具开发的技术社群', 'track_based', 'B'),
('新手村', '面向Lv.0-1新手的友好互助社群', 'level_based', '0-1'),
('进阶营', '面向Lv.2-3进阶学员的深度交流社群', 'level_based', '2-3'),
('大师殿堂', '面向Lv.4专家和毕业生的高端社群', 'level_based', '4');

COMMENT ON TABLE communities IS '社群';
COMMENT ON TABLE community_members IS '社群成员';
COMMENT ON TABLE community_posts IS '社群帖子';
COMMENT ON TABLE post_comments IS '帖子评论';
COMMENT ON TABLE post_likes IS '帖子点赞';
COMMENT ON TABLE portfolios IS '作品集';
COMMENT ON TABLE portfolio_comments IS '作品评论';
COMMENT ON TABLE portfolio_likes IS '作品点赞';
COMMENT ON TABLE portfolio_tags IS '作品标签';
COMMENT ON TABLE portfolio_tag_relations IS '作品-标签关联';
COMMENT ON TABLE featured_portfolios IS '精选作品';
COMMENT ON TABLE community_events IS '社群活动';
COMMENT ON TABLE event_participants IS '活动参与';
