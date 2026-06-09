# 启程小猫 - 独立Agent系统设计

## 🎯 系统定位

**启程小猫**是一个完整的、可独立部署的AI Agent系统，具备：
- 💝 情感陪伴能力
- 💼 PBL项目式学习指导
- 🧠 深度分析能力
- 🤝 供需方交流理解

**核心特点**：
- 可以在启程平台内使用
- 也可以独立部署到其他平台
- 提供标准化的API接口
- 支持多种集成方式

---

## 🏗️ 系统架构

### 1. 核心架构

```
┌─────────────────────────────────────────────────────┐
│                  启程小猫 Agent                      │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │  情感陪伴    │  │  项目指导    │  │  分析    │ │
│  │   模块       │  │    模块      │  │  模块    │ │
│  └──────────────┘  └──────────────┘  └──────────┘ │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │           统一对话引擎                       │  │
│  │  - 智能路由                                  │  │
│  │  - 上下文管理                                │  │
│  │  - 记忆系统                                  │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │           AI模型层                           │  │
│  │  - Claude Sonnet 4                          │  │
│  │  - 提示词工程                                │  │
│  │  - 多轮对话                                  │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │           数据存储层                         │  │
│  │  - 对话历史                                  │  │
│  │  - 用户记忆                                  │  │
│  │  - 项目数据                                  │  │
│  └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                        ↓
        ┌───────────────────────────────┐
        │      标准化API接口             │
        │  - RESTful API                │
        │  - WebSocket                  │
        │  - SDK                        │
        └───────────────────────────────┘
                        ↓
        ┌───────────────────────────────┐
        │      多平台集成               │
        │  - 启程平台                   │
        │  - 企业内部系统               │
        │  - 第三方应用                 │
        │  - 独立Web应用                │
        └───────────────────────────────┘
```

### 2. 模块设计

#### 情感陪伴模块
```typescript
EmotionalCompanionModule {
  - 情绪识别
  - 共情回应
  - 生命问题探索
  - 成长陪伴
  - 信念转变追踪
}
```

#### 项目指导模块
```typescript
ProjectGuidanceModule {
  - 苏格拉底式提问
  - 任务拆解引导
  - MVP方案生成
  - 代码执行支持
  - 反思引导
}
```

#### 分析模块
```typescript
AnalysisModule {
  - 需求分析
  - 能力评估
  - 匹配度计算
  - 风险识别
  - 建议生成
}
```

#### 供需理解模块
```typescript
SupplyDemandModule {
  - 学生需求理解
  - 企业需求理解
  - 双向匹配
  - 沟通桥梁
  - 期望管理
}
```

---

## 🔌 API设计

### 1. RESTful API

#### 核心对话接口
```typescript
POST /api/v1/agent/chat
{
  "message": "用户消息",
  "userId": "用户ID",
  "sessionId": "会话ID（可选）",
  "context": {
    "mode": "emotional" | "project" | "auto",
    "projectId": "项目ID（可选）",
    "metadata": {}
  }
}

Response:
{
  "success": true,
  "data": {
    "sessionId": "会话ID",
    "response": {
      "content": "启程小猫的回复",
      "mentorType": "emotional" | "project" | "coordinated",
      "emotionalContent": "情感部分（协同模式）",
      "projectContent": "项目部分（协同模式）",
      "suggestions": ["建议1", "建议2"],
      "detectedSignals": {
        "passionSpark": false,
        "flowMoment": false,
        "stuckPoint": false,
        "breakthrough": false
      }
    },
    "tokensUsed": 1234,
    "responseTime": 2500
  }
}
```

#### 项目管理接口
```typescript
// 初始化项目
POST /api/v1/agent/projects/init
{
  "userId": "用户ID",
  "initialProblem": "初始问题",
  "title": "项目标题",
  "domain": "项目领域"
}

// 获取项目列表
GET /api/v1/agent/projects?userId={userId}

// 获取项目详情
GET /api/v1/agent/projects/{projectId}

// 任务拆解
POST /api/v1/agent/projects/{projectId}/decompose
{
  "taskDescription": "任务描述"
}

// 执行代码
POST /api/v1/agent/projects/{projectId}/execute
{
  "language": "python",
  "code": "代码内容"
}
```

