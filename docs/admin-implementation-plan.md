# 启程平台 · 管理端开发实施方案

**版本：v1.0**  
**创建时间：2026-04-16**

---

## 一、项目概述

### 1.1 项目背景
启程平台已完成学生端和企业端的核心功能开发，现需开发管理端作为运营中枢，实现对双边用户、项目、订单、AI引擎等核心业务的全面管理和监控。

### 1.2 技术栈选型

#### 前端
- **框架**：React 18 + TypeScript
- **UI组件库**：Ant Design Pro 或 TDesign
- **路由**：React Router v6
- **状态管理**：Zustand
- **图表**：ECharts
- **HTTP客户端**：Axios
- **构建工具**：Vite

#### 后端
- **基于现有后端**：Node.js + Express + TypeScript
- **新增模块**：`/src/routes/admin/` 目录
- **API前缀**：`/api/v1/admin/`
- **认证方式**：JWT（独立于学生/企业端）

#### 部署
- **建议独立域名**：admin.qicheng.com
- **强制HTTPS**
- **Nginx反向代理**

---

## 二、数据库设计

### 2.1 已有表梳理（可直接使用）

| 表名 | 用途 | 管理端使用场景 |
|---|---|---|
| `users` | 用户基础表 | 学生/企业账号管理 |
| `student_profiles` | 学生档案 | 学生详情、能力画像 |
| `company_profiles` | 企业档案 | 企业详情、认证信息 |
| `tasks` | 任务/项目表 | 项目库管理 |
| `task_assignments` | 任务分配记录 | 订单管理 |
| `task_submissions` | 任务提交记录 | 交付记录查看 |
| `task_ratings` | 任务评价 | 评价记录查看 |
| `opc_v2_assessments` | OPC v2测评记录 | 学生能力画像数据 |
| `opc_v2_results` | OPC v2测评结果 | 人格标签、赛道推荐 |
| `mentor_conversations` | 导师对话记录 | 导师对话监控 |
| `growth_reports` | 成长报告 | 学生成长轨迹 |
| `story_wall_posts` | 故事墙帖子 | OPC故事墙管理 |
| `withdrawals` | 提现记录 | 提现审核 |
| `payment_transactions` | 支付交易记录 | 财务流水 |
| `admin_operation_logs` | 操作日志（已存在） | 管理员操作审计 |
| `system_config` | 系统配置（已存在） | 系统配置管理 |

### 2.2 新增表（见 migration 047）

| 表名 | 用途 |
|---|---|
| `admin_users` | 管理员账号 |
| `admin_roles` | 管理员角色 |
| `admin_permissions` | 权限定义 |
| `ai_call_logs` | AI调用日志（成本统计） |
| `mentor_tool_hints` | 导师工具提示库 |
| `mentor_growth_observations` | 导师成长观察记录 |
| `income_records` | 收入流水（统一财务记录） |
| `announcements` | 公告 |
| `help_documents` | 帮助文档 |

---

## 三、开发计划（按优先级）

### P0 阶段：MVP核心功能（2-3周）

#### 3.1 基础架构
- [ ] 创建管理端前端项目（React + Ant Design Pro）
- [ ] 配置路由、状态管理、HTTP拦截器
- [ ] 实现登录页面和JWT认证
- [ ] 实现通用布局（侧边栏菜单 + 顶部导航）

#### 3.2 数据看板（基础版）
- [ ] 今日实时数据卡片（新增学生/企业、订单数、GMV）
- [ ] 近30天趋势图（学生/企业/订单/收入）
- [ ] 学生等级分布饼图

#### 3.3 学生管理
- [ ] 学生列表（筛选、分页、搜索）
- [ ] 学生详情页
  - Tab1：基本信息
  - Tab2：能力画像（OPC v2结果展示）
  - Tab3：成长轨迹（等级变化、订单记录）
  - Tab4：订单记录
- [ ] 学生禁用/启用功能
- [ ] 等级配置查看

#### 3.4 企业管理
- [ ] 企业列表（筛选、分页、搜索）
- [ ] 企业认证审核
  - 待审核列表
  - 认证信息展示（营业执照预览）
  - 审核通过/驳回操作
- [ ] 企业详情页
  - Tab1：基本信息
  - Tab2：项目记录
  - Tab3：订单记录
- [ ] 企业禁用/启用功能

#### 3.5 项目库管理
- [ ] 项目列表（筛选、分页、搜索）
- [ ] 项目审核
  - 待审核列表
  - 项目详情预览
  - 审核通过/驳回操作
- [ ] 项目上架/下架
- [ ] 项目详情页（完整信息展示）

