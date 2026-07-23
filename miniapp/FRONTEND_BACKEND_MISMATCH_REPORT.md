# 前后端API不匹配报告

## 执行概览
- **前端API文件**: /Users/alwan/code/qicheng/miniapp/src/services/api.ts (1721行)
- **后端路由文件**: 13个路由文件
- **BASE_URL**: `/api/v1` (前端) vs `/api` (后端)

---

## 🚨 严重问题 - 前端调用但后端不存在的API

### 1. 版本前缀不匹配 (P0 - 全局性问题)
**问题**: 前端使用 `/api/v1/*` 作为BASE_URL，但后端所有路由使用 `/api/*`

| 前端API | 实际调用路径 | 后端路由 | 状态 |
|---------|-------------|---------|------|
| 所有API | `/api/v1/*` | `/api/*` | ❌ 全部404 |

**影响**: 所有前端API调用都会失败，整个应用无法工作
**修复**: 前端将 `BASE_URL` 改为 `/api` 或后端路由添加 `/v1` 前缀

---

### 2. 认证相关API (authAPI)

| 前端API | HTTP方法 | 后端路由 | 状态 |
|---------|---------|---------|------|
| `/auth/register` | POST | ❌ 不存在 | 完全缺失 |
| `/auth/login` | POST | ❌ 不存在 | 完全缺失 |
| `/auth/send-code` | POST | ❌ 不存在 | 完全缺失 |
| `/auth/me` | GET | ❌ 不存在 | 完全缺失 |
| `/auth/profile` | PUT | ✅ `/api/auth/profile` | 存在 |
| `/auth/change-password` | POST | ❌ 不存在 | 完全缺失 |
| `/auth/settings` | PUT/GET | ❌ 不存在 | 完全缺失 |
| `/feedback` | POST | ❌ 不存在 | 完全缺失 |

**后端实际提供**:
- ✅ POST `/api/auth/wechat-login` (微信登录)
- ✅ POST `/api/auth/refresh-token` (刷新token)
- ✅ GET `/api/auth/profile` (获取资料)
- ✅ PUT `/api/auth/profile` (更新资料)

**分析**: 前端使用传统手机号+密码登录，后端只实现了微信登录

---

### 3. OPC测评API (testAPI)

| 前端API | HTTP方法 | 后端路由 | 状态 |
|---------|---------|---------|------|
| `/student/test/questions` | GET | ❌ 不存在 | 完全缺失 |
| `/student/test/submit` | POST | ❌ 不存在 | 完全缺失 |
| `/student/test/result` | GET | ❌ 不存在 | 完全缺失 |

**注**: 后端有 `/api/growth/assessment` 用于提交OC测评，但路径和参数结构完全不同

---

### 4. 任务相关API (taskAPI)

| 前端API | HTTP方法 | 后端路由 | 状态 |
|---------|---------|---------|------|
| `/tasks/matched` | GET | ❌ 不存在 | 完全缺失 |
| `/tasks/recommended` | GET | ❌ 不存在 | 完全缺失 |
| `/tasks/market` | GET | ❌ 不存在 | 完全缺失 |
| `/tasks/:id` | GET | ❌ 不存在 | 完全缺失 |
| `/tasks/:id/accept` | POST | ❌ 不存在 | 完全缺失 |
| `/tasks/:id/steps` | GET | ❌ 不存在 | 完全缺失 |
| `/tasks/:id/submit` | POST | ❌ 不存在 | 完全缺失 |
| `/tasks/my` | GET | ❌ 不存在 | 完全缺失 |
| `/tasks/flow/invitations` | GET | ❌ 不存在 | 完全缺失 |
| `/tasks/flow/:id/accept` | POST | ❌ 不存在 | 完全缺失 |
| `/tasks/flow/:id/reject` | POST | ❌ 不存在 | 完全缺失 |
| `/tasks/:id/progress` | POST | ❌ 不存在 | 完全缺失 |

**后端实际提供**:
- ✅ GET `/api/tasks` (获取任务列表)
- ✅ GET `/api/tasks/stats` (任务统计)
- ✅ GET `/api/tasks/:taskId` (任务详情)
- ✅ POST `/api/tasks/:taskId/retry` (重试任务)

