# AI导师系统 API 使用文档

## 基础信息

**Base URL**: `http://localhost:3000/api/v1/mentor-stage`  
**认证方式**: JWT Bearer Token  
**Content-Type**: `application/json`

---

## API端点列表

### 1. 获取任务的导师会话

获取指定任务的导师会话信息，如果不存在则返回null。

**请求**
```http
GET /tasks/:taskId/session
Authorization: Bearer {token}
```

**路径参数**
- `taskId` (string, required) - 任务ID

**响应示例**
```json
{
  "success": true,
  "data": {
    "id": "38374b97-3b97-43db-83bf-e9f5ce3cab07",
    "taskId": "9a4ede4a-8560-4dcc-b3ca-25eaaebfdbf2",
    "studentId": "23411f9e-203b-4fd8-b970-d87f143bc745",
    "currentStage": "requirement_understanding",
    "stageStatus": "in_progress",
    "requirementUnderstandingScore": null,
    "requirementConfirmed": false,
    "productFramework": null,
    "guidanceCount": 0,
    "encouragementCount": 0,
    "toolsRecommended": [],
    "preReviewCount": 0,
    "preReviewPassed": false,
    "finalReviewScore": null,
    "translationCount": 0,
    "communicationResolved": false,
    "totalMessages": 0,
    "totalTokensUsed": 0,
    "totalCost": 0,
    "startedAt": "2026-05-08T08:38:55.789Z",
    "completedAt": null,
    "createdAt": "2026-05-08T08:38:55.789Z",
    "updatedAt": "2026-05-08T08:38:55.789Z"
  }
}
```

**阶段说明**
- `requirement_understanding` - 需求理解与确认
- `execution_guidance` - 执行引导
- `quality_review` - 质量预审
- `communication_bridge` - 沟通桥梁

---

### 2. 获取会话消息历史

获取指定会话的消息历史记录。

**请求**
```http
GET /sessions/:sessionId/messages?limit=50&offset=0
Authorization: Bearer {token}
```

**路径参数**
- `sessionId` (string, required) - 会话ID

**查询参数**
- `limit` (number, optional) - 返回消息数量，默认50
- `offset` (number, optional) - 偏移量，默认0

**响应示例**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "99e4283e-9d6b-4368-977b-6eb1375054ed",
        "sessionId": "38374b97-3b97-43db-83bf-e9f5ce3cab07",
        "stage": "requirement_understanding",
        "role": "mentor",
        "content": "很好！你的理解基本正确。让我们一起来梳理一下具体的功能点...",
        "modelUsed": "claude-sonnet-4-6",
        "tokensUsed": 1500,
        "cost": 0.0045,
        "responseTimeMs": 2500,
        "metadata": null,
        "createdAt": "2026-05-08T08:38:55.842Z"
      },
      {
        "id": "f7974ad4-d10a-4a72-9ee8-958628b530fb",
        "sessionId": "38374b97-3b97-43db-83bf-e9f5ce3cab07",
        "stage": "requirement_understanding",
        "role": "student",
        "content": "我理解这个任务是要做一个待办事项管理应用，主要功能是添加、删除、修改和查看任务。",
        "modelUsed": null,
        "tokensUsed": null,
        "cost": null,
        "responseTimeMs": null,
        "metadata": null,
        "createdAt": "2026-05-08T08:38:55.839Z"
      }
    ],
    "total": 2
  }
}
```

**消息角色**
- `student` - 学生消息
- `mentor` - AI导师消息
- `system` - 系统消息

---

### 3. 发送消息给导师

学生向AI导师发送消息，AI会根据当前阶段给出相应的回复。

**请求**
```http
POST /sessions/:sessionId/messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "我理解这个任务是要开发一个待办事项应用，主要功能包括添加、删除、修改和查看任务。用户可以标记任务为完成状态。"
}
```

**路径参数**
- `sessionId` (string, required) - 会话ID

**请求体**
- `content` (string, required) - 消息内容，不能为空

**响应示例**
```json
{
  "success": true,
  "data": {
    "messageId": "99e4283e-9d6b-4368-977b-6eb1375054ed",
    "content": "很好！你的理解基本正确 👍\n\n理解度评分：8/10\n\n分析：你准确地把握了核心功能点，包括增删改查和状态管理。不过我们还需要关注一些细节...\n\n引导问题：\n1. 你觉得这个应用的主要使用场景是什么？\n2. 除了基本的增删改查，企业还提到了什么特殊要求？\n3. 你打算用什么技术栈来实现？\n\n鼓励：你已经迈出了很好的第一步！让我们一起把需求理解得更透彻 😊\n\n下一步：请思考上面的问题，然后告诉我你的想法。",
    "stage": "requirement_understanding",
    "tokensUsed": 1500,
    "responseTime": 2500
  }
}
```

**错误响应**
```json
{
  "success": false,
  "error": {
    "code": "EMPTY_MESSAGE",
    "message": "消息内容不能为空"
  }
}
```

---

### 4. 请求质量预审

学生提交作品前，请求AI导师进行质量预审。如果不通过，会阻止提交。

**请求**
```http
POST /tasks/:taskId/quality-review
Authorization: Bearer {token}
Content-Type: application/json

