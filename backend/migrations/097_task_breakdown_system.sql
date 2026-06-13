-- Migration: 097_task_breakdown_system.sql
-- Description: AI需求拆解系统 - E-01功能
-- Created: 2026-06-11

-- =====================================================
-- 1. 扩展tasks表，添加AI拆解相关字段
-- =====================================================

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS breakdown_result JSONB,
  ADD COLUMN IF NOT EXISTS ai_suggested_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS ai_suggested_min_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS ai_suggested_max_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS ai_suggested_days INTEGER,
  ADD COLUMN IF NOT EXISTS ai_suggested_min_days INTEGER,
  ADD COLUMN IF NOT EXISTS ai_suggested_max_days INTEGER,
  ADD COLUMN IF NOT EXISTS breakdown_version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS breakdown_created_at TIMESTAMPTZ;

-- 添加字段注释
COMMENT ON COLUMN tasks.breakdown_result IS 'AI拆解结果JSON，包含子任务列表、技能要求、预估等';
COMMENT ON COLUMN tasks.ai_suggested_price IS 'AI建议价格（中位数）';
COMMENT ON COLUMN tasks.ai_suggested_min_price IS 'AI建议最低价格';
COMMENT ON COLUMN tasks.ai_suggested_max_price IS 'AI建议最高价格';
COMMENT ON COLUMN tasks.ai_suggested_days IS 'AI建议工期（天数，中位数）';
COMMENT ON COLUMN tasks.ai_suggested_min_days IS 'AI建议最短工期';
COMMENT ON COLUMN tasks.ai_suggested_max_days IS 'AI建议最长工期';
COMMENT ON COLUMN tasks.breakdown_version IS '拆解版本号，每次重新拆解时递增';

-- 创建索引
CREATE INDEX idx_tasks_breakdown ON tasks(breakdown_created_at DESC) 
  WHERE breakdown_result IS NOT NULL;

-- =====================================================
-- 2. 创建任务拆解历史表（记录每次拆解）
-- =====================================================

CREATE TABLE IF NOT EXISTS task_breakdown_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  
  -- 拆解输入
  raw_description TEXT NOT NULL,
  additional_context JSONB DEFAULT '{}',
  
  -- 拆解结果
  breakdown_result JSONB NOT NULL,
  subtasks JSONB NOT NULL DEFAULT '[]',
  -- 示例: [
  --   {
  --     "id": "st_1",
  --     "title": "用户登录模块",
  --     "description": "实现注册、登录、忘记密码功能",
  --     "skills": ["React", "JWT", "Node.js"],
  --     "difficulty": 3,
  --     "estimatedHours": 16,
  --     "estimatedCost": {"min": 800, "max": 1200}
  --   }
  -- ]
  
  -- AI建议
  suggested_price_range JSONB,
  suggested_days_range JSONB,
  required_skills JSONB DEFAULT '[]',
  risk_warnings JSONB DEFAULT '[]',
  
  -- 元数据
  ai_model VARCHAR(100),
  ai_temperature DECIMAL(3,2),
  ai_tokens_used INTEGER,
  processing_time_ms INTEGER,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- 用户反馈
  user_accepted BOOLEAN,
  user_feedback TEXT,
  user_modified BOOLEAN DEFAULT false,
  user_modified_at TIMESTAMPTZ
);

-- 创建索引
CREATE INDEX idx_breakdown_history_task ON task_breakdown_history(task_id, created_at DESC);
CREATE INDEX idx_breakdown_history_created ON task_breakdown_history(created_at DESC);
CREATE INDEX idx_breakdown_history_user ON task_breakdown_history(created_by, created_at DESC);

COMMENT ON TABLE task_breakdown_history IS 'AI需求拆解历史记录表 - 记录每次拆解的输入输出';
COMMENT ON COLUMN task_breakdown_history.subtasks IS 'JSON格式的子任务列表，每个子任务包含标题、描述、技能、难度、时长、成本';
COMMENT ON COLUMN task_breakdown_history.risk_warnings IS 'AI识别的风险提示，如"需求过于复杂"、"时间紧迫"等';

-- =====================================================
-- 3. 创建交付标准模板表（E-02相关）
-- =====================================================

CREATE TABLE IF NOT EXISTS deliverable_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 模板基本信息
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  task_type VARCHAR(100),
  
  -- 交付标准
  standards JSONB NOT NULL,
  -- 示例: {
  --   "functional": ["所有功能正常运行", "无明显bug"],
  --   "quality": ["代码规范", "注释完整"],
  --   "documentation": ["README文档", "部署说明"],
  --   "files": ["源代码", "测试用例"]
  -- }
  
  -- 检查清单
  checklist JSONB DEFAULT '[]',
  -- 示例: [
  --   {"item": "代码可以运行", "required": true},
  --   {"item": "通过基本测试", "required": true},
  --   {"item": "有README文档", "required": false}
  -- ]
  
  -- 示例文件
  example_files JSONB DEFAULT '[]',
  
  -- 使用统计
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(3,2),
  
  -- 元数据
  is_public BOOLEAN DEFAULT true,
  is_official BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_deliverable_templates_category ON deliverable_templates(category);
