# AI导师消息中转系统设计

## 核心定位

AI导师不只是对话助手，更是**学生和企业之间的中间人**：
- 审核和过滤所有消息
- 屏蔽联系方式，防止跳单
- 优化沟通语气，减少冲突
- 记录沟通历史，便于纠纷处理
- 分阶段开放直接联系

---

## 整体架构

```
学生 ←→ AI导师 ←→ 企业
      ↑
   所有沟通都经过导师
   导师审核、过滤、引导
```

### 核心规则

**前期（0-2次合作）**：完全隔离
- 学生和企业不能直接联系
- 所有消息都通过AI导师中转
- AI自动屏蔽联系方式（手机号、微信号、QQ等）
- 保护双方隐私，防止跳单

**后期（3次合作后）**：可选开放
- AI导师询问双方是否愿意直接联系
- 双方都同意后，AI推送联系方式
- 建立长期合作关系

---

## 功能设计

### 1. 消息中转和审核

#### 场景1：学生发消息给企业

```
学生输入：
"老师，我做好设计稿了，这是我的微信：abc123，加我发给你"

AI审核：
- 检测到联系方式：微信号 abc123
- 当前合作次数：第1次
- 判断：违规，需要屏蔽

AI处理后发给企业：
"老师，我做好设计稿了，已经上传到平台了"

AI同时提醒学生：
"嗨，我注意到你想留联系方式。
 为了保护双方，前2次合作需要通过平台沟通。
 你可以直接在平台上传设计稿，企业能看到。
 
 等你们合作2次后，如果双方都愿意，
 我可以帮你们交换联系方式 :)"
```

#### 场景2：企业发消息给学生

```
企业输入：
"小伙子做得不错，加我微信细聊：13800138000"

AI审核：
- 检测到联系方式：手机号 13800138000
- 当前合作次数：第1次
- 判断：违规，需要屏蔽

AI处理后发给学生：
"小伙子做得不错，有几个细节我们再聊聊"

AI同时提醒企业：
"您好，我注意到您想留联系方式。
 为了保护双方权益，前2次合作建议通过平台沟通。
 这样可以：
 1. 保留沟通记录，避免纠纷
 2. 平台提供担保，资金安全
 
 等你们合作2次后，如果双方都满意，
 我可以帮你们建立直接联系 :)"
```

#### 场景3：语气优化

```
企业输入：
"怎么还没做完？"

AI审核：
- 语气比较生硬
- 可能引起学生反感

AI优化后发给学生：
"嗨，进度怎么样了？企业那边比较着急，
 有什么困难吗？我可以帮忙协调。"

AI同时提醒企业：
"我已经帮您转达了，语气稍微调整了一下，
 这样学生更容易接受 :)
 
 沟通小技巧：
 - 先询问进度，而不是质问
 - 表达理解，提供帮助
 - 学生会更愿意配合"
```

---

### 2. 联系方式检测规则

#### 检测模式

```typescript
const contactPatterns = [
  // 手机号
  /1[3-9]\d{9}/g,
  /\d{3}[-\s]?\d{4}[-\s]?\d{4}/g,
  
  // 微信号
  /微信[：:]\s*[\w-]+/gi,
  /wx[：:]\s*[\w-]+/gi,
  /vx[：:]\s*[\w-]+/gi,
  /加我微信/gi,
  /加微信/gi,
  
  // QQ号
  /QQ[：:]\s*\d{5,}/gi,
  /[qQ]{2}[：:]\s*\d{5,}/gi,
  
  // 邮箱
  /[\w.-]+@[\w.-]+\.\w+/g,
  
  // 其他平台
  /钉钉/gi,
  /飞书/gi,
  /企业微信/gi,
  
  // 变体（用户可能故意规避）
  /威信/gi,  // 微信的谐音
  /薇信/gi,
  /vvx/gi,
  /扣扣/gi,  // QQ的谐音
  /抠抠/gi,
  
  // 中文数字（如：一三八）
  /[一二三四五六七八九零]{11}/g,
  
  // 空格分隔（如：1 3 8 0 0 1 3 8 0 0 0）
  /\d\s+\d\s+\d/g,
];
```

#### 屏蔽策略

```typescript
function filterMessage(message: string, collaborationCount: number): string {
  // 前2次合作：严格屏蔽
  if (collaborationCount < 2) {
    let filtered = message;
    contactPatterns.forEach(pattern => {
      filtered = filtered.replace(pattern, '[已屏蔽]');
    });
    return filtered;
  }
  
  // 3次及以上：不屏蔽
  return message;
}
```

#### 变体检测

用户可能尝试规避检测：

