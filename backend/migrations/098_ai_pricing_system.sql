-- Migration: 098_ai_pricing_system.sql
-- Description: AI定价系统 - E-04功能
-- Created: 2026-06-13

-- =====================================================
-- AI定价历史记录表
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_pricing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  
  -- 输入特征
  task_features JSONB NOT NULL,
  
  -- 定价结果
  pricing_result JSONB NOT NULL,
  suggested_price DECIMAL(10,2) NOT NULL,
  confidence_level DECIMAL(3,2),
  
  -- 用户反馈
  user_accepted BOOLEAN,
  actual_price DECIMAL(10,2),
  
  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_pricing_task ON ai_pricing_history(task_id, created_at DESC);
CREATE INDEX idx_ai_pricing_created ON ai_pricing_history(created_at DESC);
CREATE INDEX idx_ai_pricing_confidence ON ai_pricing_history(confidence_level DESC);

COMMENT ON TABLE ai_pricing_history IS 'AI定价历史记录 - E-04功能，记录每次AI定价的输入输出';
COMMENT ON COLUMN ai_pricing_history.task_features IS '任务特征JSON：技能、难度、工时等';
COMMENT ON COLUMN ai_pricing_history.pricing_result IS '完整定价结果JSON：价格区间、市场对比、建议等';
COMMENT ON COLUMN ai_pricing_history.confidence_level IS '定价置信度 (0-1)';

-- =====================================================
-- Migration完成
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'migrations') THEN
    INSERT INTO migrations (version, name, executed_at)
    VALUES ('098', 'ai_pricing_system', NOW())
    ON CONFLICT (version) DO NOTHING;
  END IF;
END $$;
