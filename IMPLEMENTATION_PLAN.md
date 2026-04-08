# 启程OPC孵化平台 - 技术实现计划

## 当前状态评估

### 已完成功能（约40%）
✅ 基础架构搭建
✅ 注册登录系统
✅ OPC测评问卷（需优化）
✅ 任务大厅UI
✅ AI导师对话框架
✅ 个人中心UI
✅ 故事墙UI

### 部分完成（约30%）
⚠️ 任务匹配（有API无真实逻辑）
⚠️ 能力更新（有接口无算法）
⚠️ 财务系统（UI完成，逻辑缺失）
⚠️ 提交审核（流程不完整）

### 严重缺失（约30%）
❌ 角色选择流程
❌ 跳级挑战测试
❌ AI任务拆解
❌ AI导师五大场景
❌ 信任加速器
❌ 六维能力动态更新
❌ OPC深度报告
❌ 组队功能
❌ 平台管理后台
❌ 财务托管真实逻辑
❌ 沟通中转系统

---

## 重构计划

### 第一阶段：修复核心流程（1-2周）

#### 1.1 角色选择与新手引导
**目标：** 用户首次登录必须选择角色，且不可更改

**小程序端：**
```
pages/role-select/index.tsx
- 创建角色选择页面
- 学生/企业两个选项
- 选择后不可更改
- 保存到数据库user_type字段
```

**后端：**
```
routes/auth/controller.ts
- 注册时必须传递userType
- 登录时返回userType
- 添加userType验证中间件
```

**数据库：**
```sql
ALTER TABLE users ADD COLUMN user_type VARCHAR(20) NOT NULL;
ALTER TABLE users ADD CONSTRAINT check_user_type CHECK (user_type IN ('student', 'company'));
```

---

#### 1.2 优化OPC测评系统
**目标：** 20-30题深度测评，生成准确的能力画像

**小程序端：**
```
pages/opc-test/index.tsx
- 扩展到25题（覆盖六维能力）
- 题型：单选、多选、量表（1-5分）
- 进度条显示
- 答题时间记录
```

**后端：**
```
routes/assessment/controller.ts
- 接收答题数据
- 调用AI分析引擎
- 计算六维能力评分
- 生成个性化标签
- 推荐起始等级
```

**AI逻辑：**
```typescript
// services/ai/assessmentAnalyzer.ts
async function analyzeAssessment(answers: Answer[]) {
  const prompt = `
  分析以下OPC能力测评结果：
  ${JSON.stringify(answers)}
  
  请输出：
  1. 六维能力评分（0-100分）：
     - learning: 学习力
     - execution: 执行力
     - communication: 沟通力
     - innovation: 创新力
     - collaboration: 协作力
     - resilience: 抗压力
  2. 个性化标签（如"AI实践探索者"）
  3. 推荐起始等级（1-7）
  4. 发展建议
  
  以JSON格式返回。
  `;
  
  const result = await claudeAPI.analyze(prompt);
  return result;
}
```

---

#### 1.3 跳级挑战测试
**目标：** 有经验的学生可以跳级

**小程序端：**
```
pages/level-challenge/index.tsx
- 专业技能测试题
- 实际案例分析
- 作品提交
```

**后端：**
```
routes/assessment/challengeController.ts
- 接收挑战测试数据
- AI评估能力水平
- 判断是否通过
- 更新学生等级
```

**AI逻辑：**
```typescript
async function evaluateChallenge(submission: ChallengeSubmission) {
  const prompt = `
  评估学生的跳级挑战：
  目标等级：${submission.targetLevel}
  提交内容：${submission.content}
  
  请判断：
  1. 是否达到目标等级要求
  2. 具体评分（0-100）
  3. 优势和不足
  4. 建议等级
  
  以JSON格式返回。
  `;
  
  const result = await claudeAPI.evaluate(prompt);
  return result;
}
```

---

#### 1.4 AI智能匹配系统（重构）
**目标：** 真正的智能匹配，不是随机推荐

