-- Phase 2.1: OPC身份卡片表
-- 用于存储可分享的身份卡片数据

CREATE TABLE IF NOT EXISTS opc_identity_cards (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- OPC数据
  personality_type VARCHAR(50) NOT NULL,
  declaration TEXT NOT NULL,
  strengths JSONB NOT NULL,
  level INTEGER NOT NULL,

  -- 成长统计
  completed_tasks_count INTEGER DEFAULT 0,
  days_on_platform INTEGER DEFAULT 0,
  avg_score NUMERIC(3, 1) DEFAULT 0,

  -- 视觉设计
  visual_theme VARCHAR(20) DEFAULT 'default',

  -- 分享相关
  share_url TEXT NOT NULL,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,

  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_opc_identity_cards_student_id ON opc_identity_cards(student_id);
CREATE INDEX idx_opc_identity_cards_created_at ON opc_identity_cards(created_at DESC);

-- 触发器：自动更新updated_at
CREATE OR REPLACE FUNCTION update_opc_identity_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_opc_identity_cards_updated_at
BEFORE UPDATE ON opc_identity_cards
FOR EACH ROW
EXECUTE FUNCTION update_opc_identity_cards_updated_at();

-- 注释
COMMENT ON TABLE opc_identity_cards IS 'Phase 2.1: 可分享的OPC身份卡片';
COMMENT ON COLUMN opc_identity_cards.personality_type IS 'OPC人格类型';
COMMENT ON COLUMN opc_identity_cards.declaration IS '身份宣言';
COMMENT ON COLUMN opc_identity_cards.strengths IS '三大优势（JSON数组）';
COMMENT ON COLUMN opc_identity_cards.visual_theme IS '视觉主题: default, minimal, vibrant, elegant';
COMMENT ON COLUMN opc_identity_cards.share_url IS '分享链接';
COMMENT ON COLUMN opc_identity_cards.view_count IS '浏览次数';
