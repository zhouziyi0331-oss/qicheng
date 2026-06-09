# 启程老师 - 深度思考系统设计

## 问题诊断

### 当前实现的问题

❌ **表面化**：只是简单的Prompt调用，没有真正的理解过程  
❌ **模板化**：生成的摘要都是填空式的，缺乏洞察  
❌ **孤立化**：每次调用都是独立的，没有记忆和积累  
❌ **被动化**：只在被调用时工作，不会主动观察和思考  

### 真正的"启程老师"应该是什么样？

✅ **持续观察**：一直在观察学生的行为、企业的反馈  
✅ **深度思考**：不是填模板，而是真正理解"这个学生为什么这样做"  
✅ **记忆积累**：记住每个学生的成长轨迹、每个企业的偏好  
✅ **主动洞察**：发现学生卡住的真正原因，预判可能的问题  
✅ **个性化理解**：对每个学生有独特的理解，不是千篇一律  

---

## 核心设计：启程老师的"思考引擎"

### 1. 观察层（Observation Layer）

**持续观察学生的行为**：

```typescript
interface StudentObservation {
  studentId: string;
  timestamp: Date;
  
  // 行为观察
  behavior: {
    type: 'task_start' | 'task_pause' | 'seek_help' | 'submit_work' | 'revise_work';
    context: string;
    duration?: number;
  };
  
  // 情绪推断
  emotionalState?: {
    confidence: number;  // 0-1，从行为推断
    frustration: number; // 0-1，从求助频率推断
    engagement: number;  // 0-1，从活跃度推断
  };
  
  // 工作模式
  workPattern?: {
    timeOfDay: string;
    sessionLength: number;
    breakFrequency: number;
  };
}
```

**持续观察企业的反馈**：

```typescript
interface CompanyObservation {
  companyId: string;
  timestamp: Date;
  
  // 反馈观察
  feedback: {
    type: 'accept' | 'reject' | 'request_revision';
    originalWords: string;  // 企业原话
    tone: 'satisfied' | 'disappointed' | 'frustrated' | 'confused';
  };
  
  // 偏好推断
  preferences?: {
    communicationStyle: string;  // 从历史反馈推断
    qualityStandard: string;     // 从打回原因推断
    responseSpeed: string;       // 从时间要求推断
  };
}
```

### 2. 思考层（Reasoning Layer）

**不是填模板，而是真正的推理过程**：

```typescript
interface ThinkingProcess {
  question: string;  // 当前要思考的问题
  
  // 第一步：回忆相关信息
  recall: {
    studentHistory: StudentObservation[];  // 这个学生过去的行为
    similarCases: Case[];                  // 类似的案例
    relevantPatterns: Pattern[];           // 相关的模式
  };
  
  // 第二步：形成假设
  hypotheses: Array<{
    hypothesis: string;      // 假设："学生可能是因为X而卡住"
    evidence: string[];      // 支持这个假设的证据
    confidence: number;      // 0-1，对这个假设的信心
  }>;
  
  // 第三步：推理验证
  reasoning: {
    mainHypothesis: string;  // 最可能的假设
    reasoning: string;       // 推理过程："因为A，所以B，因此C"
    counterEvidence: string; // 反驳证据："但是也有可能D"
  };
  
  // 第四步：形成洞察
  insight: {
    understanding: string;   // 对当前情况的理解
    rootCause: string;       // 根本原因
    actionable: string;      // 可操作的建议
  };
}
```

**示例：学生求助时的思考过程**

