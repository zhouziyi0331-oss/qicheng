-- Migration: 添加组队系统和社区板块相关表
-- 用途: 支持Lv.6组队功能和Lv.4+社区功能

-- 1. 创建队伍主表
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    creator_id UUID NOT NULL REFERENCES users(id),
    task_id UUID REFERENCES tasks(id),
    status VARCHAR(20) NOT NULL DEFAULT 'recruiting',
    max_members INTEGER NOT NULL DEFAULT 5,
    current_members INTEGER NOT NULL DEFAULT 1,
    required_skills JSONB,
    description TEXT,
    track VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT chk_team_status CHECK (status IN ('recruiting', 'active', 'completed', 'disbanded')),
    CONSTRAINT chk_team_track CHECK (track IN ('content', 'dev', 'mixed'))
);

-- 2. 创建队伍成员表
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    role VARCHAR(20) NOT NULL DEFAULT 'member',
    assigned_module VARCHAR(100),
    contribution_percentage DECIMAL(5,2),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'active',

    CONSTRAINT chk_member_role CHECK (role IN ('leader', 'member', 'applicant', 'external')),
    CONSTRAINT chk_member_status CHECK (status IN ('active', 'pending', 'rejected', 'left')),
    UNIQUE(team_id, user_id)
);

-- 3. 创建社区帖子表
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    required_skills JSONB,
    team_id UUID REFERENCES teams(id),
    track VARCHAR(20),
    vacancy_count INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT chk_post_type CHECK (type IN ('recruit', 'showcase', 'collab', 'discussion')),
    CONSTRAINT chk_post_status CHECK (status IN ('open', 'closed', 'expired', 'deleted')),
    CONSTRAINT chk_post_track CHECK (track IN ('content', 'dev', 'mixed', NULL))
);

-- 4. 创建社区帖子回复表
CREATE TABLE IF NOT EXISTS community_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    parent_reply_id UUID REFERENCES community_replies(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 创建社区申请表
CREATE TABLE IF NOT EXISTS community_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES community_posts(id),
    applicant_id UUID NOT NULL REFERENCES users(id),
    team_id UUID REFERENCES teams(id),
    message TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES users(id),

    CONSTRAINT chk_application_status CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    UNIQUE(post_id, applicant_id)
);

-- 6. 创建队伍任务分配表
CREATE TABLE IF NOT EXISTS team_task_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id),
    task_id UUID NOT NULL REFERENCES tasks(id),
    member_id UUID NOT NULL REFERENCES users(id),
    module_name VARCHAR(100) NOT NULL,
    module_description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'assigned',
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT chk_team_task_status CHECK (status IN ('assigned', 'in_progress', 'completed', 'blocked'))
);

-- 7. 创建索引
CREATE INDEX IF NOT EXISTS idx_teams_creator ON teams(creator_id);
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);
CREATE INDEX IF NOT EXISTS idx_teams_task ON teams(task_id);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(team_id, role);

CREATE INDEX IF NOT EXISTS idx_community_posts_author ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_type ON community_posts(type, status);
CREATE INDEX IF NOT EXISTS idx_community_posts_track ON community_posts(track, status);
CREATE INDEX IF NOT EXISTS idx_community_posts_team ON community_posts(team_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_replies_post ON community_replies(post_id);
CREATE INDEX IF NOT EXISTS idx_community_replies_author ON community_replies(author_id);

CREATE INDEX IF NOT EXISTS idx_community_applications_post ON community_applications(post_id, status);
CREATE INDEX IF NOT EXISTS idx_community_applications_applicant ON community_applications(applicant_id);

CREATE INDEX IF NOT EXISTS idx_team_task_assignments_team ON team_task_assignments(team_id);
CREATE INDEX IF NOT EXISTS idx_team_task_assignments_member ON team_task_assignments(member_id);

-- 8. 创建触发器：自动更新队伍成员数
CREATE OR REPLACE FUNCTION update_team_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        UPDATE teams
        SET current_members = current_members + 1,
            updated_at = NOW()
        WHERE id = NEW.team_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status != 'active' AND NEW.status = 'active' THEN
        UPDATE teams
        SET current_members = current_members + 1,
            updated_at = NOW()
        WHERE id = NEW.team_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status != 'active' THEN
        UPDATE teams
        SET current_members = current_members - 1,
            updated_at = NOW()
        WHERE id = NEW.team_id;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
        UPDATE teams
        SET current_members = current_members - 1,
            updated_at = NOW()
        WHERE id = OLD.team_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_team_member_count ON team_members;
CREATE TRIGGER trigger_update_team_member_count
    AFTER INSERT OR UPDATE OR DELETE ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_team_member_count();

-- 9. 创建触发器：自动更新帖子回复数
CREATE OR REPLACE FUNCTION update_post_reply_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE community_posts
        SET reply_count = reply_count + 1,
            updated_at = NOW()
        WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE community_posts
        SET reply_count = reply_count - 1,
            updated_at = NOW()
        WHERE id = OLD.post_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_reply_count ON community_replies;
CREATE TRIGGER trigger_update_post_reply_count
    AFTER INSERT OR DELETE ON community_replies
    FOR EACH ROW
    EXECUTE FUNCTION update_post_reply_count();

-- 10. 添加注释
COMMENT ON TABLE teams IS '队伍主表（Lv.6可创建）';
COMMENT ON TABLE team_members IS '队伍成员表';
COMMENT ON TABLE community_posts IS '社区帖子表（Lv.4+可见，Lv.6可发布）';
COMMENT ON TABLE community_replies IS '社区帖子回复表';
COMMENT ON TABLE community_applications IS '社区申请表（Lv.5+可申请）';
COMMENT ON TABLE team_task_assignments IS '队伍任务分配表';

COMMENT ON COLUMN team_members.role IS 'leader=队长, member=成员, applicant=申请者, external=外部成员';
COMMENT ON COLUMN community_posts.type IS 'recruit=招募, showcase=作品展示, collab=协作, discussion=讨论';
