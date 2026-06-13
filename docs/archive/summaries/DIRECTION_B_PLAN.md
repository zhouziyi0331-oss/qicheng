# AI导师动态化改造计划（方向B）

**目标**: 让AI导师的每句话都有真实数据支撑  
**预计时间**: 2-3天  
**核心原则**: 查得到就引用，查不到就不编造

---

## 📊 表结构分析

### 关键表

**1. mentor_growth_observations** - 成长观察记录
```
id, student_id, task_id, observation_type, observation_content,
context (jsonb), skills_demonstrated (jsonb), is_significant, tags
```
**用途**: T-02查真实卡点案例、T-05对比成长数据

**2. mentor_messages** - 对话消息
```
id, session_id, role (student/mentor), content, 
detected_signals (jsonb), created_at
```
**用途**: T-04查真实对话历史

**3. mentor_sessions** - 对话会话
```
id, mentor_id, student_id, task_id, status, 
context_data (jsonb), message_count
```
**用途**: 关联消息和任务

---

## 🎯 三大改造任务

### T-02: 卡住响应 - 引用真实案例

**触发场景**: 学生说"我卡住了""不会做""做不出来"

**当前问题**: 可能使用固定模板"别急，几乎所有人在这一步都会卡"

**改造目标**: 
1. 检测到卡住关键词
2. 从`mentor_growth_observations`查真实同类卡点
3. 传入AI-06，让AI引用这个真实案例
4. 如果查不到，只给引导，不编造案例

**实现位置**: `mentorCoreService.ts` 或创建新的 `mentorContextEnhancer.ts`

**SQL查询**:
```sql
-- 查询同类卡点案例
SELECT 
  observation_content,
  context,
  skills_demonstrated
FROM mentor_growth_observations
WHERE observation_type = 'stuck'
  AND task_id IN (
    SELECT id FROM orders 
    WHERE project_id IN (
      SELECT id FROM projects WHERE track = :currentTrack
    )
  )
  AND student_id != :currentStudentId  -- 不查自己
ORDER BY RANDOM()
LIMIT 1;
```

**传入AI的context**:
```json
{
  "has_real_case": true,
  "similar_case": {
    "content": "一个Lv.3的学生在配色上卡了2天...",
    "context": {...}
  }
}
```

**AI Prompt约束**:
```
如果context中有similar_case，必须在第一句话中引用这个真实案例。
如果没有similar_case，不要编造"上次有个同学"，直接给引导性问题。
```

---

### T-04: 轻推消息 - 引用真实对话

**触发场景**: 学生接受任务后3小时无动作

**当前问题**: 可能使用模板"你上次说XX"但XX是编的

**改造目标**:
1. 定时任务检测无动作学生
2. 从`mentor_messages`查该任务最近一条学生消息
3. 轻推文案引用这条真实消息
4. 如果没有历史消息，用通用提醒

**实现位置**: `mentorAutoTriggerService.ts` 或 `mentorNudgeService.ts`

**SQL查询**:
```sql
-- 查询该任务最近一条学生消息
SELECT content, created_at
FROM mentor_messages mm
JOIN mentor_sessions ms ON mm.session_id = ms.id
WHERE ms.task_id = :taskId
  AND mm.role = 'student'
ORDER BY mm.created_at DESC
LIMIT 1;
```

**轻推文案生成**:
```typescript
// 有历史消息
if (lastMessage) {
  const nudge = `你${timeSince(lastMessage.created_at)}说"${lastMessage.content}"——做出来了吗？还是遇到什么困难了？`;
}

// 无历史消息（降级）
else {
  const nudge = `这个任务还有${hoursLeft}小时截止。如果需要帮助，告诉我你现在在哪一步。`;
}
```

---

### T-05: 里程碑见证 - 对比真实成长

**触发场景**: 学生完成第1单/第5单/升级

**当前问题**: "入驻时你说不会配色"这句话的来源不明

**改造目标**:
1. 订单完成触发
2. 查入驻时的`user_ability_profiles`（initial gaps）
3. 查本单的`mentor_growth_observations`（skills demonstrated）
4. 对比找出闭合的gap
5. 传入AI-04生成见证消息

**实现位置**: 创建 `mentorMilestoneService.ts`