{
  "submission": "我已经完成了待办事项应用的开发。\n\n实现的功能：\n1. 添加任务 - 用户可以输入任务标题和描述\n2. 删除任务 - 点击删除按钮可以删除任务\n3. 修改任务 - 双击任务可以编辑内容\n4. 查看任务列表 - 所有任务显示在列表中\n5. 标记完成 - 点击复选框可以标记任务为完成状态\n\n技术栈：React + TypeScript + Tailwind CSS\n\n代码仓库：https://github.com/xxx/todo-app\n演示地址：https://todo-app-demo.vercel.app"
}
```

**路径参数**
- `taskId` (string, required) - 任务ID

**请求体**
- `submission` (string, required) - 提交内容描述

**响应示例（通过）**
```json
{
  "success": true,
  "data": {
    "passed": true,
    "score": 85,
    "review": {
      "totalScore": 85,
      "scores": {
        "functionality": 18,
        "usability": 17,
        "codeQuality": 16,
        "documentation": 15,
        "innovation": 19
      },
      "strengths": [
        "功能完整，实现了所有基本要求",
        "使用了现代化的技术栈（React + TypeScript）",
        "提供了演示地址，方便查看效果"
      ],
      "suggestions": [
        "建议添加README文档，说明如何运行项目",
        "可以考虑添加任务优先级功能"
      ],
      "feedback": "你的作品质量不错，已经达到了提交标准。建议完善一下文档后就可以提交给企业了。加油！💪"
    }
  }
}
```

**响应示例（不通过）**
```json
{
  "success": false,
  "requiresImprovement": true,
  "data": {
    "preCheckResult": {
      "passed": false,
      "score": 65,
      "review": {
        "totalScore": 65,
        "scores": {
          "functionality": 14,
          "usability": 12,
          "codeQuality": 13,
          "documentation": 10,
          "innovation": 16
        },
        "issues": [
          {
            "severity": "critical",
            "description": "缺少任务修改功能",
            "suggestion": "需要实现双击编辑或添加编辑按钮"
          },
          {
            "severity": "warning",
            "description": "没有提供代码仓库链接",
            "suggestion": "请上传代码到GitHub并提供链接"
          },
          {
            "severity": "suggestion",
            "description": "UI设计较为简单",
            "suggestion": "可以参考Material-UI或Ant Design优化界面"
          }
        ],
        "strengths": [
          "基本功能已实现",
          "使用了TypeScript，代码类型安全"
        ],
        "feedback": "你的作品还有一些需要改进的地方。请根据上面的建议修改后再提交。相信你能做得更好！😊"
      }
    },
    "message": "您的提交未通过AI导师预审，请根据建议改进后再提交"
  }
}
```

---

### 5. 获取会话统计

获取指定会话的统计信息，包括消息数、tokens使用量、成本等。

**请求**
```http
GET /sessions/:sessionId/stats
Authorization: Bearer {token}
```

**路径参数**
- `sessionId` (string, required) - 会话ID

**响应示例**
```json
{
  "success": true,
  "data": {
    "totalMessages": 10,
    "totalTokensUsed": 15000,
    "totalCost": 0.045,
    "messagesByRole": {
      "student": 5,
      "mentor": 5,
      "system": 0
    },
    "averageResponseTime": 2300
  }
}
```

---

### 6. 确认需求理解

学生确认已经理解需求，系统会自动进入执行引导阶段。

**请求**
```http
POST /sessions/:sessionId/confirm-requirement
Authorization: Bearer {token}
Content-Type: application/json