**注**: 后端的 `/api/tasks` 似乎是"后台任务"系统，不是业务任务

---

### 5. AI导师API (mentorAPI + mentorStageAPI)

**完全缺失的API模块**:
- `/mentor/chat` - AI对话
- `/mentor/:taskId/history` - 对话历史
- `/mentor/:taskId/first-step` - 首步引导
- `/mentor/:taskId/stuck` - 卡住报告
- `/mentor-stage/*` - 整个4阶段导师系统 (50+个端点)

**影响**: 整个AI导师功能完全无法使用

---

### 6. 能力系统API (abilityAPI)

| 前端API | 后端路由 | 状态 |
|---------|---------|------|
| `/ability/radar` | ❌ 不存在 | 完全缺失 |
| `/ability/timeline` | ❌ 不存在 | 完全缺失 |
| `/ability/emotion-state` | ❌ 不存在 | 完全缺失 |
| `/ability/growth-comparison` | ❌ 不存在 | 完全缺失 |
| `/ability/growth-dashboard` | ❌ 不存在 | 完全缺失 |
| `/ability/update-after-task` | ❌ 不存在 | 完全缺失 |

**后端类似功能**:
- ✅ GET `/api/growth/ability-radar/latest` (能力雷达图)
- ✅ GET `/api/growth/comparison-reports/latest` (对比报告)

**路径完全不匹配**

---

### 7. 故事墙API (storyAPI)

| 前端API | 后端路由 | 状态 |
|---------|---------|------|
| `/story/feed` | ❌ 不存在 | 完全缺失 |
| `/story/post` | ❌ 不存在 | 完全缺失 |
| `/story/:id/like` | ❌ 不存在 | 完全缺失 |
| `/story/:id/comment` | ❌ 不存在 | 完全缺失 |

---

### 8. 报告系统API (reportAPI)

| 前端API | 后端路由 | 状态 |
|---------|---------|------|
| `/reports` | ❌ 不存在 | 完全缺失 |
| `/reports/order` | ❌ 不存在 | 完全缺失 |
| `/reports/:id` | ❌ 不存在 | 完全缺失 |
| `/reports/:id/pdf` | ❌ 不存在 | 完全缺失 |

---

### 9. 提现系统API (withdrawAPI)

| 前端API | 后端路由 | 实际匹配 |
|---------|---------|---------|
| `/student/balance` | ✅ `/api/financial/balance` | 路径不同 |
| `/payments/withdraw` | ✅ `/api/financial/withdrawal/request` | 路径不同 |
| `/payments/withdraw/history` | ✅ `/api/financial/withdrawal` | 路径不同 |

**后端使用 `/api/financial/*` 前缀，前端期望不同路径**

---

### 10. 等级系统API (levelAPI)

**完全缺失**:
- `/student/level` - 当前等级
- `/student/level/next` - 升级所需经验
- `/student/level/check` - 检查升级
- `/level/:userId` - 用户等级
- `/level/upgrade` - 执行升级
- `/level/challenge` - 跳级挑战

---

### 11. 其他大量缺失的模块

以下前端定义的API模块在后端**完全不存在**:

- **jumpLevelAPI** - 跳级系统 (5个端点)
- **teamAPI** - 组队系统 (9个端点)
- **communityAPI** - 社区板块 (6个端点)
- **opcAPI** - OPC测试 (3个端点)
- **opcV2API** - OPC v2.0 (10个端点)
- **assetDashboardAPI** - 资产仪表盘 (3个端点)
- **growthComparisonAPI** - 成长对比 (1个端点)
- **caseLibraryAPI** - 案例库 (4个端点)
- **mentorRelationshipAPI** - 引路人机制 (4个端点)
- **opcStoryAPI** - OPC故事墙 (13个端点)
- **companyStudentBridgeAPI** - 企业学生打通 (6个端点)
- **demandDecompositionAPI** - 需求拆解 (4个端点)
- **matchAPI** - 项目匹配 (2个端点)
- **mentorNewAPI** - 新导师系统 (6个端点)
- **milestoneAPI** - 里程碑 (3个端点)
- **lifeQuestionAPI** - 生命问题 (3个端点)
- **passionSparkAPI** - 热情火花 (4个端点)
- **partnershipAPI** - 合伙人关系 (7个端点)
- **explorationAPI** - 探索模式 (8个端点)
- **incubationAPI** - 孵化计划 (5个端点)
- **allianceAPI** - 联合体 (6个端点)
- **notificationAPI** - 通知中心 (4个端点)
- **walletAPI** - 钱包 (4个端点)
- **communicationAPI** - 沟通中转 (8个端点)
- **agreementAPI** - 协议授权 (10个端点)
- **challengeGraduationAPI** - 跳级毕业 (11个端点)
- **aiEngineAPI** - AI引擎 (8个端点)
- **opcGrowthAPI** - OPC成长报告 (7个端点)
- **communityPortfolioAPI** - 社群作品展示 (10个端点)
- **ratingAPI** - 评价系统新版 (5个端点)
- **escrowAPI** - 托管提现新版 (6个端点)
- **securityAPI** - 安全相关 (8个端点)
- **analyticsAPI** - 分析统计 (2个端点)
- **talentAPI** - 天赋标签 (11个端点)
- **statsAPI** - 统计数据 (3个端点)
- **dailyTasksAPI** - 每日任务 (2个端点)
- **companyRatingAPI** - 企业评价 (4个端点)
- **taskTranslationAPI** - 任务翻译 (2个端点)
- **studentRecommendationAPI** - 学生推荐 (2个端点)
- **taskFlowAPI** - 任务流程 (2个端点)
- **submissionAPI** - 提交预审核 (1个端点)

---

## ⚠️ 未集成 - 后端存在但前端未使用

### 1. 真实项目API (/api/real-projects)

**后端提供但前端未调用**:
- ✅ GET `/api/real-projects/available` - 获取可用项目
- ✅ GET `/api/real-projects/:id` - 项目详情
- ✅ GET `/api/real-projects/my/projects` - 我的项目
- ✅ GET `/api/real-projects/my/stats` - 项目统计
- ✅ POST `/api/real-projects/:id/apply` - 申请项目
- ✅ POST `/api/real-projects/:id/accept` - 接受项目
- ✅ POST `/api/real-projects/:id/complete` - 完成项目

**建议**: 集成到前端，可能是"真实案例"或"实战项目"功能

---

### 2. 收藏系统API (/api/favorites)

**后端完整实现但前端完全未调用**:
- ✅ GET `/api/favorites` - 获取收藏列表
- ✅ POST `/api/favorites` - 添加收藏
- ✅ DELETE `/api/favorites/:id` - 取消收藏
- ✅ GET `/api/favorites/stats` - 收藏统计
- ✅ GET `/api/favorites/categories` - 分类列表
- ✅ PUT `/api/favorites/:id/note` - 更新笔记
- ✅ PUT `/api/favorites/:id/category` - 更新分类
- ✅ PUT `/api/favorites/:id/pin` - 置顶

**建议**: 这是完整的收藏功能，应该集成到前端

---

### 3. 成就系统API (/api/achievements)

**后端完整实现但前端完全未调用**:
- ✅ GET `/api/achievements` - 获取成就列表
- ✅ POST `/api/achievements/check` - 检查并解锁成就
- ✅ GET `/api/achievements/stats` - 成就统计
- ✅ PUT `/api/achievements/:id/display` - 切换展示状态

**建议**: 游戏化系统，应该集成

---

### 4. 秘密空间API (/api/secret-space)

**后端完整实现但前端完全未调用**:
- ✅ GET `/api/secret-space` - 获取秘密空间
- ✅ POST `/api/secret-space/check-in` - 签到
- ✅ POST `/api/secret-space/mood` - 记录心情
- ✅ GET `/api/secret-space/mood` - 获取心情记录
- ✅ POST `/api/secret-space/notes` - 添加私密笔记
- ✅ PUT `/api/secret-space/notes/:id` - 更新笔记
- ✅ DELETE `/api/secret-space/notes/:id` - 删除笔记
- ✅ POST `/api/secret-space/milestones` - 添加里程碑
- ✅ PUT `/api/secret-space/milestones/:id/complete` - 完成里程碑
- ✅ POST `/api/secret-space/quotes` - 添加名言收藏
- ✅ PUT `/api/secret-space/settings` - 更新设置
- ✅ GET `/api/secret-space/stats` - 空间统计

