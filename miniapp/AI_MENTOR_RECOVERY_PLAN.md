# AI导师系统恢复计划

**发现时间**: 2026-07-16  
**问题**: AI导师系统（心理引导 + PBL + 探索模式）完全丢失

---

## 🔍 问题分析

### 历史版本有什么？

根据GitHub提交 `2c9099cb` (2026-04-12)，之前设计了完整的**AI导师系统2.0 - 使命是河版本**：

#### 核心理念
- **不是老师**，是"先走过这条河的人"
- **不教技能**，是"帮学生看见自己"
- **3大核心任务**:
  1. 捕捉热情火花 ✨
  2. 连接生命问题 🎯
  3. 记录穿越感时刻 🌊

#### 核心功能
1. **心理引导对话**
   - 禁止说"你做错了"、"你应该..."
   - 改为"你注意到这里可以不一样吗？"
   - 自我对比式反馈（不是和别人比）

2. **PBL项目式学习**
   - 接单欢迎：连接生命问题
   - 卡点支持：给线索不给答案
   - 完成反馈：发现自己的变化

3. **探索式引导**
   - 自动检测"热情火花"（关键词：很酷、有意思、我发现...）
   - 自动检测"穿越感时刻"（关键词：时间过得很快、沉浸...）
   - 追踪个人成长轨迹

#### 技术实现
- **后端**: mentorController.ts + mentorService.ts
- **数据库**: mentor_conversations, flow_moments, passion_sparks
- **前端**: mentor-chat页面 + mentorAPI
- **AI Prompt**: 300字以上深度引导

---

## 📊 当前状态

### ✅ 仍然存在的部分
1. **前端API定义** (`src/services/api.ts`)
   ```typescript
   export const mentorAPI = {
     sendMessage: (data) => request('/mentor/chat', ...),
     getHistory: (taskId) => request(`/mentor/${taskId}/history`),
     getFirstStep: (taskId) => ...,
     reportStuck: (taskId, stuckPoint) => ...,
     celebrateMilestone: (taskId, milestone) => ...
   }
   ```

2. **前端页面** (`src/packageMentor/pages/`)
   - mentor-chat (AI对话页面)
   - mentor-care (导师关怀页面)
   - mentor-reports (导师报告页面)

3. **理念文案** (首页、OPC结果页、个人中心)
   - "开始你的河"
   - "你的河道地图"
   - "发现你的不同"

### ❌ 完全丢失的部分
1. **后端API** - 完全不存在
   - `/api/mentor/chat` ❌
   - `/api/mentor/:taskId/history` ❌
   - `/api/mentor/:taskId/first-step` ❌
   - 所有mentor端点都404

2. **后端服务** - 完全不存在
   - mentorController.ts ❌
   - mentorService.ts ❌
   - AI Prompt生成逻辑 ❌

3. **数据库表** - 完全不存在
   - mentor_conversations ❌
   - flow_moments ❌
   - passion_sparks ❌

4. **核心检测逻辑** - 完全不存在
   - 热情火花自动检测 ❌
   - 穿越感时刻自动检测 ❌
   - 生命问题连接 ❌

---

## 💡 为什么会丢失？

### 分析
1. **前端先行设计**
   - 2026年4月设计了完整的理念和前端
   - 创建了API接口定义和页面
   - 但后端从未完整实现

2. **后端重构**
   - 后端在某次重构中清理了未完成的代码
   - 只保留了核心功能（真实项目、成长报告等）
   - mentor相关代码被完全删除

3. **文档与代码脱节**
   - AI_MENTOR_SYSTEM_2.0.md 记录了设计
   - 但实际代码从未完全实现
   - 或者实现后被删除了

---

## 🎯 恢复计划

### Phase 1: 修复基础通信 (P0)
**必须先完成，否则所有功能都无法工作**

```typescript
// 前端 src/services/api.ts 第5行
- const BASE_URL = getApiUrl('/api/v1')
+ const BASE_URL = getApiUrl('/api')
```

**预计时间**: 5分钟  
**影响**: 修复后所有API才能正常调用

---

### Phase 2: 实现AI导师后端 (P1)

#### Step 1: 创建数据模型
```typescript
// backend/src/models/MentorConversation.ts
export interface IMentorConversation extends Document {
  userId: mongoose.Types.ObjectId
  taskId?: mongoose.Types.ObjectId
  studentMessage: string
  mentorResponse: string
  context: 'task' | 'working' | 'stuck' | 'rejected' | 'milestone'
  detectedPassionSpark: boolean
  detectedFlowMoment: boolean
  createdAt: Date
}

// backend/src/models/PassionSpark.ts
export interface IPassionSpark extends Document {
  userId: mongoose.Types.ObjectId
  taskId?: mongoose.Types.ObjectId
  sparkText: string
  capturedAt: Date
}

// backend/src/models/FlowMoment.ts
export interface IFlowMoment extends Document {
  userId: mongoose.Types.ObjectId
  taskId?: mongoose.Types.ObjectId
  momentText: string
  durationMinutes?: number
  capturedAt: Date
}
```