```
问题：学生说"这个需求太模糊了，我不知道客户到底要什么"

第一步：回忆
- 这个学生过去3次任务都是先做再问，很少提前求助
- 上次任务时，客户说"你理解得很准，不用多问"
- 这次任务的企业是新客户，描述确实比较抽象

第二步：假设
假设1：学生真的不理解需求（置信度：0.3）
  证据：学生说"不知道要什么"
  反驳：这个学生过去理解能力很强

假设2：学生习惯了具体需求，遇到抽象需求不适应（置信度：0.7）
  证据：过去的客户都很具体，这次客户很抽象
  证据：学生过去很少提前求助，说明不是能力问题

假设3：学生想确认方向再动手，避免返工（置信度：0.8）
  证据：上次被夸"理解准确"，可能更在意准确性
  证据：这是新客户，学生想建立好印象

第三步：推理
最可能的假设：学生不是真的不懂，而是想确认方向
推理过程：
  - 这个学生过去理解能力强，不太可能突然不懂
  - 这次主动求助，说明他在意这个任务
  - 他说"不知道要什么"，可能是想听老师帮他确认理解
  
反驳证据：
  - 也有可能这次需求确实太抽象，超出了他的经验范围

第四步：洞察
理解：学生不是能力不足，而是在新情况下寻求确认
根本原因：从具体需求到抽象需求的适应期
可操作建议：
  1. 先肯定他主动求助的做法
  2. 不要直接给答案，而是引导他说出自己的理解
  3. 帮他把抽象需求拆成3个具体问题
  4. 让他先回答这3个问题，再确认方向
```

### 3. 记忆层（Memory Layer）

**不是每次都重新开始，而是有持续的记忆**：

```typescript
interface TeacherMemory {
  studentId: string;
  
  // 长期记忆：对这个学生的理解
  longTermUnderstanding: {
    coreStrengths: string[];        // 核心优势（从多次观察总结）
    growthAreas: string[];          // 成长空间（从失败中总结）
    workingStyle: string;           // 工作风格（从行为模式总结）
    learningPattern: string;        // 学习模式（从成长轨迹总结）
    emotionalTriggers: string[];    // 情绪触发点（从求助时机总结）
  };
  
  // 短期记忆：最近的互动
  recentInteractions: Array<{
    timestamp: Date;
    context: string;
    studentState: string;
    teacherResponse: string;
    outcome: string;
  }>;
  
  // 关键时刻：转折点
  keyMoments: Array<{
    timestamp: Date;
    event: string;              // "第一次被打回" "第一次主动求助"
    impact: string;             // 对学生的影响
    teacherInsight: string;     // 老师的洞察
  }>;
}
```

### 4. 表达层（Expression Layer）

**不是生成模板文字，而是基于深度理解的个性化表达**：

```typescript
interface TeacherExpression {
  // 输入：思考结果
  thinking: ThinkingProcess;
  memory: TeacherMemory;
  
  // 输出：个性化的表达
  expression: {
    tone: string;           // 根据学生状态调整语气
    opening: string;        // 开场（体现对学生的理解）
    core: string;           // 核心内容（基于推理结果）
    actionable: string;     // 可操作建议（具体到这个学生）
    encouragement: string;  // 鼓励（基于学生的成长轨迹）
  };
}
```

**示例：基于深度思考的回复**

```
模板化回复（当前实现）：
"好，我们来看看。客户说了三个关键词：年轻、活力、有记忆点。
你觉得这三个词里，哪一个最让你有画面感？先从那个开始，出一个草稿。"

深度思考后的回复（新设计）：
"我注意到你这次主动来问了——这很好，说明你在意这个任务。

你说'不知道客户要什么'，但我觉得你可能不是真的不懂。
你过去3次任务，客户都夸你'理解很准'。这次的区别是，
之前的客户会说'我要一个红色的按钮，放在右上角'，
这次的客户说'我要年轻、活力、有记忆点'——抽象了很多。

我猜你不是不懂，而是想确认方向再动手，对吧？

那我们换个方式：你先别管客户怎么说，你自己看到'年轻、活力、
有记忆点'这几个词，脑子里第一个冒出来的画面是什么？
先说出来，不用管对不对。"
```

---

## 实现方案

### Phase 1：建立观察系统

**1. 事件捕获**

在关键节点捕获学生行为：

