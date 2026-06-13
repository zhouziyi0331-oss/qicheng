-- E-06: 学生作品集关联
-- 让企业能看到学生的历史作品和项目经验

-- 作品集表
CREATE TABLE student_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),

  -- 作品信息
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,  -- 'web', 'mobile', 'design', 'algorithm', 'data', 'other'

  -- 技术栈
  tech_stack TEXT[] NOT NULL DEFAULT '{}',

  -- 媒体资源
  cover_image VARCHAR(500),
  images TEXT[] DEFAULT '{}',
  video_url VARCHAR(500),
  demo_url VARCHAR(500),
  github_url VARCHAR(500),

  -- 项目详情
  role VARCHAR(100),  -- '独立完成', '团队协作-负责前端', etc.
  duration_days INTEGER,
  highlights TEXT[],  -- 亮点特性
  challenges_overcome TEXT,  -- 克服的挑战

  -- 关联任务
  related_task_id UUID REFERENCES tasks(id),
  is_from_platform BOOLEAN DEFAULT false,

  -- 展示设置
  is_public BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,

  -- 统计
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,

  -- 审核状态
  status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'approved', 'rejected'
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 作品集浏览记录
CREATE TABLE portfolio_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES student_portfolios(id),
  viewer_id UUID REFERENCES users(id),
  viewer_role VARCHAR(50),  -- 'company', 'student', 'guest'
  view_duration_seconds INTEGER,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 作品集点赞
CREATE TABLE portfolio_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES student_portfolios(id),
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(portfolio_id, user_id)
);

-- 作品集标签
CREATE TABLE portfolio_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES student_portfolios(id),
  tag_name VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_portfolios_student ON student_portfolios(student_id, display_order);
CREATE INDEX idx_portfolios_status ON student_portfolios(status, created_at DESC);
CREATE INDEX idx_portfolios_category ON student_portfolios(category, is_public);
CREATE INDEX idx_portfolios_task ON student_portfolios(related_task_id);
CREATE INDEX idx_portfolio_views_portfolio ON portfolio_views(portfolio_id, viewed_at DESC);
CREATE INDEX idx_portfolio_likes_portfolio ON portfolio_likes(portfolio_id);
CREATE INDEX idx_portfolio_tags_portfolio ON portfolio_tags(portfolio_id);
CREATE INDEX idx_portfolio_tags_name ON portfolio_tags(tag_name);

-- 更新作品集浏览次数的触发器
CREATE OR REPLACE FUNCTION update_portfolio_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE student_portfolios
  SET view_count = (
    SELECT COUNT(*) FROM portfolio_views WHERE portfolio_id = NEW.portfolio_id
  )
  WHERE id = NEW.portfolio_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_portfolio_view_count
AFTER INSERT ON portfolio_views
FOR EACH ROW
EXECUTE FUNCTION update_portfolio_view_count();

-- 更新作品集点赞次数的触发器
CREATE OR REPLACE FUNCTION update_portfolio_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE student_portfolios
    SET like_count = like_count + 1
    WHERE id = NEW.portfolio_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE student_portfolios
    SET like_count = like_count - 1
    WHERE id = OLD.portfolio_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_portfolio_like_count
AFTER INSERT OR DELETE ON portfolio_likes
FOR EACH ROW
EXECUTE FUNCTION update_portfolio_like_count();

-- 学生完成任务后自动生成作品集记录的触发器
CREATE OR REPLACE FUNCTION auto_create_portfolio_from_task()
RETURNS TRIGGER AS $$
BEGIN
  -- 只有当任务完成且质量评分较高时才自动生成
  IF NEW.status = 'completed' AND OLD.status != 'completed'
     AND NEW.client_rating >= 4.0 THEN

    INSERT INTO student_portfolios (
      student_id,
      title,
      description,
      category,
      tech_stack,
      related_task_id,
      is_from_platform,
      duration_days,
      status
    ) VALUES (
      NEW.student_id,
      NEW.title,
      COALESCE(NEW.description, '通过启程平台完成的项目'),
      COALESCE(NEW.category, 'other'),
      COALESCE(NEW.required_skills, ARRAY[]::TEXT[]),
      NEW.id,
      true,
      EXTRACT(DAY FROM (NEW.completed_at - NEW.started_at)),
      'approved'  -- 平台任务自动审核通过
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_create_portfolio
AFTER UPDATE ON tasks
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION auto_create_portfolio_from_task();

-- 扩展用户表，添加作品集统计
ALTER TABLE users ADD COLUMN IF NOT EXISTS portfolio_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_portfolio_views INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_portfolio_likes INTEGER DEFAULT 0;

-- 更新用户作品集统计的触发器
CREATE OR REPLACE FUNCTION update_user_portfolio_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users
    SET portfolio_count = portfolio_count + 1
    WHERE id = NEW.student_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users
    SET portfolio_count = portfolio_count - 1
    WHERE id = OLD.student_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE users
    SET total_portfolio_views = (
      SELECT COALESCE(SUM(view_count), 0) FROM student_portfolios WHERE student_id = NEW.student_id
    ),
    total_portfolio_likes = (
      SELECT COALESCE(SUM(like_count), 0) FROM student_portfolios WHERE student_id = NEW.student_id
    )
    WHERE id = NEW.student_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_portfolio_stats
AFTER INSERT OR UPDATE OR DELETE ON student_portfolios
FOR EACH ROW
EXECUTE FUNCTION update_user_portfolio_stats();

COMMENT ON TABLE student_portfolios IS 'E-06: 学生作品集，展示学生的项目经验';
COMMENT ON TABLE portfolio_views IS '作品集浏览记录';
COMMENT ON TABLE portfolio_likes IS '作品集点赞记录';
COMMENT ON TABLE portfolio_tags IS '作品集标签';
