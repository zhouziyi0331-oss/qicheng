-- 企业端体验优化功能集
-- E-01d: 任务草稿箱
-- E-01a: 任务模板市场
-- E-01b: 预算智能建议

-- 任务草稿表
CREATE TABLE task_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES users(id),

  -- 草稿内容（复用tasks表的字段结构）
  title VARCHAR(200),
  description TEXT,
  category VARCHAR(50),
  required_skills TEXT[],
  budget DECIMAL(10,2),
  deadline DATE,
  requirements TEXT[],
  deliverables TEXT[],

  -- 草稿状态
  is_template BOOLEAN DEFAULT false,  -- 是否另存为模板
  template_name VARCHAR(100),

  -- 智能建议记录
  ai_suggestions JSONB,
  -- {
  --   "budget_suggestion": {min: 300, max: 500, reason: "同类任务平均价格"},
  --   "skill_suggestions": ["React", "TypeScript"],
  --   "timeline_suggestion": 7
  -- }

  last_edited_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 任务模板市场
CREATE TABLE task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 模板基本信息
  template_name VARCHAR(200) NOT NULL,
  template_description TEXT,
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(50),

  -- 模板内容
  title_template VARCHAR(200),
  description_template TEXT,
  required_skills TEXT[],
  typical_budget_min DECIMAL(10,2),
  typical_budget_max DECIMAL(10,2),
  typical_duration_days INTEGER,
  requirements_template TEXT[],
  deliverables_template TEXT[],

  -- 使用数据
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(3,2),  -- 使用该模板的任务完成率
  avg_rating DECIMAL(3,2),

  -- 推荐等级
  recommended_student_level_min INTEGER,
  recommended_student_level_max INTEGER,

  -- 标签
  tags TEXT[] DEFAULT '{}',

  -- 状态
  is_active BOOLEAN DEFAULT true,
  is_official BOOLEAN DEFAULT true,  -- 官方模板 vs 用户分享模板

  -- 创建者（如果是用户分享）
  created_by UUID REFERENCES users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 模板使用记录
CREATE TABLE template_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES task_templates(id),
  company_id UUID NOT NULL REFERENCES users(id),
  task_id UUID REFERENCES tasks(id),

  -- 使用结果
  task_completed BOOLEAN DEFAULT false,
  task_rating DECIMAL(3,2),

  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- 预算建议记录
CREATE TABLE budget_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES users(id),

  -- 输入参数
  task_category VARCHAR(50),
  task_description TEXT,
  required_skills TEXT[],
  quality_expectation VARCHAR(50),  -- 'basic', 'standard', 'premium'

  -- AI建议
  suggested_min DECIMAL(10,2),
  suggested_max DECIMAL(10,2),
  suggested_optimal DECIMAL(10,2),

  -- 依据数据
  similar_tasks_count INTEGER,
  similar_tasks_avg_budget DECIMAL(10,2),
  market_data JSONB,
  -- {
  --   "p25": 250, "p50": 350, "p75": 500,
  --   "completion_rate_by_budget": {"<300": 0.6, "300-500": 0.85, ">500": 0.92}
  -- }

  reasoning TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_drafts_company ON task_drafts(company_id, last_edited_at DESC);
CREATE INDEX idx_templates_category ON task_templates(category, is_active);
CREATE INDEX idx_templates_usage ON task_templates(usage_count DESC) WHERE is_active = true;
CREATE INDEX idx_template_usage_template ON template_usage(template_id);
CREATE INDEX idx_budget_suggestions_company ON budget_suggestions(company_id, created_at DESC);

-- 模板使用后更新统计
CREATE OR REPLACE FUNCTION update_template_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE task_templates
    SET usage_count = usage_count + 1
    WHERE id = NEW.template_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.task_completed = true AND OLD.task_completed = false THEN
    -- 更新成功率和平均评分
    WITH stats AS (
      SELECT
        COUNT(*) FILTER (WHERE task_completed = true) as completed,
        COUNT(*) as total,
        AVG(task_rating) FILTER (WHERE task_rating IS NOT NULL) as avg_rating
      FROM template_usage
      WHERE template_id = NEW.template_id
    )
    UPDATE task_templates
    SET success_rate = (SELECT completed::DECIMAL / NULLIF(total, 0) FROM stats),
        avg_rating = (SELECT avg_rating FROM stats)
    WHERE id = NEW.template_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_template_stats