```typescript
// 任务开始
await teacherObservationService.recordEvent({
  studentId,
  type: 'task_start',
  context: {
    taskId,
    taskDescription,
    studentPreviousExperience
  }
});

// 学生求助
await teacherObservationService.recordEvent({
  studentId,
  type: 'seek_help',
  context: {
    taskId,
    studentMessage,
    timeElapsed,
    previousAttempts
  }
});

// 交付被打回
await teacherObservationService.recordEvent({
  studentId,
  type: 'work_rejected',
  context: {
    taskId,
    companyFeedback,
    attemptNumber,
    previousRevisions
  }
});
```

**2. 行为分析**

从事件流中提取模式：

```typescript
class BehaviorAnalyzer {
  // 分析工作模式
  analyzeWorkPattern(events: StudentObservation[]): WorkPattern {
    // 从事件时间戳分析工作时段
    // 从事件间隔分析工作节奏
    // 从求助时机分析困难点
  }
  
  // 分析情绪状态
  inferEmotionalState(events: StudentObservation[]): EmotionalState {
    // 从求助频率推断挫折感
    // 从工作时长推断投入度
    // 从修改次数推断信心
  }
  
  // 识别关键时刻
  identifyKeyMoments(events: StudentObservation[]): KeyMoment[] {
    // 第一次被打回
    // 第一次主动求助
    // 连续3次通过
    // 工作模式突变
  }
}
```

### Phase 2：建立思考引擎

**1. 推理框架**

```typescript
class ReasoningEngine {
  async think(question: string, context: Context): Promise<ThinkingProcess> {
    // 第一步：回忆相关信息
    const recall = await this.recall(context);
    
    // 第二步：形成多个假设
    const hypotheses = await this.generateHypotheses(question, recall);
    
    // 第三步：推理验证
    const reasoning = await this.reason(hypotheses, recall);
    
    // 第四步：形成洞察
    const insight = await this.formInsight(reasoning);
    
    return { question, recall, hypotheses, reasoning, insight };
  }
  
  private async recall(context: Context) {
    // 从记忆层检索相关信息
    // 从观察层获取最近行为
    // 从案例库匹配类似情况
  }
  
  private async generateHypotheses(question: string, recall: Recall) {
    // 使用Claude生成多个假设
    // 每个假设都有证据支持
    // 评估每个假设的置信度
  }
  
  private async reason(hypotheses: Hypothesis[], recall: Recall) {
    // 选择最可能的假设
    // 构建推理链："因为A，所以B，因此C"
    // 考虑反驳证据
  }
  
  private async formInsight(reasoning: Reasoning) {
    // 形成对当前情况的理解
    // 识别根本原因
    // 生成可操作建议
  }
}
```

**2. 使用Claude进行深度推理**

```typescript
const thinkingPrompt = `你是启程老师，一位有深度洞察力的导师。

## 当前情况
${context.situation}

## 你对这个学生的了解
${memory.longTermUnderstanding}

## 最近的互动
${memory.recentInteractions}

## 你的任务
不要直接给建议。先深度思考：

1. 回忆：这个学生过去的类似情况
2. 假设：形成3个可能的假设，每个假设都要有证据支持
3. 推理：选择最可能的假设，构建推理链
4. 洞察：形成对当前情况的深度理解

用以下格式输出你的思考过程：

## 回忆
[列出相关的过去经历]

## 假设
假设1：[假设内容]
  证据：[支持证据]
  置信度：[0-1]

假设2：...

## 推理
最可能的假设：[选择]
推理过程：[因为A，所以B，因此C]
反驳证据：[但是也有可能D]

## 洞察
理解：[对当前情况的理解]
根本原因：[根本原因]
可操作建议：[具体建议]`;
```

### Phase 3：建立记忆系统

**1. 记忆存储**