**后端：**
```typescript
// services/matching/intelligentMatcher.ts
async function matchTaskToStudents(task: Task) {
  // 1. 分析任务需求
  const taskAnalysis = await analyzeTaskRequirements(task);
  
  // 2. 获取符合等级的学生池
  const candidateStudents = await getEligibleStudents(task.required_level);
  
  // 3. 计算每个学生的匹配度
  const matches = await Promise.all(
    candidateStudents.map(async (student) => {
      const score = await calculateMatchScore(task, student, taskAnalysis);
      return { student, score, reason: score.reason };
    })
  );
  
  // 4. 排序并选出Top 2-3
  const topMatches = matches
    .sort((a, b) => b.score.total - a.score.total)
    .slice(0, 3);
  
  return topMatches;
}

async function calculateMatchScore(task, student, taskAnalysis) {
  // 能力匹配度 40%
  const abilityScore = compareAbilities(taskAnalysis.requiredAbilities, student.opc_scores);
  
  // 历史表现 30%
  const historyScore = evaluateHistory(student.task_history);
  
  // 兴趣标签 20%
  const interestScore = matchInterests(taskAnalysis.tags, student.opc_tag);
  
  // 时间可用性 10%
  const availabilityScore = checkAvailability(student.current_tasks);
  
  const total = 
    abilityScore * 0.4 +
    historyScore * 0.3 +
    interestScore * 0.2 +
    availabilityScore * 0.1;
  
  return {
    total,
    breakdown: { abilityScore, historyScore, interestScore, availabilityScore },
    reason: generateMatchReason(total, taskAnalysis, student)
  };
}
```

---

#### 1.5 AI任务拆解系统
**目标：** 接单后自动拆解任务步骤

**小程序端：**
```
pages/tasks/breakdown.tsx
- 显示AI拆解的步骤
- 所需技能清单
- 推荐工具/插件
- 参考资源链接
```

**后端：**
```typescript
// services/ai/taskBreakdown.ts
async function breakdownTask(task: Task) {
  const prompt = `
  请拆解以下任务：
  标题：${task.title}
  描述：${task.description}
  要求：${task.requirements}
  
  请输出：
  1. 工作步骤（分步骤列出）
  2. 每步所需技能
  3. 推荐工具/软件
  4. 可能的难点
  5. 参考资源
  
  以JSON格式返回。
  `;
  
  const result = await claudeAPI.breakdown(prompt);
  return result;
}
```

---

#### 1.6 AI导师五大场景
**目标：** 全程辅导，启发式引导

**场景1：任务咨询（接单前）**
```typescript
// 触发：学生查看任务详情时
async function consultBeforeAccept(task: Task, student: Student) {
  const prompt = `
  学生正在考虑接这个任务：
  ${JSON.stringify(task)}
  
  学生能力：${JSON.stringify(student.opc_scores)}
  
  请以启发式方式：
  1. 分析任务难度
  2. 评估学生能力匹配度
  3. 提示可能的挑战
  4. 给出接单建议
  
  语气：温暖、鼓励、专业
  `;
  
  return await claudeAPI.chat(prompt);
}
```

**场景2：进行中推送（30秒后）**
```typescript
// 触发：接单后30秒
async function proactiveCheckIn(task: Task, student: Student) {
  const prompt = `
  学生刚接了任务：${task.title}
  
  请主动关心：
  1. 是否理解任务要求
  2. 是否需要帮助拆解步骤
  3. 推荐从哪里开始
  
  语气：亲切、主动、不打扰
  `;
  
  return await claudeAPI.chat(prompt);
}
```

**场景3：卡住引导（学生求助）**
```typescript
// 触发：学生点击"问AI导师"
async function helpWhenStuck(task: Task, student: Student, question: string) {
  const prompt = `
  学生在做任务时遇到问题：
  任务：${task.title}
  问题：${question}
  
  请启发式引导（不直接给答案）：
  1. 帮助梳理思路
  2. 提供线索和方向
  3. 推荐工具/方法
  4. 鼓励自主探索
  
  语气：耐心、启发、鼓励
  `;
  
  return await claudeAPI.chat(prompt);
}
```

**场景4：打回鼓励（审核不通过）**
```typescript
// 触发：AI初审或企业审核不通过
async function encourageAfterRejection(task: Task, student: Student, feedback: string) {
  const prompt = `
  学生的提交被打回：
  任务：${task.title}
  反馈：${feedback}
  
  请鼓励并指导：
  1. 肯定已完成的部分
  2. 指出需要改进的地方
  3. 给出具体改进建议
  4. 鼓励再次尝试
  
  语气：温暖、鼓励、建设性
  `;
  
  return await claudeAPI.chat(prompt);
}
```

**场景5：里程碑庆祝（完成任务）**
```typescript
// 触发：任务审核通过
async function celebrateMilestone(task: Task, student: Student) {
  const prompt = `
  学生完成了任务：${task.title}
  这是第${student.completed_tasks_count}个任务
  
  请庆祝并展望：
  1. 祝贺完成
  2. 总结收获
  3. 能力提升点
  4. 下一步建议
  
  语气：热情、庆祝、展望未来
  `;
  
  return await claudeAPI.chat(prompt);
}
```

