# 启程平台 v8 产品功能开发实施计划

**基于**: PRODUCT_DESIGN_V8.md  
**制定日期**: 2026-06-09  
**预计开发周期**: P0阶段 8-12周

---

## 阶段划分

### P0阶段：MVP核心功能（8-12周）
**目标**: 上线可用的完整闭环，包含身份发现→AI陪伴→变现路径

### P1阶段：体验增强（上线后1-3个月）
**目标**: 增加导师智能化、数据可视化、社交传播机制

### P2阶段：生态扩展（上线后3-6个月）
**目标**: 引路人网络、故事墙、高校活动数字化

---

## P0阶段详细任务拆解

### 模块一：能力画像诊断系统（3-4周）

#### Sprint 1.1: OPC测试题库与分析引擎（1.5周）

**前端任务**:
- [ ] 设计并实现25题测试界面
  - 4个维度渐进展示（AI工具 → 创作偏好 → 工作风格 → 兴趣方向）
  - 进度条组件
  - 单选/多选/文本输入混合题型支持
  - 本地缓存答案（防止刷新丢失）

**后端任务**:
- [ ] 创建数据库表
  ```sql
  -- opc_questions: 题库表
  -- opc_user_answers: 用户答案表
  -- opc_analysis_results: 分析结果表
  ```
- [ ] 实现OPC分析API
  - POST `/api/v1/opc/submit-answers` 
  - 调用AI-01引擎（Anthropic Claude）
  - Temperature: 0.3（分析类）
  - 返回6种人格标签之一 + 初始等级 + 三大优势 + 两个gap

**AI Prompt设计**:
```
你是启程平台的能力分析师。根据学生的25道测试答案，分析其AI能力人格。

输出JSON格式：
{
  "personality_type": "视觉叙事者/系统构建者/创意执行者/数据翻译官/工具整合师/对话设计师",
  "initial_level": 1-3,
  "level_reason": "30字内依据",
  "track_recommendation": "AI内容创作/AI工具开发/双赛道",
  "track_reason": "50字内理由",
  "three_strengths": ["具体优势1", "具体优势2", "具体优势3"],
  "two_gaps": ["可操作gap1", "可操作gap2"],
  "declaration": "你是一个擅长XX的人。在AI时代，这种能力的名字叫「XX」。"
}

禁止：
- 不能说"根据你的信息"
- 优势必须具体，不能"你很有创意"
- gap必须可操作，不能"需要更多经验"
```

**验收标准**:
- ✅ 25题流畅完成，无卡顿
- ✅ AI分析在10秒内返回结果
- ✅ 返回的JSON格式完全符合要求
- ✅ 三大优势和两个gap通过"初心筛子"检查

---

#### Sprint 1.2: 身份宣言页面（1周）

**前端任务**:
- [ ] 实现身份宣言页面UI
  - 顶部大字展示人格标签
  - 中部数据卡片（赛道推荐、等级、优势、gap）
  - 底部推荐首单类型 + 收入预期
  - 浮动按钮"分享我的身份卡片"
  - 固定按钮"看看适合你的项目"

**后端任务**:
- [ ] GET `/api/v1/opc/result/:userId` 
  - 返回完整分析结果
  - 包含同类数据统计（实时查询）

**同类数据统计SQL**:
```sql
SELECT 
  COUNT(*) as total_count,
  COUNT(CASE WHEN first_order_completed = true THEN 1 END) * 100.0 / COUNT(*) as completion_rate,
  MIN(DATEDIFF(first_order_date, created_at)) as fastest_days
FROM users
WHERE opc_personality_tag = '视觉叙事者';
```

**验收标准**:
- ✅ 页面加载时间 <1秒
- ✅ 同类数据为真实数据，不编造
- ✅ 文案符合"你是一个擅长XX的人"句式
- ✅ 优势和gap通过具体性检查

---

#### Sprint 1.3: 身份卡片生成与分享（0.5周）

**前端任务**:
- [ ] 身份卡片生成（Canvas绘制）
  - 6种人格标签对应6种渐变色
  - 中央显示：人格标签 + 等级
  - 下方显示：一句话宣言
  - 左下：启程认证标识
  - 右下：二维码（指向测试页）
  - 底部小字：同类数据
  