#### 3.6 订单管理
- [ ] 订单列表（筛选、分页、搜索）
- [ ] 订单详情页
  - Tab1：订单信息（状态时间线）
  - Tab2：交付记录
  - Tab3：导师对话
- [ ] 异常订单处理
  - 超时提醒
  - 手动取消订单
  - 纠纷仲裁

#### 3.7 管理员账号
- [ ] 管理员登录页面
- [ ] 管理员列表
- [ ] 新增/编辑管理员
- [ ] 密码重置

---

### P1 阶段：完善功能（1-2周）

#### 3.8 数据看板（完整版）
- [ ] 预警模块（订单超时、审核积压、纠纷待处理）
- [ ] 更多维度图表（项目类型分布、学生活跃度等）

#### 3.9 导师系统管理
- [ ] 导师对话监控（按学生/订单查询）
- [ ] 工具提示库管理（CRUD）
- [ ] 成长观察数据查看

#### 3.10 AI引擎管理
- [ ] AI调用日志列表（筛选、分页）
- [ ] 成本统计（今日/本月/累计）
- [ ] 按引擎/模型拆分成本图表

#### 3.11 内容管理
- [ ] OPC故事墙管理（审核、编辑、下架）
- [ ] 公告推送（新建、发布、已读统计）

#### 3.12 操作日志
- [ ] 操作日志列表（按操作人/类型/时间筛选）
- [ ] 日志详情查看

---

### P2 阶段：高级功能（2-3周）

#### 3.13 财务管理
- [ ] 收入流水列表
- [ ] 提现审核（批量审核）
- [ ] 平台抽成配置
- [ ] 财务报表（日/周/月/季度）

#### 3.14 AI引擎高级管理
- [ ] Prompt管理（查看、编辑、版本历史）
- [ ] A/B测试配置
- [ ] 效果评估指标展示

#### 3.15 系统管理
- [ ] 角色权限管理
- [ ] 系统配置管理（键值对配置）
- [ ] 帮助文档管理

#### 3.16 数据导出
- [ ] 学生数据导出（Excel）
- [ ] 订单数据导出（Excel）
- [ ] 财务报表导出（Excel/PDF）

---

## 四、后端API设计

### 4.1 认证模块 `/api/v1/admin/auth`

| 接口 | 方法 | 说明 |
|---|---|---|
| `/login` | POST | 管理员登录 |
| `/logout` | POST | 管理员登出 |
| `/refresh` | POST | 刷新Token |
| `/profile` | GET | 获取当前管理员信息 |

### 4.2 数据看板 `/api/v1/admin/dashboard`

| 接口 | 方法 | 说明 |
|---|---|---|
| `/stats/today` | GET | 今日实时数据 |
| `/stats/trend` | GET | 趋势数据（近30天） |
| `/stats/distribution` | GET | 分布数据（等级/项目类型） |
| `/alerts` | GET | 预警列表 |

### 4.3 学生管理 `/api/v1/admin/students`

| 接口 | 方法 | 说明 |
|---|---|---|
| `/` | GET | 学生列表（分页、筛选） |
| `/:id` | GET | 学生详情 |
| `/:id/profile` | GET | 学生档案（能力画像） |
| `/:id/orders` | GET | 学生订单记录 |
| `/:id/growth` | GET | 成长轨迹 |
| `/:id/mentor-chats` | GET | 导师对话记录 |
| `/:id/status` | PUT | 禁用/启用学生 |
| `/:id/level` | PUT | 手动调整等级 |
| `/export` | POST | 导出学生数据 |

### 4.4 企业管理 `/api/v1/admin/companies`

| 接口 | 方法 | 说明 |
|---|---|---|
| `/` | GET | 企业列表 |
| `/:id` | GET | 企业详情 |
| `/:id/projects` | GET | 企业项目记录 |
| `/:id/orders` | GET | 企业订单记录 |
| `/:id/status` | PUT | 禁用/启用企业 |
| `/pending-review` | GET | 待审核企业列表 |
| `/:id/review` | POST | 企业认证审核 |

### 4.5 项目库管理 `/api/v1/admin/tasks`

| 接口 | 方法 | 说明 |
|---|---|---|
| `/` | GET | 项目列表 |
| `/:id` | GET | 项目详情 |
| `/:id` | PUT | 编辑项目 |
| `/:id/status` | PUT | 上架/下架项目 |
| `/pending-review` | GET | 待审核项目列表 |
| `/:id/review` | POST | 项目审核 |

### 4.6 订单管理 `/api/v1/admin/orders`