**SQL查询**:
```sql
-- 1. 查入驻时画像的gap
SELECT 
  gap_to_fill,
  initial_skill_level
FROM user_ability_profiles
WHERE user_id = :userId 
  AND is_current = false
ORDER BY created_at ASC
LIMIT 1;

-- 2. 查本单成长观察
SELECT 
  skills_demonstrated,
  observation_content,
  is_significant
FROM mentor_growth_observations
WHERE task_id = :orderId
  AND observation_type IN ('skill_shown', 'breakthrough');

-- 3. 查客户评价（额外证据）
SELECT rating, comment
FROM orders
WHERE id = :orderId;
```

**对比逻辑**:
```typescript
// 找出闭合的gap
const closedGaps = initialGaps.filter(gap => 
  currentSkills.some(skill => 
    skill.toLowerCase().includes(gap.toLowerCase())
  )
);

// 传入AI-04
const context = {
  initial_gaps: initialGaps,
  current_skills: currentSkills,
  gaps_closed: closedGaps,
  client_rating: clientRating,
  client_comment: clientComment,
  order_count: orderCount
};
```

**AI Prompt约束**:
```
生成见证消息时：
1. 如果gaps_closed有数据，必须对比具体的gap和skill
2. 如果client_comment提到了某个细节，必须引用
3. 禁止使用"恭喜""加油""很棒"等空洞词
4. 80字以内，口语化，直接

示例：
"入驻时你的gap_to_fill是['不会配色']，这单skills_demonstrated有['独立完成配色方案']，
客户说'配色很舒服'。这个gap闭合了。"
```

---

## 🔧 实施步骤

### 第1步: 创建上下文增强服务（2小时）

**文件**: `backend/src/services/mentorContextEnhancer.ts`

**功能**:
- `getRealStuckCase(studentId, taskId)` - 查真实卡点案例
- `getLastStudentMessage(taskId)` - 查最近学生消息
- `getGrowthComparison(studentId, orderId)` - 对比成长数据

```typescript
class MentorContextEnhancer {
  /**
   * 获取真实的同类卡点案例（T-02）
   */
  async getRealStuckCase(studentId: string, taskId: string) {
    const task = await getTaskInfo(taskId);
    
    const cases = await query(`
      SELECT observation_content, context
      FROM mentor_growth_observations
      WHERE observation_type = 'stuck'
        AND task_id IN (
          SELECT id FROM orders 
          WHERE project_id IN (
            SELECT id FROM projects WHERE track = $1
          )
        )
        AND student_id != $2
      ORDER BY RANDOM()
      LIMIT 1
    `, [task.track, studentId]);
    
    return cases[0] || null;
  }

  /**
   * 获取最近一条学生消息（T-04）
   */
  async getLastStudentMessage(taskId: string) {
    const messages = await query(`
      SELECT mm.content, mm.created_at
      FROM mentor_messages mm
      JOIN mentor_sessions ms ON mm.session_id = ms.id
      WHERE ms.task_id = $1 AND mm.role = 'student'
      ORDER BY mm.created_at DESC
      LIMIT 1
    `, [taskId]);
    
    return messages[0] || null;
  }

  /**
   * 获取成长对比数据（T-05）
   */
  async getGrowthComparison(studentId: string, orderId: string) {
    // 1. 入驻时gap
    const initialGaps = await query(`
      SELECT gap_to_fill
      FROM user_ability_profiles
      WHERE user_id = $1 AND is_current = false
      ORDER BY created_at ASC LIMIT 1
    `, [studentId]);

    // 2. 本单skills
    const currentSkills = await query(`
      SELECT skills_demonstrated, observation_content
      FROM mentor_growth_observations
      WHERE task_id = $1
    `, [orderId]);

    // 3. 对比找出闭合的gap
    const gaps = initialGaps[0]?.gap_to_fill || [];
    const skills = currentSkills.flatMap(s => s.skills_demonstrated || []);
    
    const closedGaps = gaps.filter(gap =>
      skills.some(skill => skill.toLowerCase().includes(gap.toLowerCase()))
    );

    return {
      initial_gaps: gaps,
      current_skills: skills,
      gaps_closed: closedGaps
    };
  }
}
```

---

### 第2步: 修改mentorCoreService集成T-02（2小时）

**位置**: `backend/src/services/mentorCoreService.ts`

