# 启程平台"空壳AI"改造实施报告

**日期**: 2026-06-09  
**核心问题**: 产品描述很美，但全是"固定文案"，不是"动态数据"  
**改造状态**: ✅ **第一阶段完成（基础设施）**

---

## 🎯 核心理念

> "导师说'上次有个Lv.3的人也卡了'——这句话如果是从数据库里查出来的真实记录，它就是陪伴；如果是一句写死的文案，它就是欺骗。"

**改造目标**: 让每一句话都"有据可查"，让每一个数字都来自真实数据。

---

## ✅ 今天完成的工作（4小时）

### 1. AI-07 初心审核引擎 ✅

**创建**: `backend/src/services/principleReviewService.ts`

**功能**: 每次AI导师生成回复后，自动审核是否符合初心

**审核标准**:
```
不通过（让学生更依赖）:
- 直接给出完整答案
- 使用"你应该""你需要""最好"等控制性语言
- 编造不存在的"其他学生"案例
- 过度夸奖但没有具体数据
- 空洞鼓励词"加油""你真棒"

通过（让学生更独立）:
- 只给线索或方向，学生需要自己完成最后一步
- 引用真实对话记录
- 夸奖具体到某个行为
- 开放性建议"你可以试试"
- 提出问题让学生思考
```

**技术实现**:
- 模型: claude-sonnet-4-20250514
- temperature: 0.1（审核需要确定性）
- 输出: JSON格式`{pass: true/false, reason: string}`
- 审核失败时: 重新生成回复

**关键代码**:
```typescript
const review = await principleReviewService.reviewMentorResponse(
  candidateResponse,
  { studentLevel, hasRealCaseData: true }
);

if (!review.pass) {
  // 重新生成，传入不通过原因
  revisedResponse = await generateWithConstraint(review.reason);
}
```

---

### 2. 统计API - 消除固定文案 ✅

**创建**: 
- `backend/src/controllers/statsController.ts`
- `backend/src/routes/stats.ts`

**API端点**:

#### GET /api/v1/stats/personality/:tag
**用途**: 替代"全国有12,843个和你一样的XX"固定文案

**返回真实数据**:
```json
{
  "personality_tag": "visual_storyteller",
  "total_count": 8,              // 真实人数
  "first_task_completion_rate": 50,  // 真实完成率
  "completed_count": 4,
  "avg_first_task_days": 5,
  "fastest_first_task_days": 2
}
```

**前端调用示例**:
```typescript
// ❌ 错误 - 硬编码
const text = "全国有12,843个和你一样的视觉叙事者";

// ✅ 正确 - 动态数据
const stats = await api.getPersonalityStats(profile.opc_personality_tag);
const text = `全国有${stats.total_count}个和你一样的${getLabel(profile.opc_personality_tag)}`;
```

#### GET /api/v1/stats/track/:track
**用途**: 替代固定的市场均价

**返回真实数据**:
```json
{
  "track": "AI内容创作",
  "total_completed_orders": 156,
  "median_market_price": 450,    // 真实中位数
  "avg_client_rating": 4.2
}
```

#### GET /api/v1/stats/student-valuation
**用途**: 替代固定的"月薪估值¥6,000"

**返回真实数据**:
```json
{
  "skills": [
    {
      "track": "AI内容创作",
      "order_count": 3,
      "avg_income": 400,
      "avg_rating": 4.5,
      "proficiency_level": "入门"
    }
  ],
  "estimated_monthly_income": 1600  // 基于真实订单计算
}
```

---

### 3. 数据真实性检查工具 ✅

**创建**: `backend/scripts/checkDataIntegrity.ts`

**检查项**:
1. OPC测评完整性 - 每个学生都有测评数据吗？
2. 学生能力向量完整性 - 都有AI生成的向量吗？
3. 任务匹配分数合理性 - 分数在0-1范围内吗？
4. 导师对话消息完整性 - 有空消息吗？
5. 人格标签分布合理性 - 某个标签占比超过80%吗？
6. 查找可疑固定数字 - 数据库中有"12,843"这样的假数字吗？
7. 任务翻译内容真实性 - AI翻译内容完整吗？

**运行结果**:
```
✅ OPC测评完整性: 28/28学生有数据
✅ 能力向量完整性: 22/22学生有向量
⚠️  1个学生缺少profile_summary
✅ 匹配分数合理: 平均0.39，范围0.36-0.47
✅ 人格标签分布合理: 最高占比32%
```

