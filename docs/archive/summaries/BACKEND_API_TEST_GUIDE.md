# 后端API测试指南

## 📋 测试前准备

### 1. 运行数据库迁移
```bash
# 确保PostgreSQL正在运行
# 运行迁移文件
psql -U postgres -d qicheng -f migrations/087_opc_v2_system.sql
psql -U postgres -d qicheng -f migrations/088_semantic_matching_engine.sql
psql -U postgres -d qicheng -f migrations/089_mentor_auto_trigger.sql
```

### 2. 启动后端服务
```bash
cd backend
npm run dev
```

服务应该在 `http://localhost:3000` 启动，并显示：
- ✅ Mentor trigger cron job started (every 30 seconds)
- ✅ 启程 Backend started

---

## 🧪 OPC v2.0 API 测试

### 1. 开始测评
```bash
POST http://localhost:3000/api/v1/opc-v2/start
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "assessmentId": "uuid",
    "status": "in_progress",
    "currentStep": "pre_questions"
  }
}
```

### 2. 提交前置定义题答案
```bash
POST http://localhost:3000/api/v1/opc-v2/answer
Authorization: Bearer <token>
Content-Type: application/json

{
  "assessmentId": "uuid",
  "questionType": "pre_question",
  "questionNumber": 1,
  "answer": "创新,坚持,热情"
}

Response:
{
  "success": true,
  "data": {
    "saved": true,
    "nextStep": "pre_questions" // 或 "choice_questions"
  }
}
```

### 3. 提交选择题答案
```bash
POST http://localhost:3000/api/v1/opc-v2/answer
Authorization: Bearer <token>
Content-Type: application/json

{
  "assessmentId": "uuid",
  "questionType": "choice_question",
  "questionNumber": 1,
  "dimension": "openness",
  "answer": "A"
}
```

### 4. 完成测评（触发AI分析）
```bash
POST http://localhost:3000/api/v1/opc-v2/:assessmentId/complete
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "resultId": "uuid",
    "status": "completed",
    "message": "AI正在分析你的画像..."
  }
}
```

### 5. 获取测评结果
```bash
GET http://localhost:3000/api/v1/opc-v2/:assessmentId/result
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "studentId": "uuid",
    "scores": {
      "openness": 85,
      "persistence": 78,
      "creativity": 92,
      "learning": 88,
      "collaboration": 75,
      "resilience": 80
    },
    "personalityTags": ["创新者", "独立思考者", "快速学习者"],
    "selfPerceptionAnalysis": "你对自己的认知...",
    "aiInsights": "基于你的回答，我看到...",
    "trackRecommendations": [
      {
        "track": "技术创新",
        "matchScore": 0.92,
        "reason": "你的创造力和学习能力..."
      }
    ],
    "createdAt": "2026-05-28T..."
  }
}
```

### 6. 获取最新测评结果
```bash
GET http://localhost:3000/api/v1/opc-v2/latest
Authorization: Bearer <token>
```

---

## 🤖 AI导师自动触发系统测试

### 测试场景1：T-01触发（接单后30秒）

#### 步骤1：创建订单并接单
```bash
# 学生接受任务
POST http://localhost:3000/api/v1/orders/:orderId/accept
Authorization: Bearer <student_token>
```

#### 步骤2：检查触发日志
```bash
# 应该自动创建一条T-01触发记录
GET http://localhost:3000/api/v1/mentor-trigger/logs/:orderId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "orderId": "uuid",
      "triggerType": "T-01",
      "status": "pending",
      "scheduledAt": "2026-05-28T10:00:30Z", // 30秒后
      "triggeredAt": null,
      "messageId": null,
      "createdAt": "2026-05-28T10:00:00Z"
    }
  ]
}
```

#### 步骤3：等待30秒后检查
```bash
# 30秒后，定时任务应该已执行
GET http://localhost:3000/api/v1/mentor-trigger/logs/:orderId

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "triggerType": "T-01",
      "status": "triggered", // 已触发
      "triggeredAt": "2026-05-28T10:00:35Z",
      "messageId": "uuid" // 已生成消息
    }
  ]
}
```

#### 步骤4：查看生成的导师消息
```bash
GET http://localhost:3000/api/v1/mentor-trigger/messages/:orderId
Authorization: Bearer <student_token>

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "role": "assistant",
      "content": "嗨！看到你接下了这个任务...",
      "context": "task_start",
      "triggeredBy": "T-01",
      "autoTriggered": true,
      "studentViewed": false,
      "createdAt": "2026-05-28T10:00:35Z"
    }
  ]
}
```

### 测试场景2：T-03触发（打回后）

#### 步骤1：企业打回订单
```bash
POST http://localhost:3000/api/v1/orders/:orderId/reject
Authorization: Bearer <company_token>
Content-Type: application/json

{
  "reason": "代码质量不符合要求，需要优化性能"
}
```