**修改点**:
```typescript
// 在生成回复前，增强context
async generateResponse(studentId, taskId, message) {
  // 检测是否卡住
  const isStuck = this.detectStuckSignal(message);
  
  let enhancedContext = {};
  
  if (isStuck) {
    // 查真实案例
    const realCase = await mentorContextEnhancer.getRealStuckCase(studentId, taskId);
    
    if (realCase) {
      enhancedContext.has_real_case = true;
      enhancedContext.similar_case = realCase;
    } else {
      enhancedContext.has_real_case = false;
    }
  }
  
  // 调用AI-06，传入增强的context
  const response = await this.callAI06({
    studentMessage: message,
    context: enhancedContext
  });
  
  // 调用AI-07审核
  const review = await principleReviewService.reviewMentorResponse(
    response,
    { 
      studentLevel: student.level,
      hasRealCaseData: enhancedContext.has_real_case 
    }
  );
  
  if (!review.pass) {
    // 重新生成
    return this.regenerateWithConstraint(review.reason, enhancedContext);
  }
  
  return response;
}
```

---

### 第3步: 修改mentorAutoTriggerService集成T-04（2小时）

**位置**: `backend/src/services/mentorAutoTriggerService.ts`

**修改点**:
```typescript
// 生成轻推消息时，引用真实对话
async generateNudgeMessage(studentId, taskId) {
  // 查最近一条学生消息
  const lastMessage = await mentorContextEnhancer.getLastStudentMessage(taskId);
  
  let nudgePrompt = '';
  
  if (lastMessage) {
    const timeSince = this.calculateTimeSince(lastMessage.created_at);
    nudgePrompt = `学生${timeSince}说："${lastMessage.content}"。现在已经过了3小时，生成一条轻推消息，问问做出来了吗，还是遇到困难了？`;
  } else {
    const hoursLeft = await this.getDeadlineHours(taskId);
    nudgePrompt = `学生接受任务后没有发过消息。还有${hoursLeft}小时截止。生成一条提醒消息，问问现在在哪一步。`;
  }
  
  // 调用AI生成
  const nudge = await this.callAI(nudgePrompt);
  
  // 调用AI-07审核
  const review = await principleReviewService.reviewMentorResponse(nudge, {
    studentLevel: student.level,
    hasRealCaseData: !!lastMessage
  });
  
  return review.pass ? nudge : await this.regenerate(review.reason);
}
```

---

### 第4步: 创建mentorMilestoneService实现T-05（3小时）

**文件**: `backend/src/services/mentorMilestoneService.ts`

```typescript
class MentorMilestoneService {
  /**
   * 订单完成时，生成里程碑见证消息
   */
  async generateMilestoneMessage(studentId: string, orderId: string) {
    // 1. 获取成长对比数据
    const comparison = await mentorContextEnhancer.getGrowthComparison(studentId, orderId);
    
    // 2. 获取订单信息
    const order = await this.getOrderInfo(orderId);
    
    // 3. 检查是否有gap闭合
    if (comparison.gaps_closed.length === 0) {
      // 没有gap闭合，只夸奖本单表现
      return this.generateSimplePraise(order, comparison.current_skills);
    }
    
    // 4. 有gap闭合，生成对比见证
    const context = {
      initial_gaps: comparison.initial_gaps,
      current_skills: comparison.current_skills,
      gaps_closed: comparison.gaps_closed,
      client_rating: order.client_rating,
      client_comment: order.client_comment,
      order_count: await this.getOrderCount(studentId)
    };
    
    // 5. 调用AI-04生成见证消息
    const message = await this.callAI04({
      type: 'milestone_witness',
      context,
      constraints: [
        '必须对比initial_gaps和current_skills的具体内容',
        '必须引用client_comment中的具体细节',
        '禁止使用空洞鼓励词',
        '80字以内'
      ]
    });
    
    // 6. 审核
    const review = await principleReviewService.reviewMentorResponse(message, {
      studentLevel: order.student_level,
      hasRealCaseData: true
    });
    
    return review.pass ? message : await this.regenerate(review.reason, context);
  }
}
```

---

### 第5步: 更新AI Prompt模板（1小时）

**位置**: `backend/src/prompts/mentorPrompts.ts`

**T-02 Prompt约束**:
```typescript
const STUCK_RESPONSE_PROMPT = `
学生说：{student_message}

上下文：
{context.has_real_case ? '找到一个真实案例：' + context.similar_case : '没有找到同类案例'}

生成回复规则：
1. 如果有真实案例，第一句话必须引用这个案例
2. 如果没有真实案例，不要编造"上次有个同学"
3. 只给线索或引导性问题，不给完整答案
4. 不使用"加油""你真棒"等空洞鼓励
`;
```