**后端任务**:
- [ ] POST `/api/v1/opc/generate-card` 
  - 接收userId
  - 返回卡片图片URL（七牛云存储）
- [ ] 分享追踪机制
  - 扫码进入时记录referrer
  - 新人完成测试后通知分享者

**验收标准**:
- ✅ 卡片生成时间 <3秒
- ✅ 6种人格标签颜色正确映射
- ✅ 二维码可正常扫描跳转
- ✅ 分享通知及时送达（30秒内）

---

### 模块二：AI导师陪伴系统（4-5周）

#### Sprint 2.1: 导师基础架构（1周）

**后端任务**:
- [ ] 创建数据库表
  ```sql
  -- mentor_conversations: 对话记录
  -- mentor_triggers: 触发事件记录
  -- mentor_context: 对话上下文（Redis）
  ```
- [ ] 实现导师对话API
  - POST `/api/v1/mentor/message` 
  - WebSocket支持（流式输出）
  - 上下文管理（最近10轮对话）

**AI Prompt设计（基础人设）**:
```
你是启程平台的AI导师。你的身份是"一个先走过这条河的人"。

语气：好奇、温暖、具体
说话风格：口语化，不用专业术语，用学生能理解的类比

核心能力：在学生最脆弱的时候，接住羞耻感，给出线索而非答案

禁止用语：
- "你做错了"
- "应该这样"
- "你需要学习"
- "你真棒"
- "继续加油"

允许用语：
- "别急，几乎所有人在这一步都会卡"
- "你现在卡在哪一步了？"
- "你可以先试试..."
- "你先试试这个，做完告诉我结果"

当前任务: {task_description}
学生当前进度: {current_step}
历史卡点: {stuck_points}

学生说: {user_message}

请回复学生。记住：给线索，不给答案。
```

**验收标准**:
- ✅ 对话响应时间 <2秒
- ✅ 流式输出体验流畅
- ✅ 上下文正确保持
- ✅ 禁用词汇零出现

---

#### Sprint 2.2: T-01接单后引导（0.5周）

**后端任务**:
- [ ] 订单创建时触发T-01
- [ ] 30秒后自动发送导师消息
- [ ] 生成3个快捷回复按钮

**AI Prompt**:
```
学生刚接了一个任务：{task_title}
任务类型：{task_type}
任务描述：{task_description}

请生成T-01引导消息，包含：
1. 工具推荐（2-3个常用工具）
2. 任务拆解（3步）
3. 开放邀请（问学生从哪步开始）

输出JSON：
{
  "message": "文案",
  "quick_replies": ["按钮1", "按钮2", "按钮3"]
}
```

**验收标准**:
- ✅ 订单创建后30秒内收到消息
- ✅ 工具推荐与任务类型匹配
- ✅ 任务拆解清晰可执行
- ✅ 快捷回复按钮可点击

---

#### Sprint 2.3: T-02卡住响应（1周）

**后端任务**:
- [ ] 关键词检测（"卡住""不知道""不会""怎么办"）
- [ ] 调用mentor_growth_observations查询同类卡点
- [ ] 四步引导流程

**AI Prompt**:
```
学生说：{user_message}
当前任务：{task_title}
当前步骤：{current_step}

从mentor_growth_observations查到的同类卡点：
{similar_stuck_points}

请按四步流程回复：
1. 接住羞耻感："别急，几乎所有人在这一步都会卡..."
2. 定位卡点："你现在卡在哪一步了？"
3. 给线索：具体的搜索关键词或工具建议
4. 邀请试一步："你先试试这个，做完告诉我"

输出JSON：
{
  "message": "完整四步回复",
  "quick_replies": ["我试试", "还是不太明白", "换个方向"]
}
```

**验收标准**:
- ✅ 关键词准确触发
- ✅ 同类卡点数据真实（来自数据库）
- ✅ 给出的线索具体可操作
- ✅ 连续3次求助升级为分步模式

---

