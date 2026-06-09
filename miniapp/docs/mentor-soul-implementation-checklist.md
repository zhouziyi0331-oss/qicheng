# 启程小猫"灵魂注入"实施清单

## 🎯 目标
让启程小猫从"冷冰冰的系统"变成"温暖的成长伙伴"

---

## 📋 实施步骤

### 阶段1：后端Prompt重写 🔥 **最优先**

#### 1.1 创建新的Prompt模板表
```sql
-- 已有表：mentor_prompt_templates
-- 需要添加新字段：
ALTER TABLE mentor_prompt_templates ADD COLUMN personality_style TEXT;
ALTER TABLE mentor_prompt_templates ADD COLUMN emotion_keywords JSONB;
ALTER TABLE mentor_prompt_templates ADD COLUMN memory_triggers JSONB;
```

#### 1.2 重写4个阶段的Prompt

**需要创建的文件**：
- `backend/prompts/stage1_requirement_understanding.md`
- `backend/prompts/stage2_execution_guidance.md`
- `backend/prompts/stage3_quality_review.md`
- `backend/prompts/stage4_communication_bridge.md`

**每个Prompt必须包含**：
- ✅ 身份设定（"你是启程小猫"）
- ✅ 人格特质（温暖、敏锐、启发）
- ✅ 说话风格（口语化、有情绪）
- ✅ 具体场景和目标
- ✅ 示例对话（好的和不好的对比）

#### 1.3 实现Prompt变量替换

**文件**: `backend/services/mentorPromptBuilder.ts`

```typescript
class MentorPromptBuilder {
  buildPrompt(stage: string, variables: any): string {
    // 1. 加载基础Prompt模板
    const basePrompt = this.loadTemplate(stage)
    
    // 2. 加载学生记忆
    const memories = this.loadRelevantMemories(variables.studentId)
    
    // 3. 加载对话历史
    const history = this.loadConversationHistory(variables.sessionId)
    
    // 4. 组装完整Prompt
    return this.assemblePrompt(basePrompt, variables, memories, history)
  }
}
```

---

### 阶段2：记忆系统增强

#### 2.1 记忆向量化存储

**需要实现**：
- 使用pgvector扩展存储记忆向量
- 每条记忆生成embedding
- 支持语义相似度搜索

**文件**: `backend/services/memoryVectorService.ts`

```typescript
class MemoryVectorService {
  async storeMemory(memory: Memory): Promise<void> {
    // 1. 生成embedding
    const embedding = await this.generateEmbedding(memory.content)
    
    // 2. 存储到数据库
    await db.query(`
      INSERT INTO mentor_memories (student_id, content, embedding, type)
      VALUES ($1, $2, $3, $4)
    `, [memory.studentId, memory.content, embedding, memory.type])
  }
  
  async searchSimilarMemories(query: string, studentId: string): Promise<Memory[]> {
    // 语义搜索相关记忆
    const queryEmbedding = await this.generateEmbedding(query)
    return await db.query(`
      SELECT * FROM mentor_memories
      WHERE student_id = $1
      ORDER BY embedding <-> $2
      LIMIT 3
    `, [studentId, queryEmbedding])
  }
}
```

#### 2.2 自动记忆召回

**触发时机**：
- 学生表达情绪 → 召回类似情绪的记忆
- 学生遇到问题 → 召回类似问题的解决方法
- 学生说"我不行" → 召回成功经历

**文件**: `backend/services/memoryRecallService.ts`

```typescript
class MemoryRecallService {
  async autoRecall(currentMessage: string, studentId: string): Promise<Memory[]> {
    // 1. 分析当前消息的情绪和主题
    const analysis = await this.analyzeMessage(currentMessage)
    
    // 2. 根据情绪和主题搜索相关记忆
    const memories = await this.vectorService.searchSimilarMemories(
      currentMessage, 
      studentId
    )
    
    // 3. 过滤和排序
    return this.filterRelevantMemories(memories, analysis)
  }
}
```

---

### 阶段3：工具推荐集成

#### 3.1 工具库数据表

