# 🧪 启程平台完整测试执行方案

执行时间：2026-05-28  
测试范围：OPC v2.0 + AI导师触发 + 语义匹配 + WebSocket通知

---

## ✅ 任务1：运行数据库迁移

### 步骤1.1：检查PostgreSQL状态

```bash
# 检查PostgreSQL是否运行
psql -U postgres -c "SELECT version();"

# 检查数据库是否存在
psql -U postgres -c "\l" | grep qicheng
```

### 步骤1.2：运行迁移文件

```bash
cd /Users/alwan/code/qicheng/backend

# 迁移1：OPC v2.0系统
echo "========================================="
echo "运行迁移 087: OPC v2.0 系统"
echo "========================================="
psql -U postgres -d qicheng -f migrations/087_opc_v2_system.sql

# 迁移2：语义匹配引擎
echo "========================================="
echo "运行迁移 088: 语义匹配引擎"
echo "========================================="
psql -U postgres -d qicheng -f migrations/088_semantic_matching_engine.sql

# 迁移3：AI导师自动触发
echo "========================================="
echo "运行迁移 089: AI导师自动触发"
echo "========================================="
psql -U postgres -d qicheng -f migrations/089_mentor_auto_trigger.sql
```

### 步骤1.3：验证表创建

```bash
# 验证OPC v2.0表
echo "验证OPC v2.0表..."
psql -U postgres -d qicheng -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'opc_v2_%';"

# 验证AI导师表
echo "验证AI导师表..."
psql -U postgres -d qicheng -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'mentor_%';"

# 验证语义匹配表
echo "验证语义匹配表..."
psql -U postgres -d qicheng -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('student_capabilities', 'task_student_matches', 'task_translations');"

# 验证触发器
echo "验证PostgreSQL触发器..."
psql -U postgres -d qicheng -c "SELECT trigger_name, event_manipulation, event_object_table FROM information_schema.triggers WHERE trigger_name LIKE 'trigger_schedule_%';"
```

**预期结果**：
```
✅ opc_v2_assessments
✅ opc_v2_answers
✅ opc_v2_results
✅ mentor_messages
✅ mentor_trigger_logs
✅ student_capabilities
✅ task_student_matches
✅ task_translations
✅ trigger_schedule_t01
✅ trigger_schedule_t03
✅ trigger_schedule_t05
```

---

## ✅ 任务2：测试OPC v2.0 API

### 步骤2.1：启动后端服务

```bash
cd /Users/alwan/code/qicheng/backend
npm run dev
```

**在新终端窗口继续以下测试**

### 步骤2.2：获取测试用户Token

```bash
# 方法1：如果已有测试用户，直接登录
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800138000",
    "password": "Test123456"
  }'

# 方法2：如果没有，先注册
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800138001",
    "password": "Test123456",
    "code": "123456",
    "role": "student",
    "name": "测试学生"
  }'
```

**保存返回的token**，后续测试都需要用到：
```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 步骤2.3：测试OPC v2.0 - 获取题目

```bash
# API 1: 获取OPC v2.0题目
curl -X GET http://localhost:3000/api/v1/opc/v2/questions \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'
```

**验证点**：
- ✅ 返回200状态码
- ✅ 包含2道前置题（pre_questions）
- ✅ 包含36道选择题（questions）
- ✅ 每题有6个维度权重（d1-d6）

### 步骤2.4：测试OPC v2.0 - 提交答案

```bash
# API 2: 提交OPC v2.0答案
curl -X POST http://localhost:3000/api/v1/opc/v2/submit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "preAnswers": {
      "career_stage": "exploring",
      "primary_goal": "skill_development"
    },
    "answers": [
      {"questionId": 1, "answer": "A"},
      {"questionId": 2, "answer": "B"},
      {"questionId": 3, "answer": "C"},
      {"questionId": 4, "answer": "A"},
      {"questionId": 5, "answer": "B"},
      {"questionId": 6, "answer": "C"},
      {"questionId": 7, "answer": "A"},
      {"questionId": 8, "answer": "B"},
      {"questionId": 9, "answer": "C"},
      {"questionId": 10, "answer": "A"},
      {"questionId": 11, "answer": "B"},
      {"questionId": 12, "answer": "C"},
      {"questionId": 13, "answer": "A"},
      {"questionId": 14, "answer": "B"},
      {"questionId": 15, "answer": "C"},
      {"questionId": 16, "answer": "A"},
      {"questionId": 17, "answer": "B"},
      {"questionId": 18, "answer": "C"},
      {"questionId": 19, "answer": "A"},
      {"questionId": 20, "answer": "B"},
      {"questionId": 21, "answer": "C"},
      {"questionId": 22, "answer": "A"},
      {"questionId": 23, "answer": "B"},
      {"questionId": 24, "answer": "C"},
      {"questionId": 25, "answer": "A"},
      {"questionId": 26, "answer": "B"},
      {"questionId": 27, "answer": "C"},
      {"questionId": 28, "answer": "A"},
      {"questionId": 29, "answer": "B"},
      {"questionId": 30, "answer": "C"},
      {"questionId": 31, "answer": "A"},
      {"questionId": 32, "answer": "B"},
      {"questionId": 33, "answer": "C"},
      {"questionId": 34, "answer": "A"},
      {"questionId": 35, "answer": "B"},
      {"questionId": 36, "answer": "C"}
    ]
  }' \
  | jq '.'