AFTER INSERT OR UPDATE ON template_usage
FOR EACH ROW
EXECUTE FUNCTION update_template_stats();

-- 插入官方模板示例
INSERT INTO task_templates (
  id, template_name, template_description, category, subcategory,
  title_template, description_template, required_skills,
  typical_budget_min, typical_budget_max, typical_duration_days,
  requirements_template, deliverables_template,
  recommended_student_level_min, recommended_student_level_max,
  tags
) VALUES
(
  gen_random_uuid(),
  '电商AI产品图设计',
  '适用于电商平台的AI生成产品展示图，包含主图、详情图等',
  '设计类',
  'AI图片生成',
  '[品牌名称] 电商产品图设计',
  '我们需要为[产品名称]设计一套完整的电商展示图，包含：\n1. 主图5张（白底+场景）\n2. 详情页长图1张\n3. 营销海报2张\n\n风格要求：[简约/时尚/科技感]，符合品牌调性。',
  ARRAY['Midjourney', 'Stable Diffusion', 'AI图片生成', 'Photoshop'],
  300, 500, 3,
  ARRAY['提供产品照片或3D模型', '提供品牌VI规范', '明确使用场景（淘宝/京东/小红书）'],
  ARRAY['5张主图（1:1比例，白底+场景）', '1张详情页长图（750px宽）', '2张营销海报（指定尺寸）', '可商用授权说明'],
  3, 7,
  ARRAY['电商', 'AI设计', '产品图', '快速交付']
),
(
  gen_random_uuid(),
  '公众号AI文案撰写',
  '为公众号撰写AI辅助的推广文案，提高阅读转化',
  '内容类',
  'AI文案',
  '[品牌名称] 公众号推广文案',
  '我们需要为[产品/活动]撰写公众号推广文案，要求：\n1. 标题吸引眼球（给出3个备选）\n2. 正文800-1200字\n3. 结尾带行动号召\n\n目标人群：[目标用户画像]\n传播目标：[提高认知/促进转化]',
  ARRAY['ChatGPT', 'AI文案', '公众号运营', '内容营销'],
  200, 400, 2,
  ARRAY['提供产品/品牌介绍', '提供目标人群画像', '提供参考案例或竞品文案'],
  ARRAY['3个标题方案', '1篇完整文案（800-1200字）', '配图建议3-5张', '可商用授权说明'],
  2, 6,
  ARRAY['公众号', 'AI文案', '营销推广', '快速交付']
),
(
  gen_random_uuid(),
  '小红书AI种草笔记',
  '适用于小红书平台的AI生成种草笔记，提高产品曝光',
  '内容类',
  'AI文案',
  '[品牌名称] 小红书种草笔记',
  '我们需要为[产品名称]撰写小红书种草笔记，要求：\n1. 5-8篇笔记（不同角度）\n2. 每篇300-500字\n3. 配图建议\n\n风格要求：真实体验感，避免硬广。',
  ARRAY['小红书运营', 'AI文案', '内容营销'],
  250, 450, 3,
  ARRAY['提供产品详细信息', '提供使用场景', '提供目标人群画像'],
  ARRAY['5-8篇小红书笔记', '每篇300-500字', '配图建议（AI生成或素材建议）', '话题标签建议'],
  2, 6,
  ARRAY['小红书', 'AI文案', '种草', '社交媒体']
);

COMMENT ON TABLE task_drafts IS 'E-01d: 任务草稿箱';
COMMENT ON TABLE task_templates IS 'E-01a: 任务模板市场';
COMMENT ON TABLE template_usage IS '模板使用记录';
COMMENT ON TABLE budget_suggestions IS 'E-01b: 预算智能建议';
