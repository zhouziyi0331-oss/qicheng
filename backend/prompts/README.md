# 启程小猫Prompt模板使用指南

## 📚 模板概览

已创建4个阶段的完整Prompt模板，每个模板都经过精心设计，让启程小猫真正"有灵魂"。

### 模板清单

| 阶段 | 文件 | 触发时机 | 模型 | 状态 |
|------|------|----------|------|------|
| 阶段1 | [stage1_requirement_understanding.md](./stage1_requirement_understanding.md) | 学生接单后3秒 | Sonnet 4.6 | ✅ 已完成 |
| 阶段2 | [stage2_execution_guidance.md](./stage2_execution_guidance.md) | 学生主动提问 | Sonnet 4.6 / Haiku 4.5 | ✅ 已完成 |
| 阶段3 | [stage3_quality_review.md](./stage3_quality_review.md) | 学生准备提交 | Sonnet 4.6 | ✅ 已完成 |
| 阶段4 | [stage4_communication_bridge.md](./stage4_communication_bridge.md) | 企业给出反馈 | Sonnet 4.6 | ✅ 已完成 |

---

## 🎯 核心特点

### 1. 有温度的对话

**不再是**：
```
检测到你的焦虑情绪（强度7/10）。建议进行深呼吸练习。
```

**而是**：
```
嗯，我感觉到你有点紧张…是不是担心做不好？

其实啊，这种感觉我见过很多次。你知道吗，上次那个任务
你也是这样，但最后你做得超出了自己的预期。

要不要先聊聊，你具体在担心什么？
```

### 2. 启发式引导

**不直接给答案**，而是用问题引导思考：
- "你觉得问题可能出在哪里？"
- "如果是XXX，会怎么样？"
- "你之前遇到类似情况是怎么解决的？"

### 3. 自然召回记忆

**不机械地列出记录**，而是自然地提起：
- "这让我想起来了..."
- "你还记得上次那个任务吗？"
- "和之前那次很像..."

### 4. 工具推荐集成

**不生硬地推销**，而是解释为什么：
- "对了，我想到一个可能对你有用的方法..."
- "要不要试试XXX？我觉得适合你现在的情况..."

---

## 🔧 使用方法

### 步骤1：加载模板

