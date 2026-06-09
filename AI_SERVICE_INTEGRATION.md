# AI服务集成文档

## 概述

本文档描述了Python AI服务与Node.js后端的集成方案。AI服务提供交付物预检和进步识别功能，通过HTTP REST API与后端通信。

## 架构

```
┌─────────────────┐      HTTP REST      ┌──────────────────┐
│                 │ ───────────────────> │                  │
│  Node.js Backend│                      │  Python AI Service│
│  (Port 3000)    │ <─────────────────── │  (Port 8002)     │
│                 │      JSON Response   │                  │
└─────────────────┘                      └──────────────────┘
         │                                        │
         │                                        │
         v                                        v
┌─────────────────┐                      ┌──────────────────┐
│   PostgreSQL    │ <─────────────────── │  Claude Opus 4.7 │
│   Database      │                      │  API             │
└─────────────────┘                      └──────────────────┘
```

## 服务组件

### 1. Python AI服务 (FastAPI)

**位置**: `/Users/alwan/code/qicheng/ai-service/`

**端口**: 8002

**启动命令**:
```bash
cd /Users/alwan/code/qicheng/ai-service
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload
```

**环境变量** (`.env`):
```
PORT=8002
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/qicheng
ANTHROPIC_API_KEY=your_api_key_here
```

**核心API端点**:

1. **交付物预检** - `POST /api/ai/pre-check-submission`
   - 功能: 在学生提交前预检内容质量
   - 输入: 任务ID、学生ID、提交内容
   - 输出: 通过概率、问题列表、亮点、反馈

2. **进步识别** - `POST /api/ai/progress-feedback`
   - 功能: 识别学生进步并生成个性化反馈
   - 输入: 学生ID、任务ID、当前表现
   - 输出: 进步反馈、改进指标

3. **生成向量** - `POST /api/ai/generate-embedding`
   - 功能: 生成文本的向量表示
   - 输入: 文本内容
   - 输出: 1536维向量

4. **健康检查** - `GET /api/ai/health`
   - 功能: 检查服务状态
   - 输出: 服务状态信息

### 2. Node.js后端集成

**位置**: `/Users/alwan/code/qicheng/backend/`

**新增文件**:

1. **AI服务客户端** - `src/services/aiServiceClient.ts`
   - HTTP客户端封装
   - 类型定义
   - 错误处理

2. **交付物预检服务** - `src/services/submissionPreCheckService.ts`
   - 业务逻辑封装
   - 结果格式化
   - 降级处理

3. **预检API路由** - `src/routes/submissionPreCheck.ts`
   - RESTful端点
   - 认证中间件
   - 参数验证

**API端点**:

```
POST /api/v1/submissions/pre-check
Authorization: Bearer <token>
Content-Type: application/json

{
  "taskId": "uuid",
  "submissionContent": "string"
}
```

**响应格式**:
```json
{
  "success": true,
  "data": {
    "passLikelihood": 75,
    "criticalIssues": [
      {
        "description": "问题描述",
        "suggestion": "改进建议"
      }
    ],
    "warnings": [...],
    "highlights": ["亮点1", "亮点2"],
    "overallFeedback": "总体评价",
    "shouldSubmit": true,
    "formattedMessage": "格式化的Markdown消息"
  }
}
```

## 数据库表结构

### tasks表
```sql
- id (uuid)
- title (varchar)
- description (text)
- acceptance_criteria (text)  -- 验收标准
- track (enum)                -- 赛道
- level (integer)             -- 难度等级
- title_embedding (vector)
- description_embedding (vector)
- combined_embedding (vector)
```

### task_submissions表
```sql
- id (uuid)
- task_id (uuid)
- student_id (uuid)
- file_urls (jsonb)
- submission_note (text)
- ai_score (integer)
- ai_feedback (text)
- ai_review_count (integer)
- status (enum)
- submitted_at (timestamp)
```

### task_assignments表
```sql
- id (uuid)
- task_id (uuid)
- student_id (uuid)
- status (enum)
- accepted_at (timestamp)
- completed_at (timestamp)
```

### task_ratings表
```sql
- id (uuid)
- task_id (uuid)
- student_id (uuid)
- rating (integer)
- feedback (text)
- created_at (timestamp)
```

## 使用流程

### 交付物预检流程

1. **学生准备提交**
   - 学生在前端填写提交内容
   - 点击"预检"按钮

2. **调用预检API**
   ```typescript
   const response = await fetch('/api/v1/submissions/pre-check', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${token}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       taskId: '9a4ede4a-8560-4dcc-b3ca-25eaaebfdbf2',
       submissionContent: '我完成了...'
     })
   });
   ```

3. **AI分析**
   - Node.js后端调用Python AI服务
   - AI服务查询数据库获取任务信息和学生历史
   - 调用Claude API进行智能分析
   - 返回分析结果

4. **展示结果**
   - 显示通过概率
   - 列出关键问题和改进建议
   - 展示亮点
   - 建议是否提交

