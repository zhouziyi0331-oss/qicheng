-- 迁移095: 升级通关仪式系统
-- Phase 1.4: 升级通关仪式

-- 升级通关仪式记录表
CREATE TABLE IF NOT EXISTS level_up_ceremonies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 升级信息
  old_level INTEGER NOT NULL,
  new_level INTEGER NOT NULL,
  trigger_reason VARCHAR(50) NOT NULL, -- 'task_milestone', 'quality_breakthrough', 'skill_mastery'

  -- 庆祝内容
  title VARCHAR(100) NOT NULL,
  main_message TEXT NOT NULL,
  achievements JSONB NOT NULL, -- ["成就1", "成就2", "成就3"]
  next_level_preview TEXT NOT NULL,
  celebration_emoji VARCHAR(10) NOT NULL,
  sound_effect VARCHAR(50) NOT NULL, -- 'level_up', 'milestone', 'breakthrough'

  -- 互动数据
  viewed BOOLEAN DEFAULT false,
  viewed_at TIMESTAMPTZ,
  shared BOOLEAN DEFAULT false,
  shared_at TIMESTAMPTZ,

  -- 元数据
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT level_up_ceremonies_trigger_check
    CHECK (trigger_reason IN ('task_milestone', 'quality_breakthrough', 'skill_mastery')),
  CONSTRAINT level_up_ceremonies_sound_check
    CHECK (sound_effect IN ('level_up', 'milestone', 'breakthrough'))
);

CREATE INDEX idx_level_up_ceremonies_student ON level_up_ceremonies(student_id);
CREATE INDEX idx_level_up_ceremonies_created ON level_up_ceremonies(created_at DESC);
CREATE INDEX idx_level_up_ceremonies_new_level ON level_up_ceremonies(new_level);

COMMENT ON TABLE level_up_ceremonies IS '升级通关仪式记录表';
COMMENT ON COLUMN level_up_ceremonies.trigger_reason IS '触发原因：任务里程碑/质量突破/技能精通';
COMMENT ON COLUMN level_up_ceremonies.achievements IS 'AI生成的具体成就列表';
COMMENT ON COLUMN level_up_ceremonies.sound_effect IS '音效类型：升级/里程碑/突破';