**建议**: "小猫的秘密空间"功能完整，应该作为核心功能集成

---

### 5. 任务进度拆解API (/api/task-progress)

**后端完整实现但前端完全未调用**:
- ✅ POST `/api/task-progress/generate` - 生成任务拆解
- ✅ GET `/api/task-progress/my/list` - 我的任务进度列表
- ✅ GET `/api/task-progress/:projectId` - 获取项目进度
- ✅ PUT `/api/task-progress/:progressId/task/:taskNumber` - 更新任务状态
- ✅ POST `/api/task-progress/:progressId/task/:taskNumber/challenge` - 记录挑战
- ✅ POST `/api/task-progress/:progressId/task/:taskNumber/reflection` - 添加反思
- ✅ POST `/api/task-progress/:progressId/summary` - 生成项目总结

**建议**: 任务拆解和进度追踪功能，应该集成

---

### 6. 管理员API (/api/admin)

**后端提供的管理功能**:
- ✅ GET `/api/admin/stats` - 系统统计
- ✅ GET `/api/admin/health-check` - 健康检查
- ✅ POST `/api/admin/clear-stats` - 清除统计
- ✅ POST `/api/admin/financial/recalculate/:userId` - 重算余额
- ✅ POST `/api/admin/financial/recalculate-all` - 重算所有余额
- ✅ POST `/api/admin/payments/grant` - 手动发放支付
- ✅ GET `/api/admin/payments/stats` - 支付统计
- ✅ GET `/api/admin/real-projects/*` - 真实项目管理

**状态**: 管理功能不需要在学生端集成

---

## 🔧 逻辑不匹配

### 1. 实践项目API路径不匹配

| 功能 | 前端调用 | 后端路由 | 匹配度 |
|------|---------|---------|--------|
| 项目列表 | `/practice/projects` | ✅ `/api/practice/projects` | ✅ 匹配 |
| 项目报告 | `/practice/projects/:id/report` | ✅ `/api/practice/projects/:id/report` | ✅ 匹配 |
| 统计数据 | `/practice/stats` | ✅ `/api/practice/stats` | ✅ 匹配 |
| 更新进度 | `/practice/projects/:id/progress` | ✅ `/api/practice/projects/:id/progress` | ✅ 匹配 |

**但缺少前端未定义的后端功能**:
- POST `/api/practice/decomposition/generate` - AI拆解报告生成
- GET `/api/practice/decomposition/:reportId/status` - 查询状态
- POST `/api/practice/decomposition/:reportId/unlock` - 解锁报告
- GET `/api/practice/decomposition/:reportId` - 获取完整内容

---

### 2. 联系方式交换API完全匹配 ✅

| 功能 | 前端 | 后端 | 状态 |
|------|------|------|------|
| 获取合作伙伴 | `/contact-exchange/partners` | ✅ `/api/contact-exchange/partners` | ✅ 完全匹配 |
| 发起请求 | `/contact-exchange/request` | ✅ `/api/contact-exchange/request` | ✅ 完全匹配 |
| 确认交换 | `/contact-exchange/confirm` | ✅ `/api/contact-exchange/confirm` | ✅ 完全匹配 |
| 交换状态 | `/contact-exchange/status/:partnerId` | ✅ `/api/contact-exchange/status/:partnerId` | ✅ 完全匹配 |
| 已交换联系方式 | `/contact-exchange/contact/:partnerId` | ✅ `/api/contact-exchange/contact/:partnerId` | ✅ 完全匹配 |

**这是唯一完全匹配的模块** 🎉

---

### 3. 成长系统API路径不匹配

| 前端期望 | 后端实际 | 状态 |
|---------|---------|------|
| `/ability/radar` | `/api/growth/ability-radar/latest` | ⚠️ 路径不同 |
| `/ability/growth-comparison` | `/api/growth/comparison-reports/latest` | ⚠️ 路径不同 |
| 无定义 | `/api/growth/assessment` | ⚠️ 前端未调用 |
| 无定义 | `/api/growth/growth-path/generate` | ⚠️ 前端未调用 |
| 无定义 | `/api/growth/graduation-report/generate` | ⚠️ 前端未调用 |