5. **学生决策**
   - 如果通过概率高且无关键问题 → 直接提交
   - 如果有关键问题 → 修改后再预检
   - 最多允许2次修改机会

### 进步识别流程

1. **任务完成后**
   - 企业对学生提交进行评分
   - 系统记录评分和反馈

2. **触发进步识别**
   ```typescript
   const result = await aiServiceClient.identifyProgress({
     student_id: 'uuid',
     task_id: 'uuid',
     current_performance: {
       rating: 4,
       feedback: '完成质量不错',
       completion_time: 120
     }
   });
   ```

3. **AI分析进步**
   - 查询学生历史任务表现
   - 对比当前表现与历史平均
   - 识别进步维度（评分、时间、卡点）
   - 生成个性化鼓励寄语

4. **展示反馈**
   - 在学生端显示进步反馈
   - 突出改进的方面
   - 提供继续努力的方向

## 测试

### 测试Python AI服务

```bash
# 健康检查
curl http://localhost:8002/api/ai/health

# 测试交付物预检
curl -X POST http://localhost:8002/api/ai/pre-check-submission \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "9a4ede4a-8560-4dcc-b3ca-25eaaebfdbf2",
    "student_id": "f1241d8a-985e-4e99-9b66-2d88a54b6674",
    "submission_content": "我完成了用户登录功能..."
  }'

# 测试进步识别
curl -X POST http://localhost:8002/api/ai/progress-feedback \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "f1241d8a-985e-4e99-9b66-2d88a54b6674",
    "task_id": "9a4ede4a-8560-4dcc-b3ca-25eaaebfdbf2",
    "current_performance": {
      "rating": 4,
      "feedback": "完成质量不错",
      "completion_time": 120
    }
  }'
```

### 测试Node.js集成

```bash
# 需要有效的JWT token
curl -X POST http://localhost:3000/api/v1/submissions/pre-check \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "9a4ede4a-8560-4dcc-b3ca-25eaaebfdbf2",
    "submissionContent": "我完成了用户登录功能..."
  }'
```

## 错误处理

### 降级策略

1. **AI服务不可用**
   - Node.js后端捕获连接错误
   - 返回中性结果，不阻止提交
   - 记录错误日志

2. **Claude API超时**
   - Python服务设置30秒超时
   - 返回默认鼓励性反馈
   - 不影响核心业务流程

3. **数据库查询失败**
   - 使用空历史记录处理
   - 返回基础分析结果

### 日志记录

- Python服务日志: `ai-service.log`
- Node.js后端日志: `backend.log`
- 包含请求ID、时间戳、错误堆栈

## 性能优化

1. **缓存策略**
   - 任务信息缓存（5分钟）
   - 学生历史缓存（10分钟）

2. **并发控制**
   - 数据库连接池（最大20个连接）
   - API请求超时（30秒）

3. **异步处理**
   - 非阻塞IO
   - 后台任务队列

## 安全考虑

1. **认证授权**
   - Node.js端验证JWT token
   - Python服务信任内网请求

2. **输入验证**
   - 提交内容长度限制（10-10000字符）
   - UUID格式验证
   - SQL注入防护

3. **敏感信息**
   - API密钥存储在环境变量
   - 不在日志中记录敏感数据

## 部署清单

### 开发环境

- [x] Python AI服务运行在8002端口
- [x] Node.js后端运行在3000端口
- [x] PostgreSQL数据库配置正确
- [x] 环境变量配置完成
- [x] 依赖包安装完成

### 生产环境

- [ ] 使用进程管理器（PM2/Supervisor）
- [ ] 配置反向代理（Nginx）
- [ ] 启用HTTPS
- [ ] 配置日志轮转
- [ ] 设置监控告警
- [ ] 数据库备份策略

## 故障排查

### AI服务无法启动

1. 检查端口占用: `lsof -i:8002`
2. 检查依赖安装: `pip list | grep anthropic`
3. 检查数据库连接: 测试DATABASE_URL
4. 查看日志: `tail -f ai-service.log`

### Node.js集成失败

1. 检查AI服务健康: `curl http://localhost:8002/api/ai/health`
2. 检查路由注册: 查看app.ts中的路由配置
3. 重新编译: `npm run build`
4. 重启服务: `npm run dev`

### 数据库查询错误

1. 检查表结构: 确认字段名称正确
2. 检查数据存在: 验证UUID有效
3. 查看SQL日志: 启用PostgreSQL查询日志

## 下一步计划

1. **集成进步识别到评分流程**
   - 在task_ratings表插入后触发
   - 调用AI服务生成进步反馈
   - 在学生端展示

2. **优化预检算法**
   - 增加更多检查维度
   - 训练专用模型
   - 提高准确率

3. **添加更多AI功能**
   - 任务推荐优化
   - 智能定价建议
   - 自动生成任务步骤

4. **监控和分析**
   - API调用统计
   - 准确率追踪
   - 用户满意度调查

## 联系方式

- 技术负责人: [待填写]
- 问题反馈: [待填写]
- 文档更新: 2026-05-02