---

## 📋 设计方案（待实施）

### 第二阶段: AI导师动态化（2-3天）

#### T-02 卡住响应改造
**当前**: "别急，几乎所有人在这一步都会卡" - 固定文案

**改为**: 
```typescript
// 1. 查询真实同类卡点案例
const realCase = await query(`
  SELECT obs_content, user_id, u.current_level
  FROM mentor_growth_observations mo
  JOIN users u ON mo.user_id = u.id
  WHERE obs_type = 'stuck_point'
    AND task_id IN (SELECT id FROM orders WHERE project_id IN (...))
  ORDER BY RANDOM() LIMIT 1
`);

// 2. 传入AI-06
const context = {
  similar_stuck_case: realCase.obs_content,
  case_student_level: realCase.current_level
};

// 3. AI生成回复必须引用这个真实案例
// 4. 如果查不到，不编造，只给引导
```

#### T-04 轻推消息改造
**当前**: "你上次说先写第一句话——写了吗？" - 模板

**改为**:
```typescript
// 1. 查询该订单最近一条学生消息
const lastMessage = await query(`
  SELECT content, created_at
  FROM mentor_messages
  WHERE order_id = :orderId AND sender = 'student'
  ORDER BY created_at DESC LIMIT 1
`);

// 2. 轻推文案引用真实内容
const nudge = `你上次说"${lastMessage.content}"——做出来了吗？`;

// 3. 如果没有历史消息，降级为普通提醒
```

#### T-05 里程碑见证改造
**当前**: "入驻时你说不会配色" - 不知道来源

**改为**:
```typescript
// 1. 查入驻时画像的gap
const initialGaps = await query(`
  SELECT gap_to_fill
  FROM user_ability_profiles
  WHERE user_id = :userId AND is_current = false
  ORDER BY created_at ASC LIMIT 1
`);

// 2. 查本单成长观察
const currentSkills = await query(`
  SELECT skills_shown
  FROM mentor_growth_observations
  WHERE order_id = :orderId
`);

// 3. 对比找出闭合的gap
const closedGap = initialGaps.find(gap =>
  currentSkills.some(skill => skill.includes(gap))
);

// 4. 传入AI-06生成见证消息
const context = {
  initial_gaps: initialGaps,
  current_skills_shown: currentSkills,
  gap_closed: closedGap
};
```

---

### 第三阶段: 前端固定文案清理（1天）

#### 需要修复的页面
1. `/profile` - 能力估值、同类数据
2. `/journey` - 成长对比卡片
3. `/story` - 故事墙（确保没有fake stories）
4. `/onboarding` - 引导文案

#### 开发规范
```typescript
// 禁止模式1: 硬编码数字
const similarCount = 12843; // ❌

// 正确模式
const stats = await api.getPersonalityStats(tag);
const similarCount = stats.total_count; // ✅

// 禁止模式2: 前端模板填空
const label = labelMap[tag]; // ❌

// 正确模式
const label = profile.profile_summary; // ✅ 直接用AI返回的

// 禁止模式3: mock数据
const stories = mockStories; // ❌

// 正确模式
const stories = await api.getStories(); // ✅
if (stories.length === 0) {
  显示"还没有人分享故事"
}
```

---

## 🔍 代码审查清单

### 后端审查（上线前必查）
- [ ] 搜索所有包含"人格标签"+"文案"的映射数组 → 删除
- [ ] 搜索所有包含数字的常量字符串 → 改为数据库查询
- [ ] 检查AI-01到AI-07的调用日志，确保每个引擎都有真实调用记录
- [ ] 运行`checkDataIntegrity.ts`，确保0个问题
- [ ] 检查所有`mentor_messages`的INSERT，确保content来自AI返回值

### 前端审查（上线前必查）
- [ ] 搜索所有包含数字的文案 → 改为API数据绑定
- [ ] 搜索"你是一个""你擅长"等描述性文案 → 改为API返回值
- [ ] 搜索所有mock数据 → 删除，改为API调用
- [ ] 搜索"12,843""63%"等可疑数字 → 全部删除
- [ ] 验证每个页面刷新后显示的数字会变化（如果有新数据）

---

## 📊 当前数据状态