```sql
CREATE TABLE mentor_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  适用场景 JSONB, -- ["拖延", "任务太大"]
  推荐话术 TEXT,
  使用指导 TEXT,
  tool_url VARCHAR(255), -- 工具页面路径
  icon VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 插入工具数据
INSERT INTO mentor_tools (tool_id, name, category, 适用场景, 推荐话术, 使用指导, tool_url, icon) VALUES
('pomodoro_timer', '番茄计时器', '时间管理', '["拖延", "任务太大", "注意力不集中"]', '要不要试试把任务切成25分钟的小块？我这里有个计时器。', '设置25分钟，专注做一件事，时间到了休息5分钟。', '/pages/toolbox/pomodoro', '🍅'),
('mind_map', '思维导图', '思维工具', '["思路混乱", "不知道从哪开始", "需要梳理"]', '感觉你的想法有点乱，要不要用思维导图理一理？', '把主题写在中间，然后把想到的都写出来，不用管顺序。', '/pages/toolbox/mindmap', '🧠'),
('eisenhower_matrix', '四象限法', '优先级管理', '["不知道先做什么", "什么都想做", "时间不够"]', '事情太多了？咱们用四象限法分分类，看看哪些最重要。', '把任务分成：重要紧急、重要不紧急、不重要紧急、不重要不紧急。', '/pages/toolbox/eisenhower', '📊');
```

#### 3.2 工具推荐引擎

**文件**: `backend/services/toolRecommendationService.ts`

```typescript
class ToolRecommendationService {
  async recommendTool(studentMessage: string, context: any): Promise<ToolRecommendation | null> {
    // 1. 关键词匹配
    const keywords = this.extractKeywords(studentMessage)
    
    // 2. 查询匹配的工具
    const tools = await db.query(`
      SELECT * FROM mentor_tools
      WHERE 适用场景 ?| $1
      LIMIT 1
    `, [keywords])
    
    if (tools.length === 0) return null
    
    // 3. 返回工具推荐
    return {
      tool_id: tools[0].tool_id,
      name: tools[0].name,
      reason: this.generateReason(tools[0], context),
      how_to_use: tools[0].使用指导,
      tool_url: tools[0].tool_url,
      icon: tools[0].icon
    }
  }
}
```

#### 3.3 AI响应格式扩展

**当前格式**：
```json
{
  "reply": "导师的回复文本"
}
```

**新格式**：
```json
{
  "reply": "导师的回复文本",
  "tool_recommendation": {
    "tool_id": "pomodoro_timer",
    "name": "番茄计时器",
    "reason": "你说任务太大不知道从哪开始...",
    "how_to_use": "设置25分钟...",
    "tool_url": "/pages/toolbox/pomodoro",
    "icon": "🍅"
  },
  "recalled_memories": [
    {
      "id": "mem_123",
      "content": "上次UI设计任务，学生也说'我不会'，最后得了90分",
      "occurred_at": "2024-03-15"
    }
  ],
  "emotion_detected": {
    "type": "anxiety",
    "intensity": "medium",
    "keywords": ["担心", "不知道"]
  }
}
```

---

### 阶段4：前端界面增强

#### 4.1 工具卡片组件

**文件**: `frontend/components/mentor/ToolCard.tsx`

```tsx
interface ToolCardProps {
  tool: {
    name: string
    reason: string
    how_to_use: string
    tool_url: string
    icon: string
  }
}

export function ToolCard({ tool }: ToolCardProps) {
  return (
    <View className='tool-card'>
      <View className='tool-header'>
        <Text className='tool-icon'>{tool.icon}</Text>
        <Text className='tool-name'>{tool.name}</Text>
      </View>
      <Text className='tool-reason'>{tool.reason}</Text>
      <Text className='tool-guide'>{tool.how_to_use}</Text>
      <View 
        className='tool-button'
        onClick={() => Taro.navigateTo({ url: tool.tool_url })}
      >
        <Text>立即使用</Text>
      </View>
    </View>
  )
}
```

#### 4.2 记忆引用显示

**文件**: `frontend/components/mentor/MemoryReference.tsx`

```tsx
interface MemoryReferenceProps {
  memories: Array<{
    id: string
    content: string
    occurred_at: string
  }>
}

export function MemoryReference({ memories }: MemoryReferenceProps) {
  if (memories.length === 0) return null
  
  return (
    <View className='memory-reference'>
      <Text className='memory-label'>🐱 启程小猫记得：</Text>
      {memories.map(memory => (
        <View key={memory.id} className='memory-item'>
          <Text className='memory-content'>{memory.content}</Text>
          <Text className='memory-time'>{formatDate(memory.occurred_at)}</Text>
        </View>
      ))}
    </View>
  )
}
```

#### 4.3 情绪标记显示

**文件**: `frontend/components/mentor/EmotionIndicator.tsx`

