# 启程项目前后端API对齐分析报告

## 📊 总体情况

- **后端路由总数**: 302 个
- **前端API调用总数**: 185 个
- **匹配成功**: 18 个 (6.0%)
- **后端有但前端未调用**: 284 个
- **前端调用但后端未实现**: 167 个

## 🔴 严重问题：对齐率仅 6%

这意味着前后端基本处于"各自开发"的状态，大量功能无法正常工作。

---

## 🎯 核心问题分析

### 问题1：路由路径不一致

**现象**：
- 前端调用：`GET /tasks/market`
- 后端实现：`GET /api/v1/tasks/market` 或 `GET /market`

**原因**：
- 前端 `api.ts` 中的 `BASE_URL = 'http://localhost:3000/api/v1'`
- 前端调用时使用相对路径：`request('/tasks/market')`
- 实际请求：`http://localhost:3000/api/v1/tasks/market`
- 但后端某些路由可能注册在不同的前缀下

### 问题2：AI引擎API完全缺失

**前端调用的AI引擎API**（10个）：
```
GET  /api/v1/ai-engine/decompose/:taskId
GET  /api/v1/ai-engine/qa/history
GET  /api/v1/ai-engine/requirement/:sessionId/result
GET  /api/v1/ai-engine/review/:reviewId
POST /api/v1/ai-engine/decompose
POST /api/v1/ai-engine/qa
POST /api/v1/ai-engine/requirement/continue
POST /api/v1/ai-engine/requirement/start
POST /api/v1/ai-engine/review/submit
```

**后端实际实现**：
- 后端有 `aiEngineRoutes`，但路径可能不匹配
- 需要检查 `backend/src/routes/aiEngine.ts` 的实际路由定义

### 问题3：核心任务API缺失

**前端调用但后端未实现的核心API**：
```
GET  /tasks/market          # 任务市场列表
GET  /tasks/matched         # 智能匹配任务
GET  /tasks/recommended     # 推荐任务
GET  /tasks/my              # 我的任务
GET  /tasks/:id             # 任务详情
GET  /tasks/:id/steps       # 任务步骤
POST /tasks/:id/accept      # 接取任务
POST /tasks/:id/submit      # 提交任务
POST /tasks/:id/progress    # 更新进度
```

这些是**学生端最核心的功能**，如果缺失，学生无法：
- 浏览任务
- 接取任务
- 查看任务详情
- 提交作品

### 问题4：能力系统API缺失

```
GET  /ability/radar         # 六维雷达图
GET  /ability/timeline      # 成长时间线
GET  /ability/emotion-state # 情绪状态
POST /ability/update-after-task # 任务完成后更新能力
```

### 问题5：企业端API缺失

```
GET  /company/tasks                        # 企业任务列表
GET  /company/tasks/:id                    # 任务详情
GET  /company/tasks/:id/matched-students   # 匹配的学生
GET  /company/tasks/:id/progress           # 任务进度
POST /company/tasks/publish                # 发布任务
POST /company/tasks/:id/verify             # 验收任务
POST /company/match/students               # 智能匹配学生
```

---

## 🛠️ 修复方案

### 方案A：修改前端API调用（推荐）

**优点**：
- 后端已经实现了大部分功能，只是路径不同
- 改动量小，风险低
- 可以快速验证功能

**步骤**：
1. 检查后端实际实现的路由路径
2. 修改前端 `miniapp/src/services/api.ts` 中的API调用路径
3. 逐个功能模块对齐

**示例**：
```typescript
// 修改前
export const taskAPI = {
  getList: () => request('/tasks/market'),
  getDetail: (id: string) => request(`/tasks/${id}`),
}

// 修改后（假设后端实现在 /task-level/）
export const taskAPI = {
  getList: () => request('/task-level/company/list'),
  getDetail: (id: string) => request(`/task-level/${id}`),
}
```

### 方案B：补充后端缺失的API

**优点**：
- 前端代码不需要改动
- API设计更符合RESTful规范

**缺点**：
- 工作量大
- 需要实现167个缺失的API