#### Sprint 2.4: T-03交付物打回（1周）

**后端任务**:
- [ ] AI审核不达标时触发T-03
- [ ] 生成"肯定+指向+线索+邀请"四部曲
- [ ] 偶尔加入导师自己的经历

**AI Prompt**:
```
学生提交的交付物被AI审核打回。

审核反馈：{review_feedback}
不达标原因：{rejection_reason}
学生历史卡点：{stuck_history}

请生成T-03打回消息，四部曲：
1. 肯定：找出做得好的部分
2. 指向具体位置：明确哪里需要调整
3. 给方向线索：告诉学生如何调整
4. 邀请对话：如果不确定就继续问

偶尔（20%概率）加一句导师自己的经历。

输出JSON：
{
  "message": "完整四部曲",
  "quick_replies": ["我去改", "具体怎么调？", "改好了"]
}
```

**验收标准**:
- ✅ 肯定部分真实具体
- ✅ 指向位置明确（第X张图/第X段文字）
- ✅ 线索可操作（调成14px/用移动端预览）
- ✅ 导师经历自然融入，不生硬

---

#### Sprint 2.5: 导师对话界面（1周）

**前端任务**:
- [ ] 任务详情页右下角悬浮按钮"问导师"
- [ ] 底部抽屉式对话界面
- [ ] AI消息左侧，学生消息右侧
- [ ] 系统触发消息浅灰底色
- [ ] 工具推荐卡片展示
- [ ] 流式输出打字机效果
- [ ] 每条消息下方3个快捷回复按钮

**WebSocket实现**:
- [ ] 建立WebSocket连接
- [ ] 流式接收AI回复
- [ ] 断线重连机制

**验收标准**:
- ✅ 对话界面不全屏，可同时看任务详情
- ✅ 流式输出流畅无卡顿
- ✅ 快捷回复按钮点击即发送
- ✅ 工具推荐卡片可跳转

---

### 模块三：资产可视化系统（2-3周）

#### Sprint 3.1: 个人资产仪表盘（1.5周）

**前端任务**:
- [ ] "我的"页面顶部仪表盘
- [ ] 左侧：当前等级大字
- [ ] 右侧：能力估值
- [ ] 中部：能力拆解（3-5项）
- [ ] 底部：累计数据（4项关键指标）

**后端任务**:
- [ ] GET `/api/v1/user/dashboard` 
- [ ] 实时统计查询
  ```sql
  SELECT 
    u.current_level,
    COUNT(o.id) as total_orders,
    SUM(o.student_earning) as total_income,
    COUNT(DISTINCT mo.stuck_point_type) as stuck_count,
    COUNT(CASE WHEN mo.resolved = true THEN 1 END) as resolved_count,
    COUNT(DISTINCT o.tools_used) as tools_count
  FROM users u
  LEFT JOIN orders o ON o.student_id = u.id
  LEFT JOIN mentor_growth_observations mo ON mo.student_id = u.id
  WHERE u.id = ?
  ```

**能力估值算法**:
```javascript
// 基于真实市场数据估值
const skillValue = {
  'AI生图': { minPrice: 300, maxPrice: 500, level: 'mastery_level' },
  '文案改写': { minPrice: 200, maxPrice: 400, level: 'mastery_level' },
  '客户沟通': { minPrice: 0, maxPrice: 0, level: 'mastery_level' } // 软技能不直接估值
}

// 计算总估值
let totalValue = 0
for (skill in userSkills) {
  const config = skillValue[skill.name]
  if (config && skill.level >= config.level) {
    totalValue += (config.minPrice + config.maxPrice) / 2
  }
}
```

**验收标准**:
- ✅ 数据实时准确（来自数据库）
- ✅ 能力估值基于真实市场价
- ✅ "卡住过"数据正常显示（不隐藏）
- ✅ 页面加载时间 <2秒

---

#### Sprint 3.2: 成长对比卡片（1周）

**后端任务**:
- [ ] 完成第5单/第10单时触发
- [ ] POST `/api/v1/user/growth-card/generate` 
- [ ] 对比第1单和当前单的数据