| 接口 | 方法 | 说明 |
|---|---|---|
| `/` | GET | 订单列表 |
| `/:id` | GET | 订单详情 |
| `/:id/timeline` | GET | 订单状态时间线 |
| `/:id/submissions` | GET | 交付记录 |
| `/:id/mentor-chats` | GET | 导师对话 |
| `/:id/cancel` | POST | 手动取消订单 |
| `/:id/dispute` | POST | 纠纷仲裁 |
| `/export` | POST | 导出订单数据 |

### 4.7 导师系统 `/api/v1/admin/mentor`

| 接口 | 方法 | 说明 |
|---|---|---|
| `/conversations` | GET | 导师对话列表 |
| `/tool-hints` | GET | 工具提示库列表 |
| `/tool-hints` | POST | 新增提示 |
| `/tool-hints/:id` | PUT | 编辑提示 |
| `/tool-hints/:id` | DELETE | 删除提示 |
| `/observations` | GET | 成长观察数据 |

### 4.8 AI引擎 `/api/v1/admin/ai`

| 接口 | 方法 | 说明 |
|---|---|---|
| `/logs` | GET | AI调用日志列表 |
| `/logs/:id` | GET | 日志详情 |
| `/stats/cost` | GET | 成本统计 |
| `/stats/performance` | GET | 性能统计 |
| `/prompts` | GET | Prompt列表 |
| `/prompts/:engine` | GET | 获取指定引擎Prompt |
| `/prompts/:engine` | PUT | 更新Prompt |

### 4.9 内容管理 `/api/v1/admin/content`

| 接口 | 方法 | 说明 |
|---|---|---|
| `/stories` | GET | 故事墙列表 |
| `/stories/:id/review` | POST | 故事审核 |
| `/stories/:id/status` | PUT | 故事上下架 |
| `/announcements` | GET | 公告列表 |
| `/announcements` | POST | 新建公告 |
| `/announcements/:id` | PUT | 编辑公告 |
| `/announcements/:id` | DELETE | 删除公告 |

### 4.10 财务管理 `/api/v1/admin/finance`

| 接口 | 方法 | 说明 |
|---|---|---|
| `/income-records` | GET | 收入流水列表 |
| `/withdrawals/pending` | GET | 待审核提现列表 |
| `/withdrawals/:id/review` | POST | 提现审核 |
| `/config/commission` | GET | 抽成配置 |
| `/config/commission` | PUT | 更新抽成配置 |
| `/reports` | GET | 财务报表 |

### 4.11 系统管理 `/api/v1/admin/system`

| 接口 | 方法 | 说明 |
|---|---|---|
| `/admins` | GET | 管理员列表 |
| `/admins` | POST | 新增管理员 |
| `/admins/:id` | PUT | 编辑管理员 |
| `/admins/:id/status` | PUT | 禁用/启用管理员 |
| `/admins/:id/reset-password` | POST | 重置密码 |
| `/roles` | GET | 角色列表 |
| `/permissions` | GET | 权限列表 |
| `/logs` | GET | 操作日志列表 |
| `/config` | GET | 系统配置列表 |
| `/config/:key` | PUT | 更新配置 |

---

## 五、权限控制设计

### 5.1 JWT Token结构

```json
{
  "adminId": "uuid",
  "username": "admin",
  "roleCode": "super_admin",
  "permissions": ["*"],
  "iat": 1234567890,
  "exp": 1234567890
}
```

### 5.2 权限验证中间件

```typescript
// src/middleware/adminAuth.ts
export const requireAdmin = (requiredPermission?: string) => {
  return async (req, res, next) => {
    // 1. 验证JWT Token
    // 2. 检查是否为管理员
    // 3. 检查权限（如果指定了requiredPermission）
    // 4. 记录操作日志
  };
};
```

### 5.3 权限代码示例

```typescript
// 超级管理员可访问所有接口
router.get('/students', requireAdmin('student:view'), getStudents);

// 运营专员可编辑学生
router.put('/students/:id', requireAdmin('student:edit'), updateStudent);

// 审核专员可审核企业
router.post('/companies/:id/review', requireAdmin('company:review'), reviewCompany);

// 财务专员可审核提现
router.post('/withdrawals/:id/review', requireAdmin('finance:review'), reviewWithdrawal);
```

---

## 六、前端页面结构

