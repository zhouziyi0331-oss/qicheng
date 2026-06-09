# 🧪 启程平台测试执行指南

## 📋 测试前准备清单

### 环境要求
- [ ] PostgreSQL 14+ 已安装并运行
- [ ] Node.js 16+ 已安装
- [ ] 微信开发者工具已安装
- [ ] 后端依赖已安装 (`npm install`)
- [ ] 前端依赖已安装 (`npm install`)

---

## 🚀 第一步：启动服务

### 1.1 运行数据库迁移

```bash
cd /Users/alwan/code/qicheng/backend

# 检查PostgreSQL是否运行
psql -U postgres -c "SELECT version();"

# 运行迁移文件
echo "运行OPC v2.0迁移..."
psql -U postgres -d qicheng -f migrations/087_opc_v2_system.sql

echo "运行语义匹配引擎迁移..."
psql -U postgres -d qicheng -f migrations/088_semantic_matching_engine.sql

echo "运行AI导师自动触发迁移..."
psql -U postgres -d qicheng -f migrations/089_mentor_auto_trigger.sql

# 验证表是否创建成功
echo "验证表创建..."
psql -U postgres -d qicheng -c "\dt opc_v2_*"
psql -U postgres -d qicheng -c "\dt mentor_*"
psql -U postgres -d qicheng -c "\dt student_capabilities"
psql -U postgres -d qicheng -c "\dt task_student_matches"
```

**预期输出**：
```
✅ opc_v2_assessments
✅ opc_v2_answers
✅ opc_v2_results
✅ mentor_messages
✅ mentor_trigger_logs
✅ student_capabilities
✅ task_student_matches
✅ task_translations
```

### 1.2 启动后端服务

```bash
cd /Users/alwan/code/qicheng/backend

# 启动开发服务器
npm run dev
```

**预期输出**：
```
✅ 启程 Backend started on port 3000
✅ WebSocket service initialized
✅ Mentor trigger cron job started (every 30 seconds)
```

**验证服务运行**：
```bash
# 在新终端窗口测试
curl http://localhost:3000/health

# 预期响应：
# {"status":"ok","service":"qicheng-backend","timestamp":"2026-05-29T..."}
```

### 1.3 启动前端服务

```bash
cd /Users/alwan/code/qicheng/miniapp

# 启动微信小程序开发服务器
npm run dev:weapp
```

**然后**：
1. 打开微信开发者工具
2. 导入项目（选择 `miniapp` 目录）
3. 确认编译成功

---

## 🧪 第二步：测试OPC v2.0 API

### 2.1 准备测试数据

首先需要一个测试用户token：

```bash
# 注册测试用户
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800138000",
    "password": "Test123456",
    "code": "123456",
    "role": "student",
    "username": "测试学生"
  }'

# 保存返回的token
export TOKEN="返回的token"
```

### 2.2 测试开始测评

```bash
curl -X POST http://localhost:3000/api/v1/opc-v2/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**预期响应**：
```json
{
  "success": true,
  "data": {
    "assessmentId": "uuid",
    "status": "in_progress",
    "currentStep": "pre_questions"
  }
}
```

**验证点**：
- [ ] 返回200状态码
- [ ] 返回assessmentId
- [ ] status为in_progress
- [ ] 数据库中创建了记录

```sql
-- 验证数据库
SELECT * FROM opc_v2_assessments WHERE student_id = 'your_user_id';
```

### 2.3 测试提交前置定义题

```bash
# 保存assessmentId
export ASSESSMENT_ID="上一步返回的assessmentId"

# 提交第一题
curl -X POST http://localhost:3000/api/v1/opc-v2/answer \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assessmentId": "'$ASSESSMENT_ID'",
    "questionType": "pre_question",
    "questionNumber": 1,
    "answer": "创新,坚持,热情"
  }'

# 提交第二题
curl -X POST http://localhost:3000/api/v1/opc-v2/answer \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assessmentId": "'$ASSESSMENT_ID'",
    "questionType": "pre_question",
    "questionNumber": 2,
    "answer": "我开发了一个完整的Web应用，从零开始学习并成功上线"
  }'
```

**验证点**：
- [ ] 两次请求都返回200
- [ ] 返回success: true
- [ ] 数据库中保存了答案

```sql
SELECT * FROM opc_v2_answers WHERE assessment_id = 'your_assessment_id';
```

### 2.4 测试提交36道选择题

```bash
# 提交所有选择题（示例：前6题）
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/v1/opc-v2/answer \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "assessmentId": "'$ASSESSMENT_ID'",
      "questionType": "choice_question",
      "questionNumber": '$i',
      "dimension": "openness",
      "answer": "A"
    }'
  sleep 0.5