**T-04 Prompt约束**:
```typescript
const NUDGE_PROMPT = `
{lastMessage ? 
  `学生${timeSince}说："${lastMessage.content}"。生成一条轻推消息，引用这句话，问问进展。` :
  `学生接受任务后没有发消息。还有${hoursLeft}小时截止。生成一条提醒，问问现在在哪一步。`
}

规则：
1. 必须引用学生的真实消息（如果有）
2. 不编造学生没说过的话
3. 语气轻松，不制造焦虑
`;
```

**T-05 Prompt约束**:
```typescript
const MILESTONE_PROMPT = `
学生完成了第{order_count}单。

入驻时的gap: {initial_gaps}
本单展示的skill: {current_skills}
已闭合的gap: {gaps_closed}
客户评价: {client_comment}

生成80字以内的见证消息：
1. 对比initial_gaps和current_skills的具体内容
2. 如果gaps_closed有数据，说明哪个gap闭合了
3. 引用client_comment的具体细节
4. 禁止"恭喜""加油""很棒"
5. 口语化，直接
`;
```

---

### 第6步: 端到端测试（2小时）

**测试场景1: T-02卡住响应**
```
1. 学生发消息"我不会配色"
2. 后端查询同类卡点案例
3. AI引用真实案例生成回复
4. AI-07审核通过
5. 学生收到回复，第一句话引用了真实案例
```

**测试场景2: T-04轻推消息**
```
1. 学生接受任务后3小时无动作
2. 定时任务触发
3. 查询学生最近消息"我先试试用Canva"
4. 生成轻推"你3小时前说先试试用Canva——做出来了吗？"
5. AI-07审核通过
6. 发送轻推消息
```

**测试场景3: T-05里程碑见证**
```
1. 学生完成第1单
2. 查入驻时gap: ['不会配色']
3. 查本单skill: ['独立完成配色方案']
4. 对比发现gap闭合
5. 生成见证消息："入驻时你说不会配色，这单客户说'配色很舒服'。这个gap闭合了。"
6. AI-07审核通过
7. 显示给学生
```

---

## 📋 开发清单

### Day 1: 基础设施（6小时）
- [x] 创建 `mentorContextEnhancer.ts`
- [ ] 实现 `getRealStuckCase()`
- [ ] 实现 `getLastStudentMessage()`
- [ ] 实现 `getGrowthComparison()`
- [ ] 编写单元测试

### Day 2: 集成改造（6小时）
- [ ] 修改 `mentorCoreService.ts` 集成T-02
- [ ] 修改 `mentorAutoTriggerService.ts` 集成T-04
- [ ] 创建 `mentorMilestoneService.ts` 实现T-05
- [ ] 更新AI Prompt模板

### Day 3: 测试验证（6小时）
- [ ] T-02端到端测试
- [ ] T-04端到端测试
- [ ] T-05端到端测试
- [ ] 修复发现的问题
- [ ] 更新文档

---

## 🚫 禁止模式

### 禁止模式1: 编造案例
```typescript
// ❌ 错误
const response = "上次有个Lv.3的同学也卡了"; // 编造的

// ✅ 正确
const realCase = await getRealStuckCase(studentId, taskId);
if (realCase) {
  const response = `之前${realCase.content}`;
} else {
  const response = "你可以试试先把任务拆成两步"; // 不编造
}
```

### 禁止模式2: 编造学生消息
```typescript
// ❌ 错误
const nudge = "你上次说先写第一句话"; // 学生没说过

// ✅ 正确
const lastMessage = await getLastStudentMessage(taskId);
const nudge = lastMessage 
  ? `你${timeSince}说"${lastMessage.content}"` 
  : "还有X小时截止"; // 没消息就不引用
```

### 禁止模式3: 编造成长对比
```typescript
// ❌ 错误
const message = "入驻时你说不会配色"; // 不知道来源

// ✅ 正确
const comparison = await getGrowthComparison(studentId, orderId);
if (comparison.gaps_closed.includes('配色')) {
  const message = `入驻时gap是${comparison.initial_gaps}，现在${comparison.current_skills}`;
}
```

---

## ✅ 验证标准

改造完成后，必须满足：

1. **有据可查**: 每句引用都能追溯到数据库记录
2. **查不到不编**: 查不到真实数据时，不编造案例
3. **通过AI-07**: 所有回复都通过初心审核
4. **可重现**: 同样的数据，生成同样的回复
5. **可追溯**: ai_call_logs记录所有AI调用和审核结果

---

## 🎯 下一步

**现在立即开始第1步**（创建mentorContextEnhancer.ts）

告诉我"开始"，我立即创建服务文件！