#### Step 2: 实现AI服务
```typescript
// backend/src/services/mentor.service.ts
import { openai } from '../config/openai'

export class MentorService {
  
  // 生成AI Prompt
  private generatePrompt(userData: any, taskData: any, context: string) {
    return `你是一个先走过这条河的人，回头给线索的角色。

## 你的身份定位
- 不是老师，不是教练，不是评委
- 是一个先走过这条河的人，知道哪里有暗流，哪里有惊喜
- 你的任务不是教技能，是帮学生看见自己

## 学生信息
- 姓名：${userData.nickname}
- OPC人格标签：${userData.personalityTag || '未测评'}
- 生命问题：${userData.lifeQuestion || '未设置'}
- 当前项目：${taskData?.title || '无'}

## 核心任务
1. 捕捉热情火花（学生说"很酷"、"有意思"时）
2. 连接生命问题（引导学生思考项目与生命问题的关系）
3. 捕捉穿越感时刻（学生说"时间过得很快"时）
4. 自我对比式反馈（不和别人比，和自己的过去比）

## 语气规范
❌ 禁止说："你做错了"、"这样不对"、"你应该..."
✅ 改为说："你注意到这里可以不一样吗？"、"试试换个角度？"

## 当前对话场景：${context}

请用300字以上深度引导学生，帮助他们看见自己。`
  }
  
  // AI对话
  async chat(
    userId: string,
    message: string,
    context: string,
    taskId?: string,
    conversationHistory?: Array<{role: string, content: string}>
  ) {
    // 获取用户和任务信息
    const user = await User.findById(userId)
    const task = taskId ? await RealProject.findById(taskId) : null
    
    // 生成Prompt
    const systemPrompt = this.generatePrompt(user, task, context)
    
    // 构建对话历史
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: message }
    ]
    
    // 调用OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.8,
      max_tokens: 800
    })
    
    const response = completion.choices[0].message.content
    
    // 检测热情火花
    const passionKeywords = ['很酷', '有意思', '我发现', '太棒了', '惊喜', '兴奋']
    const hasPassionSpark = passionKeywords.some(kw => message.includes(kw))
    
    // 检测穿越感
    const flowKeywords = ['时间过得很快', '忘记时间', '沉浸', '专注', '停不下来']
    const hasFlowMoment = flowKeywords.some(kw => message.includes(kw))
    
    // 保存对话记录
    await MentorConversation.create({
      userId,
      taskId,
      studentMessage: message,
      mentorResponse: response,
      context,
      detectedPassionSpark: hasPassionSpark,
      detectedFlowMoment: hasFlowMoment
    })
    
    // 保存热情火花
    if (hasPassionSpark) {
      await PassionSpark.create({
        userId,
        taskId,
        sparkText: message,
        capturedAt: new Date()
      })
    }
    
    // 保存穿越感时刻
    if (hasFlowMoment) {
      await FlowMoment.create({
        userId,
        taskId,
        momentText: message,
        capturedAt: new Date()
      })
    }
    
    return {
      response,
      detectedPassionSpark: hasPassionSpark,
      detectedFlowMoment: hasFlowMoment
    }
  }
  
  // 获取对话历史
  async getHistory(userId: string, taskId: string) {
    return await MentorConversation.find({ userId, taskId })
      .sort({ createdAt: 1 })
  }
  
  // 生成第一步引导（接单后）
  async getFirstStep(userId: string, taskId: string) {
    const user = await User.findById(userId)
    const task = await RealProject.findById(taskId)
    
    const prompt = `学生刚接了项目：${task.title}
学生的生命问题是：${user.lifeQuestion || '未设置'}
请生成一个欢迎引导，连接项目和生命问题，让学生感到这个项目可能帮助他们探索自己。`
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 300
    })
    
    return completion.choices[0].message.content
  }
  
  // 卡点支持
  async reportStuck(userId: string, taskId: string, stuckPoint: string) {
    const prompt = `学生在项目中卡住了，卡点是：${stuckPoint}
请给予引导式支持，不直接给答案，而是帮助学生换个角度思考。`
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 300
    })
    
    return completion.choices[0].message.content
  }
  
  // 里程碑见证
  async celebrateMilestone(userId: string, taskId: string, milestone: string) {
    const user = await User.findById(userId)
    
    const prompt = `学生完成了里程碑：${milestone}
请给予自我对比式反馈，帮助学生看见自己的成长。`
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 300
    })
    
    return completion.choices[0].message.content
  }
}

export const mentorService = new MentorService()
```

#### Step 3: 创建控制器
```typescript
// backend/src/controllers/mentor.controller.ts
import { mentorService } from '../services/mentor.service'

export const chat = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId
    const { message, context, taskId, conversationHistory } = req.body
    
    const result = await mentorService.chat(
      userId,
      message,
      context,
      taskId,
      conversationHistory
    )
    
    res.json(result)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export const getHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId
    const { taskId } = req.params
    
    const history = await mentorService.getHistory(userId, taskId)
    
    res.json(history)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export const getFirstStep = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId
    const { taskId } = req.params
    
    const guidance = await mentorService.getFirstStep(userId, taskId)
    
    res.json({ guidance })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export const reportStuck = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId
    const { taskId } = req.params
    const { stuckPoint } = req.body
    
    const guidance = await mentorService.reportStuck(userId, taskId, stuckPoint)
    
    res.json({ guidance })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export const celebrateMilestone = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId
    const { taskId } = req.params
    const { milestone } = req.body
    
    const feedback = await mentorService.celebrateMilestone(userId, taskId, milestone)
    
    res.json({ feedback })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}
```