done

# 继续提交其他30题...
# 或者使用脚本批量提交
```

**验证点**：
- [ ] 所有36题都提交成功
- [ ] 数据库中有36条choice_question记录

### 2.5 测试完成测评（触发AI分析）

```bash
curl -X POST http://localhost:3000/api/v1/opc-v2/$ASSESSMENT_ID/complete \
  -H "Authorization: Bearer $TOKEN"
```

**预期响应**：
```json
{
  "success": true,
  "data": {
    "resultId": "uuid",
    "status": "completed"
  }
}
```

**验证点**：
- [ ] 返回200状态码
- [ ] 返回resultId
- [ ] 触发AI分析（查看后端日志）
- [ ] 10秒内完成分析

**后端日志应该显示**：
```
Analyzing OPC v2.0 assessment...
Calling Claude API...
AI analysis completed
```

### 2.6 测试获取结果

```bash
curl -X GET http://localhost:3000/api/v1/opc-v2/$ASSESSMENT_ID/result \
  -H "Authorization: Bearer $TOKEN"
```

**预期响应**：
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "scores": {
      "openness": 85,
      "persistence": 78,
      "creativity": 92,
      "learning": 88,
      "collaboration": 75,
      "resilience": 80
    },
    "personalityTags": ["创新者", "独立思考者"],
    "aiInsights": "基于你的回答...",
    "selfPerceptionAnalysis": "你对自己的认知...",
    "trackRecommendations": [
      {
        "track": "技术创新",
        "matchScore": 0.92,
        "reason": "你的创造力和学习能力..."
      }
    ]
  }
}
```

**验证点**：
- [ ] 返回完整的结果数据
- [ ] 6个维度分数都在0-100之间
- [ ] personalityTags不为空
- [ ] aiInsights包含个性化内容
- [ ] selfPerceptionAnalysis引用了用户填写的词
- [ ] trackRecommendations有推荐理由

**数据库验证**：
```sql
SELECT * FROM opc_v2_results WHERE assessment_id = 'your_assessment_id';
```

### 2.7 前端测试

在微信开发者工具中：

1. **开始测评**
   - [ ] 点击"开始测评"按钮
   - [ ] 跳转到前置定义题页面
   - [ ] 页面正常显示

2. **填写前置定义题**
   - [ ] 可以输入三个词
   - [ ] 可以输入厉害的事
   - [ ] 字数限制正常工作
   - [ ] 点击"下一步"跳转到选择题

3. **完成36道选择题**
   - [ ] 36题正常显示
   - [ ] 可以选择A/B/C/D
   - [ ] 选择后自动跳到下一题
   - [ ] 进度条正确显示
   - [ ] 完成后显示"分析中"动画

4. **查看结果页面**
   - [ ] 自动跳转到结果页
   - [ ] 显示6维度分数
   - [ ] 显示性格标签
   - [ ] 显示AI洞察（橙色渐变背景）
   - [ ] 显示自我认知分析（蓝色渐变背景）
   - [ ] 显示赛道推荐（紫色渐变背景）
   - [ ] 样式美观，无错位

---

## 🧪 第三步：测试AI导师自动触发系统

### 3.1 准备测试环境

```bash
# 确认定时任务正在运行
# 查看后端日志，应该每30秒看到：
# "Checking for pending mentor triggers..."
```

### 3.2 测试T-01触发（接单后30秒）

**步骤**：

1. **创建测试任务**（企业端）
```bash
# 使用企业账号token
export COMPANY_TOKEN="企业token"

curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Authorization: Bearer $COMPANY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试任务",
    "description": "用于测试AI导师触发",
    "budget": 1000,
    "deadline": "2026-06-30"
  }'

export TASK_ID="返回的任务ID"
```

2. **学生接单**
```bash
curl -X POST http://localhost:3000/api/v1/tasks/$TASK_ID/accept \
  -H "Authorization: Bearer $TOKEN"

export ORDER_ID="返回的订单ID"
```

3. **等待30秒**
```bash
echo "等待30秒，观察后端日志..."
sleep 30
```

4. **检查触发日志**
```bash
curl -X GET http://localhost:3000/api/v1/mentor-trigger/logs/$ORDER_ID \
  -H "Authorization: Bearer $TOKEN"
```

**预期响应**：
```json
{
  "success": true,
  "data": [
    {
      "triggerType": "T-01",
      "status": "triggered",
      "scheduledAt": "2026-05-29T10:00:30Z",
      "triggeredAt": "2026-05-29T10:00:35Z",
      "messageId": "uuid"
    }
  ]
}
```