```tsx
interface EmotionIndicatorProps {
  emotion: {
    type: 'anxiety' | 'frustration' | 'excitement' | 'confusion'
    intensity: 'low' | 'medium' | 'high'
  }
}

const EMOTION_CONFIG = {
  anxiety: { label: '有点紧张', icon: '😰', color: '#F59E0B' },
  frustration: { label: '有点沮丧', icon: '😔', color: '#EF4444' },
  excitement: { label: '很兴奋', icon: '🎉', color: '#10B981' },
  confusion: { label: '有点困惑', icon: '🤔', color: '#6B7280' }
}

export function EmotionIndicator({ emotion }: EmotionIndicatorProps) {
  const config = EMOTION_CONFIG[emotion.type]
  
  return (
    <View className='emotion-indicator' style={{ borderColor: config.color }}>
      <Text className='emotion-icon'>{config.icon}</Text>
      <Text className='emotion-label'>{config.label}</Text>
    </View>
  )
}
```

#### 4.4 对话界面集成

**修改文件**: `frontend/components/mentor/MentorStageChat.tsx`

```tsx
// 渲染消息时
{message.role === 'mentor' && (
  <View className='mentor-message'>
    {/* 情绪标记 */}
    {message.emotion_detected && (
      <EmotionIndicator emotion={message.emotion_detected} />
    )}
    
    {/* 记忆引用 */}
    {message.recalled_memories && (
      <MemoryReference memories={message.recalled_memories} />
    )}
    
    {/* 消息内容 */}
    <Text className='message-text'>{message.content}</Text>
    
    {/* 工具推荐 */}
    {message.tool_recommendation && (
      <ToolCard tool={message.tool_recommendation} />
    )}
  </View>
)}
```

---

### 阶段5：测试与优化

#### 5.1 对话质量测试

**测试场景**：
1. 学生说"我不行" → 检查是否召回成功经历
2. 学生说"不知道从哪开始" → 检查是否推荐工具
3. 学生情绪低落 → 检查回应是否温暖
4. 学生过度依赖 → 检查是否引导思考
5. 学生取得突破 → 检查是否真诚庆祝

**评估标准**：
- 语气是否口语化、有情绪
- 是否用"我"而不是"系统"
- 是否有启发式提问
- 是否自然召回记忆
- 是否推荐合适工具

#### 5.2 A/B测试

**对比组**：
- A组：使用新Prompt（有灵魂）
- B组：使用旧Prompt（机械化）

**指标**：
- 对话轮次（越多越好）
- 学生满意度评分
- 任务完成率
- 学生主动分享率

---

## 🚀 实施优先级

### P0 - 立即开始（本周）
1. ✅ 创建Prompt设计文档（已完成）
2. 🔥 重写4个阶段的Prompt模板
3. 🔥 实现Prompt变量替换逻辑
4. 🔥 测试新Prompt的对话效果

### P1 - 下周开始
1. 实现记忆向量化存储
2. 实现自动记忆召回
3. 创建工具库数据表
4. 实现工具推荐引擎

### P2 - 两周后
1. 前端工具卡片组件
2. 前端记忆引用显示
3. 前端情绪标记显示
4. 集成到对话界面

### P3 - 持续优化
1. 收集用户反馈
2. 优化Prompt
3. A/B测试
4. 迭代改进

---

## 📊 成功指标

### 定量指标
- 平均对话轮次：从 2-3 轮提升到 5-8 轮
- 学生满意度：从 3.5/5 提升到 4.5/5
- 工具使用率：从 0% 提升到 30%+
- 记忆召回准确率：> 80%

### 定性指标
- 学生愿意多说，不只是回答"嗯"
- 学生主动分享感受和想法
- 学生感到被理解和支持
- 学生愿意反思，而不只是要答案

---

## 💡 关键注意事项

### 1. Prompt设计原则
- ❌ 不要：指令式、技术性、冷冰冰
- ✅ 要：对话式、温暖、有共鸣

### 2. 记忆召回原则
- ❌ 不要：机械地列出历史记录
- ✅ 要：自然地提起相关经历

### 3. 工具推荐原则
- ❌ 不要：生硬地推销工具
- ✅ 要：解释为什么适合TA

### 4. 情绪回应原则
- ❌ 不要：说教、讲道理
- ✅ 要：先理解、再引导

---

## 📝 相关文档

- [启程小猫核心Prompt设计](./mentor-soul-prompt-design.md)
- [Week 4-5 实现文档](./week4-5-implementation.md)
- [Week 6 实现文档](./week6-implementation.md)
- [AI导师系统完整实现计划](../../../backend/docs/mentor-stage-system-plan.md)

---

**文档版本**: v1.0  
**创建日期**: 2026-05-10  
**负责人**: 后端团队 + AI团队  
**预计完成**: 2-3周