#### 分析接口
```typescript
// 需求分析
POST /api/v1/agent/analyze/requirement
{
  "userId": "用户ID",
  "requirement": "需求描述",
  "context": {}
}

// 能力评估
POST /api/v1/agent/analyze/capability
{
  "userId": "用户ID",
  "projectHistory": [],
  "skills": []
}

// 匹配度计算
POST /api/v1/agent/analyze/match
{
  "studentId": "学生ID",
  "taskId": "任务ID"
}
```

### 2. WebSocket API

```typescript
// 连接
ws://api.qicheng.com/agent/ws?userId={userId}&token={token}

// 消息格式
{
  "type": "chat" | "project" | "notification",
  "data": {
    "message": "消息内容",
    "context": {}
  }
}

// 响应格式
{
  "type": "response" | "progress" | "notification",
  "data": {
    "content": "响应内容",
    "progress": 50,
    "status": "processing" | "completed"
  }
}
```

### 3. SDK

#### JavaScript/TypeScript SDK
```typescript
import { QiChengAgent } from '@qicheng/agent-sdk'

const agent = new QiChengAgent({
  apiKey: 'your_api_key',
  baseURL: 'https://api.qicheng.com'
})

// 对话
const response = await agent.chat({
  message: '我想做一个AI项目',
  userId: 'user123',
  mode: 'auto'
})

// 初始化项目
const project = await agent.projects.init({
  userId: 'user123',
  initialProblem: '我想用AI自动总结会议纪要',
  title: '会议纪要生成器'
})

// 任务拆解
const guidance = await agent.projects.decompose(projectId, {
  taskDescription: '实现语音转文字功能'
})

// 执行代码
const execution = await agent.projects.executeCode(projectId, {
  language: 'python',
  code: 'print("Hello, World!")'
})
```

#### Python SDK
```python
from qicheng_agent import QiChengAgent

agent = QiChengAgent(
    api_key='your_api_key',
    base_url='https://api.qicheng.com'
)

# 对话
response = agent.chat(
    message='我想做一个AI项目',
    user_id='user123',
    mode='auto'
)

# 初始化项目
project = agent.projects.init(
    user_id='user123',
    initial_problem='我想用AI自动总结会议纪要',
    title='会议纪要生成器'
)

# 任务拆解
guidance = agent.projects.decompose(
    project_id=project_id,
    task_description='实现语音转文字功能'
)

# 执行代码
execution = agent.projects.execute_code(
    project_id=project_id,
    language='python',
    code='print("Hello, World!")'
)
```

---

## 🚀 部署方案

### 1. 独立部署（推荐）

#### Docker部署
```yaml
# docker-compose.yml
version: '3.8'

services:
  qicheng-agent:
    image: qicheng/agent:latest
    ports:
      - "3000:3000"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    volumes:
      - ./data:/app/data
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=qicheng_agent
      - POSTGRES_USER=qicheng
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

#### 启动命令
```bash
# 克隆仓库
git clone https://github.com/qicheng/agent.git
cd agent

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入 ANTHROPIC_API_KEY

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f qicheng-agent
```

### 2. 云平台部署

#### AWS部署
```bash
# 使用 AWS ECS
aws ecs create-cluster --cluster-name qicheng-agent

# 创建任务定义
aws ecs register-task-definition --cli-input-json file://task-definition.json

# 创建服务
aws ecs create-service \
  --cluster qicheng-agent \
  --service-name qicheng-agent-service \
  --task-definition qicheng-agent \
  --desired-count 2
```

#### Vercel部署
```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

### 3. 企业内部部署

#### Kubernetes部署
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: qicheng-agent
spec:
  replicas: 3
  selector:
    matchLabels:
      app: qicheng-agent
  template:
    metadata:
      labels:
        app: qicheng-agent
    spec:
      containers:
      - name: qicheng-agent
        image: qicheng/agent:latest
        ports:
        - containerPort: 3000
        env:
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: qicheng-secrets
              key: anthropic-api-key
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: qicheng-secrets
              key: database-url
```

---

## 🔐 安全与认证

### 1. API认证

#### API Key认证
```typescript
// 请求头
Authorization: Bearer your_api_key_here

