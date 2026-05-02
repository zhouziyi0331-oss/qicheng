-- 联合体组建功能
-- 孵化计划学生可以组建联合体，一起接大项目

-- 联合体表
CREATE TABLE IF NOT EXISTS alliances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL, -- 联合体名称
  founder_id UUID NOT NULL REFERENCES users(id), -- 创始人
  description TEXT, -- 联合体简介
  vision TEXT, -- 愿景
  member_ids UUID[] DEFAULT '{}', -- 成员ID数组
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'disbanded'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 联合体成员表
CREATE TABLE IF NOT EXISTS alliance_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alliance_id UUID NOT NULL REFERENCES alliances(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- 'founder', 'core', 'member'
  skills TEXT[], -- 技能标签
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(alliance_id, student_id)
);

-- 联合体邀请表
CREATE TABLE IF NOT EXISTS alliance_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alliance_id UUID NOT NULL REFERENCES alliances(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES users(id),
  invitee_id UUID NOT NULL REFERENCES users(id),
  invitation_message TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP
);

-- 联合体项目表
CREATE TABLE IF NOT EXISTS alliance_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alliance_id UUID NOT NULL REFERENCES alliances(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id),
  project_name VARCHAR(200) NOT NULL,
  project_description TEXT,
  assigned_members UUID[], -- 分配的成员
  revenue_share JSONB, -- 收益分配方案
  status VARCHAR(20) DEFAULT 'planning', -- 'planning', 'in_progress', 'completed'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_alliances_founder ON alliances(founder_id);
CREATE INDEX IF NOT EXISTS idx_alliance_members_alliance ON alliance_members(alliance_id);
CREATE INDEX IF NOT EXISTS idx_alliance_members_student ON alliance_members(student_id);
CREATE INDEX IF NOT EXISTS idx_alliance_invitations_alliance ON alliance_invitations(alliance_id);
CREATE INDEX IF NOT EXISTS idx_alliance_invitations_invitee ON alliance_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_alliance_projects_alliance ON alliance_projects(alliance_id);

-- 触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_alliances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS alliances_updated_at_trigger ON alliances;
CREATE TRIGGER alliances_updated_at_trigger
BEFORE UPDATE ON alliances
FOR EACH ROW
EXECUTE FUNCTION update_alliances_updated_at();