**步骤**：
1. 创建缺失的路由文件
2. 实现业务逻辑
3. 连接数据库
4. 编写测试

---

## 📋 立即行动清单

### 第一步：确认后端实际路由（30分钟）

运行以下命令，生成后端所有路由的完整列表：

```bash
cd /Users/alwan/code/qicheng/backend
grep -r "router\.(get|post|put|delete|patch)" src/routes/ --include="*.ts" | \
  sed 's/.*router\.\([a-z]*\).*['"'"'"`]\([^'"'"'"`]*\)['"'"'"`].*/\1 \2/' | \
  sort | uniq > actual-backend-routes.txt
```

### 第二步：核心功能优先对齐（2小时）

按优先级修复以下模块：

#### 🔥 P0 - 核心流程（必须立即修复）
1. **用户认证**
   - `POST /auth/register`
   - `POST /auth/login`
   - `POST /auth/send-code`
   - `GET /auth/me`

2. **任务浏览与接取**
   - `GET /tasks/market`
   - `GET /tasks/:id`
   - `POST /tasks/:id/accept`

3. **任务提交**
   - `POST /tasks/:id/submit`
   - `GET /tasks/:id/steps`

#### ⚠️ P1 - 重要功能（1周内修复）
4. **AI导师对话**
   - `POST /mentor/chat`
   - `GET /mentor/:taskId/history`

5. **能力画像**
   - `GET /ability/radar`
   - `GET /ability/timeline`

6. **任务匹配**
   - `GET /tasks/matched`
   - `GET /tasks/recommended`

#### 📌 P2 - 增强功能（2周内修复）
7. **企业端功能**
8. **社群与作品展示**
9. **OPC测评系统**

### 第三步：创建路由映射文档（1小时）

创建一个 `API_MAPPING.md` 文档，记录：
```markdown
| 前端调用 | 后端实际路由 | 状态 | 负责人 |
|---------|-------------|------|--------|
| GET /tasks/market | GET /task-level/company/list | ✅ 已对齐 | - |
| GET /tasks/:id | GET /task-level/:taskId | ❌ 未实现 | 待分配 |
```

---

## 🔍 快速诊断命令

### 检查某个API是否实现

```bash
# 检查任务市场API
grep -r "'/market'" backend/src/routes/

# 检查任务详情API
grep -r "'/:.*id'" backend/src/routes/tasks/

# 检查AI引擎API
grep -r "ai-engine" backend/src/routes/
```

### 测试API是否可用

```bash
# 测试任务市场
curl http://localhost:3000/api/v1/tasks/market

# 测试任务详情
curl http://localhost:3000/api/v1/tasks/123

# 测试AI引擎
curl -X POST http://localhost:3000/api/v1/ai-engine/qa \
  -H "Content-Type: application/json" \
  -d '{"question":"测试问题"}'
```

---

## 💡 建议

### 短期（本周）
1. ✅ **先让核心流程跑通**：注册→登录→浏览任务→接取任务→提交任务
2. 📝 **创建API映射文档**：记录前后端实际对应关系
3. 🧪 **编写集成测试**：确保修复后的API能正常工作

### 中期（2周内）
1. 🔧 **补充缺失的API**：按优先级实现P1功能
2. 📚 **完善API文档**：使用Swagger生成API文档
3. 🎯 **前后端联调**：每个功能模块完成后立即联调

### 长期（1个月内）
1. 🏗️ **重构API设计**：统一RESTful规范
2. 🧪 **完善测试覆盖**：单元测试 + 集成测试
3. 📊 **监控API使用情况**：找出未使用的API并清理

---

## 📞 需要帮助？

如果你需要我帮你：
1. ✅ 检查某个具体API的实现情况
2. ✅ 修复某个功能模块的前后端对齐
3. ✅ 实现缺失的后端API
4. ✅ 编写API文档

请告诉我你想从哪个功能开始！

---

**生成时间**: 2026-05-03  
**对齐率**: 6.0% (18/302)  
**优先级**: 🔴 紧急
