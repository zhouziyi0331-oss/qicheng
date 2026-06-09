-- 跳级测试系统
-- 实现跳级条件判断、测试任务推送、独立审核

-- 1. 跳级记录表
CREATE TABLE IF NOT EXISTS jump_test_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),

  -- 跳级信息
  from_level SMALLINT NOT NULL,
  target_level SMALLINT NOT NULL,
  track VARCHAR(20) NOT NULL,

  -- 测试任务
  test_order_id UUID REFERENCES orders(id),

  -- 审核结果
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'testing', 'passed', 'failed')),
  ai_score DECIMAL(3,1),
  ai_feedback TEXT,

  -- 时间戳
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,

  -- 索引
  CONSTRAINT unique_student_jump_attempt UNIQUE(student_id, applied_at)
);

CREATE INDEX idx_jump_records_student ON jump_test_records(student_id, applied_at DESC);
CREATE INDEX idx_jump_records_status ON jump_test_records(status);

-- 2. 跳级测试任务模板表
CREATE TABLE IF NOT EXISTS jump_test_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 模板信息
  track VARCHAR(20) NOT NULL CHECK (track IN ('content', 'dev')),
  target_level SMALLINT NOT NULL CHECK (target_level BETWEEN 1 AND 5),

  -- 任务内容
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT NOT NULL,
  acceptance_criteria TEXT NOT NULL,

  -- 难度
  difficulty SMALLINT NOT NULL,
  estimated_hours INTEGER,

  -- 元数据
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(track, target_level)
);

-- 3. 预置跳级测试模板

-- 内容创作赛道
INSERT INTO jump_test_templates (track, target_level, title, description, requirements, acceptance_criteria, difficulty, estimated_hours) VALUES
('content', 2, '品牌视觉系列设计',
 '为一个虚拟咖啡品牌"云间"设计一套完整的视觉系统，包括Logo、主视觉、社交媒体模板。',
 '1. 使用AI工具生成Logo设计（至少3个方案）\n2. 设计品牌主视觉（海报/Banner）\n3. 设计小红书/Instagram帖子模板（至少5张）\n4. 保持视觉风格统一',
 '1. Logo设计有创意且符合品牌调性\n2. 主视觉有冲击力\n3. 社交媒体模板可复用\n4. 整体风格统一\n5. 交付源文件和效果图',
 3, 24),

('content', 4, '短剧内容策划与制作',
 '策划并制作一个3集的AI短剧，主题为"未来职场"，每集3-5分钟。',
 '1. 完整的剧本大纲和分集剧本\n2. 使用AI工具生成角色形象\n3. 使用AI工具生成场景\n4. 剪辑成片（配音+字幕）\n5. 提供完整的制作流程说明',
 '1. 剧本逻辑完整，有起承转合\n2. 角色形象统一\n3. 场景符合剧情\n4. 成片流畅，配音清晰\n5. 制作流程可复现',
 5, 48);

-- 工具开发赛道
INSERT INTO jump_test_templates (track, target_level, title, description, requirements, acceptance_criteria, difficulty, estimated_hours) VALUES
('dev', 2, 'AI工作流自动化系统',
 '搭建一个自动化工作流，实现"每天定时抓取新闻 → AI总结 → 发送到飞书群"。',
 '1. 使用n8n或类似工具搭建工作流\n2. 接入新闻API\n3. 接入AI总结API（如Claude/GPT）\n4. 接入飞书Webhook\n5. 设置定时触发\n6. 提供完整的配置文档',
 '1. 工作流能正常运行\n2. 新闻抓取准确\n3. AI总结质量高\n4. 飞书消息格式美观\n5. 配置文档清晰可复现',
 3, 24),

('dev', 4, '智能客服Agent开发',
 '开发一个智能客服Agent，能回答常见问题、查询订单状态、转人工客服。',
 '1. 使用LangChain或类似框架\n2. 接入知识库（FAQ）\n3. 接入订单查询API（模拟）\n4. 实现多轮对话\n5. 实现转人工逻辑\n6. 提供完整的代码和部署文档',
 '1. Agent能准确回答FAQ\n2. 能查询订单状态\n3. 多轮对话流畅\n4. 转人工逻辑合理\n5. 代码结构清晰\n6. 部署文档完整',
 5, 48);

-- 4. 注释
COMMENT ON TABLE jump_test_records IS '跳级测试记录表：记录学生的跳级申请和测试结果';
COMMENT ON TABLE jump_test_templates IS '跳级测试任务模板表：预置不同等级的跳级测试任务';
COMMENT ON COLUMN jump_test_records.status IS 'pending=已申请待推送, testing=测试中, passed=通过, failed=失败';
