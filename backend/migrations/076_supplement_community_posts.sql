-- Migration: 补充 community_posts 表的缺失字段
-- 用途: 添加组队招募相关字段

-- 1. 添加缺失字段
ALTER TABLE community_posts
ADD COLUMN IF NOT EXISTS type VARCHAR(20),
ADD COLUMN IF NOT EXISTS required_skills JSONB,
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id),
ADD COLUMN IF NOT EXISTS track VARCHAR(20),
ADD COLUMN IF NOT EXISTS vacancy_count INTEGER,
ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- 2. 从现有字段迁移数据
UPDATE community_posts
SET type = post_type
WHERE type IS NULL;

-- 3. 添加约束
ALTER TABLE community_posts
ADD CONSTRAINT chk_post_type_new CHECK (type IN ('recruit', 'showcase', 'collab', 'discussion', 'experience', 'question'));

ALTER TABLE community_posts
ADD CONSTRAINT chk_post_track CHECK (track IN ('content', 'dev', 'mixed', NULL));

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_community_posts_type ON community_posts(type, status);
CREATE INDEX IF NOT EXISTS idx_community_posts_track ON community_posts(track, status);
CREATE INDEX IF NOT EXISTS idx_community_posts_team ON community_posts(team_id);

-- 5. 添加注释
COMMENT ON COLUMN community_posts.type IS '帖子类型：recruit=招募, showcase=作品展示, collab=协作, discussion=讨论';
COMMENT ON COLUMN community_posts.team_id IS '关联的队伍ID（招募帖）';
COMMENT ON COLUMN community_posts.track IS '赛道：content=内容, dev=开发, mixed=混合';
COMMENT ON COLUMN community_posts.vacancy_count IS '招募空缺数量';
