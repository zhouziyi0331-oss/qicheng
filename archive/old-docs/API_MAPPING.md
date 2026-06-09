# 前后端API映射表

> 生成时间: 2026-05-02T16:21:13.821Z

## 统计

- 总API数: 41
- 已实现: 27 (65.9%)
- 需实现: 0 (0.0%)

---

## 认证相关

| 前端调用 | 后端实际 | 状态 | 修复方案 |
|---------|---------|------|----------|
| `POST /auth/register` | `POST /api/v1/auth/register` | ✅ 已实现 | - |
| `POST /auth/login` | `POST /api/v1/auth/login` | ✅ 已实现 | - |
| `POST /auth/send-code` | `POST /api/v1/auth/send-code` | ✅ 已实现 | - |
| `GET /auth/me` | `❌ 缺失` | 需要实现 | 添加到 auth/index.ts |

## 任务相关

| 前端调用 | 后端实际 | 状态 | 修复方案 |
|---------|---------|------|----------|
| `GET /tasks/market` | `GET /api/v1/tasks/market` | ✅ 已实现 | - |
| `GET /tasks/matched` | `❌ 缺失` | 需要实现 | 添加到 tasks/index.ts |
| `GET /tasks/recommended` | `GET /api/v1/tasks/recommended` | ✅ 已实现 | - |
| `GET /tasks/my` | `GET /api/v1/tasks/my` | ✅ 已实现 | - |
| `GET /tasks/:id` | `GET /api/v1/tasks/:id` | ✅ 已实现 | - |
| `GET /tasks/:id/steps` | `GET /api/v1/tasks/:id/steps` | ✅ 已实现 | - |
| `POST /tasks/:id/accept` | `POST /api/v1/tasks/:id/accept` | ✅ 已实现 | - |
| `POST /tasks/:id/submit` | `POST /api/v1/tasks/:id/submit` | ✅ 已实现 | - |
| `POST /tasks/:id/progress` | `❌ 缺失` | 需要实现 | 添加到 tasks/index.ts |

## 能力系统

| 前端调用 | 后端实际 | 状态 | 修复方案 |
|---------|---------|------|----------|
| `GET /ability/radar` | `GET /api/v1/ability/radar` | ✅ 已实现 | - |
| `GET /ability/timeline` | `GET /api/v1/ability/timeline` | ✅ 已实现 | - |
| `GET /ability/emotion-state` | `❌ 缺失` | 需要实现 | 添加到 ability/index.ts |
| `POST /ability/update-after-task` | `❌ 缺失` | 需要实现 | 添加到 ability/index.ts |

## AI导师

| 前端调用 | 后端实际 | 状态 | 修复方案 |
|---------|---------|------|----------|
| `POST /mentor/chat` | `POST /api/v1/mentor/chat` | ✅ 已实现 | - |
| `GET /mentor/:taskId/history` | `GET /api/v1/mentor/:taskId/history` | ✅ 已实现 | - |
| `GET /mentor/:taskId/first-step` | `GET /api/v1/mentor/:taskId/first-step` | ✅ 已实现 | - |
| `POST /mentor/:taskId/stuck` | `❌ 缺失` | 需要实现 | 添加到 mentor/index.ts |
| `POST /mentor/:taskId/rejection-guidance` | `❌ 缺失` | 需要实现 | 添加到 mentor/index.ts |
| `POST /mentor/:taskId/milestone` | `❌ 缺失` | 需要实现 | 添加到 mentor/index.ts |

## 通知系统

| 前端调用 | 后端实际 | 状态 | 修复方案 |
|---------|---------|------|----------|
| `GET /notifications` | `GET /api/v1/notifications` | ✅ 已实现 | - |
| `GET /notifications/unread-count` | `❌ 缺失` | 需要实现 | 添加到 notifications/index.ts |
| `POST /notifications/:id/read` | `PUT /api/v1/notifications/:id/read` | ✅ 已实现（方法不同） | - |
| `POST /notifications/read-all` | `PUT /api/v1/notifications/read-all` | ✅ 已实现（方法不同） | - |

## OPC测评

| 前端调用 | 后端实际 | 状态 | 修复方案 |
|---------|---------|------|----------|
| `GET /student/test/questions` | `GET /api/v1/student/test/questions` | ✅ 已实现 | - |
| `POST /student/test/submit` | `POST /api/v1/student/test/submit` | ✅ 已实现 | - |
| `GET /student/test/result` | `❌ 缺失` | 需要实现 | 添加到 student/index.ts |
| `POST /opc/submit` | `POST /api/v1/opc/submit` | ✅ 已实现 | - |
| `GET /opc/result/:userId` | `GET /api/v1/opc/result/:userId` | ✅ 已实现 | - |
| `GET /opc/report/:userId` | `❌ 缺失` | 需要实现 | 添加到 opcRoutes.ts |

## 企业端

| 前端调用 | 后端实际 | 状态 | 修复方案 |
|---------|---------|------|----------|
| `POST /company/tasks/publish` | `POST /api/v1/tasks/company` | ✅ 已实现（路径不同） | - |
| `GET /company/tasks` | `GET /api/v1/tasks/company` | ✅ 已实现（路径不同） | - |
| `GET /company/tasks/:id` | `GET /api/v1/tasks/:id` | ✅ 已实现 | - |
| `GET /company/tasks/:id/matched-students` | `❌ 缺失` | 需要实现 | 添加到 tasks/companyController.ts |
| `GET /company/tasks/:id/progress` | `GET /api/v1/company/tasks/:taskId/progress` | ✅ 已实现 | - |
| `POST /company/tasks/:id/verify` | `POST /api/v1/tasks/company/:id/approve` | ✅ 已实现（路径不同） | - |
| `POST /company/tasks/:id/cancel` | `❌ 缺失` | 需要实现 | 添加到 tasks/companyController.ts |
| `POST /company/tasks/:id/assign` | `❌ 缺失` | 需要实现 | 添加到 tasks/companyController.ts |

## 修复指南

### 方案A: 修改前端API调用（推荐）

修改 `miniapp/src/services/api.ts`，将前端调用路径改为后端实际路径。

**示例**:
```typescript
// 修改前
export const taskAPI = {
  getList: () => request('/tasks/market'),
}

// 修改后
export const taskAPI = {
  getList: () => request('/tasks/market'), // 路径正确，无需修改
}
```

### 方案B: 补充缺失的后端API

对于标记为 ❌ 的API，需要在对应的路由文件中添加实现。