5. **检查生成的消息**
```bash
curl -X GET http://localhost:3000/api/v1/mentor-trigger/messages/$ORDER_ID \
  -H "Authorization: Bearer $TOKEN"
```

**预期响应**：
```json
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
      "createdAt": "2026-05-29T10:00:35Z"
    }
  ]
}
```

**验证点**：
- [ ] 30秒后自动创建触发记录
- [ ] 触发记录status为triggered
- [ ] 生成了导师消息
- [ ] 消息内容个性化
- [ ] 消息引用了学生的OPC画像

**数据库验证**：
```sql
-- 检查触发日志
SELECT * FROM mentor_trigger_logs WHERE order_id = 'your_order_id';

-- 检查消息
SELECT * FROM mentor_messages WHERE task_id = 'your_task_id' AND triggered_by = 'T-01';
```

**后端日志验证**：
```
应该看到：
✅ Processing 1 pending mentor triggers
✅ Executing T-01 for order xxx
✅ Successfully executed T-01, message_id: xxx
```

### 3.3 测试T-03触发（打回后5秒）

**步骤**：

1. **学生提交作品**
```bash
curl -X POST http://localhost:3000/api/v1/tasks/$TASK_ID/submit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "已完成任务",
    "fileUrls": ["http://example.com/work.pdf"]
  }'
```

2. **企业打回**
```bash
curl -X POST http://localhost:3000/api/v1/orders/$ORDER_ID/reject \
  -H "Authorization: Bearer $COMPANY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "代码质量不符合要求，需要优化性能和添加注释"
  }'
```

3. **等待5秒**
```bash
sleep 5
```

4. **检查T-03消息**
```bash
curl -X GET http://localhost:3000/api/v1/mentor-trigger/messages/$ORDER_ID \
  -H "Authorization: Bearer $TOKEN"
```

**验证点**：
- [ ] 5秒后自动创建T-03触发记录
- [ ] 生成了打回指导消息
- [ ] 消息翻译了企业反馈
- [ ] 提供了具体修改建议
- [ ] 语气鼓励而非批评

### 3.4 测试T-05触发（完成后10秒）

**步骤**：

1. **学生重新提交**
```bash
curl -X POST http://localhost:3000/api/v1/tasks/$TASK_ID/submit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "已根据反馈修改完成",
    "fileUrls": ["http://example.com/work-v2.pdf"]
  }'
```

2. **企业确认完成**
```bash
curl -X POST http://localhost:3000/api/v1/orders/$ORDER_ID/complete \
  -H "Authorization: Bearer $COMPANY_TOKEN"
```

3. **等待10秒**
```bash
sleep 10
```

4. **检查T-05消息**
```bash
curl -X GET http://localhost:3000/api/v1/mentor-trigger/messages/$ORDER_ID \
  -H "Authorization: Bearer $TOKEN"
```

**验证点**：
- [ ] 10秒后自动创建T-05触发记录
- [ ] 生成了完成庆祝消息
- [ ] 回顾了任务完成历程
- [ ] 提取了关键成长时刻
- [ ] 语气庆祝和鼓励

### 3.5 前端测试

在微信开发者工具中：

1. **查看导师对话页面**
   - [ ] 进入导师对话页面
   - [ ] 看到T-01消息（带"接单引导"标签）
   - [ ] 看到T-03消息（带"打回指导"标签）
   - [ ] 看到T-05消息（带"完成庆祝"标签）
   - [ ] 消息自动标记为已查看
   - [ ] 样式正确显示

2. **验证消息内容**
   - [ ] T-01消息个性化
   - [ ] T-03消息翻译了企业反馈
   - [ ] T-05消息回顾了成长
   - [ ] 所有消息显示时间戳

---

## 🧪 第四步：测试WebSocket通知系统

### 4.1 测试连接

在微信开发者工具控制台：

```javascript
// 应该看到：
console.log("WebSocket connected: {...}")
```

**验证点**：
- [ ] WebSocket自动连接
- [ ] 通知铃铛显示绿色在线指示器
- [ ] 每30秒发送心跳

### 4.2 测试接收通知

**触发各种事件**：

1. **完成OPC测评** → 应该收到"画像分析完成"通知
2. **接受任务** → 应该收到"订单状态变化"通知
3. **收到导师消息** → 应该收到"导师消息"通知

**验证点**：
- [ ] 收到Toast提示
- [ ] 手机震动反馈
- [ ] 通知铃铛显示未读数量
- [ ] 通知中心显示新通知