CREATE INDEX idx_deliverable_templates_type ON deliverable_templates(task_type);
CREATE INDEX idx_deliverable_templates_public ON deliverable_templates(is_public) WHERE is_public = true;
CREATE INDEX idx_deliverable_templates_usage ON deliverable_templates(usage_count DESC);

COMMENT ON TABLE deliverable_templates IS '交付标准模板库 - E-02功能，提供标准化的交付要求';
COMMENT ON COLUMN deliverable_templates.standards IS 'JSON格式的交付标准，包含功能、质量、文档、文件等维度';
COMMENT ON COLUMN deliverable_templates.checklist IS '交付检查清单，用于验收时逐项核对';

-- =====================================================
-- 4. 创建任务-模板关联表
-- =====================================================

CREATE TABLE IF NOT EXISTS task_deliverable_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES deliverable_templates(id) ON DELETE CASCADE,
  
  -- 定制化标准（覆盖模板默认值）
  customized_standards JSONB,
  customized_checklist JSONB,
  
  -- 元数据
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  applied_by UUID REFERENCES users(id),
  
  UNIQUE(task_id, template_id)
);

CREATE INDEX idx_task_templates_task ON task_deliverable_templates(task_id);
CREATE INDEX idx_task_templates_template ON task_deliverable_templates(template_id);

-- =====================================================
-- 5. 创建自动更新触发器
-- =====================================================

CREATE OR REPLACE FUNCTION update_deliverable_template_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_deliverable_template_timestamp
  BEFORE UPDATE ON deliverable_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_deliverable_template_timestamp();

-- =====================================================
-- 6. 插入默认交付标准模板
-- =====================================================

-- 前端开发模板
INSERT INTO deliverable_templates (name, description, category, task_type, standards, checklist, is_official)
VALUES (
  '前端开发标准',
  '前端项目的通用交付标准',
  'development',
  'frontend',
  '{
    "functional": ["页面可以正常打开", "交互功能正常", "数据展示正确", "响应式适配"],
    "quality": ["代码符合ESLint规范", "组件结构清晰", "注释完整", "无console.log"],
    "documentation": ["README说明", "组件使用文档", "API接口说明"],
    "files": ["源代码", "依赖清单(package.json)", "构建配置"]
  }',
  '[
    {"item": "页面可以正常访问", "required": true},
    {"item": "所有功能按钮可点击", "required": true},
    {"item": "移动端适配", "required": false},
    {"item": "有README文档", "required": true},
    {"item": "代码通过ESLint检查", "required": false}
  ]',
  true
) ON CONFLICT DO NOTHING;

-- 后端开发模板
INSERT INTO deliverable_templates (name, description, category, task_type, standards, checklist, is_official)
VALUES (
  '后端开发标准',
  '后端API项目的通用交付标准',
  'development',
  'backend',
  '{
    "functional": ["API接口正常响应", "数据库操作正确", "错误处理完善"],
    "quality": ["代码规范", "异常处理", "日志记录", "单元测试"],
    "documentation": ["API文档", "数据库设计文档", "部署说明"],
    "files": ["源代码", "依赖清单", "数据库脚本", "环境配置示例"]
  }',
  '[
    {"item": "API能正常调用", "required": true},
    {"item": "数据库连接成功", "required": true},
    {"item": "有API文档", "required": true},
    {"item": "有错误处理", "required": true},
    {"item": "有单元测试", "required": false}
  ]',
  true
) ON CONFLICT DO NOTHING;

-- 设计类模板
INSERT INTO deliverable_templates (name, description, category, task_type, standards, checklist, is_official)
VALUES (
  'UI设计标准',
  'UI设计项目的通用交付标准',
  'design',
  'ui_design',
  '{
    "functional": ["设计稿完整", "尺寸标注清晰", "颜色规范"],
    "quality": ["视觉统一", "交互流畅", "符合品牌调性"],
    "documentation": ["设计说明", "切图标注", "字体图标说明"],
    "files": ["设计源文件", "切图资源", "原型文件(可选)"]
  }',
  '[
    {"item": "提供Figma/Sketch源文件", "required": true},
    {"item": "标注尺寸和颜色", "required": true},
    {"item": "导出切图资源", "required": true},
    {"item": "设计说明文档", "required": false}
  ]',
  true
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 7. 创建统计视图
-- =====================================================

CREATE OR REPLACE VIEW v_breakdown_stats AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_breakdowns,
  COUNT(*) FILTER (WHERE user_accepted = true) as accepted_count,
  AVG(processing_time_ms) as avg_processing_time,
  AVG(ai_tokens_used) as avg_tokens_used
FROM task_breakdown_history
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

COMMENT ON VIEW v_breakdown_stats IS 'AI拆解统计视图 - 按日汇总拆解次数、接受率、处理时间等';

-- =====================================================
-- Migration完成
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'migrations') THEN
    INSERT INTO migrations (version, name, executed_at)
    VALUES ('097', 'task_breakdown_system', NOW())
    ON CONFLICT (version) DO NOTHING;
  END IF;
END $$;