**对比数据查询**:
```sql
-- 第1单数据
SELECT 
  DATEDIFF(submitted_at, accepted_at) as duration_days,
  stuck_count,
  (SELECT stuck_point_type FROM mentor_growth_observations 
   WHERE order_id = o.id ORDER BY occurred_at LIMIT 1) as main_stuck
FROM orders o
WHERE student_id = ? AND order_number = 1

-- 当前单数据
SELECT 
  DATEDIFF(submitted_at, accepted_at) as duration_days,
  stuck_count
FROM orders o
WHERE id = ?
```

**前端任务**:
- [ ] 弹窗展示对比卡片
- [ ] 左侧第1单数据
- [ ] 右侧当前单数据
- [ ] 中间箭头连接动效
- [ ] 底部文案（基于真实数据生成）
- [ ] 分享按钮

**AI生成对比文案Prompt**:
```
第1单：耗时{days1}天，卡住{stuck1}次，最怕{fear1}
第{n}单：耗时{days_n}天，卡住{stuck_n}次

请生成一句温暖的对比文案，让学生看到自己的成长。
格式："你在XX上完全不需要问了——你还记得第1单卡了X次吗？"

禁止："你真棒""继续加油"
```

**验收标准**:
- ✅ 触发时机准确（第5/10/20单）
- ✅ 对比数据真实（来自orders表）
- ✅ 文案温暖具体，不空洞
- ✅ 分享图片自动隐去敏感信息

---

#### Sprint 3.3: 升级通关仪式（0.5周）

**前端任务**:
- [ ] 全屏动画（旧等级碎裂，新等级升起）
- [ ] 显示新等级解锁能力
- [ ] 显示导师专属留言
- [ ] 显示下一级目标

**后端任务**:
- [ ] 等级提升时触发
- [ ] 调用AI-04生成导师留言

**AI生成导师留言Prompt**:
```
学生从Lv.{old_level}升到Lv.{new_level}

学生数据：
- 第1单耗时：{first_order_days}天，卡了{first_stuck}次
- 最近3单平均耗时：{recent_avg_days}天
- 总完成订单：{total_orders}单
- 历史卡点：{stuck_history}

请生成一段导师专属留言，包含：
1. 引用具体数据展示成长
2. 预测下一级大概需要多久
3. 告诉学生Lv.{new_level+1}可以做什么任务

格式示例：
"你升到Lv.2了。我翻了一下你的记录——第1单你卡了3次，后面几单几乎不需要我了。按这个速度，Lv.3你大概1个月就能到。到了Lv.3，你就可以接品牌矩阵类的任务了，那才是你真正该去的地方。"

禁止："恭喜""继续加油"
```

**验收标准**:
- ✅ 动画流畅，2秒内完成
- ✅ 导师留言引用真实数据
- ✅ 下一级目标明确可量化
- ✅ 不制造焦虑

---

### 模块四：引路人机制（1周）

#### Sprint 4.1: 引路人邀请与追踪（1周）

**前端任务**:
- [ ] 完成5单后显示"邀请新人"入口
- [ ] 生成专属邀请链接/二维码
- [ ] 查看被邀请人进度（脱敏）

**后端任务**:
- [ ] 创建数据库表
  ```sql
  -- referrals: 邀请关系表
  -- referral_progress: 新人进度表
  ```
- [ ] POST `/api/v1/referral/create` 
  - 生成唯一referral_code
- [ ] GET `/api/v1/referral/my-referrals` 
  - 返回被邀请人列表（脱敏）
- [ ] 新人注册时记录referrer_id
- [ ] 新人完成首单时通知引路人

**权限控制**:
```javascript
// 引路人可以看到的
- 新人昵称
- 当前任务状态（进行中/已完成/已放弃）
- 完成订单数

// 引路人不能看到的
- 具体交付物内容
- 新人收入数据
- 新人个人信息
```

**验收标准**:
- ✅ 完成5单后自动开放邀请权限
- ✅ 邀请链接唯一且永久有效
- ✅ 新人完成首单30秒内通知送达
- ✅ 引路人主页显示"曾指引过X个人开始"
- ✅ 无任何形式的返佣机制