```
admin-frontend/
├── src/
│   ├── pages/
│   │   ├── Login/                    # 登录页
│   │   ├── Dashboard/                # 数据看板
│   │   ├── Students/                 # 学生管理
│   │   │   ├── List.tsx              # 学生列表
│   │   │   ├── Detail.tsx            # 学生详情
│   │   │   └── LevelConfig.tsx       # 等级配置
│   │   ├── Companies/                # 企业管理
│   │   │   ├── List.tsx
│   │   │   ├── Detail.tsx
│   │   │   └── Review.tsx            # 认证审核
│   │   ├── Tasks/                    # 项目库管理
│   │   │   ├── List.tsx
│   │   │   ├── Detail.tsx
│   │   │   └── Review.tsx
│   │   ├── Orders/                   # 订单管理
│   │   │   ├── List.tsx
│   │   │   ├── Detail.tsx
│   │   │   └── Dispute.tsx           # 纠纷处理
│   │   ├── Mentor/                   # 导师系统
│   │   │   ├── Conversations.tsx
│   │   │   ├── ToolHints.tsx
│   │   │   └── Observations.tsx
│   │   ├── AI/                       # AI引擎
│   │   │   ├── Logs.tsx
│   │   │   ├── CostStats.tsx
│   │   │   └── PromptManage.tsx
│   │   ├── Content/                  # 内容管理
│   │   │   ├── Stories.tsx
│   │   │   └── Announcements.tsx
│   │   ├── Finance/                  # 财务管理
│   │   │   ├── IncomeRecords.tsx
│   │   │   ├── WithdrawalReview.tsx
│   │   │   └── Reports.tsx
│   │   └── System/                   # 系统管理
│   │       ├── Admins.tsx
│   │       ├── Roles.tsx
│   │       ├── Logs.tsx
│   │       └── Config.tsx
│   ├── components/                   # 通用组件
│   │   ├── Layout/                   # 布局组件
│   │   ├── Charts/                   # 图表组件
│   │   └── Common/                   # 通用组件
│   ├── services/                     # API服务
│   ├── stores/                       # 状态管理
│   ├── utils/                        # 工具函数
│   └── types/                        # TypeScript类型定义
```

---

## 七、安全建议

### 7.1 认证安全
- 管理端使用独立JWT Secret
- Token有效期：2小时（可配置）
- 支持Refresh Token机制
- 登录失败5次锁定账号30分钟

### 7.2 操作安全
- 所有敏感操作记录到 `admin_operation_logs`
- 关键操作需二次验证（短信/邮箱验证码）
- 批量操作需确认弹窗

### 7.3 数据安全
- 敏感字段脱敏展示（手机号、身份证号）
- 导出数据需审计日志
- 定期备份数据库

### 7.4 网络安全
- 强制HTTPS
- 配置CORS白名单
- 防止SQL注入、XSS攻击
- 接口限流（Rate Limiting）

---

## 八、开发规范

### 8.1 代码规范
- 使用ESLint + Prettier
- 遵循Airbnb JavaScript Style Guide
- 组件使用函数式组件 + Hooks
- 接口使用TypeScript类型定义

### 8.2 Git规范
- 分支命名：`feature/admin-xxx`、`bugfix/admin-xxx`
- Commit规范：`feat(admin): xxx`、`fix(admin): xxx`

### 8.3 测试规范
- 单元测试：Jest + React Testing Library
- E2E测试：Playwright（可选）
- 接口测试：Postman Collection

---

## 九、部署方案

### 9.1 前端部署
```bash
# 构建
npm run build

# Nginx配置
server {
  listen 443 ssl;
  server_name admin.qicheng.com;
  
  root /var/www/admin-frontend/dist;
  index index.html;
  
  location / {
    try_files $uri $uri/ /index.html;
  }
  
  location /api/ {
    proxy_pass http://localhost:3000;
  }
}
```

### 9.2 后端部署
- 使用PM2管理进程
- 配置环境变量（JWT_SECRET_ADMIN）
- 日志输出到文件

---

## 十、时间估算

| 阶段 | 工作量 | 时间 |
|---|---|---|
| P0 MVP核心功能 | 前端15人日 + 后端10人日 | 2-3周 |
| P1 完善功能 | 前端8人日 + 后端5人日 | 1-2周 |
| P2 高级功能 | 前端12人日 + 后端8人日 | 2-3周 |
| 测试与优化 | 5人日 | 1周 |
| **总计** | **约60人日** | **6-9周** |

---

## 十一、下一步行动

### 立即执行
1. ✅ 创建数据库迁移文件（047_admin_tables.sql）
2. ⏳ 执行数据库迁移
3. ⏳ 创建管理端前端项目脚手架
4. ⏳ 创建后端 `/src/routes/admin/` 目录结构
5. ⏳ 实现管理员登录功能

### 本周目标
- 完成基础架构搭建
- 实现登录和权限验证
- 完成数据看板基础版
- 完成学生管理列表页

---

**文档结束**