```

**验证点**：
- ✅ 返回200状态码
- ✅ 返回assessmentId
- ✅ 返回6维度分数（d1-d6）
- ✅ 返回性格标签（personalityTags）
- ✅ 返回AI洞察（aiInsights）
- ✅ 返回自我认知分析（selfPerception）
- ✅ 返回赛道推荐（trackRecommendations）

### 步骤2.5：测试OPC v2.0 - 获取结果

```bash
# API 3: 获取OPC v2.0结果
curl -X GET http://localhost:3000/api/v1/opc/v2/result \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'
```

**验证点**：
- ✅ 返回完整的测评结果
- ✅ 包含AI生成的个性化分析
- ✅ 包含成长建议

### 步骤2.6：测试OPC v2.0 - 获取历史记录

```bash
# API 4: 获取历史记录
curl -X GET http://localhost:3000/api/v1/opc/v2/history \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'
```

### 步骤2.7：测试OPC v2.0 - 重新分析

```bash
# API 5: 重新分析（如果有assessmentId）
curl -X POST http://localhost:3000/api/v1/opc/v2/reanalyze \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assessmentId": "YOUR_ASSESSMENT_ID"
  }' \
  | jq '.'
```

---

## ✅ 任务3：测试AI导师自动触发系统

### 步骤3.1：验证Cron服务启动

检查后端服务日志，应该看到：
```
✅ Mentor trigger cron job started (every 30 seconds)
```

### 步骤3.2：创建测试订单

```bash
# 首先需要一个任务和订单
# 假设已有taskId和orderId，如果没有需要先创建

# 创建任务（企业端操作，这里简化）
# 创建订单（学生接单）
```

### 步骤3.3：测试T-01触发（接单后30秒）

```bash
# 手动触发T-01（测试用）
curl -X POST http://localhost:3000/api/v1/mentor-trigger/t01/YOUR_ORDER_ID \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'
```

**验证点**：
- ✅ 返回200状态码
- ✅ 创建了mentor_trigger_logs记录
- ✅ scheduled_at = NOW() + 30秒
- ✅ 30秒后，cron job自动执行
- ✅ 生成AI导师消息

### 步骤3.4：测试T-03触发（打回后5秒）

```bash
# 手动触发T-03（测试用）
curl -X POST http://localhost:3000/api/v1/mentor-trigger/t03/YOUR_ORDER_ID \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'
```

**验证点**：
- ✅ scheduled_at = NOW() + 5秒
- ✅ 5秒后自动执行
- ✅ 生成鼓励和指导消息

### 步骤3.5：测试T-05触发（完成后10秒）

```bash
# 手动触发T-05（测试用）
curl -X POST http://localhost:3000/api/v1/mentor-trigger/t05/YOUR_ORDER_ID \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'
```

**验证点**：
- ✅ scheduled_at = NOW() + 10秒
- ✅ 10秒后自动执行
- ✅ 生成庆祝和总结消息

### 步骤3.6：查看触发日志

```bash
# 获取订单的所有触发日志
curl -X GET http://localhost:3000/api/v1/mentor-trigger/logs/YOUR_ORDER_ID \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'
```

### 步骤3.7：查看AI导师消息

```bash
# 获取订单的所有AI导师消息
curl -X GET http://localhost:3000/api/v1/mentor-trigger/messages/YOUR_ORDER_ID \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'
```

### 步骤3.8：查看统计数据

```bash
# 获取24小时统计
curl -X GET http://localhost:3000/api/v1/mentor-trigger/stats \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'
```

**验证点**：
- ✅ 显示待处理数量
- ✅ 显示24小时内触发次数
- ✅ 显示各类型触发统计

### 步骤3.9：验证PostgreSQL触发器

```bash
# 模拟订单状态变更，验证触发器自动插入记录
psql -U postgres -d qicheng -c "
  -- 假设有订单ID
  UPDATE orders SET status = 'accepted' WHERE id = 'YOUR_ORDER_ID';
  
  -- 查看是否自动创建了trigger_log
  SELECT * FROM mentor_trigger_logs WHERE order_id = 'YOUR_ORDER_ID' ORDER BY created_at DESC LIMIT 5;