// 或查询参数
?apiKey=your_api_key_here
```

#### JWT认证
```typescript
// 登录获取token
POST /api/v1/auth/login
{
  "username": "user@example.com",
  "password": "password"
}

Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600
}

// 使用token
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### 2. 数据隐私

- 用户数据加密存储
- 对话历史定期清理
- 敏感信息脱敏
- GDPR合规

### 3. 访问控制

- 基于角色的访问控制（RBAC）
- API速率限制
- IP白名单
- 审计日志

---

## 📊 监控与运维

### 1. 健康检查

```typescript
GET /health

Response:
{
  "status": "healthy",
  "timestamp": "2026-05-11T10:00:00Z",
  "uptime": 86400,
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "ai_model": "healthy"
  }
}
```

### 2. 性能监控

```typescript
GET /metrics

Response:
{
  "requests_total": 10000,
  "requests_per_second": 10,
  "average_response_time": 2500,
  "error_rate": 0.01,
  "active_sessions": 50
}
```

### 3. 日志系统

```typescript
// 结构化日志
{
  "timestamp": "2026-05-11T10:00:00Z",
  "level": "info",
  "service": "qicheng-agent",
  "userId": "user123",
  "sessionId": "session456",
  "action": "chat",
  "duration": 2500,
  "tokensUsed": 1234
}
```

---

## 🎨 集成示例

### 1. 集成到启程平台

```typescript
// 启程平台内部调用
import { enhancedMentorService } from './services/enhancedMentorService'

const response = await enhancedMentorService.chat(
  userId,
  message,
  { projectId, forceMode: 'auto' }
)
```

### 2. 集成到企业内部系统

```typescript
// 企业内部系统调用
import { QiChengAgent } from '@qicheng/agent-sdk'

const agent = new QiChengAgent({
  apiKey: process.env.QICHENG_API_KEY,
  baseURL: 'https://agent.company.com'
})

const response = await agent.chat({
  message: '帮我分析这个需求',
  userId: employeeId,
  context: {
    department: 'engineering',
    role: 'developer'
  }
})
```

### 3. 集成到第三方应用

```typescript
// 第三方应用调用
const response = await fetch('https://api.qicheng.com/agent/chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: '我想学习AI',
    userId: 'external_user_123'
  })
})

const data = await response.json()
console.log(data.response.content)
```

### 4. 独立Web应用

```typescript
// React应用
import { useQiChengAgent } from '@qicheng/react-sdk'

function ChatComponent() {
  const { chat, loading, response } = useQiChengAgent({
    apiKey: 'your_api_key'
  })

  const handleSend = async (message) => {
    await chat({ message, userId: 'user123' })
  }

  return (
    <div>
      {loading ? <Spinner /> : <Message content={response.content} />}
      <Input onSend={handleSend} />
    </div>
  )
}
```

---

## 💰 商业模式

### 1. 定价方案

#### 免费版
- 每月100次对话
- 基础功能
- 社区支持

#### 专业版（$99/月）
- 每月10,000次对话
- 完整功能
- 邮件支持
- API访问

#### 企业版（定制）
- 无限对话
- 私有部署
- 定制开发
- 专属支持
- SLA保障

### 2. 计费方式

- 按对话次数计费
- 按Token使用量计费
- 按月订阅
- 按年订阅（8折优惠）

---

## 🎉 总结

### 核心优势

✅ **完整独立** - 可独立部署，不依赖启程平台  
✅ **标准化API** - 提供RESTful API、WebSocket、SDK  
✅ **多平台集成** - 支持多种集成方式  
✅ **情感+项目** - 独特的双能力融合  
✅ **供需理解** - 深度分析和匹配能力  
✅ **易于部署** - Docker、K8s、云平台  
✅ **安全可靠** - 完善的认证和监控  

### 应用场景

1. **启程平台** - 核心AI导师
2. **企业内部** - 员工成长助手
3. **教育机构** - 学生学习导师
4. **培训机构** - 项目式学习指导
5. **独立应用** - AI学习助手产品

---

**启程小猫 - 你温暖的成长伙伴，随时随地陪伴你** 🐱✨
