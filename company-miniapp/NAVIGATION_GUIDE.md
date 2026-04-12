# 企业端小程序导航连接指南

## 页面跳转流程图

### 1. 首页 (index)
**快捷入口：**
- 📝 发布任务 → `/pages/publish/index`
- 📋 我的任务 → `/pages/tasks/index`
- 💬 消息中心 → `/pages/chat-list/index`
- 💰 财务管理 → `/pages/payments/index`
- ⭐ 收藏学生 → `/pages/favorite-students/index`
- 📊 数据报表 → `/pages/data-report/index`

**待处理任务卡片：**
- 待验收任务 → `/pages/task-detail/index?id={taskId}`
- 待选择学生 → `/pages/select-students/index?taskId={taskId}`

**统计数据：**
- 总互动量/活跃用户/任务完成率 → `/pages/data-report/index`

**最近活动：**
- 任务已完成 → `/pages/task-detail/index?id=1`
- 新消息 → `/pages/chat-list/index`
- 付款提醒 → `/pages/payments/index`

---

### 2. 任务列表 (tasks)
**标签页：**
- 全部 / 进行中 / 待处理 / 已完成

**任务卡片点击：**
- 任务卡片 → `/pages/task-detail/index?id={taskId}`

**快捷操作按钮：**
- 待确认状态 → 验收任务 → `/pages/task-verification/index?taskId={taskId}`
- 进行中状态 → 查看进度 → `/pages/task-progress/index?taskId={taskId}`
- 进行中状态 → 联系学生 → `/pages/chat-detail/index?taskId={taskId}&studentId={studentId}`
- 待接单状态 → 查看匹配学生 → `/pages/select-students/index?taskId={taskId}`

---

### 3. 任务详情 (task-detail)
**快捷操作：**
- 👤 学生资料 → `/pages/student-profile/index?studentId={studentId}`
- 📊 任务进度 → `/pages/task-progress/index?taskId={taskId}`
- 💬 联系学生 → `/pages/chat-detail/index?taskId={taskId}&studentId={studentId}`
- 📝 追加需求 → `/pages/add-requirement/index?taskId={taskId}`

**底部操作按钮：**
- AI审核通过后 → 拒绝/验收通过 → 提交验收结果
- 验收通过后 → 支付尾款 → `/pages/payment/index?taskId={taskId}&type=final`
- 任务完成后 → 确认完成 → 返回任务列表
- 特定状态下 → 取消任务 → 确认取消（扣除30%定金）

---

### 4. 企业中心 (profile)
**统计数据（可点击）：**
- 发布任务 → `/pages/tasks/index`
- 进行中 → `/pages/tasks/index?tab=active`
- 已完成 → `/pages/tasks/index?tab=completed`

**快捷操作：**
- 📝 发布任务 → `/pages/publish/index`
- ⏰ 待处理 (徽章:3) → `/pages/tasks/index?tab=pending`
- 💬 消息 (徽章:5) → `/pages/chat-list/index`
- 💰 财务 → `/pages/payments/index`

**菜单列表：**
- 我的任务 (徽章:3) → `/pages/tasks/index`
- 付款记录 → `/pages/payments/index`
- 聊天消息 (徽章:5) → `/pages/chat-list/index`
- 待评价任务 (徽章:2) → `/pages/pending-ratings/index`
- 收藏的学生 → `/pages/favorite-students/index`
- 数据报表 → `/pages/data-report/index`
- 发票管理 → `/pages/invoice-manage/index`
- 企业认证 → `/pages/company-verify/index`
- 任务申诉 → `/pages/dispute/index`
- 账号设置 → 开发中
- 帮助中心 → 开发中

---

### 5. 学生测评报告 (student-profile)
**功能：**
- 查看学生的OPC兴趣爱好测评结果
- 查看技能评估（雷达图）
- 查看历史任务记录
- 收藏/取消收藏学生
- 查看学生作品集

**来源页面：**
- 任务详情页 → 学生资料按钮
- 选择学生页 → 学生卡片

---

### 6. 任务验收 (task-verification)
**功能：**
- 查看学生提交的交付物
- 查看AI审核结果和评分
- 验收通过 → 跳转支付尾款
- 拒绝验收 → 学生需重新提交

**来源页面：**
- 任务列表 → 待确认任务的验收按钮
- 任务详情页 → 底部验收按钮

---

### 7. 任务进度跟踪 (task-progress)
**功能：**
- 时间轴展示任务各阶段
- 发布 → 匹配 → 接单 → 执行 → 提交 → 审核 → 验收 → 完成
- 每个阶段显示时间和状态