---

### 第二阶段：完善业务逻辑（2-3周）

#### 2.1 提交审核完整流程

**AI初审：**
```typescript
// services/ai/submissionReviewer.ts
async function reviewSubmission(task: Task, submission: Submission) {
  const prompt = `
  审核学生提交：
  任务要求：${JSON.stringify(task.requirements)}
  提交内容：${JSON.stringify(submission.content)}
  
  请检查：
  1. 是否完整（所有要求都满足）
  2. 格式是否正确
  3. 质量初步评估
  4. 改进建议
  
  输出：
  {
    "pass": true/false,
    "score": 0-100,
    "feedback": "具体反馈",
    "suggestions": ["建议1", "建议2"]
  }
  `;
  
  const result = await claudeAPI.review(prompt);
  return result;
}
```

**企业审核：**
```typescript
// routes/tasks/companyController.ts
async function reviewSubmission(req, res) {
  const { submissionId, approved, feedback } = req.body;
  
  if (approved) {
    // 通过：触发结算
    await settleTask(submissionId);
    // 触发AI庆祝
    await celebrateMilestone(task, student);
  } else {
    // 拒绝：通知学生+AI鼓励
    await notifyRejection(submissionId, feedback);
    await encourageAfterRejection(task, student, feedback);
  }
}
```

---

#### 2.2 财务托管真实逻辑

**企业发布任务时：**
```typescript
// routes/tasks/companyController.ts
async function publishTask(req, res) {
  const { title, description, budget } = req.body;
  
  // 1. 创建任务
  const task = await createTask({ title, description, budget });
  
  // 2. 企业支付到平台托管账户
  const payment = await paymentService.createPayment({
    companyId: req.user.id,
    taskId: task.id,
    amount: budget,
    type: 'escrow' // 托管
  });
  
  // 3. 等待支付完成
  await payment.waitForCompletion();
  
  // 4. 触发AI匹配
  await matchTaskToStudents(task);
  
  res.json({ success: true, task });
}
```

**任务完成后：**
```typescript
// services/finance/settlement.ts
async function settleTask(submissionId: string) {
  const submission = await getSubmission(submissionId);
  const task = await getTask(submission.task_id);
  
  // 1. 计算平台抽成
  const platformFee = task.budget * 0.20; // 20%
  const studentAmount = task.budget - platformFee;
  
  // 2. 从托管账户转账
  await transferFromEscrow({
    taskId: task.id,
    studentId: submission.student_id,
    amount: studentAmount,
    platformFee: platformFee
  });
  
  // 3. 更新学生余额
  await updateStudentBalance(submission.student_id, studentAmount);
  
  // 4. 记录交易
  await createTransaction({
    taskId: task.id,
    studentId: submission.student_id,
    companyId: task.company_id,
    amount: studentAmount,
    platformFee: platformFee,
    type: 'settlement'
  });
}
```

**学生提现：**
```typescript
// routes/finance/withdrawController.ts
async function withdraw(req, res) {
  const { amount, method } = req.body; // method: 'wechat' | 'alipay'
  const studentId = req.user.id;
  
  // 1. 检查余额
  const balance = await getBalance(studentId);
  if (balance < amount || amount < 10) {
    return res.status(400).json({ error: '余额不足或低于最低提现金额' });
  }
  
  // 2. 检查提现条件（任务完成1周后）
  const canWithdraw = await checkWithdrawEligibility(studentId);
  if (!canWithdraw) {
    return res.status(400).json({ error: '任务完成未满1周' });
  }
  
  // 3. 创建提现申请
  const withdrawal = await createWithdrawal({
    studentId,
    amount,
    method,
    status: 'pending'
  });
  
  // 4. 调用支付接口
  if (method === 'wechat') {
    await wechatPay.transfer(withdrawal);
  } else {
    await alipay.transfer(withdrawal);
  }
  
  // 5. 扣除余额
  await deductBalance(studentId, amount);
  
  res.json({ success: true, withdrawal });
}
```

---

#### 2.3 信任加速器系统

**完成任务时检测：**
```typescript
// routes/tasks/companyController.ts
async function completeTask(taskId: string, studentId: string) {
  // 1. 标记任务完成
  await markTaskCompleted(taskId);
  
  // 2. 检查是否完成同一企业2单
  const task = await getTask(taskId);
  const completedCount = await countCompletedTasks(studentId, task.company_id);
  
  if (completedCount >= 2) {
    // 3. 触发信任加速器
    await unlockContact(studentId, task.company_id);
    
    // 4. 通知双方
    await notifyContactUnlocked(studentId, task.company_id);
  }
}
```