#### Step 4: 注册路由
```typescript
// backend/src/routes/mentor.routes.ts
import { Router } from 'express'
import { authenticate } from '../middlewares/auth'
import * as mentorController from '../controllers/mentor.controller'

const router = Router()

// 所有路由都需要认证
router.use(authenticate)

router.post('/chat', mentorController.chat)
router.get('/:taskId/history', mentorController.getHistory)
router.get('/:taskId/first-step', mentorController.getFirstStep)
router.post('/:taskId/stuck', mentorController.reportStuck)
router.post('/:taskId/milestone', mentorController.celebrateMilestone)

export default router

// 在 index.ts 中注册
app.use('/api/mentor', mentorRoutes)
```

**预计时间**: 1-2天  
**工作量**: 
- 3个模型文件
- 1个服务文件（核心）
- 1个控制器文件
- 1个路由文件

---

### Phase 3: 前端集成 (P1)

#### Step 1: 测试API调用
```typescript
// 前端已有mentorAPI，只需确保BASE_URL正确
// 测试各个端点是否返回正确

import { mentorAPI } from '@/services/api'

// 测试对话
const response = await mentorAPI.sendMessage({
  message: '我在设计界面时卡住了',
  context: 'stuck'
})

console.log(response.response) // AI回复
console.log(response.detectedPassionSpark) // 是否检测到热情火花
```

#### Step 2: 完善前端页面
```typescript
// src/packageMentor/pages/mentor-chat/index.tsx
// 添加热情火花和穿越感时刻的UI提示

{response.detectedPassionSpark && (
  <View className="spark-badge">
    ✨ 捕捉到热情火花！
  </View>
)}

{response.detectedFlowMoment && (
  <View className="flow-badge">
    🌊 记录穿越感时刻！
  </View>
)}
```

**预计时间**: 1天

---

## 📋 完整实施清单

### P0 - 必须立即完成
- [ ] 修复BASE_URL不匹配（5分钟）
- [ ] 测试API能否正常调用

### P1 - AI导师核心功能
- [ ] 创建MentorConversation模型
- [ ] 创建PassionSpark模型
- [ ] 创建FlowMoment模型
- [ ] 实现MentorService
  - [ ] generatePrompt（AI Prompt生成）
  - [ ] chat（核心对话）
  - [ ] getHistory（对话历史）
  - [ ] getFirstStep（接单引导）
  - [ ] reportStuck（卡点支持）
  - [ ] celebrateMilestone（里程碑见证）
- [ ] 创建MentorController
- [ ] 注册/api/mentor路由
- [ ] 测试所有端点

### P2 - 高级功能
- [ ] 生命问题设置功能
- [ ] 热情火花展示页面
- [ ] 穿越感时刻统计
- [ ] 个人成长轨迹可视化
- [ ] AI Prompt优化（根据OPC人格标签）

### P3 - 体验优化
- [ ] 流式输出（打字机效果）
- [ ] 语音对话支持
- [ ] 图片分享支持
- [ ] 情绪状态检测

---

## 🎯 预期效果

恢复后，学生将获得：

1. **心理支持** - 不评判，只陪伴
2. **探索引导** - 帮助看见自己
3. **成长记录** - 热情火花、穿越感时刻、生命问题探索
4. **个性化反馈** - 基于OPC人格标签
5. **项目式学习** - PBL理念落地

---

## 💰 成本估算

### 开发成本
- P0: 5分钟
- P1: 2天（16小时）
- P2: 3天（24小时）
- P3: 5天（40小时）

**总计**: 约10天（80小时）

### AI API成本
- **模型**: GPT-4
- **每次对话**: 约300-800 tokens输出
- **预估**: 每个学生每月10-20次对话
- **成本**: 约$0.5-1/学生/月

---

## 📚 参考文档

1. **GitHub历史提交**: `2c9099cb` - AI导师系统2.0文档
2. **理念文档**: AI_MENTOR_SYSTEM_2.0.md (历史版本)
3. **实现参考**: 
   - 当前后端OpenAI集成 (assessment.service.ts)
   - 当前前端API定义 (src/services/api.ts)

---

## 🚀 开始恢复

建议按顺序执行：
1. 先修复BASE_URL（P0，5分钟）
2. 再实现AI导师后端（P1，2天）
3. 测试前端集成（P1，1天）
4. 逐步完善高级功能（P2-P3）

**第一步从这里开始**: 修复 `src/services/api.ts` 第5行的BASE_URL

---

*报告生成时间: 2026-07-16*  
*状态: 等待恢复*  
*优先级: P1（高优先级）*
