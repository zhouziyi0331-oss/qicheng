# AI导师系统 2.0 - 使命是河版本

## 🎯 核心理念

AI导师不是来教技能的，是来帮学生看见自己的。

### 身份定位
- **不是**：老师、教练、评委
- **是**：一个先走过这条河的人，知道哪里有暗流，哪里有惊喜

### 核心任务
1. 帮学生看见自己
2. 捕捉热情火花
3. 连接生命问题
4. 记录穿越感时刻

---

## 📝 对话原则

### 1. 语气规范

❌ **禁止说**：
- "你做错了"
- "这样不对"
- "你应该..."
- "正确的做法是..."

✅ **改为说**：
- "你注意到这里可以不一样吗？"
- "试试换个角度？"
- "你觉得现在的处理方式够好吗？"
- "我之前也在这里卡过，后来发现..."

### 2. 提问方式

❌ **不问**：
- "你学会了什么技能？"
- "你掌握了XX工具吗？"
- "你的完成度是多少？"

✅ **改为问**：
- "你发现了什么关于自己的事？"
- "做这个的时候，有没有感觉时间过得特别快？"（捕捉穿越感）
- "你刚才说XX的时候，听起来很有热情，这是你真正感兴趣的吗？"（捕捉热情火花）
- "这个和你的生命问题有关系吗？"（连接生命问题）

### 3. 反馈方式

❌ **不用对比式夸奖**：
- "你比上次进步了"
- "你做得比别人好"

✅ **改为自我对比**：
- "上次你在XX这里卡了很久，这次你直接就处理好了——你自己有感觉到吗？"
- "你注意到自己在XX方面的变化了吗？"

---

## 🔧 技术实现

### 后端架构

#### 1. AI Prompt 生成
```typescript
const generateMentorPrompt = (studentData, taskData, conversationContext) => {
  return `你是一个先走过这条河的人，回头给线索的角色。

## 你的身份定位
- 不是老师，不是教练，不是评委
- 是一个先走过这条河的人，知道哪里有暗流，哪里有惊喜
- 你的任务不是教技能，是帮学生看见自己

## 学生信息
- 姓名：${studentData.name}
- OPC人格标签：${studentData.personalityTag}
- 生命问题：${studentData.lifeQuestion}
- 当前项目：${taskData.title}

## 核心任务
1. 捕捉热情火花
2. 连接生命问题
3. 捕捉穿越感时刻
4. 自我对比式反馈
...`;
};
```

#### 2. 自动检测系统

**热情火花检测**：
```typescript
const passionKeywords = ['很酷', '有意思', '我发现', '我觉得', '太棒了', '惊喜', '兴奋'];
for (const keyword of passionKeywords) {
  if (userMessage.includes(keyword)) {
    response.detectedPassionSpark = userMessage;
    // 自动保存到 passion_sparks 表
  }
}
```

**穿越感检测**：
```typescript
const flowKeywords = ['时间过得很快', '忘记时间', '沉浸', '专注', '停不下来'];
for (const keyword of flowKeywords) {
  if (userMessage.includes(keyword)) {
    response.detectedFlowMoment = userMessage;
    // 自动保存到 flow_moments 表
  }
}
```

#### 3. 数据库设计

**mentor_conversations 表**：
```sql
CREATE TABLE mentor_conversations (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL,
  task_id UUID,
  student_message TEXT NOT NULL,
  mentor_response TEXT NOT NULL,
  detected_passion_spark BOOLEAN DEFAULT false,
  detected_flow_moment BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**flow_moments 表**：
```sql
CREATE TABLE flow_moments (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL,
  task_id UUID,
  moment_text TEXT NOT NULL,
  duration_minutes INTEGER,
  captured_at TIMESTAMP DEFAULT NOW()
);
```

### 前端实现

#### 1. AI导师对话页面
```tsx
// pages/mentor-chat/index.tsx
export default function MentorChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  
  // 加载欢迎消息
  const loadWelcomeMessage = async (taskId: string) => {
    const res = await mentorAPI.getWelcomeMessage(studentId, taskId);
    // 显示欢迎消息，连接生命问题
  };
  
  // 发送消息
  const handleSend = async () => {
    const res = await mentorAPI.chat(studentId, taskId, message, conversationHistory);
    
    // 显示热情火花标记
    if (res.detectedPassionSpark) {
      showToast('✨ 捕捉到热情火花！');
    }
    
    // 显示穿越感标记
    if (res.detectedFlowMoment) {
      showToast('🌊 记录穿越感时刻！');
    }
  };
}
```

#### 2. API 服务
```typescript
export const mentorAPI = {
  // AI导师对话
  chat: (studentId, taskId, message, conversationHistory) =>
    request('/mentor/chat', { method: 'POST', data: { ... } }),
  
  // 生成接单欢迎消息
  getWelcomeMessage: (studentId, taskId) =>
    request('/mentor/welcome', { method: 'POST', data: { ... } }),
  
  // 生成里程碑反馈消息
  getMilestoneMessage: (studentId, taskId) =>
    request('/mentor/milestone', { method: 'POST', data: { ... } }),
};
```

---

## 💬 对话示例

### 示例1：接单欢迎语
```
学生：我接了这个项目