**解锁联系方式：**
```typescript
// services/trust/contactUnlocker.ts
async function unlockContact(studentId: string, companyId: string) {
  // 1. 创建解锁记录
  await createUnlockRecord({
    studentId,
    companyId,
    unlockedAt: new Date()
  });
  
  // 2. 获取双方联系方式
  const student = await getStudent(studentId);
  const company = await getCompany(companyId);
  
  // 3. 发送通知
  await sendNotification(studentId, {
    title: '恭喜！已解锁企业联系方式',
    content: `你已完成${company.name}的2个任务，现在可以直接联系对方了！`,
    data: {
      companyName: company.name,
      companyContact: company.contact_phone,
      companyEmail: company.contact_email
    }
  });
  
  await sendNotification(companyId, {
    title: '学生联系方式已解锁',
    content: `${student.name}已完成你的2个任务，现在可以直接联系对方了！`,
    data: {
      studentName: student.name,
      studentPhone: student.phone,
      studentWechat: student.wechat_id
    }
  });
}
```

---

#### 2.4 六维能力动态更新

**任务完成后更新：**
```typescript
// services/ability/abilityUpdater.ts
async function updateAbilityScores(studentId: string, taskId: string) {
  const task = await getTask(taskId);
  const submission = await getSubmission(taskId, studentId);
  const currentScores = await getAbilityScores(studentId);
  
  // 1. AI分析任务表现
  const performance = await analyzeTaskPerformance(task, submission);
  
  // 2. 计算新的能力评分
  const newScores = {
    learning: updateScore(currentScores.learning, performance.learning),
    execution: updateScore(currentScores.execution, performance.execution),
    communication: updateScore(currentScores.communication, performance.communication),
    innovation: updateScore(currentScores.innovation, performance.innovation),
    collaboration: updateScore(currentScores.collaboration, performance.collaboration),
    resilience: updateScore(currentScores.resilience, performance.resilience)
  };
  
  // 3. 保存历史记录
  await saveAbilityHistory(studentId, newScores);
  
  // 4. 更新当前评分
  await updateCurrentScores(studentId, newScores);
  
  return newScores;
}

async function analyzeTaskPerformance(task, submission) {
  const prompt = `
  分析学生任务表现：
  任务：${JSON.stringify(task)}
  提交：${JSON.stringify(submission)}
  完成时间：${submission.completed_at}
  截止时间：${task.deadline}
  
  请评估六维能力表现（-10到+10分）：
  1. learning: 学习新技能的速度
  2. execution: 按时完成的能力
  3. communication: 需求理解准确度
  4. innovation: 解决方案创新性
  5. collaboration: 团队协作表现
  6. resilience: 面对困难的表现
  
  以JSON格式返回。
  `;
  
  const result = await claudeAPI.analyze(prompt);
  return result;
}

function updateScore(currentScore: number, delta: number) {
  // 使用指数移动平均，新表现权重30%
  return Math.round(currentScore * 0.7 + (currentScore + delta) * 0.3);
}
```

---

### 第三阶段：高级功能（3-4周）

#### 3.1 OPC深度报告生成

**报告生成引擎：**
```typescript
// services/report/reportGenerator.ts
async function generateDeepReport(studentId: string) {
  const student = await getStudentFullData(studentId);
  
  // 1. 收集所有数据
  const data = {
    assessment: student.opc_assessment,
    abilities: student.ability_history,
    tasks: student.completed_tasks,
    growth: student.growth_timeline,
    interactions: student.mentor_conversations
  };
  
  // 2. AI生成万字报告
  const report = await generateReport(data);
  
  // 3. 生成可视化图表
  const charts = await generateCharts(data);
  
  // 4. 合成PDF
  const pdf = await generatePDF(report, charts);
  
  // 5. 保存报告
  await saveReport(studentId, pdf);
  
  return pdf;
}

async function generateReport(data) {
  const prompt = `
  为学生生成OPC深度报告（10000字）：
  
  数据：${JSON.stringify(data)}
  
  报告结构：
  
  ## 一、简历包装模块
  - 专业化描述任务经历
  - 数据化成果展示
  - 降本增效案例
  - 解决方案亮点
  
  ## 二、能力分析模块
  - 六维能力深度解读
  - 优势与短板分析
  - 成长曲线预测
  
  ## 三、职业方向模块
  - 基于能力的职业建议
  - 适合的行业领域
  - 发展路径规划
  
  ## 四、创业指导模块
  - 3个天马行空的创意方向
  - 每个方向的市场空缺分析
  - 目标客群画像
  - 获客渠道建议
  - 商业模式建议
  
  ## 五、行动计划模块
  - 短期目标（3个月）
  - 中期目标（1年）
  - 长期目标（3年）
  
  要求：
  - 总字数10000字以上
  - 具体、可操作
  - 鼓励性、展望性
  - 数据支撑
  
  以Markdown格式返回。
  `;
  
  const result = await claudeAPI.generate(prompt, { maxTokens: 16000 });
  return result;
}
```