---

## P0阶段总结

### 核心功能清单
- ✅ OPC测试与分析（25题 → AI分析 → 6种人格标签）
- ✅ 身份宣言页面（专属宣言 + 三大优势 + 两个gap）
- ✅ 身份卡片生成与分享
- ✅ AI导师T-01/T-02/T-03（接单引导 + 卡住响应 + 打回反馈）
- ✅ 导师对话界面（流式输出 + 快捷回复 + 工具推荐）
- ✅ 个人资产仪表盘（能力估值 + 累计数据）
- ✅ 成长对比卡片（第5单/第10单触发）
- ✅ 升级通关仪式（AI生成导师留言）
- ✅ 引路人机制（邀请追踪 + 脱敏展示）

### 技术栈
**前端**: React + TypeScript + TailwindCSS + WebSocket  
**后端**: Node.js + TypeScript + Express + PostgreSQL + Redis  
**AI**: Anthropic Claude API (AI-01/AI-04)  
**存储**: 七牛云（图片）  
**部署**: Docker + Nginx

### 数据库新增表
```sql
-- OPC系统
opc_questions (题库)
opc_user_answers (用户答案)
opc_analysis_results (分析结果)

-- AI导师系统
mentor_conversations (对话记录)
mentor_triggers (触发事件)

-- 引路人系统
referrals (邀请关系)
referral_progress (新人进度)
```

---

## P1阶段规划（简要）

### Sprint 5.1: AI导师T-04长时间无操作（1周）
- Cron定时检测
- 2小时/4小时/8小时梯度推送
- 引用上一次互动内容

### Sprint 5.2: AI导师T-05里程碑见证（1周）
- 首单完成触发
- 等级提升触发
- 克服历史卡点触发
- 企业高评分触发

### Sprint 5.3: OPC成长报告（2周）
- 六维能力雷达图
- 成长轨迹可视化
- AI-04生成万字报告
- 付费解锁机制（¥299）

### Sprint 5.4: OPC故事墙（1周）
- 学生自主撰写成长故事
- 导师见证语录
- 故事展示需授权
- 不筛选"最成功"故事

### Sprint 5.5: 导师人设记忆系统（1周）
- 构建导师"曾经的经历"知识库
- 对话中自然引用
- 每次对话最多1次

### Sprint 5.6: 同类数据实时展示（0.5周）
- 测试结果页展示同类人数
- 实时统计完成率
- 最快首单天数

---

## P2阶段规划（简要）

### Sprint 6.1: 成长对比卡片扩展（1周）
- 第20单触发
- 升级时触发
- 克服历史卡点时触发

### Sprint 6.2: 引路人进阶功能（1周）
- 引路人可发鼓励消息
- 新人卡住时通知引路人
- 引路人成就徽章

### Sprint 6.3: 高校活动SOP数字化（2周）
- 活动报名系统
- 现场测试小程序
- 批量生成身份卡片
- 活动数据看板

---

## 初心筛子检查清单

每个功能上线前，必须通过以下检查：

### 用户更独立了吗？
- [ ] AI导师只给线索，不给答案
- [ ] 交付物打回后学生能自己修改
- [ ] 成长对比让学生看到自己变强了

### 用户更真实了吗？
- [ ] 所有数据来自真实订单
- [ ] 不编造"月入过万"案例
- [ ] 故事墙展示真实经历，不润色

### 用户更被看见了吗？
- [ ] 导师留言引用具体数据
- [ ] 升级仪式不是模板通知
- [ ] 成长对比关注"自己变了"而非"比别人好"

---

## 开发资源需求

**前端**: 2-3人  
**后端**: 2-3人  
**AI Prompt工程师**: 1人  
**产品经理**: 1人  
**UI/UX设计师**: 1人

**预计工时**: 
- P0阶段: 1200-1600小时
- P1阶段: 600-800小时
- P2阶段: 400-600小时

---

**文档版本**: v1.0  
**制定日期**: 2026-06-09  
**对应产品文档**: PRODUCT_DESIGN_V8.md