**来源页面：**
- 任务详情页 → 任务进度按钮
- 任务列表 → 查看进度按钮

---

### 8. 选择学生 (select-students)
**功能：**
- 查看AI匹配的10名学生
- 查看学生的OPC测评结果和技能
- 选择5名学生发送任务邀请
- 点击学生卡片 → `/pages/student-profile/index?studentId={studentId}`

**来源页面：**
- 任务列表 → 待接单任务的查看匹配学生按钮
- 首页 → 待选择任务卡片

---

### 9. 聊天功能
**聊天列表 (chat-list)：**
- 显示所有对话
- 点击对话 → `/pages/chat-detail/index?taskId={taskId}&studentId={studentId}`

**聊天详情 (chat-detail)：**
- 实时消息收发
- 支持文字、图片、文件
- 显示任务信息卡片

**来源页面：**
- 首页 → 消息中心
- 企业中心 → 聊天消息
- 任务详情 → 联系学生

---

### 10. 财务管理
**付款管理 (payments)：**
- 财务统计（总支出、待支付、已支付）
- 付款记录列表
- 点击记录 → 查看详情

**支付页面 (payment)：**
- 支付定金（30%）
- 支付尾款（70%）
- 微信支付集成

**来源页面：**
- 首页 → 财务管理
- 企业中心 → 付款记录
- 任务详情 → 支付尾款按钮

---

### 11. 其他功能页面
**追加需求 (add-requirement)：**
- 任务进行中可追加需求
- 填写需求描述和预算
- 提交后等待学生确认

**需求历史 (amendment-history)：**
- 查看所有追加需求记录
- 显示状态和处理结果

**企业认证 (company-verify)：**
- 上传营业执照
- 填写企业信息
- 等待审核

**收藏学生 (favorite-students)：**
- 查看收藏的学生列表
- 点击学生 → 学生资料页

**数据报表 (data-report)：**
- 任务统计图表
- 支出分析
- 学生评分分布

**发票管理 (invoice-manage)：**
- 申请开具发票
- 查看发票记录
- 下载发票

**任务申诉 (dispute)：**
- 提交任务纠纷申诉
- 上传证据材料
- 等待平台处理

**待评价 (pending-ratings)：**
- 查看待评价任务列表
- 点击任务 → `/pages/rate-task/index?taskId={taskId}`

**评价任务 (rate-task)：**
- 对学生进行评分
- 填写评价内容
- 提交后完成任务

---

## 业务流程完整链路

### 发布任务流程
1. 首页/企业中心 → 发布任务
2. 填写任务信息 → 提交
3. 支付30%定金 → `/pages/payment/index?taskId={taskId}&type=deposit`
4. AI匹配学生（自动）
5. 查看匹配学生 → `/pages/select-students/index?taskId={taskId}`
6. 选择5名学生发送邀请
7. 等待学生接单

### 任务执行流程
1. 学生接单 → 任务状态变为"进行中"
2. 查看任务进度 → `/pages/task-progress/index?taskId={taskId}`
3. 与学生沟通 → `/pages/chat-detail/index`
4. 追加需求（可选）→ `/pages/add-requirement/index?taskId={taskId}`
5. 学生提交交付物
6. AI审核（自动）
7. 企业验收 → `/pages/task-verification/index?taskId={taskId}`

### 验收支付流程
1. 验收通过 → 跳转支付尾款
2. 支付70%尾款 → `/pages/payment/index?taskId={taskId}&type=final`
3. 平台担保7天
4. 确认完成 → 平台放款给学生
5. 评价学生 → `/pages/rate-task/index?taskId={taskId}`
6. 任务完成

### 异常处理流程
1. 验收不通过 → 学生重新提交
2. 取消任务 → 扣除30%定金
3. 任务纠纷 → `/pages/dispute/index` 提交申诉

---

## 徽章提示系统

**首页：**
- 待处理任务卡片显示紧急程度

**企业中心：**
- 快捷操作显示待处理数量（红色徽章）
- 菜单项显示未读/待处理数量

**任务列表：**
- 任务状态标签（进行中、待确认、已完成、待接单）

**聊天列表：**
- 未读消息数量

---

## 编译和运行

```bash
# 编译
npm run build:weapp

# 开发模式（带 watch）
npm run dev:weapp

# 编译输出目录
/Users/alwan/code/qicheng/company-miniapp/dist/
```

在微信开发者工具中打开 `dist/` 目录即可预览和调试。
