-- Phase 3.2: OPC故事墙
-- 让学生分享自己的OPC故事，看到"原来还可以这样"

-- OPC故事表
CREATE TABLE IF NOT EXISTS opc_stories (
  id VARCHAR(255) PRIMARY KEY,
  student_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  personality_type VARCHAR(100) NOT NULL, -- 人格类型
  title VARCHAR(500) NOT NULL, -- 故事标题
  story_content TEXT NOT NULL, -- 故事正文
  story_type VARCHAR(50) NOT NULL, -- 'discovery'(发现自己), 'breakthrough'(突破), 'acceptance'(接纳), 'growth'(成长)
  emotion_tags TEXT[], -- 情绪标签 ['迷茫', '惊喜', '释然', '坚定']
  life_question TEXT, -- 关联的生命问题
  before_state TEXT, -- 之前的状态
  after_state TEXT, -- 之后的状态
  key_moment TEXT, -- 关键转折点
  reflection TEXT, -- 自我反思
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'published'
  moderation_note TEXT, -- 审核备注
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false, -- 是否精选
  featured_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP
);

-- 故事点赞表
CREATE TABLE IF NOT EXISTS opc_story_likes (
  id SERIAL PRIMARY KEY,
  story_id VARCHAR(255) NOT NULL REFERENCES opc_stories(id) ON DELETE CASCADE,
  student_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(story_id, student_id)
);

-- 故事评论表
CREATE TABLE IF NOT EXISTS opc_story_comments (
  id SERIAL PRIMARY KEY,
  story_id VARCHAR(255) NOT NULL REFERENCES opc_stories(id) ON DELETE CASCADE,
  student_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  comment_content TEXT NOT NULL,
  is_author_reply BOOLEAN DEFAULT false, -- 是否是作者回复
  parent_comment_id INTEGER REFERENCES opc_story_comments(id) ON DELETE CASCADE,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 故事共鸣标记表（用于"我也有类似经历"）
CREATE TABLE IF NOT EXISTS opc_story_resonances (
  id SERIAL PRIMARY KEY,
  story_id VARCHAR(255) NOT NULL REFERENCES opc_stories(id) ON DELETE CASCADE,
  student_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  resonance_type VARCHAR(50) NOT NULL, -- 'similar_experience', 'same_feeling', 'inspired'
  note TEXT, -- 共鸣说明
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(story_id, student_id, resonance_type)
);

-- 故事标签关联表
CREATE TABLE IF NOT EXISTS opc_story_tag_relations (
  id SERIAL PRIMARY KEY,
  story_id VARCHAR(255) NOT NULL REFERENCES opc_stories(id) ON DELETE CASCADE,
  tag VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(story_id, tag)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_opc_stories_student ON opc_stories(student_id);
CREATE INDEX IF NOT EXISTS idx_opc_stories_personality ON opc_stories(personality_type);
CREATE INDEX IF NOT EXISTS idx_opc_stories_status ON opc_stories(status);
CREATE INDEX IF NOT EXISTS idx_opc_stories_type ON opc_stories(story_type);
CREATE INDEX IF NOT EXISTS idx_opc_stories_featured ON opc_stories(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_opc_stories_published_at ON opc_stories(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_opc_stories_like_count ON opc_stories(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_opc_story_likes_story ON opc_story_likes(story_id);
CREATE INDEX IF NOT EXISTS idx_opc_story_likes_student ON opc_story_likes(student_id);
CREATE INDEX IF NOT EXISTS idx_opc_story_comments_story ON opc_story_comments(story_id);
CREATE INDEX IF NOT EXISTS idx_opc_story_resonances_story ON opc_story_resonances(story_id);
CREATE INDEX IF NOT EXISTS idx_opc_story_tag_relations_tag ON opc_story_tag_relations(tag);

-- 全文搜索索引
CREATE INDEX IF NOT EXISTS idx_opc_stories_content_search ON opc_stories
  USING gin(to_tsvector('chinese', title || ' ' || story_content));

-- 评论
COMMENT ON TABLE opc_stories IS 'OPC故事墙，学生分享自己的OPC发现和成长故事';
COMMENT ON COLUMN opc_stories.story_type IS '故事类型：discovery(发现自己), breakthrough(突破), acceptance(接纳), growth(成长)';
COMMENT ON COLUMN opc_stories.before_state IS '测评前/改变前的状态';
COMMENT ON COLUMN opc_stories.after_state IS '测评后/改变后的状态';
COMMENT ON COLUMN opc_stories.key_moment IS '关键转折点描述';
COMMENT ON COLUMN opc_stories.is_featured IS '是否被推荐到首页精选';

COMMENT ON TABLE opc_story_resonances IS '故事共鸣标记，记录"我也有类似经历"';
COMMENT ON COLUMN opc_story_resonances.resonance_type IS '共鸣类型：similar_experience(类似经历), same_feeling(同感), inspired(受启发)';