### 4.3 测试通知中心

1. **点击通知铃铛**
   - [ ] 跳转到通知中心页面
   - [ ] 显示所有通知列表
   - [ ] 未读通知高亮显示

2. **测试过滤**
   - [ ] 切换到"未读"标签
   - [ ] 只显示未读通知
   - [ ] 切换回"全部"显示所有通知

3. **测试操作**
   - [ ] 点击"全部标记为已读"
   - [ ] 未读数量变为0
   - [ ] 点击"清空通知"
   - [ ] 通知列表清空

4. **测试跳转**
   - [ ] 点击"画像分析完成"通知
   - [ ] 跳转到OPC结果页
   - [ ] 点击"导师消息"通知
   - [ ] 跳转到导师对话页

---

## ✅ 测试完成清单

### OPC v2.0 API测试
- [ ] 开始测评API
- [ ] 提交前置定义题API
- [ ] 提交选择题API
- [ ] 完成测评API
- [ ] 获取结果API
- [ ] 前端测评流程
- [ ] 前端结果展示

### AI导师自动触发测试
- [ ] T-01触发（30秒）
- [ ] T-01消息生成
- [ ] T-03触发（5秒）
- [ ] T-03消息翻译
- [ ] T-05触发（10秒）
- [ ] T-05消息回顾
- [ ] 前端消息展示

### WebSocket通知测试
- [ ] WebSocket连接
- [ ] 心跳保活
- [ ] 接收通知
- [ ] Toast提示
- [ ] 震动反馈
- [ ] 通知中心显示
- [ ] 未读统计
- [ ] 标记已读
- [ ] 清空通知
- [ ] 智能跳转

---

## 📊 测试结果记录

### 测试执行记录表

| 测试项 | 状态 | 执行时间 | 问题 | 备注 |
|--------|------|---------|------|------|
| 数据库迁移 | ⏳ | - | - | - |
| 后端服务启动 | ⏳ | - | - | - |
| OPC v2.0 API | ⏳ | - | - | - |
| AI导师触发 | ⏳ | - | - | - |
| WebSocket通知 | ⏳ | - | - | - |

### 发现的问题

| 问题ID | 严重程度 | 描述 | 状态 | 解决方案 |
|--------|---------|------|------|---------|
| - | - | - | - | - |

---

## 🐛 常见问题排查

### 问题1：数据库迁移失败

**症状**：运行迁移时报错

**排查**：
```bash
# 检查PostgreSQL是否运行
pg_isready

# 检查数据库是否存在
psql -U postgres -l | grep qicheng

# 检查用户权限
psql -U postgres -c "\du"
```

**解决**：
- 确保PostgreSQL正在运行
- 确保qicheng数据库存在
- 确保用户有足够权限

### 问题2：后端服务启动失败

**症状**：npm run dev报错

**排查**：
```bash
# 检查端口是否被占用
lsof -i :3000

# 检查环境变量
cat .env

# 检查依赖
npm list
```

**解决**：
- 杀掉占用端口的进程
- 配置正确的环境变量
- 重新安装依赖

### 问题3：定时任务不执行

**症状**：30秒后没有触发T-01

**排查**：
```bash
# 检查后端日志
# 应该看到："Mentor trigger cron job started"

# 检查数据库触发器
psql -U postgres -d qicheng -c "SELECT tgname FROM pg_trigger WHERE tgname LIKE 'trigger_schedule%';"

# 检查触发日志表
psql -U postgres -d qicheng -c "SELECT * FROM mentor_trigger_logs ORDER BY created_at DESC LIMIT 5;"
```

**解决**：
- 重启后端服务
- 检查PostgreSQL触发器是否创建
- 手动触发测试

### 问题4：WebSocket连接失败

**症状**：前端无法连接WebSocket

**排查**：
- 检查后端是否启动
- 检查token是否有效
- 查看浏览器控制台错误

**解决**：
- 重新登录获取新token
- 检查CORS配置
- 检查WebSocket URL

---

## 🎯 测试完成标准

全部测试通过的标准：

- [ ] 所有API返回正确响应
- [ ] 所有前端页面正常显示
- [ ] 所有自动触发正常工作
- [ ] 所有通知正常接收
- [ ] 无严重错误或崩溃
- [ ] 性能符合要求
- [ ] 用户体验流畅

---

**开始测试前，请确保已完成"测试前准备清单"中的所有项目！**

**测试过程中，请在对应的复选框打勾 ✅，并记录发现的问题。**

**祝测试顺利！** 🚀
