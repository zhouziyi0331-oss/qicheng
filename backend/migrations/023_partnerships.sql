-- 合伙人关系系统
CREATE TABLE IF NOT EXISTS partnerships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relationship_level VARCHAR(20) NOT NULL DEFAULT 'hired', -- 'hired', 'trusted', 'partner'
  collaboration_count INTEGER DEFAULT 0,
  partnership_terms JSONB, -- 合伙条款
  invited_at TIMESTAMP, -- 合伙人邀请时间
  accepted_at TIMESTAMP, -- 接受时间
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'paused', 'ended'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, student_id)
);

-- 合伙人互动记录
CREATE TABLE IF NOT EXISTS partnership_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partnership_id UUID NOT NULL REFERENCES partnerships(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50) NOT NULL, -- 'task_completed', 'idea_shared', 'meeting', 'investment'
  interaction_data JSONB, -- 互动详情
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_partnerships_company ON partnerships(company_id);
CREATE INDEX IF NOT EXISTS idx_partnerships_student ON partnerships(student_id);
CREATE INDEX IF NOT EXISTS idx_partnerships_level ON partnerships(relationship_level);
CREATE INDEX IF NOT EXISTS idx_partnership_interactions_partnership ON partnership_interactions(partnership_id);

-- 触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_partnerships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER partnerships_updated_at_trigger
BEFORE UPDATE ON partnerships
FOR EACH ROW
EXECUTE FUNCTION update_partnerships_updated_at();