#### 步骤2：检查触发（应该5秒后触发）
```bash
GET http://localhost:3000/api/v1/mentor-trigger/logs/:orderId

# 应该看到T-03记录，scheduledAt是5秒后
```

#### 步骤3：查看T-03消息
```bash
GET http://localhost:3000/api/v1/mentor-trigger/messages/:orderId

# 应该看到翻译后的修改建议
```

### 测试场景3：T-05触发（完成后）

#### 步骤1：订单完成
```bash
POST http://localhost:3000/api/v1/orders/:orderId/complete
Authorization: Bearer <company_token>
```

#### 步骤2：检查触发（应该10秒后触发）
```bash
GET http://localhost:3000/api/v1/mentor-trigger/logs/:orderId

# 应该看到T-05记录
```

#### 步骤3：查看T-05庆祝消息
```bash
GET http://localhost:3000/api/v1/mentor-trigger/messages/:orderId

# 应该看到成长回顾和庆祝消息
```

### 手动触发测试（用于调试）

```bash
# 手动触发T-01
POST http://localhost:3000/api/v1/mentor-trigger/t01/:orderId
Authorization: Bearer <token>

# 手动触发T-03
POST http://localhost:3000/api/v1/mentor-trigger/t03/:orderId
Authorization: Bearer <token>

# 手动触发T-05
POST http://localhost:3000/api/v1/mentor-trigger/t05/:orderId
Authorization: Bearer <token>
```

### 监控API

```bash
# 获取待处理数量
GET http://localhost:3000/api/v1/mentor-trigger/pending-count
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "count": 3
  }
}

# 获取24小时统计
GET http://localhost:3000/api/v1/mentor-trigger/stats
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "triggerType": "T-01",
      "status": "triggered",
      "count": 15
    },
    {
      "triggerType": "T-03",
      "status": "triggered",
      "count": 8
    },
    {
      "triggerType": "T-05",
      "status": "triggered",
      "count": 12
    }
  ]
}

# 手动触发处理（测试用）
POST http://localhost:3000/api/v1/mentor-trigger/process-now
Authorization: Bearer <token>
```

---

## ✅ 验证清单

### OPC v2.0系统
- [ ] 可以开始新测评
- [ ] 可以提交前置定义题答案
- [ ] 可以提交36道选择题答案
- [ ] 完成后触发AI分析
- [ ] AI生成个性化画像
- [ ] 6维度分数正确计算
- [ ] 性格标签合理
- [ ] 赛道推荐有理由
- [ ] 可以获取最新结果

### AI导师自动触发系统
- [ ] 接单后30秒自动创建T-01记录
- [ ] 定时任务每30秒执行一次
- [ ] T-01消息个性化（引用OPC画像）
- [ ] 打回后5秒自动创建T-03记录
- [ ] T-03消息翻译企业反馈
- [ ] 完成后10秒自动创建T-05记录
- [ ] T-05消息回顾成长历程
- [ ] 触发日志正确记录状态
- [ ] 失败时记录错误信息
- [ ] 手动触发API正常工作
- [ ] 监控API返回正确数据

### 数据库触发器
- [ ] orders表状态变为accepted时自动插入T-01记录
- [ ] orders表状态变为rejected时自动插入T-03记录
- [ ] orders表状态变为completed/confirmed时自动插入T-05记录
- [ ] 触发器不会重复插入记录

---

## 🐛 常见问题

### 1. 定时任务没有执行
**检查**：
```bash
# 查看后端日志
# 应该看到：Mentor trigger cron job started (every 30 seconds)
# 每30秒应该有：Processing X pending mentor triggers
```

### 2. AI消息生成失败
**检查**：
```bash
# 查看触发日志的error_message字段
GET http://localhost:3000/api/v1/mentor-trigger/logs/:orderId

# 常见原因：
# - Claude API key未配置
# - 订单数据不完整
# - 学生OPC画像不存在
```

### 3. 触发器没有创建记录
**检查**：
```sql
-- 检查PostgreSQL触发器是否存在
SELECT tgname FROM pg_trigger WHERE tgname LIKE 'trigger_schedule%';

-- 应该看到：
-- trigger_schedule_t01
-- trigger_schedule_t03
-- trigger_schedule_t05
```

---

## 📊 性能监控

### 定时任务性能
```bash
# 查看日志中的处理时间
# 正常情况下，每次处理应该在1-2秒内完成
# 如果超过5秒，需要优化
```

### AI生成性能
```bash
# T-01生成时间：约2-4秒
# T-03生成时间：约3-5秒（需要分析对话历史）
# T-05生成时间：约4-6秒（需要提取关键时刻）
```

---

## 🎯 下一步

测试通过后，进行前端集成：
1. 前端集成OPC结果页
2. 前端集成导师消息展示
3. 前端集成匹配功能
4. 全面验收测试
