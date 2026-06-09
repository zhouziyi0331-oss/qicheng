-- 组队系统 + 社区板块
-- 实现Lv.5/Lv.6大型任务组队、社区招募、技能展示

-- 1. 队伍主表
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 队伍信息
  name VARCHAR(100) NOT NULL,
  creator_id UUID NOT NULL REFERENCES users(id),
  project_id UUID REFERENCES tasks(id),

  -- 状态
  status VARCHAR(50) NOT NULL DEFAULT 'recruiting' CHECK (status IN ('recruiting', 'active', 'completed', 'disbanded')),

  -- 成员配置
  max_members INTEGER NOT NULL DEFAULT 5,
  current_members INTEGER NOT NULL DEFAULT 1,

  -- 技能要求
  required_skills JSONB DEFAULT '[]',
  track VARCHAR(20) CHECK (track IN ('content', 'dev', 'mixed')),

  -- 描述
  description TEXT,

  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_teams_creator ON teams(creator_id);
CREATE INDEX idx_teams_status ON teams(status);
CREATE INDEX idx_teams_track ON teams(track);

-- 2. 队伍成员表
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 关联
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),

  -- 角色
  role VARCHAR(50) NOT NULL CHECK (role IN ('leader', 'member', 'applicant', 'external')),

  -- 任务分配
  assigned_module VARCHAR(200),
  module_description TEXT,

  -- 分润比例（队长设定）
  revenue_share_percent DECIMAL(5,2) DEFAULT 0,

  -- 状态
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'rejected', 'left')),

  -- 时间戳
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,

  UNIQUE(team_id, user_id)
);

CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_role ON team_members(role);

-- 3. 社区帖子表
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 发布者
  author_id UUID NOT NULL REFERENCES users(id),

  -- 帖子类型
  type VARCHAR(50) NOT NULL CHECK (type IN ('recruit', 'showcase', 'collab')),

  -- 内容
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  cover_image VARCHAR(500),

  -- 技能标签
  required_skills JSONB DEFAULT '[]',
  track VARCHAR(20) CHECK (track IN ('content', 'dev', 'mixed')),

  -- 关联
  team_id UUID REFERENCES teams(id),

  -- 招募信息（仅招募帖）
  vacancy_count INTEGER,
  total_applicants INTEGER DEFAULT 0,

  -- 状态
  status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'expired')),

  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

CREATE INDEX idx_community_posts_author ON community_posts(author_id);
CREATE INDEX idx_community_posts_type ON community_posts(type);
CREATE INDEX idx_community_posts_status ON community_posts(status, created_at DESC);
CREATE INDEX idx_community_posts_track ON community_posts(track);

-- 4. 社区帖子申请表
CREATE TABLE IF NOT EXISTS community_post_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 关联
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES users(id),
  team_id UUID REFERENCES teams(id),

  -- 申请信息
  message TEXT,
  skills_offered JSONB DEFAULT '[]',

  -- 状态
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

  -- 时间戳
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,

  UNIQUE(post_id, applicant_id)
);

CREATE INDEX idx_post_applications_post ON community_post_applications(post_id);
CREATE INDEX idx_post_applications_applicant ON community_post_applications(applicant_id);
CREATE INDEX idx_post_applications_status ON community_post_applications(status);

-- 5. 队伍邀请链接表
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 关联
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),

  -- 邀请码
  invite_code VARCHAR(50) NOT NULL UNIQUE,

  -- 邀请类型
  invite_type VARCHAR(50) NOT NULL CHECK (invite_type IN ('internal', 'external')),

  -- 状态
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,

  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  used_at TIMESTAMPTZ
);

CREATE INDEX idx_team_invitations_code ON team_invitations(invite_code);
CREATE INDEX idx_team_invitations_team ON team_invitations(team_id);

-- 6. 扩展orders表：添加队伍关联
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id),
ADD COLUMN IF NOT EXISTS revenue_distribution JSONB;

-- 7. 队伍收入分配记录表
CREATE TABLE IF NOT EXISTS team_revenue_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 关联
  order_id UUID NOT NULL REFERENCES orders(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  member_id UUID NOT NULL REFERENCES users(id),

  -- 分润信息
  total_revenue DECIMAL(10,2) NOT NULL,
  member_share_percent DECIMAL(5,2) NOT NULL,
  member_amount DECIMAL(10,2) NOT NULL,

  -- 状态
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),

  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX idx_revenue_distributions_order ON team_revenue_distributions(order_id);
CREATE INDEX idx_revenue_distributions_team ON team_revenue_distributions(team_id);
CREATE INDEX idx_revenue_distributions_member ON team_revenue_distributions(member_id);

-- 8. 触发器：自动更新队伍成员数
CREATE OR REPLACE FUNCTION update_team_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.role IN ('leader', 'member') THEN
    UPDATE teams SET current_members = current_members + 1 WHERE id = NEW.team_id;
  ELSIF TG_OP = 'DELETE' AND OLD.role IN ('leader', 'member') THEN
    UPDATE teams SET current_members = current_members - 1 WHERE id = OLD.team_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.role = 'applicant' AND NEW.role = 'member' THEN
    UPDATE teams SET current_members = current_members + 1 WHERE id = NEW.team_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_team_member_count
AFTER INSERT OR UPDATE OR DELETE ON team_members
FOR EACH ROW
EXECUTE FUNCTION update_team_member_count();

-- 9. 触发器：队伍满员自动关闭招募帖
CREATE OR REPLACE FUNCTION close_recruitment_when_full()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_members >= NEW.max_members THEN
    -- 更新队伍状态
    UPDATE teams SET status = 'active' WHERE id = NEW.id;

    -- 关闭相关招募帖
    UPDATE community_posts
    SET status = 'closed', updated_at = NOW()
    WHERE team_id = NEW.id AND type = 'recruit' AND status = 'open';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_close_recruitment_when_full
AFTER UPDATE ON teams
FOR EACH ROW
WHEN (NEW.current_members >= NEW.max_members)
EXECUTE FUNCTION close_recruitment_when_full();

-- 10. 注释
COMMENT ON TABLE teams IS '队伍主表：Lv.5/Lv.6学生创建的组队';
COMMENT ON TABLE team_members IS '队伍成员表：记录队伍成员和角色';
COMMENT ON TABLE community_posts IS '社区帖子表：招募、共创、作品展示';
COMMENT ON TABLE community_post_applications IS '社区帖子申请表：学生申请加入队伍';
COMMENT ON TABLE team_invitations IS '队伍邀请链接表：邀请外部朋友加入';
COMMENT ON TABLE team_revenue_distributions IS '队伍收入分配记录表：记录每个成员的分润';

COMMENT ON COLUMN teams.status IS 'recruiting=招募中, active=进行中, completed=已完成, disbanded=已解散';
COMMENT ON COLUMN team_members.role IS 'leader=队长, member=成员, applicant=申请中, external=外部成员';
COMMENT ON COLUMN community_posts.type IS 'recruit=招募队友, showcase=作品展示, collab=共创提案';