---

## 📊 统计汇总

### 前端API模块统计
- **定义的API模块**: 48个
- **定义的端点总数**: 约400+个

### 后端路由统计
- **实际路由文件**: 13个
- **实际端点总数**: 约80个

### 匹配度分析
| 类别 | 数量 | 百分比 |
|------|------|--------|
| 前端调用但后端不存在 | ~350个 | 87.5% |
| 后端存在但前端未用 | ~30个 | 37.5% |
| 完全匹配 | ~5个 | 1.25% |
| 路径不匹配但功能相似 | ~15个 | 3.75% |

---

## 🎯 关键发现

### 1. BASE_URL致命错误
**前端**: `BASE_URL = getApiUrl('/api/v1')`  
**后端**: 所有路由使用 `/api`  
**结果**: 100% API调用404

### 2. 认证体系完全不同
- **前端**: 手机号+验证码/密码登录
- **后端**: 仅支持微信小程序登录
- **结果**: 注册、登录功能完全无法使用

### 3. 核心业务功能缺失
以下核心模块在后端**完全不存在**:
- 任务系统 (taskAPI) - 任务市场、接单、提交
- AI导师系统 (mentorAPI/mentorStageAPI) - 所有AI对话功能
- 能力系统 (abilityAPI) - 六维雷达图、成长轨迹
- OPC测评系统 (testAPI/opcAPI/opcV2API)
- 等级系统 (levelAPI)
- 故事墙 (storyAPI)

### 4. 大量未使用的后端功能
后端实现了以下完整功能但前端未集成:
- 收藏系统 (favorites)
- 成就系统 (achievements)
- 秘密空间 (secret-space)
- 任务进度拆解 (task-progress)
- 真实项目 (real-projects)

### 5. 唯一匹配的模块
只有 `contactExchangeAPI` 前后端完全匹配

---

## 💡 建议

### P0 优先级 (立即修复)
1. **修复BASE_URL不匹配**: 前端改为 `/api` 或后端添加 `/v1` 路由
2. **统一认证体系**: 决定使用微信登录还是手机号登录
3. **实现核心任务系统**: 后端补充 `/api/tasks/*` 业务任务API

### P1 高优先级
4. **实现OPC测评系统**: `/api/opc/*` 或 `/api/student/test/*`
5. **实现能力系统**: 统一前端 `abilityAPI` 和后端 `/api/growth/*`
6. **实现AI导师基础功能**: `/api/mentor/chat` 对话接口

### P2 中优先级
7. **集成后端已有功能**: 收藏、成就、秘密空间、任务进度
8. **补充等级系统**: `/api/level/*`
9. **补充故事墙**: `/api/story/*`

### P3 低优先级
10. **决策40+个未实现模块**: 哪些是真实需求，哪些是过度设计

---

## 🔍 架构问题分析

### 问题1: 前端API定义过度
前端定义了48个API模块、400+个端点，但大部分未实现，可能原因:
- 前端先行设计了完整的功能蓝图
- 复制了大量计划中但未开发的功能
- 缺少前后端API设计对齐机制

### 问题2: 后端聚焦点不同
后端实现了:
- 微信登录 (前端期望手机号登录)
- 真实项目系统 (前端未调用)
- 收藏/成就/秘密空间 (前端未集成)
- 成长报告/毕业报告 (前端路径不匹配)

### 问题3: 缺少API文档和对齐流程
- 没有统一的API规范文档
- 前后端使用不同的路径约定
- 缺少版本管理机制

---

## 🚀 下一步行动

1. **立即修复BASE_URL** - 让基础通信工作
2. **对齐认证体系** - 让用户能登录
3. **实现核心MVP** - 任务系统 + OPC测评 + 基础导师
4. **清理前端未使用API** - 删除或标记为"计划中"
5. **集成后端已有功能** - 充分利用已开发的收藏/成就系统
6. **建立API文档** - 使用OpenAPI/Swagger统一管理

---

**生成时间**: 2026-07-17  
**分析文件**: 前端 api.ts (1721行) + 后端 13个路由文件  
**关键结论**: 前后端严重不匹配，87.5%的前端API调用会失败