```
学生: "我的手机是 一三八 零零 一三八 零零零"
学生: "加我V：a b c 1 2 3"
学生: "搜索我的名字：张三三三"
学生: "我叫张三，你懂的"

AI需要：
- 检测中文数字
- 检测空格分隔
- 检测暗示性语言
- 提醒用户不要规避
```

---

### 3. 合作次数追踪

#### 数据库表

```sql
CREATE TABLE collaboration_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  company_id UUID NOT NULL REFERENCES users(id),
  task_id UUID NOT NULL REFERENCES tasks(id),
  
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  
  student_rating INTEGER,  -- 企业给学生的评分
  company_rating INTEGER,  -- 学生给企业的评分
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_collab_student_company ON collaboration_history(student_id, company_id);
CREATE INDEX idx_collab_completed ON collaboration_history(completed_at);
```

#### 查询合作次数

```typescript
async function getCollaborationCount(studentId: string, companyId: string): Promise<number> {
  const sql = `
    SELECT COUNT(*) as count
    FROM collaboration_history
    WHERE student_id = $1 AND company_id = $2
      AND completed_at IS NOT NULL
  `;
  const result = await queryOne(sql, [studentId, companyId]);
  return result.count;
}
```

---

### 4. 联系方式交换

#### 第3次合作完成后

**AI自动发送给学生**：

```
恭喜！你和【XX公司】的第3次合作圆满完成 🎉

我注意到你们合作得很愉快：
- 第1次任务：评分 4.5/5.0
- 第2次任务：评分 4.8/5.0
- 第3次任务：评分 5.0/5.0

你们是否愿意建立直接联系？
这样以后可以更方便地沟通。

如果你同意，我会询问企业，
双方都同意后，我会推送联系方式。

【同意】 【暂不需要】
```

**AI自动发送给企业**：

```
恭喜！您和【张三】的第3次合作圆满完成 🎉

我注意到你们合作得很愉快：
- 第1次任务：评分 4.5/5.0
- 第2次任务：评分 4.8/5.0  
- 第3次任务：评分 5.0/5.0

您是否愿意和张三建立直接联系？
这样以后可以更方便地沟通。

如果您同意，我会询问学生，
双方都同意后，我会推送联系方式。

【同意】 【暂不需要】
```

#### 双方都同意后

**AI发送给学生**：

```
好消息！【XX公司】也同意建立直接联系 🎉

企业联系方式：
- 联系人：李经理
- 手机：138****8000（点击查看完整号码）
- 微信：abc123（点击复制）
- 邮箱：li@company.com

温馨提示：
- 以后你们可以直接沟通了
- 但建议重要事项还是在平台留记录
- 这样有问题时平台可以帮忙协调
```

**AI发送给企业**：

```
好消息！【张三】也同意建立直接联系 🎉

学生联系方式：
- 姓名：张三
- 手机：139****9000（点击查看完整号码）
- 微信：xyz789（点击复制）
- 邮箱：zhang@student.com

温馨提示：
- 以后你们可以直接沟通了
- 但建议重要事项还是在平台留记录
- 这样有问题时平台可以帮忙协调
```

---

## 技术实现

### 1. 消息中转服务

**文件位置**：`src/services/messageRelayService.ts`

```typescript
class MessageRelayService {
  /**
   * 发送消息（自动中转）
   */
  async sendMessage(
    fromUserId: string,
    toUserId: string,
    message: string,
    taskId: string
  ): Promise<void> {
    // 1. 查询合作次数
    const collabCount = await this.getCollaborationCount(fromUserId, toUserId);
    
    // 2. 检测和屏蔽联系方式
    const filtered = this.filterContactInfo(message, collabCount);
    
    // 3. 如果屏蔽了内容，提醒发送者
    if (filtered !== message) {
      await this.notifySender(fromUserId, '检测到联系方式已屏蔽');
    }
    
    // 4. 优化语气（可选）
    const optimized = await this.optimizeTone(filtered, fromUserId, toUserId);
    
    // 5. 保存消息记录
    await this.saveMessage(fromUserId, toUserId, message, optimized, taskId);
    
    // 6. 发送给接收者
    await this.deliverMessage(toUserId, optimized);
  }
  
  /**
   * 检测和屏蔽联系方式
   */
  private filterContactInfo(message: string, collabCount: number): string {
    // 3次及以上合作：不屏蔽
    if (collabCount >= 2) {
      return message;
    }
    
    // 前2次合作：严格屏蔽
    let filtered = message;
    contactPatterns.forEach(pattern => {
      filtered = filtered.replace(pattern, '[已屏蔽]');
    });
    
    return filtered;
  }
  
  /**
   * 优化语气（调用AI）
   */
  private async optimizeTone(
    message: string,
    fromUserId: string,
    toUserId: string
  ): Promise<string> {
    // 获取发送者角色
    const fromUser = await this.getUser(fromUserId);
    const toUser = await this.getUser(toUserId);
    
    // 只优化企业发给学生的消息
    if (fromUser.role !== 'company') {
      return message;
    }
    
    // 调用AI分析语气
    const prompt = `