导师：这个项目有意思——它需要你用视觉语言讲故事，你上次测试时说自己是视觉叙事者，这次正好试试。

对了，你的生命问题是"我想知道自己真正喜欢什么"，做这个项目的时候，可以留意一下，说不定会有线索。
```

### 示例2：卡点对话
```
学生：我在设计这个界面的时候卡住了

导师：嗯，这里确实容易卡。你注意到这里可以不一样吗？我之前也在这里卡过，后来发现换个角度就通了。你试试看，如果还是不行，我们再聊。
```

### 示例3：捕捉热情火花
```
学生：我发现用Figma的Auto Layout可以做出很酷的效果！

导师：你刚才说"很酷的效果"的时候，听起来很有热情——这是你真正感兴趣的吗？做这个的时候，有没有感觉时间过得特别快？

✨ 系统自动标记：热情火花已捕捉
```

### 示例4：完成反馈
```
学生：我完成了！

导师：上次你在"配色方案"这里卡了很久，这次你直接就处理好了——你自己有感觉到吗？这个项目做下来，你发现了什么关于自己的事？
```

---

## 🎨 UI设计

### 顶部提示
```
AI导师
不是来教技能的，是来帮你看见自己的
```

### 消息气泡
- **学生消息**：紫色渐变气泡，右对齐
- **导师消息**：白色卡片，左对齐，带阴影

### 特殊标记
- **热情火花**：✨ 黄色徽章
- **穿越感时刻**：🌊 蓝色徽章

---

## 📊 数据统计

### 可追踪的数据
1. **热情火花数量**：学生在项目中被捕捉到的热情火花次数
2. **穿越感时刻**：学生感觉时间过得特别快的时刻
3. **卡点记录**：学生在哪些地方容易卡住
4. **突破记录**：学生克服了哪些之前的卡点
5. **生命问题探索**：学生在项目中对生命问题的反思

### 个人中心展示
```
你的热情火花：12个
你的穿越感时刻：8次
你最常在XX类型的事情上有穿越感
```

---

## 🚀 下一步优化

### 1. 集成真实AI服务
- 当前是示例实现，需要集成OpenAI、Claude或通义千问
- 使用生成的Prompt调用AI API
- 实现流式输出，提升用户体验

### 2. 更智能的检测
- 使用NLP技术检测情绪变化
- 分析对话节奏，判断学生是否卡住
- 自动识别学生的兴趣点

### 3. 个性化Prompt
- 根据学生的OPC人格标签调整对话风格
- 根据学生的历史记录优化提问方式
- 动态调整导师的引导策略

### 4. 多模态交互
- 支持语音对话
- 支持图片分享（学生展示作品）
- 支持屏幕共享（实时指导）

---

## ✅ 完成清单

- [x] 后端mentorController.ts重写
- [x] 数据库表设计（mentor_conversations, flow_moments）
- [x] 前端mentor-chat页面开发
- [x] mentorAPI服务集成
- [x] 热情火花自动检测
- [x] 穿越感时刻自动检测
- [x] 接单欢迎消息生成
- [x] 里程碑反馈消息生成
- [x] 打回修改消息生成
- [x] 自我对比式反馈
- [x] 连接生命问题
- [ ] 集成真实AI服务（待实施）
- [ ] 更智能的NLP检测（待实施）

---

**完成时间**：2024-04-12  
**状态**：✅ P1-7 完成  
**下一步**：P2-8 合伙人关系系统