```typescript
// backend/services/mentorPromptBuilder.ts
class MentorPromptBuilder {
  async loadTemplate(stage: string): Promise<string> {
    const templatePath = `./prompts/stage${stage}_*.md`
    const template = await fs.readFile(templatePath, 'utf-8')
    
    // 提取核心Prompt部分（在```之间的内容）
    const promptMatch = template.match(/```\n([\s\S]*?)\n```/)
    return promptMatch ? promptMatch[1] : template
  }
}
```

### 步骤2：替换变量

```typescript
class MentorPromptBuilder {
  replaceVariables(template: string, variables: any): string {
    let result = template
    
    // 简单变量替换
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      result = result.replace(regex, variables[key] || '')
    })
    
    // 条件块处理
    result = this.processConditionals(result, variables)
    
    // 循环块处理
    result = this.processLoops(result, variables)
    
    return result
  }
  
  processConditionals(template: string, variables: any): string {
    // 处理 {{#if variable}} ... {{/if}}
    const ifRegex = /{{#if (\w+)}}([\s\S]*?){{\/if}}/g
    return template.replace(ifRegex, (match, varName, content) => {
      return variables[varName] ? content : ''
    })
  }
  
  processLoops(template: string, variables: any): string {
    // 处理 {{#each array}} ... {{/each}}
    const eachRegex = /{{#each (\w+)}}([\s\S]*?){{\/each}}/g
    return template.replace(eachRegex, (match, varName, content) => {
      const array = variables[varName]
      if (!Array.isArray(array)) return ''
      
      return array.map((item, index) => {
        let itemContent = content
        // 替换 {{this.property}}
        Object.keys(item).forEach(key => {
          itemContent = itemContent.replace(
            new RegExp(`{{this\\.${key}}}`, 'g'),
            item[key]
          )
        })
        // 替换 {{@index}}
        itemContent = itemContent.replace(/{{@index}}/g, String(index + 1))
        return itemContent
      }).join('\n')
    })
  }
}
```

### 步骤3：加载记忆

```typescript
class MentorPromptBuilder {
  async loadRelevantMemories(studentId: string, context: string): Promise<Memory[]> {
    // 使用向量搜索找到相关记忆
    const memories = await memoryVectorService.searchSimilarMemories(
      context,
      studentId,
      limit: 3
    )
    
    return memories.map(m => ({
      content: m.content,
      occurred_at: this.formatDate(m.occurred_at)
    }))
  }
}
```

### 步骤4：组装完整Prompt

```typescript
class MentorPromptBuilder {
  async buildPrompt(stage: string, variables: any): Promise<string> {
    // 1. 加载基础模板
    const baseTemplate = await this.loadTemplate(stage)
    
    // 2. 加载学生记忆
    const memories = await this.loadRelevantMemories(
      variables.studentId,
      variables.student_question || variables.task_description
    )
    variables.student_memories = memories
    
    // 3. 加载对话历史
    const history = await this.loadConversationHistory(
      variables.sessionId,
      limit: 3
    )
    variables.conversation_history = this.formatHistory(history)
    
    // 4. 替换变量
    const prompt = this.replaceVariables(baseTemplate, variables)
    
    return prompt
  }
}
```

### 步骤5：调用AI

```typescript
class MentorCoreService {
  async chat(sessionId: string, userMessage: string): Promise<MentorResponse> {
    // 1. 获取会话信息
    const session = await this.getSession(sessionId)
    
    // 2. 构建Prompt
    const prompt = await promptBuilder.buildPrompt(session.stage, {
      sessionId,
      studentId: session.studentId,
      student_question: userMessage,
      task_title: session.task.title,
      // ... 其他变量
    })
    
    // 3. 调用AI
    const response = await anthropic.messages.create({
      model: this.selectModel(session.stage),
      max_tokens: 2000,
      temperature: 0.7,
      messages: [
        { role: 'user', content: prompt }
      ]
    })
    
    // 4. 解析响应
    const result = JSON.parse(response.content[0].text)
    
    // 5. 保存消息和记忆
    await this.saveMessage(sessionId, 'student', userMessage)
    await this.saveMessage(sessionId, 'mentor', result.reply, result)
    
    if (result.memories) {
      await this.saveMemories(session.studentId, result.memories)
    }
    
    return result
  }
}
```

---

## 📊 模型选择策略

```typescript
class MentorCoreService {
  selectModel(stage: string, operation?: string): string {
    const rules = {
      requirement_understanding: {
        initial: 'claude-haiku-4-5',      // 初始打招呼
        analysis: 'claude-sonnet-4-6',    // 分析理解准确度
        correction: 'claude-sonnet-4-6',  // 纠正理解偏差
        prd_generation: 'claude-sonnet-4-6' // 生成PRD框架
      },
      execution_guidance: {
        simple_question: 'claude-haiku-4-5',     // 简单问题
        complex_question: 'claude-sonnet-4-6',   // 复杂问题
        encouragement: 'claude-haiku-4-5',       // 简单鼓励
        pattern_analysis: 'claude-sonnet-4-6'    // 模式分析
      },
      quality_review: {
        pre_check: 'claude-sonnet-4-6',   // 质量预审（关键）
        feedback: 'claude-haiku-4-5'      // 简单反馈
      },
      communication_bridge: {
        translation: 'claude-sonnet-4-6', // 翻译反馈
        clarification: 'claude-haiku-4-5' // 简单澄清
      }
    }
    
    return rules[stage]?.[operation] || 'claude-sonnet-4-6'
  }
}
```

---

## 🧪 测试方法

### 单元测试

```typescript
// tests/prompts/stage1.test.ts
describe('Stage 1: Requirement Understanding', () => {
  it('should generate warm greeting for new student', async () => {
    const prompt = await promptBuilder.buildPrompt('1', {
      task_title: '品牌海报设计',
      student_name: '小明',
      completed_tasks_count: 0
    })
    
    expect(prompt).toContain('嘿')
    expect(prompt).toContain('第一个任务')
    expect(prompt).not.toContain('系统')
    expect(prompt).not.toContain('检测到')
  })
  
  it('should recall memories for experienced student', async () => {
    const prompt = await promptBuilder.buildPrompt('1', {
      task_title: 'UI设计',
      student_name: '小红',
      completed_tasks_count: 10,
      student_memories: [
        { content: '上次设计任务得了90分', occurred_at: '2024-03-15' }
      ]
    })
    
    expect(prompt).toContain('上次')
    expect(prompt).toContain('90分')
  })
})
```

### 集成测试

```typescript
// tests/integration/mentor-chat.test.ts
describe('Mentor Chat Integration', () => {
  it('should have warm conversation style', async () => {
    const response = await mentorService.chat(sessionId, '我不知道怎么做')
    
    // 检查语气
    expect(response.reply).toMatch(/嗯|哎|哇/)
    expect(response.reply).toContain('我')
    expect(response.reply).not.toContain('系统')
    
    // 检查是否有引导性问题
    expect(response.reply).toMatch(/\?/)
    
    // 检查是否有情绪回应
    expect(response.emotion_detected).toBeDefined()
  })
  
  it('should recommend tools when appropriate', async () => {
    const response = await mentorService.chat(
      sessionId,
      '任务太大了，不知道从哪开始'
    )
    
    expect(response.tool_recommendation).toBeDefined()
    expect(response.tool_recommendation.tool_id).toMatch(/pomodoro|mind_map/)
  })
})
```

### 对话质量测试

```typescript
// tests/quality/conversation-quality.test.ts
describe('Conversation Quality', () => {
  const testCases = [
    {
      scenario: '学生情绪低落',
      input: '算了，我不想做了',
      expectations: {
        hasEmotionResponse: true,
        hasEncouragement: true,
        recallsSuccess: true,
        tone: 'supportive'
      }
    },
    {
      scenario: '学生过度依赖',
      input: '这个配色用哪个好？',
      expectations: {
        doesNotGiveDirectAnswer: true,
        hasSocraticQuestions: true,
        encouragesThinking: true
      }
    }
  ]
  
  testCases.forEach(({ scenario, input, expectations }) => {
    it(`should handle: ${scenario}`, async () => {
      const response = await mentorService.chat(sessionId, input)
      
      if (expectations.hasEmotionResponse) {
        expect(response.reply).toMatch(/感觉到|注意到/)
      }
      
      if (expectations.doesNotGiveDirectAnswer) {
        expect(response.reply).not.toMatch(/建议使用|应该用/)
        expect(response.reply).toMatch(/你觉得|你想想/)
      }
      
      // ... 其他检查
    })
  })
})
```

---

## 📈 监控指标

### 对话质量指标

```typescript
interface ConversationMetrics {
  // 对话轮次
  averageTurns: number        // 目标: 5-8轮
  
  // 语气检查
  usesFirstPerson: boolean    // 使用"我"
  hasEmotionWords: boolean    // 有情绪词
  avoidsTechnicalTerms: boolean // 避免"系统"、"检测到"
  
  // 引导质量
  hasSocraticQuestions: number  // 启发式提问数量
  givesDirectAnswers: number    // 直接给答案次数（应该少）
  
  // 记忆使用
  recallsMemories: number       // 召回记忆次数
  
  // 工具推荐
  recommendsTools: number       // 推荐工具次数
  toolUsageRate: number         // 工具使用率
}
```

### 监控实现

```typescript
class ConversationMonitor {
  async analyzeConversation(sessionId: string): Promise<ConversationMetrics> {
    const messages = await this.getMessages(sessionId)
    
    return {
      averageTurns: messages.length / 2,
      usesFirstPerson: this.checkFirstPerson(messages),
      hasEmotionWords: this.checkEmotionWords(messages),
      hasSocraticQuestions: this.countQuestions(messages),
      recallsMemories: this.countMemoryRecalls(messages),
      recommendsTools: this.countToolRecommendations(messages),
      // ...
    }
  }
  
  checkFirstPerson(messages: Message[]): boolean {
    const mentorMessages = messages.filter(m => m.role === 'mentor')
    return mentorMessages.some(m => m.content.includes('我'))
  }
  
  checkEmotionWords(messages: Message[]): boolean {
    const emotionWords = ['感觉到', '注意到', '担心', '高兴', '理解']
    const mentorMessages = messages.filter(m => m.role === 'mentor')
    return mentorMessages.some(m => 
      emotionWords.some(word => m.content.includes(word))
    )
  }
}
```

---

## 🔄 持续优化

### 1. 收集反馈

```typescript
// 学生对导师回复的评分
interface FeedbackRating {
  messageId: string
  rating: 1 | 2 | 3 | 4 | 5  // 1=很差, 5=很好
  reason?: string
}

// 保存反馈
await db.query(`
  INSERT INTO mentor_message_ratings (message_id, rating, reason)
  VALUES ($1, $2, $3)
`, [messageId, rating, reason])
```

### 2. A/B测试

```typescript
// 测试不同版本的Prompt
const promptVersions = {
  v1: 'stage1_requirement_understanding_v1.md',
  v2: 'stage1_requirement_understanding_v2.md'
}

// 随机分配版本
const version = Math.random() < 0.5 ? 'v1' : 'v2'
const prompt = await promptBuilder.loadTemplate(promptVersions[version])

// 记录版本
await db.query(`
  UPDATE mentor_sessions
  SET prompt_version = $1
  WHERE id = $2
`, [version, sessionId])
```

### 3. 分析效果

```sql
-- 对比不同版本的效果
SELECT 
  prompt_version,
  AVG(conversation_turns) as avg_turns,
  AVG(student_satisfaction) as avg_satisfaction,
  AVG(tool_usage_rate) as tool_usage
FROM mentor_sessions
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY prompt_version;
```

---

## 📝 最佳实践

### 1. Prompt编写

- ✅ 用"我"，不用"系统"
- ✅ 用口语化表达
- ✅ 有情绪词
- ✅ 用问题引导
- ✅ 自然召回记忆
- ❌ 不要列出要点
- ❌ 不要直接给答案
- ❌ 不要说教

### 2. 变量管理

- ✅ 所有变量都要有默认值
- ✅ 检查变量是否存在再使用
- ✅ 格式化日期和数字
- ❌ 不要假设变量一定存在

### 3. 错误处理

- ✅ AI响应解析失败时有降级方案
- ✅ 记录所有错误日志
- ✅ 向用户显示友好的错误信息
- ❌ 不要让错误中断对话

---

## 🎓 培训材料

### 给团队的培训

1. **理解"有灵魂"的含义**
   - 阅读 [对话对比示例](../../miniapp/docs/mentor-conversation-comparison.md)
   - 理解机械版 vs 有灵魂版的区别

2. **学习Prompt结构**
   - 阅读4个阶段的Prompt模板
   - 理解每个部分的作用

3. **实践编写**
   - 尝试编写新的场景处理
   - 团队互相review

4. **测试和优化**
   - 运行测试用例
   - 根据反馈优化

---

**文档版本**: v1.0  
**创建日期**: 2026-05-10  
**维护者**: 后端团队 + AI团队  
**状态**: 使用指南完成