你是一个沟通专家。请分析以下企业发给学生的消息，判断语气是否合适。

消息内容：
"${message}"

如果语气生硬、可能引起反感，请优化为更友好的表达。
如果语气已经很好，直接返回原消息。

只返回优化后的消息，不要解释。
`;
    
    const optimized = await this.callAI(prompt);
    
    // 如果优化了，提醒企业
    if (optimized !== message) {
      await this.notifySender(
        fromUserId,
        '我帮您稍微调整了一下语气，这样学生更容易接受 :)'
      );
    }
    
    return optimized;
  }
  
  /**
   * 保存消息记录
   */
  private async saveMessage(
    fromUserId: string,
    toUserId: string,
    originalMessage: string,
    filteredMessage: string,
    taskId: string
  ): Promise<void> {
    const sql = `
      INSERT INTO task_messages (
        task_id, from_user_id, to_user_id,
        original_message, filtered_message,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `;
    
    await query(sql, [
      taskId,
      fromUserId,
      toUserId,
      originalMessage,
      filteredMessage,
    ]);
  }
}
```

---

### 2. 联系方式交换服务

**文件位置**：`src/services/contactExchangeService.ts`

```typescript
class ContactExchangeService {
  /**
   * 任务完成后检查是否可以交换联系方式
   */
  async checkAndPromptExchange(
    studentId: string,
    companyId: string,
    taskId: string
  ): Promise<void> {
    // 查询合作次数
    const count = await this.getCollaborationCount(studentId, companyId);
    
    // 第3次合作完成
    if (count === 2) {
      await this.promptBothSides(studentId, companyId, taskId);
    }
  }
  
  /**
   * 询问双方是否愿意交换联系方式
   */
  private async promptBothSides(
    studentId: string,
    companyId: string,
    taskId: string
  ): Promise<void> {
    // 获取历史评分
    const history = await this.getCollaborationHistory(studentId, companyId);
    
    // 生成消息
    const studentMessage = this.generatePromptMessage('student', history);
    const companyMessage = this.generatePromptMessage('company', history);
    
    // 发送给学生
    await this.sendPrompt(studentId, studentMessage, taskId);
    
    // 发送给企业
    await this.sendPrompt(companyId, companyMessage, taskId);
    
    // 记录询问状态
    await this.recordPromptStatus(studentId, companyId, taskId);
  }
  
  /**
   * 双方都同意后交换联系方式
   */
  async exchangeContacts(
    studentId: string,
    companyId: string
  ): Promise<void> {
    // 获取双方联系方式
    const studentContact = await this.getContact(studentId);
    const companyContact = await this.getContact(companyId);
    
    // 推送给对方
    await this.pushContact(studentId, companyContact, 'company');
    await this.pushContact(companyId, studentContact, 'student');
    
    // 记录已交换
    await this.recordExchange(studentId, companyId);
  }
  
  /**
   * 生成询问消息
   */
  private generatePromptMessage(
    role: 'student' | 'company',
    history: CollaborationHistory[]
  ): string {
    const ratings = history.map((h, i) => 
      `- 第${i + 1}次任务：评分 ${h.rating}/5.0`
    ).join('\n');
    
    if (role === 'student') {
      return `
恭喜！你和【${history[0].companyName}】的第3次合作圆满完成 🎉

我注意到你们合作得很愉快：
${ratings}

你们是否愿意建立直接联系？
这样以后可以更方便地沟通。

如果你同意，我会询问企业，
双方都同意后，我会推送联系方式。

【同意】 【暂不需要】
      `.trim();
    } else {
      return `
恭喜！您和【${history[0].studentName}】的第3次合作圆满完成 🎉

我注意到你们合作得很愉快：
${ratings}

您是否愿意和${history[0].studentName}建立直接联系？
这样以后可以更方便地沟通。

如果您同意，我会询问学生，
双方都同意后，我会推送联系方式。

【同意】 【暂不需要】
      `.trim();
    }
  }
}
```

---

### 3. 数据库表设计

#### task_messages（任务消息表）

```sql
CREATE TABLE task_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),
  from_user_id UUID NOT NULL REFERENCES users(id),
  to_user_id UUID NOT NULL REFERENCES users(id),
  
  original_message TEXT NOT NULL,  -- 原始消息
  filtered_message TEXT NOT NULL,  -- 过滤后的消息
  
  is_filtered BOOLEAN DEFAULT false,  -- 是否被过滤
  is_optimized BOOLEAN DEFAULT false,  -- 是否被优化
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_task_msg_task ON task_messages(task_id);
CREATE INDEX idx_task_msg_from ON task_messages(from_user_id);
CREATE INDEX idx_task_msg_to ON task_messages(to_user_id);
```

#### contact_exchange_requests（联系方式交换请求表）

```sql
CREATE TABLE contact_exchange_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  company_id UUID NOT NULL REFERENCES users(id),
  task_id UUID NOT NULL REFERENCES tasks(id),
  
  student_agreed BOOLEAN DEFAULT false,
  company_agreed BOOLEAN DEFAULT false,
  
  exchanged BOOLEAN DEFAULT false,
  exchanged_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_exchange_student_company ON contact_exchange_requests(student_id, company_id);
```

---

## 特殊情况处理

### 1. 用户试图绕过屏蔽

```
学生: "我的手机是 一三八 零零 一三八 零零零"
学生: "加我V：a b c 1 2 3"
学生: "搜索我的名字：张三三三"

AI检测到规避行为：
"嗨，我注意到你可能在尝试留联系方式。

为了保护双方权益，前2次合作建议通过平台沟通。
这样可以：
1. 保留沟通记录，避免纠纷
2. 平台提供担保，资金安全

等你们合作2次后，我会主动询问是否交换联系方式。

请理解，这是为了保护你和企业双方的利益 :)"
```

### 2. 紧急情况例外

```
学生: "老师，我手机丢了，能把企业联系方式给我吗？紧急！"

AI判断：
- 查看历史记录
- 如果确实在合作中
- 可以临时提供联系方式
- 但需要记录原因

AI回复：
"我理解你的情况。考虑到你们正在合作中，
 我可以临时提供企业联系方式。

企业联系人：李经理
手机：138****8000（点击查看）

请注意：
- 这是紧急情况的例外处理
- 建议尽快恢复手机，继续在平台沟通
- 重要事项还是要在平台留记录"
```

### 3. 平台外联系的监控

```
双方交换联系方式后：

AI定期检查：
- 是否还在平台上发布/接任务
- 是否有跳单行为（长期不在平台交易）
- 如果发现异常，提醒或限制

异常提醒：
"嗨，我注意到你和【XX公司】已经3个月没有在平台上合作了。

如果你们还在合作，建议：
1. 继续在平台发布任务，保障双方权益
2. 平台提供担保，避免纠纷
3. 积累信用，获得更多机会

如果有任何问题，随时找我 :)"
```

---

## 消息流转逻辑

### 前期（0-2次合作）：严格中转

```
学生 → AI导师 → 企业
       ↓
    1. 检测联系方式
    2. 屏蔽违规内容
    3. 优化语气
    4. 记录沟通
    5. 转发给对方
```

### 后期（3次+合作）：可选直连

```
学生 ←→ 企业（直接联系）
  ↓       ↓
  AI导师（监控）
  ↓
1. 检测异常（长期不沟通）
2. 提醒重要节点
3. 提供协调服务
```

---

## 成功指标

### 业务指标

- **跳单率**：下降80%（从10% → 2%）
- **纠纷率**：下降50%（从5% → 2.5%）
- **平台留存率**：提升30%（从60% → 78%）
- **沟通效率**：提升20%（减少误解和冲突）

### 用户满意度

- **学生满意度**：4.0/5.0 → 4.5/5.0
- **企业满意度**：3.8/5.0 → 4.3/5.0
- **平台信任度**：提升40%

---

## 实施优先级

### P0（第一阶段）
1. 消息中转基础功能
2. 联系方式检测和屏蔽
3. 合作次数追踪

### P1（第二阶段）
4. 语气优化
5. 联系方式交换
6. 异常监控

### P2（第三阶段）
7. 变体检测（中文数字、空格分隔）
8. 紧急情况处理
9. 平台外联系监控

---

## 总结

### 核心价值

1. **保护平台利益**
   - 防止跳单
   - 保留沟通记录
   - 提供担保服务

2. **保护用户权益**
   - 避免纠纷
   - 记录证据
   - 公正调解

3. **提升沟通效率**
   - 优化语气
   - 减少冲突
   - 促进合作

### 一句话总结

AI导师作为中间人，不只是传话筒，更是沟通的优化器和平台利益的守护者。

---

**文档版本**: v1.0  
**完成日期**: 2026-05-10  
**负责团队**: 后端团队 + AI团队