```sql
-- 运行checkDataIntegrity.ts的结果
OPC测评记录: 28条
学生能力向量: 22/22个学生
任务匹配记录: 10条（平均38.8%）
人格标签分布: 
  - balanced_learner: 9人 (32%)
  - visual_storyteller: 8人 (29%)
  - system_builder: 8人 (29%)
  - creative_executor: 3人 (11%)
```

**验证**: 这些数字是真实的，不是写死的。

---

## 🎯 下一步行动

### 需要你决定的事（5分钟）

**1. 优先级选择**

我已经完成了基础设施（AI-07审核引擎、统计API、数据检查工具）。

接下来有两个方向：

**方向A: 继续后端改造**（2-3天）
- 改造T-02, T-04, T-05（AI导师动态化）
- 需要理解现有mentor相关表的结构
- 改动范围：`mentorService.ts`和相关表

**方向B: 前端固定文案清理**（1天）
- 清理所有硬编码数字和文案
- 连接刚创建的统计API
- 改动范围：`frontend/app`下的多个页面

**我的建议**: 先做方向B（前端清理），因为：
1. 见效快（1天就能看到真实数据）
2. 风险低（API已经就绪）
3. 用户能直接看到改进

然后再做方向A（AI导师改造）。

你更倾向哪个方向？

**2. 数据缺失处理**

检查发现1个学生缺少`profile_summary`。应该：
- A. 重新运行向量生成补齐
- B. 先忽略，继续其他工作
- C. 调查为什么缺失

---

### 立即可做（如果选择方向B）

```bash
# 1. 查找前端所有硬编码数字
cd frontend
grep -rn "[0-9]{3,}" app/ --include="*.tsx" | grep -v "node_modules"

# 2. 查找"你是一个"等描述性文案
grep -rn "你是一个\|你擅长" app/ --include="*.tsx"

# 3. 查找可疑的固定数字
grep -rn "12,843\|12843\|63%" app/ --include="*.tsx"
```

然后我逐个文件修复，连接统计API。

---

### 立即可做（如果选择方向A）

```bash
# 1. 理解mentor相关表结构
cd backend
npx ts-node -e "
// 列出所有mentor相关表
"

# 2. 找到mentor消息生成的代码
grep -rn "mentorService\|AI-06" src/ --include="*.ts"

# 3. 实施T-02改造
```

---

## 💡 关于初心筛子的技术落地

**不是**: 在每个功能入口加拦截器，判断"会让用户更依赖吗？是→拦截"

**而是**: 
1. **设计层面**: Prompt写明"只给线索不给答案"
2. **运行时审核**: AI-07自动检查每条回复
3. **开发规范**: 禁止硬编码、禁止编造数据、禁止模板填空
4. **代码审查**: 上线前运行检查清单

**初心筛子已经从"一句漂亮话"变成了"四层技术实现"。**

---

## 📈 预期效果

### 改造前（用户反馈）
```
❌ "全国有12,843个和你一样的视觉叙事者" - 所有人看到一样
❌ "上次有个Lv.3的同学也卡了" - 编造的
❌ "月薪估值¥6,000" - 写死的
❌ "加油，你真棒！" - 空洞鼓励
```

### 改造后（当前+下一步）
```
✅ "全国有8个和你一样的视觉叙事者" - 真实统计
✅ "上次Lv.3的王同学在配色上卡了2天..." - 数据库真实案例
✅ "基于你的3单，市场估值约¥1,600/月" - 真实订单计算
✅ "这张图的配色很舒服" - 具体夸奖，通过AI-07审核
```

---

## 🎉 总结

**今天完成**: 基础设施（AI-07审核引擎、统计API、数据检查工具）

**核心成就**: 
- 初心筛子从"设计原则"变成了"运行时审核"
- 统计API让"固定文案"变成了"动态数据"
- 数据检查工具确保数据真实性

**下一步**: 等待你的选择
- 方向A: 继续后端改造（AI导师动态化）
- 方向B: 前端固定文案清理

**预计总时间**:
- 基础设施（今天）: 4小时 ✅
- 前端清理: 1天
- AI导师改造: 2-3天
- **总计**: 3-4天完成所有改造

**告诉我你的选择，我立即继续！**

---

**报告时间**: 2026-06-09 08:45  
**完成度**: 第一阶段100%完成  
**等待指令**: 方向A 还是 方向B？
