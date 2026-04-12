# 启程qicheng - 完整业务流程文档

## 项目概述

启程qicheng是一个帮助高校生成为独立OPC（单人创作者）的双边平台，连接企业和学生，通过AI智能匹配实现任务分发和完成。

## 三端架构

### 1. 学生端小程序（miniapp）
- **技术栈**: Taro + React + TypeScript
- **主题色**: 粉色渐变 (#F5E6F0)
- **核心功能**: OPC测评、任务接单、AI导师、能力成长、故事分享

### 2. 企业端小程序（company-miniapp）
- **技术栈**: Taro + React + TypeScript
- **主题色**: 深色GitHub风格 (#161b22)
- **核心功能**: 任务发布、学生选择、进度跟踪、验收付款

### 3. 管理端网页（frontend）
- **技术栈**: Next.js + React + TypeScript
- **主题色**: 浅色紫色主题 (#F9F7F5)
- **核心功能**: 数据监控、用户管理、财务管理、客服工具

## 完整业务流程

### 阶段1: 企业发布任务

#### 1.1 填写任务信息
企业在小程序中填写：
- 任务标题
- 任务描述
- 任务类型（设计、开发、文案等）
- 截止日期
- 验收标准

#### 1.2 AI价格建议
- 后端API: `POST /api/v1/tasks/flow/price-suggestion`
- AI根据任务复杂度、市场行情、历史数据给出价格区间
- 企业在建议价格基础上自主定价

#### 1.3 支付30%定金
- 后端API: `POST /api/v1/tasks/flow/{taskId}/pay`
- 企业支付任务总价的30%作为定金
- 支付成功后任务进入匹配阶段

**关键代码位置**:
- 前端: `company-miniapp/src/pages/publish/index.tsx`
- 后端: `backend/src/routes/tasks/businessFlowController.ts`

---

### 阶段2: AI智能匹配

#### 2.1 AI匹配10名学生
- 后端API: `POST /api/v1/tasks/flow/{taskId}/match`
- AI根据以下维度匹配：
  - 学生能力等级
  - 技能标签匹配度
  - 历史任务完成率
  - 兴趣方向
  - 时间可用性
- 匹配结果存储在`task_matches`表

#### 2.2 企业选择5名学生
- 后端API: `POST /api/v1/tasks/flow/{taskId}/select-students`
- 企业从10名匹配学生中选择5名发送邀请
- 系统向5名学生发送任务邀请通知

**关键代码位置**:
- 前端: `company-miniapp/src/pages/select-students/index.tsx`
- 后端: `backend/src/routes/tasks/businessFlowController.ts`

---

### 阶段3: 学生接单

#### 3.1 查看任务邀请
- 后端API: `GET /api/v1/tasks/flow/invitations`
- 学生在小程序中看到任务邀请列表
- 显示信息：
  - 任务标题和描述
  - 报酬（企业定价的85%）
  - 匹配度和推荐理由
  - 截止日期

#### 3.2 接受/拒绝任务
- 接受API: `POST /api/v1/tasks/flow/{taskId}/accept`
- 拒绝API: `POST /api/v1/tasks/flow/{taskId}/reject`
- **先到先得**: 第一个接受的学生获得任务
- 其他学生的邀请自动失效

**价格说明**:
- 企业定价: 100%
- 学生收入: 85%
- 平台抽成: 15%

**关键代码位置**:
- 前端: `miniapp/src/pages/invitations/index.tsx`
- 后端: `backend/src/routes/tasks/studentFlowController.ts`

---

### 阶段4: 任务执行

#### 4.1 更新任务进度
- 后端API: `POST /api/v1/tasks/flow/{taskId}/progress`
- 学生可以随时更新任务进度（0-100%）
- 添加进度说明
- 企业可实时查看进度

#### 4.2 AI导师辅助
- 学生遇到困难可咨询AI导师
- AI提供任务拆解建议
- 推荐工具和学习资源

**关键代码位置**:
- 前端: `miniapp/src/pages/tasks/working.tsx`
- 后端: `backend/src/routes/tasks/studentFlowController.ts`

---

### 阶段5: 提交交付物

#### 5.1 学生提交作品
- 后端API: `POST /api/v1/tasks/flow/{taskId}/deliverable`
- 提交内容：
  - 作品说明（必填）
  - 作品截图（最多9张）
  - 相关链接（选填）

#### 5.2 AI自动审核
- AI审核交付物质量
- 评分：0-100分
- 给出审核意见
- 通过标准：≥60分

**关键代码位置**:
- 前端: `miniapp/src/pages/tasks/submit.tsx`
- 后端: `backend/src/routes/tasks/studentFlowController.ts`

---

### 阶段6: 企业验收

#### 6.1 查看交付物
- 后端API: `GET /api/v1/tasks/flow/{taskId}/deliverable`
- 企业查看：
  - AI审核结果
  - 学生提交的作品
  - 作品说明和截图

#### 6.2 企业验收决策
- 后端API: `POST /api/v1/tasks/flow/{taskId}/company-review`
- 两种选择：
  - **通过**: 进入支付尾款阶段
  - **拒绝**: 学生需要修改重新提交

#### 6.3 补充需求（可选）
- 后端API: `POST /api/v1/tasks/flow/{taskId}/amendment`
- 企业可以补充需求
- 会延长交付时间
- 学生根据补充需求修改

**关键代码位置**:
- 前端: `company-miniapp/src/pages/task-detail/index.tsx`
- 后端: `backend/src/routes/tasks/verificationFlowController.ts`

---

### 阶段7: 支付尾款

#### 7.1 支付70%尾款
- 后端API: `POST /api/v1/tasks/flow/{taskId}/pay`
- 企业支付剩余70%的任务报酬
- 支付成功后任务进入确认期

#### 7.2 7天确认期
- 企业有7天时间进行最终确认
- 期间可以：
  - 补充需求
  - 提出修改意见
  - 最终确认完成

**关键代码位置**:
- 前端: `company-miniapp/src/pages/payment/index.tsx`
- 后端: `backend/src/routes/tasks/verificationFlowController.ts`

---

### 阶段8: 任务完成

#### 8.1 企业最终确认
- 后端API: `POST /api/v1/tasks/flow/{taskId}/final-confirm`
- 企业确认任务完成
- 学生立即收到报酬（85%）

#### 8.2 7天自动确认
- **定时任务**: 每天凌晨2点执行
- 如果企业7天内未确认，系统自动确认
- 学生自动收到报酬
- 双方收到通知

**关键代码位置**:
- 后端: `backend/src/cron/autoConfirmationJob.ts`
- 调度器: `backend/src/cron/scheduler.ts`

---

### 阶段9: 连续合作奖励

#### 9.1 微信交换机制
- 当企业和学生连续合作2次后
- 系统自动允许双方交换微信
- 可以直接沟通，建立长期合作

#### 9.2 记录存储
- 存储在`wechat_exchanges`表
- 记录交换时间和原因
- 双方收到通知

**关键代码位置**:
- 后端: `backend/src/cron/autoConfirmationJob.ts` (自动确认时检查)

---

## 数据库表结构

### 核心表

1. **tasks** - 任务表
   - 存储任务基本信息
   - 状态流转记录

2. **payments** - 支付记录表
   - 定金支付（30%）
   - 尾款支付（70%）
   - 支付状态跟踪

3. **task_matches** - AI匹配记录表
   - 匹配的学生列表
   - 匹配分数和理由
   - 邀请状态

4. **task_progress** - 任务进度表
   - 进度百分比
   - 进度说明
   - 更新时间

5. **task_deliverables** - 交付物表
   - 作品描述
   - 文件URL
   - AI审核结果
   - 企业验收结果

6. **task_amendments** - 需求补充表
   - 补充内容
   - 延期天数
   - 处理状态

7. **notifications** - 通知表
   - 系统通知
   - 任务通知
   - 支付通知

8. **auto_confirmations** - 自动确认记录表
   - 确认时间
   - 确认原因

9. **wechat_exchanges** - 微信交换记录表
   - 交换双方
   - 交换时间
   - 交换原因

**数据库迁移文件**:
- `backend/migrations/012_complete_business_flow_pg.sql`

---

## API接口列表

### 企业端接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/tasks/flow/price-suggestion` | POST | AI价格建议 |
| `/api/v1/tasks/flow/publish` | POST | 发布任务 |
| `/api/v1/tasks/flow/{taskId}/pay` | POST | 支付定金/尾款 |
| `/api/v1/tasks/flow/{taskId}/matched-students` | GET | 查看匹配学生 |
| `/api/v1/tasks/flow/{taskId}/select-students` | POST | 选择学生 |
| `/api/v1/tasks/flow/{taskId}/deliverable` | GET | 查看交付物 |
| `/api/v1/tasks/flow/{taskId}/company-review` | POST | 企业验收 |
| `/api/v1/tasks/flow/{taskId}/amendment` | POST | 补充需求 |
| `/api/v1/tasks/flow/{taskId}/final-confirm` | POST | 最终确认 |

### 学生端接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/tasks/flow/invitations` | GET | 查看任务邀请 |
| `/api/v1/tasks/flow/{taskId}/accept` | POST | 接受任务 |
| `/api/v1/tasks/flow/{taskId}/reject` | POST | 拒绝任务 |
| `/api/v1/tasks/flow/{taskId}/progress` | POST | 更新进度 |
| `/api/v1/tasks/flow/{taskId}/deliverable` | POST | 提交交付物 |

---

## 启动指南

### 1. 启动后端服务
```bash
cd backend
npm install
npm run dev
# 运行在 http://localhost:3000
```

### 2. 启动学生端小程序
```bash
cd miniapp
npm install
npm run dev:weapp
# 使用微信开发者工具打开 dist 目录
```

### 3. 启动企业端小程序
```bash
cd company-miniapp
npm install
npm run dev:weapp
# 使用微信开发者工具打开 dist 目录
```

### 4. 启动管理端网页
```bash
cd frontend
npm install
npm run dev
# 运行在 http://localhost:3002
```

### 5. 运行数据库迁移
```bash
cd backend
npm run migrate
```

---

## 测试流程

### 完整流程测试步骤

1. **企业发布任务**
   - 打开企业端小程序
   - 点击"发布任务"
   - 填写任务信息
   - 获取AI价格建议
   - 支付30%定金

2. **AI匹配学生**
   - 系统自动匹配10名学生
   - 企业查看匹配结果
   - 选择5名学生发送邀请

3. **学生接单**
   - 打开学生端小程序
   - 查看任务邀请
   - 点击"立即接单"

4. **执行任务**
   - 学生更新任务进度
   - 咨询AI导师（可选）
   - 完成任务

5. **提交交付物**
   - 填写作品说明
   - 上传作品截图
   - 提交等待审核

6. **AI审核**
   - 系统自动AI审核
   - 评分和反馈

7. **企业验收**
   - 企业查看交付物
   - 选择通过或拒绝
   - 通过后支付70%尾款

8. **最终确认**
   - 企业7天内确认
   - 或7天后自动确认
   - 学生收到报酬

---

## 关键业务规则

### 价格分配
- 企业支付: 100%
- 学生收入: 85%
- 平台抽成: 15%

### 支付规则
- 定金: 30%（发布任务时）
- 尾款: 70%（验收通过后）

### 匹配规则
- AI匹配: 10名学生
- 企业选择: 5名学生
- 接单规则: 先到先得

### 时间规则
- 7天确认期
- 超时自动确认
- 补充需求会延长交付时间

### 合作奖励
- 连续合作2次
- 自动交换微信
- 建立长期合作

---

## 技术栈总结

### 前端
- **框架**: React + TypeScript
- **小程序**: Taro 3.x
- **网页**: Next.js 14
- **样式**: SCSS
- **状态管理**: React Hooks

### 后端
- **框架**: Node.js + Express
- **语言**: TypeScript
- **数据库**: PostgreSQL
- **定时任务**: node-cron
- **日志**: Winston

### AI服务
- **端口**: 8001
- **功能**: 价格建议、智能匹配、审核评分

---

## 项目文件结构

```
qicheng/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── routes/
│   │   │   └── tasks/
│   │   │       ├── businessFlowController.ts
│   │   │       ├── studentFlowController.ts
│   │   │       └── verificationFlowController.ts
│   │   ├── cron/
│   │   │   ├── autoConfirmationJob.ts
│   │   │   └── scheduler.ts
│   │   └── app.ts
│   └── migrations/
│       └── 012_complete_business_flow_pg.sql
├── miniapp/                 # 学生端小程序
│   └── src/
│       └── pages/
│           ├── invitations/     # 任务邀请
│           ├── tasks/working/   # 任务执行
│           └── tasks/submit/    # 提交交付物
├── company-miniapp/         # 企业端小程序
│   └── src/
│       └── pages/
│           ├── publish/         # 发布任务
│           ├── select-students/ # 选择学生
│           ├── task-detail/     # 任务详情
│           └── payment/         # 支付页面
└── frontend/                # 管理端网页
    └── app/
        └── admin/           # 管理后台
```

---

## 常见问题

### Q1: 如何测试7天自动确认？
A: 在开发环境下，定时任务会立即执行一次。也可以手动调用：
```typescript
const cronScheduler = new CronScheduler(pool);
await cronScheduler.triggerAutoConfirmation();
```

### Q2: 学生看到的价格为什么是85%？
A: 平台抽成15%作为运营成本，学生实际收入是企业定价的85%。

### Q3: 如果5个学生都不接单怎么办？
A: 系统会自动退还企业的30%定金，任务状态变为已取消。

### Q4: 企业可以补充几次需求？
A: 没有次数限制，但每次补充都会延长交付时间，建议一次性说清楚需求。

### Q5: AI审核不通过怎么办？
A: 学生可以根据AI反馈修改后重新提交，直到通过为止。

---

## 更新日志

### v1.0.0 (2024-04-11)
- ✅ 完整业务流程实现
- ✅ 三端架构搭建完成
- ✅ AI智能匹配系统
- ✅ 7天自动确认机制
- ✅ 连续合作奖励机制
- ✅ 完整的支付流程
- ✅ 实时进度跟踪
- ✅ AI审核和企业验收

---

## 联系方式

如有问题，请联系开发团队。