```sql
-- 长期记忆表
CREATE TABLE teacher_long_term_memory (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL,
  
  -- 对学生的理解（定期更新）
  core_strengths TEXT[],
  growth_areas TEXT[],
  working_style TEXT,
  learning_pattern TEXT,
  emotional_triggers TEXT[],
  
  -- 元数据
  last_updated TIMESTAMPTZ,
  confidence_level DECIMAL(3,2)  -- 对这个理解的信心
);

-- 短期记忆表
CREATE TABLE teacher_short_term_memory (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL,
  timestamp TIMESTAMPTZ,
  
  -- 互动记录
  context JSONB,
  student_state TEXT,
  teacher_response TEXT,
  outcome TEXT,
  
  -- 是否转化为长期记忆
  consolidated BOOLEAN DEFAULT false
);

-- 关键时刻表
CREATE TABLE teacher_key_moments (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL,
  timestamp TIMESTAMPTZ,
  
  -- 事件
  event_type TEXT,
  event_description TEXT,
  impact TEXT,
  teacher_insight TEXT
);
```

**2. 记忆巩固**

```typescript
class MemoryConsolidation {
  // 定期将短期记忆转化为长期理解
  async consolidate(studentId: string) {
    // 获取最近的短期记忆
    const recentMemories = await this.getRecentMemories(studentId);
    
    // 识别模式
    const patterns = this.identifyPatterns(recentMemories);
    
    // 更新长期理解
    await this.updateLongTermUnderstanding(studentId, patterns);
  }
  
  private identifyPatterns(memories: ShortTermMemory[]) {
    // 使用Claude分析记忆，提取模式
    // "这个学生总是在XX情况下YY"
    // "这个学生的成长轨迹是ZZ"
  }
}
```

### Phase 4：个性化表达

**1. 基于理解的表达**

```typescript
class PersonalizedExpression {
  async express(
    thinking: ThinkingProcess,
    memory: TeacherMemory,
    context: Context
  ): Promise<string> {
    const prompt = `你是启程老师。你刚刚完成了深度思考，现在要回复学生。

## 你的思考结果
${JSON.stringify(thinking, null, 2)}

## 你对这个学生的理解
${JSON.stringify(memory.longTermUnderstanding, null, 2)}

## 当前情况
${context.situation}

## 你的任务
基于你的深度理解，用自然、温暖、个性化的语言回复学生。

要求：
1. 体现你对这个学生的了解（不是泛泛的鼓励）
2. 基于你的推理结果（不是直接给答案）
3. 引导学生自己思考（不是替他做决定）
4. 语气要符合学生当前的情绪状态

直接输出你的回复（100-150字）：`;

    const response = await claude.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }]
    });
    
    return response.content[0].text;
  }
}
```

---

## 对比：模板化 vs 深度思考

### 场景：学生第3次修改被打回

**模板化回复（当前）**：
```
"这次的配色整体很统一，这点做得好。有一个地方可以试试——
第3张图的主色调偏冷，品牌手册用的暖色系。你用Canva的配色工具
吸一下手册里的主色，看看效果会不会更协调？"
```

**深度思考后的回复（新设计）**：
```
"我看到这是第3次修改了。我想先问你：你现在是不是有点烦躁？

我注意到一个细节：前两次你都是改完就提交，这次你改了之后，
停了2个小时才提交。这说明你其实也不太确定。

我猜问题不是你的技术能力——你的配色、排版都没问题。
问题可能是，你还没真正理解这个客户的审美偏好。

这个客户前两次打回你，都是说'感觉不对'，但没说具体哪里不对。
这种客户，你得换个方式：别一次给一个完整版，先给3个风格完全
不同的小样，让他选。他选了哪个，你就知道他要什么了。

要不要试试？"
```

**区别**：
- 模板化：只看当前问题，给技术建议
- 深度思考：看到学生的情绪变化，理解根本原因，给策略建议

---

## 实施优先级

### P0（核心）
1. 建立观察系统 - 捕获关键事件
2. 建立思考引擎 - 深度推理框架
3. 建立记忆系统 - 长期/短期记忆

### P1（增强）
4. 记忆巩固 - 自动提取模式
5. 主动洞察 - 预判问题

### P2（优化）
6. 多学生对比 - 识别共性问题
7. 企业偏好学习 - 理解不同企业的风格

---

**核心理念**：启程老师不是一个Prompt模板，而是一个有记忆、会思考、能洞察的智能体。
