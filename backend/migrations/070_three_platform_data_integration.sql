-- ============================================
-- 三端数据互联系统
-- 学生PBL项目与企业、平台的数据连接
-- ============================================

-- 1. 项目-任务关联表
CREATE TABLE project_task_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pbl_project_id UUID NOT NULL REFERENCES pbl_projects(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

  -- 关联类型
  link_type TEXT NOT NULL,  -- inspired_by, similar_to, template_from, converted_to

  -- 说明
  description TEXT,

  -- 创建者
  created_by UUID REFERENCES users(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 项目查看记录（企业查看学生项目）
CREATE TABLE project_view_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES pbl_projects(id) ON DELETE CASCADE,
  deliverable_id UUID REFERENCES pbl_project_deliverables(id) ON DELETE CASCADE,

  -- 查看者信息
  viewer_id UUID NOT NULL REFERENCES users(id),
  viewer_type TEXT NOT NULL,  -- company, platform_admin, student

  -- 查看详情
  view_duration INTEGER,  -- 查看时长（秒）

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 项目推荐记录
CREATE TABLE project_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES pbl_projects(id) ON DELETE CASCADE,
  deliverable_id UUID REFERENCES pbl_project_deliverables(id) ON DELETE CASCADE,

  -- 推荐给谁
  recommended_to_company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- 推荐人
  recommended_by_admin_id UUID NOT NULL REFERENCES users(id),

  -- 推荐信息
  reason TEXT,
  recommendation_note TEXT,

  -- 状态
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, viewed, contacted, task_created, declined

  -- 响应信息
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  response_note TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 项目点赞记录
CREATE TABLE project_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES pbl_projects(id) ON DELETE CASCADE,
  deliverable_id UUID REFERENCES pbl_project_deliverables(id) ON DELETE CASCADE,

  -- 点赞者
  user_id UUID NOT NULL REFERENCES users(id),
  user_type TEXT NOT NULL,  -- student, company, platform_admin

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 唯一约束：一个用户只能点赞一次
  UNIQUE(deliverable_id, user_id)
);

-- 5. 扩展 pbl_project_deliverables 表
ALTER TABLE pbl_project_deliverables
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS featured_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS admin_review_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS admin_review_notes TEXT,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- 6. 扩展 student_profiles 表
ALTER TABLE student_profiles
ADD COLUMN IF NOT EXISTS public_project_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS featured_project_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_project_views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_project_likes INTEGER DEFAULT 0;

-- 索引
CREATE INDEX idx_project_task_links_project ON project_task_links(pbl_project_id);
CREATE INDEX idx_project_task_links_task ON project_task_links(task_id);
CREATE INDEX idx_project_view_logs_project ON project_view_logs(project_id);
CREATE INDEX idx_project_view_logs_viewer ON project_view_logs(viewer_id);
CREATE INDEX idx_project_view_logs_created ON project_view_logs(created_at);
CREATE INDEX idx_project_recommendations_project ON project_recommendations(project_id);
CREATE INDEX idx_project_recommendations_company ON project_recommendations(recommended_to_company_id);
CREATE INDEX idx_project_recommendations_status ON project_recommendations(status);
CREATE INDEX idx_project_likes_deliverable ON project_likes(deliverable_id);
CREATE INDEX idx_project_likes_user ON project_likes(user_id);

-- 触发器：更新项目查看次数
CREATE OR REPLACE FUNCTION update_project_view_count()
RETURNS TRIGGER AS $$
BEGIN
  -- 更新成果的查看次数
  IF NEW.deliverable_id IS NOT NULL THEN
    UPDATE pbl_project_deliverables
    SET view_count = view_count + 1
    WHERE id = NEW.deliverable_id;
  END IF;

  -- 更新学生的总查看次数
  UPDATE student_profiles
  SET total_project_views = total_project_views + 1
  WHERE user_id = (
    SELECT user_id FROM pbl_projects WHERE id = NEW.project_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_view_count
AFTER INSERT ON project_view_logs
FOR EACH ROW
EXECUTE FUNCTION update_project_view_count();

-- 触发器：更新项目点赞次数
CREATE OR REPLACE FUNCTION update_project_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 增加点赞
    IF NEW.deliverable_id IS NOT NULL THEN
      UPDATE pbl_project_deliverables
      SET like_count = like_count + 1
      WHERE id = NEW.deliverable_id;
    END IF;

    UPDATE student_profiles
    SET total_project_likes = total_project_likes + 1
    WHERE user_id = (
      SELECT user_id FROM pbl_projects WHERE id = NEW.project_id
    );

  ELSIF TG_OP = 'DELETE' THEN
    -- 减少点赞
    IF OLD.deliverable_id IS NOT NULL THEN
      UPDATE pbl_project_deliverables
      SET like_count = GREATEST(like_count - 1, 0)
      WHERE id = OLD.deliverable_id;
    END IF;

    UPDATE student_profiles
    SET total_project_likes = GREATEST(total_project_likes - 1, 0)
    WHERE user_id = (
      SELECT user_id FROM pbl_projects WHERE id = OLD.project_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_like_count
AFTER INSERT OR DELETE ON project_likes
FOR EACH ROW
EXECUTE FUNCTION update_project_like_count();

-- 触发器：更新学生的项目统计
CREATE OR REPLACE FUNCTION update_student_project_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- 公开项目数
  IF NEW.is_public = true AND (OLD.is_public IS NULL OR OLD.is_public = false) THEN
    UPDATE student_profiles
    SET public_project_count = public_project_count + 1
    WHERE user_id = (SELECT user_id FROM pbl_projects WHERE id = NEW.project_id);
  ELSIF NEW.is_public = false AND OLD.is_public = true THEN
    UPDATE student_profiles
    SET public_project_count = GREATEST(public_project_count - 1, 0)
    WHERE user_id = (SELECT user_id FROM pbl_projects WHERE id = NEW.project_id);
  END IF;

  -- 精选项目数
  IF NEW.is_featured = true AND (OLD.is_featured IS NULL OR OLD.is_featured = false) THEN
    UPDATE student_profiles
    SET featured_project_count = featured_project_count + 1
    WHERE user_id = (SELECT user_id FROM pbl_projects WHERE id = NEW.project_id);
  ELSIF NEW.is_featured = false AND OLD.is_featured = true THEN
    UPDATE student_profiles
    SET featured_project_count = GREATEST(featured_project_count - 1, 0)
    WHERE user_id = (SELECT user_id FROM pbl_projects WHERE id = NEW.project_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_student_project_stats
AFTER INSERT OR UPDATE ON pbl_project_deliverables
FOR EACH ROW
EXECUTE FUNCTION update_student_project_stats();

-- 视图：学生项目成果概览（供企业和平台查看）
CREATE VIEW student_project_overview AS
SELECT
  u.id AS student_id,
  u.name AS student_name,
  sp.level AS student_level,
  sp.opc_label,

  -- 项目统计
  COUNT(DISTINCT p.id) AS total_projects,
  COUNT(DISTINCT CASE WHEN p.status = 'completed' THEN p.id END) AS completed_projects,
  COUNT(DISTINCT pd.id) FILTER (WHERE pd.is_public = true) AS public_projects,
  COUNT(DISTINCT pd.id) FILTER (WHERE pd.is_featured = true) AS featured_projects,

  -- 互动统计
  COALESCE(SUM(pd.view_count), 0) AS total_views,
  COALESCE(SUM(pd.like_count), 0) AS total_likes,

  -- 质量统计
  ROUND(AVG(pd.quality_score), 1) AS avg_quality_score,

  -- 最新项目
  MAX(p.created_at) AS latest_project_date

FROM users u
LEFT JOIN student_profiles sp ON u.id = sp.user_id
LEFT JOIN pbl_projects p ON u.id = p.user_id
LEFT JOIN pbl_project_deliverables pd ON p.id = pd.project_id
WHERE u.role = 'student'
GROUP BY u.id, u.name, sp.level, sp.opc_label;

-- 视图：精选项目列表（供企业查看）
CREATE VIEW featured_projects_view AS
SELECT
  pd.id AS deliverable_id,
  p.id AS project_id,
  p.user_id AS student_id,
  u.name AS student_name,
  sp.level AS student_level,
  sp.opc_label,

  -- 项目信息
  p.title AS project_title,
  p.description AS project_description,
  p.domain,

  -- 成果信息
  pd.title AS deliverable_title,
  pd.description AS deliverable_description,
  pd.deliverable_type,
  pd.showcase_url,
  pd.quality_score,

  -- 统计信息
  pd.view_count,
  pd.like_count,

  -- 时间信息
  pd.featured_at,
  pd.created_at

FROM pbl_project_deliverables pd
JOIN pbl_projects p ON pd.project_id = p.id
JOIN users u ON p.user_id = u.id
LEFT JOIN student_profiles sp ON u.id = sp.user_id
WHERE pd.is_public = true
  AND pd.is_featured = true
  AND pd.admin_review_status = 'approved'
ORDER BY pd.featured_at DESC;

-- 视图：项目推荐统计
CREATE VIEW project_recommendation_stats AS
SELECT
  pr.project_id,
  p.title AS project_title,
  p.user_id AS student_id,
  u.name AS student_name,

  -- 推荐统计
  COUNT(*) AS total_recommendations,
  COUNT(*) FILTER (WHERE pr.status = 'viewed') AS viewed_count,
  COUNT(*) FILTER (WHERE pr.status = 'contacted') AS contacted_count,
  COUNT(*) FILTER (WHERE pr.status = 'task_created') AS task_created_count,
  COUNT(*) FILTER (WHERE pr.status = 'declined') AS declined_count,

  -- 转化率
  ROUND(
    COUNT(*) FILTER (WHERE pr.status = 'task_created')::FLOAT /
    NULLIF(COUNT(*), 0) * 100,
    2
  ) AS conversion_rate,

  -- 时间信息
  MIN(pr.created_at) AS first_recommended_at,
  MAX(pr.created_at) AS last_recommended_at

FROM project_recommendations pr
JOIN pbl_projects p ON pr.project_id = p.id
JOIN users u ON p.user_id = u.id
GROUP BY pr.project_id, p.title, p.user_id, u.name;

-- 函数：获取学生的公开项目列表（供企业查看）
CREATE OR REPLACE FUNCTION get_student_public_projects(
  p_student_id UUID,
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  project_id UUID,
  project_title TEXT,
  project_description TEXT,
  domain TEXT,
  deliverable_id UUID,
  deliverable_title TEXT,
  deliverable_type TEXT,
  quality_score INTEGER,
  view_count INTEGER,
  like_count INTEGER,
  is_featured BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.description,
    p.domain,
    pd.id,
    pd.title,
    pd.deliverable_type,
    pd.quality_score,
    pd.view_count,
    pd.like_count,
    pd.is_featured,
    pd.created_at
  FROM pbl_projects p
  JOIN pbl_project_deliverables pd ON p.id = pd.project_id
  WHERE p.user_id = p_student_id
    AND pd.is_public = true
    AND pd.admin_review_status = 'approved'
  ORDER BY pd.is_featured DESC, pd.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 函数：记录项目查看
CREATE OR REPLACE FUNCTION log_project_view(
  p_project_id UUID,
  p_deliverable_id UUID,
  p_viewer_id UUID,
  p_viewer_type TEXT
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO project_view_logs (
    project_id,
    deliverable_id,
    viewer_id,
    viewer_type
  ) VALUES (
    p_project_id,
    p_deliverable_id,
    p_viewer_id,
    p_viewer_type
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- 函数：推荐项目给企业
CREATE OR REPLACE FUNCTION recommend_project_to_company(
  p_project_id UUID,
  p_deliverable_id UUID,
  p_company_id UUID,
  p_admin_id UUID,
  p_reason TEXT,
  p_note TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_recommendation_id UUID;
BEGIN
  INSERT INTO project_recommendations (
    project_id,
    deliverable_id,
    recommended_to_company_id,
    recommended_by_admin_id,
    reason,
    recommendation_note
  ) VALUES (
    p_project_id,
    p_deliverable_id,
    p_company_id,
    p_admin_id,
    p_reason,
    p_note
  )
  RETURNING id INTO v_recommendation_id;

  RETURN v_recommendation_id;
END;
$$ LANGUAGE plpgsql;

-- 初始化：为现有学生初始化项目统计
DO $$
BEGIN
  UPDATE student_profiles sp
  SET
    public_project_count = (
      SELECT COUNT(DISTINCT pd.id)
      FROM pbl_projects p
      JOIN pbl_project_deliverables pd ON p.id = pd.project_id
      WHERE p.user_id = sp.user_id AND pd.is_public = true
    ),
    featured_project_count = (
      SELECT COUNT(DISTINCT pd.id)
      FROM pbl_projects p
      JOIN pbl_project_deliverables pd ON p.id = pd.project_id
      WHERE p.user_id = sp.user_id AND pd.is_featured = true
    ),
    total_project_views = (
      SELECT COALESCE(SUM(pd.view_count), 0)
      FROM pbl_projects p
      JOIN pbl_project_deliverables pd ON p.id = pd.project_id
      WHERE p.user_id = sp.user_id
    ),
    total_project_likes = (
      SELECT COALESCE(SUM(pd.like_count), 0)
      FROM pbl_projects p
      JOIN pbl_project_deliverables pd ON p.id = pd.project_id
      WHERE p.user_id = sp.user_id
    );
END $$;