---

#### 3.2 组队功能

**创建团队：**
```typescript
// routes/team/controller.ts
async function createTeam(req, res) {
  const { name, members, taskId } = req.body;
  const leaderId = req.user.id;
  
  // 1. 创建团队
  const team = await createTeam({
    name,
    leaderId,
    members,
    taskId
  });
  
  // 2. 邀请成员
  await inviteMembers(team.id, members);
  
  // 3. 如果是为了特定任务，关联任务
  if (taskId) {
    await linkTeamToTask(team.id, taskId);
  }
  
  res.json({ success: true, team });
}
```

---

#### 3.3 平台管理后台

**用户管理：**
```typescript
// admin/routes/users/controller.ts
async function listUsers(req, res) {
  const { type, page, limit } = req.query;
  
  const users = await getUserList({
    type, // 'student' | 'company'
    page,
    limit,
    include: ['opc_scores', 'task_history', 'ability_history']
  });
  
  res.json(users);
}

async function getUserDetail(req, res) {
  const { userId } = req.params;
  
  const user = await getUserFullData(userId);
  
  res.json(user);
}
```

**任务管理：**
```typescript
// admin/routes/tasks/controller.ts
async function listTasks(req, res) {
  const { status, page, limit } = req.query;
  
  const tasks = await getTaskList({
    status, // 'pending' | 'in_progress' | 'submitted' | 'completed'
    page,
    limit,
    include: ['company', 'student', 'submissions']
  });
  
  res.json(tasks);
}

async function getTaskDetail(req, res) {
  const { taskId } = req.params;
  
  const task = await getTaskFullData(taskId);
  
  res.json(task);
}
```

**财务管理：**
```typescript
// admin/routes/finance/controller.ts
async function getFinanceOverview(req, res) {
  const overview = {
    totalRevenue: await getTotalRevenue(),
    platformFee: await getTotalPlatformFee(),
    pendingWithdrawals: await getPendingWithdrawals(),
    escrowBalance: await getEscrowBalance()
  };
  
  res.json(overview);
}

async function approveWithdrawal(req, res) {
  const { withdrawalId } = req.params;
  
  await processWithdrawal(withdrawalId);
  
  res.json({ success: true });
}
```

---

## 开发时间估算

| 阶段 | 功能 | 工作量 | 时间 |
|------|------|--------|------|
| 第一阶段 | 核心流程修复 | 高 | 1-2周 |
| 第二阶段 | 业务逻辑完善 | 高 | 2-3周 |
| 第三阶段 | 高级功能 | 中 | 3-4周 |
| 测试优化 | 全面测试 | 中 | 1-2周 |
| **总计** | | | **7-11周** |

---

## 技术债务清单

### 需要立即修复
1. ❌ 角色选择流程缺失
2. ❌ AI匹配逻辑是假的
3. ❌ 财务托管没有真实实现
4. ❌ 提交审核流程不完整
5. ❌ 六维能力不会动态更新

### 需要优化
1. ⚠️ OPC测评题目太少
2. ⚠️ AI导师只有对话框架
3. ⚠️ 任务拆解功能缺失
4. ⚠️ 管理后台完全没有

### 可以延后
1. 📌 组队功能
2. 📌 故事墙互动
3. 📌 深度报告生成
4. 📌 企业指定服务

---

## 下一步行动

### 立即开始（本周）
1. 创建角色选择页面
2. 修复OPC测评逻辑
3. 实现AI智能匹配
4. 完善提交审核流程

### 第二周
1. AI任务拆解
2. AI导师五大场景
3. 财务托管真实逻辑
4. 信任加速器

### 第三周
1. 六维能力动态更新
2. 平台管理后台
3. 沟通中转系统

### 第四周及以后
1. OPC深度报告
2. 组队功能
3. 全面测试
4. 性能优化

---

**文档版本：** v1.0  
**最后更新：** 2026-04-08