"
```

---

## ✅ 任务4：测试WebSocket通知系统

### 步骤4.1：验证WebSocket服务启动

检查后端日志，应该看到：
```
✅ WebSocket service initialized
```

### 步骤4.2：测试WebSocket连接（使用wscat）

```bash
# 安装wscat（如果没有）
npm install -g wscat

# 连接WebSocket
wscat -c "ws://localhost:3000?token=$TOKEN"
```

**验证点**：
- ✅ 连接成功
- ✅ 收到连接确认消息

### 步骤4.3：测试心跳机制

连接后，每30秒应该收到心跳：
```json
{"type": "ping"}
```

客户端应该回复：
```json
{"type": "pong"}
```

### 步骤4.4：测试通知推送

在另一个终端触发通知：

```bash
# 触发AI任务完成通知
curl -X POST http://localhost:3000/api/v1/test/send-notification \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "ai_task_complete",
    "title": "AI分析完成",
    "message": "您的OPC测评分析已完成",
    "data": {"assessmentId": "test-123"}
  }'
```

**验证点**：
- ✅ WebSocket客户端收到通知
- ✅ 通知格式正确
- ✅ 包含type, title, message, data字段

### 步骤4.5：测试前端WebSocket Hook

启动前端服务：
```bash
cd /Users/alwan/code/qicheng/miniapp
npm run dev:weapp
```

在微信开发者工具中：
1. 打开任意页面
2. 查看控制台，应该看到：
   ```
   WebSocket连接成功
   ```
3. 触发通知，查看是否收到

### 步骤4.6：测试通知中心页面

1. 在小程序中导航到通知中心页面
2. 验证功能：
   - ✅ 显示通知列表
   - ✅ 未读/全部筛选
   - ✅ 标记已读
   - ✅ 全部标记已读
   - ✅ 清空通知
   - ✅ 点击通知跳转

### 步骤4.7：测试通知铃铛组件

1. 在导航栏查看通知铃铛
2. 验证功能：
   - ✅ 显示未读数量
   - ✅ 红点提示
   - ✅ 点击跳转到通知中心
   - ✅ 在线状态指示器

---

## ✅ 任务5：完整测试清单

### 5.1 后端API测试清单

#### OPC v2.0 API（5个端点）
- [ ] GET /api/v1/opc/v2/questions - 获取题目
- [ ] POST /api/v1/opc/v2/submit - 提交答案
- [ ] GET /api/v1/opc/v2/result - 获取结果
- [ ] GET /api/v1/opc/v2/history - 获取历史
- [ ] POST /api/v1/opc/v2/reanalyze - 重新分析

#### AI导师触发API（10个端点）
- [ ] POST /api/v1/mentor-trigger/t01/:orderId - 手动触发T-01
- [ ] POST /api/v1/mentor-trigger/t03/:orderId - 手动触发T-03
- [ ] POST /api/v1/mentor-trigger/t05/:orderId - 手动触发T-05
- [ ] GET /api/v1/mentor-trigger/messages/:orderId - 获取消息
- [ ] PATCH /api/v1/mentor-trigger/messages/:messageId/view - 标记已查看
- [ ] GET /api/v1/mentor-trigger/logs/:orderId - 获取日志
- [ ] GET /api/v1/mentor-trigger/pending - 获取待处理
- [ ] GET /api/v1/mentor-trigger/stats - 获取统计
- [ ] POST /api/v1/mentor-trigger/process - 手动处理
- [ ] DELETE /api/v1/mentor-trigger/logs/:logId - 删除日志

#### 语义匹配API（已有服务）
- [ ] GET /api/v1/tasks/matched - 获取匹配任务
- [ ] GET /api/v1/tasks/recommended - 获取推荐任务

#### WebSocket通知
- [ ] WebSocket连接
- [ ] 心跳机制
- [ ] 通知推送
- [ ] 断线重连

### 5.2 前端功能测试清单

#### OPC v2.0前端
- [ ] 测评页面显示38题
- [ ] 答题进度显示
- [ ] 提交答案
- [ ] 结果页面显示
- [ ] AI洞察展示
- [ ] 自我认知分析
- [ ] 赛道推荐显示
- [ ] 雷达图渲染

#### AI导师自动触发前端
- [ ] AutoTriggerMessage组件显示
- [ ] T-01消息样式
- [ ] T-03消息样式
- [ ] T-05消息样式
- [ ] 自动标记已查看
- [ ] 集成到导师对话页

#### 语义匹配前端
- [ ] 推荐任务列表
- [ ] 6维度匹配显示
- [ ] 匹配理由展示
- [ ] 匹配分数显示

#### AI预审核前端
- [ ] PreReviewResult组件
- [ ] 通过概率显示
- [ ] 关键问题列表
- [ ] 建议列表
- [ ] 亮点列表
- [ ] 集成到提交页面

#### WebSocket通知前端
- [ ] useWebSocket Hook
- [ ] 通知中心页面
- [ ] 通知铃铛组件
- [ ] 未读统计
- [ ] 标记已读
- [ ] 智能跳转

### 5.3 数据库测试清单

#### 表创建验证
- [ ] opc_v2_assessments
- [ ] opc_v2_answers
- [ ] opc_v2_results
- [ ] mentor_messages
- [ ] mentor_trigger_logs
- [ ] student_capabilities
- [ ] task_student_matches
- [ ] task_translations

#### 触发器验证
- [ ] trigger_schedule_t01
- [ ] trigger_schedule_t03
- [ ] trigger_schedule_t05

#### 索引验证
- [ ] 向量索引（ivfflat）
- [ ] 外键索引
- [ ] 查询性能索引

### 5.4 集成测试清单

#### 端到端流程1：OPC测评完整流程
- [ ] 学生登录
- [ ] 开始测评
- [ ] 完成38题
- [ ] 提交答案
- [ ] AI分析（Claude API调用）
- [ ] 查看结果
- [ ] 查看AI洞察
- [ ] 查看赛道推荐

#### 端到端流程2：AI导师自动触发流程
- [ ] 学生接单
- [ ] PostgreSQL触发器插入T-01记录
- [ ] 30秒后cron job执行
- [ ] AI生成引导消息
- [ ] 学生查看消息
- [ ] 自动标记已查看

#### 端到端流程3：WebSocket通知流程
- [ ] 学生登录
- [ ] WebSocket自动连接
- [ ] 后端触发事件
- [ ] 推送通知
- [ ] 前端接收通知
- [ ] 显示未读数量
- [ ] 点击查看详情

### 5.5 性能测试清单

#### API响应时间
- [ ] OPC提交 < 2000ms（含AI调用）
- [ ] 获取题目 < 200ms
- [ ] 获取结果 < 300ms
- [ ] AI导师消息生成 < 1500ms
- [ ] WebSocket连接 < 100ms

#### 并发测试
- [ ] 10个用户同时提交OPC
- [ ] 50个WebSocket同时连接
- [ ] 100个触发器同时执行

#### 数据库性能
- [ ] 向量检索 < 500ms
- [ ] 复杂查询 < 1000ms

### 5.6 安全测试清单

#### 认证授权
- [ ] 无Token访问保护接口 → 401
- [ ] 过期Token → 401
- [ ] 跨用户访问 → 403

#### 数据验证
- [ ] SQL注入防护
- [ ] XSS防护
- [ ] CSRF防护

#### WebSocket安全
- [ ] Token验证
- [ ] 消息来源验证
- [ ] 频率限制

---

## 📊 测试结果记录

### 测试执行记录表

| 测试项 | 状态 | 执行时间 | 备注 |
|--------|------|----------|------|
| 数据库迁移 | ⏳ | - | - |
| OPC v2.0 API | ⏳ | - | - |
| AI导师触发 | ⏳ | - | - |
| WebSocket通知 | ⏳ | - | - |
| 前端集成 | ⏳ | - | - |
| 性能测试 | ⏳ | - | - |
| 安全测试 | ⏳ | - | - |

### 发现的问题

| 问题ID | 严重程度 | 描述 | 状态 | 解决方案 |
|--------|----------|------|------|----------|
| - | - | - | - | - |

---

## 🎯 测试完成标准

- [ ] 所有数据库迁移成功执行
- [ ] 所有API端点返回正确响应
- [ ] 所有前端功能正常显示
- [ ] AI导师自动触发正常工作
- [ ] WebSocket实时通知正常
- [ ] 无严重bug
- [ ] 性能指标达标
- [ ] 安全测试通过

---

## 🚀 下一步

测试完成后：
1. 修复发现的问题
2. 优化性能瓶颈
3. 完善错误处理
4. 准备上线部署

---

**测试开始时间**：_____________  
**测试完成时间**：_____________  
**测试执行人**：_____________  
**测试结果**：✅ 通过 / ❌ 未通过