{
  "productFramework": "# 待办事项应用产品框架\n\n## 核心功能\n1. 任务管理（CRUD）\n2. 状态管理（完成/未完成）\n3. 任务筛选\n\n## 技术方案\n- 前端：React + TypeScript\n- 状态管理：useState/useReducer\n- 样式：Tailwind CSS\n- 存储：LocalStorage",
  "score": 85
}
```

**路径参数**
- `sessionId` (string, required) - 会话ID

**请求体**
- `productFramework` (string, optional) - 产品功能框架（PRD雏形）
- `score` (number, optional) - 理解准确度分数（0-100）

**响应示例**
```json
{
  "success": true,
  "message": "需求理解确认成功，进入执行引导阶段"
}
```

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| `UNAUTHORIZED` | 未授权，token无效或过期 |
| `FORBIDDEN` | 无权访问此资源 |
| `SESSION_NOT_FOUND` | 会话不存在 |
| `EMPTY_MESSAGE` | 消息内容不能为空 |
| `EMPTY_SUBMISSION` | 提交内容不能为空 |

---

## 使用流程示例

### 完整的用户交互流程

```javascript
// 1. 学生接单后，获取导师会话
const sessionResponse = await fetch(`/api/v1/mentor-stage/tasks/${taskId}/session`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { data: session } = await sessionResponse.json();

// 2. 获取消息历史
const messagesResponse = await fetch(`/api/v1/mentor-stage/sessions/${session.id}/messages`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { data: { messages } } = await messagesResponse.json();

// 3. 学生发送消息
const sendResponse = await fetch(`/api/v1/mentor-stage/sessions/${session.id}/messages`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    content: '我理解这个任务是...'
  })
});
const { data: mentorReply } = await sendResponse.json();

// 4. 学生准备提交时，请求质量预审
const reviewResponse = await fetch(`/api/v1/mentor-stage/tasks/${taskId}/quality-review`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    submission: '我已经完成了...'
  })
});
const { data: reviewResult } = await reviewResponse.json();

// 5. 如果通过预审，允许提交
if (reviewResult.passed) {
  // 调用提交接口
  await submitDeliverables();
} else {
  // 显示改进建议
  showImprovementSuggestions(reviewResult.review);
}
```

---

## 前端集成建议

### 1. 导师对话组件结构

```typescript
interface MentorChatProps {
  taskId: string;
  studentId: string;
}

interface Message {
  id: string;
  role: 'student' | 'mentor' | 'system';
  content: string;
  createdAt: string;
}

interface Session {
  id: string;
  currentStage: string;
  stageStatus: string;
  totalMessages: number;
}
```

### 2. 状态管理

```typescript
const [session, setSession] = useState<Session | null>(null);
const [messages, setMessages] = useState<Message[]>([]);
const [input, setInput] = useState('');
const [loading, setLoading] = useState(false);
```

### 3. 关键功能

- **自动加载会话**: 组件挂载时自动获取会话信息
- **消息轮询**: 可选的消息轮询机制（或使用WebSocket）
- **阶段指示器**: 显示当前所处的4个阶段
- **快捷操作**: 提供"我卡住了"、"检查一下"等快捷按钮
- **预审结果展示**: 美观地展示预审分数和建议

### 4. UI/UX建议

- 固定在右下角，可折叠/展开
- 消息气泡样式区分学生和导师
- 导师消息支持Markdown渲染
- 显示AI思考中的加载动画
- 预审不通过时，高亮显示问题和建议

---

## 测试建议

### 1. 单元测试
- 测试每个API端点的请求和响应
- 测试错误处理逻辑
- 测试权限验证

### 2. 集成测试
- 测试完整的用户流程
- 测试阶段转换逻辑
- 测试预审阻塞提交功能

### 3. 性能测试
- 测试AI响应时间
- 测试并发请求处理
- 测试数据库查询性能

---

## 常见问题

### Q1: 如何判断导师会话是否已创建？
A: 调用 `GET /tasks/:taskId/session`，如果返回 `data: null` 则表示未创建。

### Q2: 学生可以跳过质量预审直接提交吗？
A: 不可以。质量预审是强制的，只有通过预审（分数≥70）才能提交。

### Q3: AI响应时间大概多久？
A: 通常在2-5秒之间，取决于消息复杂度和AI模型负载。

### Q4: 如何处理AI响应超时？
A: 建议设置30秒超时，超时后提示用户重试。

### Q5: 消息历史会保留多久？
A: 永久保留，直到任务完成后可选择归档。

---

## 更新日志

### v1.0.0 (2026-05-08)
- ✅ 初始版本发布
- ✅ 实现4个阶段的完整功能
- ✅ 集成到任务流程
- ✅ 通过全面测试

---

**文档版本**: v1.0.0  
**最后更新**: 2026-05-08  
**维护者**: 启程小猫开发团队
