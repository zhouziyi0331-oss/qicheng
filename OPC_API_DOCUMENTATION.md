# OPC系统API使用文档

## 基础信息

- **Base URL**: `http://your-domain.com/api`
- **Content-Type**: `application/json`
- **认证方式**: Bearer Token（根据实际情况）

---

## 一、OPC测试相关API

### 1.1 提交OPC测试结果

**接口**: `POST /api/opc/submit`

**请求参数**:
```json
{
  "userId": "uuid",
  "answers": [
    {
      "questionId": 1,
      "answer": "A",
      "score": 3
    },
    // ... 共36题
  ]
}
```

**响应示例**:
```json
{
  "success": true,
  "result": {
    "id": "result-uuid",
    "scores": {
      "information_processing": 75,
      "creation_drive": 45,
      "tool_learning": 60,
      "task_execution": 80,
      "collaboration": 55,
      "risk_attitude": 70
    },
    "personalityTag": {
      "key": "visual_storyteller",
      "name": "视觉叙事者",
      "description": "你擅长用画面讲故事...",
      "track": "AI内容创作",
      "level": "Lv.1 试流者",
      "firstTask": "AI图文内容制作"
    },
    "interpretations": {
      "information_processing": "整合型：你喜欢先看到全貌再动手...",
      // ... 其他维度解读
    },
    "recommendations": {
      "track": "AI内容创作",
      "level": "Lv.1 试流者",
      "firstTask": "AI图文内容制作"
    }
  }
}
```

### 1.2 获取用户OPC测试结果

**接口**: `GET /api/opc/result/:userId`

**响应示例**:
```json
{
  "success": true,
  "result": {
    "scores": { ... },
    "personalityTag": { ... },
    "interpretations": { ... },
    "recommendations": { ... },
    "completedAt": "2024-04-12T10:30:00Z"
  }
}
```

---

## 二、项目匹配相关API

### 2.1 智能项目匹配

**接口**: `GET /api/tasks/match/:userId?limit=20`

**查询参数**:
- `limit`: 返回任务数量（默认20）

**响应示例**:
```json
{
  "success": true,
  "tasks": [
    {
      "id": "task-uuid",
      "title": "小红书配图设计",
      "description": "...",
      "required_level": 1,
      "required_skills": ["Midjourney", "Photoshop"],
      "required_personality_style": "visual_storyteller",
      "is_stretch_project": false,
      "match_score": 85,
      "match_reason": "你习惯用画面思考，这个项目正好需要这种方式；你掌握的Midjourney、Photoshop技能正好匹配"
    }
    // ... 更多任务
  ],
  "summary": {
    "total": 20,
    "stretch": 4,
    "regular": 16
  }
}
```

### 2.2 获取任务详情（含匹配理由）

**接口**: `GET /api/tasks/:taskId/detail/:userId`

**响应示例**:
```json
{
  "success": true,
  "task": {
    "id": "task-uuid",
    "title": "...",
    "description": "...",
    "company_name": "XX公司",
    "match_score": 85,
    "match_reason": "你习惯先搭框架再填细节，这个项目正好需要这种工作方式",
    "is_stretch_project": false
  }
}
```

---

## 三、AI导师相关API

### 3.1 记录导师观察

**接口**: `POST /api/mentor/observe`

**请求参数**:
```json
{
  "studentId": "uuid",
  "taskId": "uuid",
  "observationType": "stuck_point",  // stuck_point | breakthrough | habit_formed
  "observationContent": "学生在配色这里卡了30分钟",
  "observationData": {
    "step": "配色",
    "minutes": 30
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "observationId": "observation-uuid"
}
```

### 3.2 检测学生卡点（定时任务）

**接口**: `POST /api/mentor/detect-stuck`

**响应示例**:
```json
{
  "success": true,
  "detected": 5
}
```

### 3.3 生成AI导师欢迎消息

**接口**: `POST /api/mentor/welcome-message`

**请求参数**:
```json
{
  "studentId": "uuid",
  "taskId": "uuid"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "这个项目有意思——它需要你用视觉语言讲故事，你上次测试时说自己擅长这个方向，这次正好试试。"
}
```

### 3.4 生成里程碑夸奖消息

**接口**: `POST /api/mentor/milestone-message`

**请求参数**:
```json
{
  "studentId": "uuid",
  "taskId": "uuid",
  "milestoneType": "task_complete"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "上次你在配色这里卡了很久，这次你直接就处理好了——你自己有感觉到吗？"
}
```

### 3.5 生成打回修改消息

**接口**: `POST /api/mentor/rejection-message`

**请求参数**:
```json
{
  "studentId": "uuid",
  "taskId": "uuid",
  "rejectionReason": "配色对比度不够",
  "goodPoints": ["排版清晰", "构图合理"]
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "排版清晰做得不错。配色对比度不够这里，你觉得现在的处理方式够好吗？试试换个角度？"
}
```

### 3.6 检测习惯形成（定时任务）

**接口**: `POST /api/mentor/detect-habits`

**响应示例**:
```json
{
  "success": true,
  "detected": 3
}
```

---

## 四、等级体系相关API

### 4.1 获取用户等级信息

**接口**: `GET /api/level/:userId`

**响应示例**:
```json
{
  "success": true,
  "level": {
    "current": 2,
    "name": "行舟者",
    "description": "形成了自己的工作习惯"
  }
}
```

### 4.2 检查升级条件

**接口**: `GET /api/level/check-upgrade/:userId`

**响应示例**:
```json
{
  "success": true,
  "canUpgrade": true,
  "currentLevel": {
    "level": 2,
    "name": "行舟者"
  },
  "nextLevel": {
    "level": 3,
    "name": "知向者"
  },
  "progress": {
    "tasks": { "current": 12, "required": 10 },
    "rating": { "current": "4.2", "required": 4.0 },
    "habits": { "current": 3, "required": 2 }
  }
}
```

### 4.3 执行升级

**接口**: `POST /api/level/upgrade`

**请求参数**:
```json
{
  "userId": "uuid"
}
```

**响应示例**:
```json
{
  "success": true,
  "newLevel": {
    "level": 3,
    "name": "知向者",
    "description": "清楚自己擅长什么"
  },
  "message": "你准备好了吗？可以试试更难的水域了。你现在是「知向者」。"
}
```

### 4.4 申请跳级挑战

**接口**: `POST /api/level/challenge`

**请求参数**:
```json
{
  "userId": "uuid",
  "taskId": "uuid"
}
```

**响应示例**:
```json
{
  "success": true,
  "challengeId": "challenge-uuid",
  "message": "跳级挑战申请成功！完成这个项目后，你将直接升到Lv.3"
}
```

**错误响应**:
```json
{
  "error": "当前等级不足，需要至少Lv.1"
}
```

### 4.5 完成跳级挑战

**接口**: `POST /api/level/challenge/complete`

**请求参数**:
```json
{
  "challengeId": "uuid",
  "success": true
}
```

**响应示例（成功）**:
```json
{
  "success": true,
  "message": "恭喜！你成功完成跳级挑战，现在是「知向者」！",
  "newLevel": {
    "level": 3,
    "name": "知向者",
    "description": "清楚自己擅长什么"
  }
}
```

**响应示例（失败）**:
```json
{
  "success": true,
  "message": "挑战失败，但不扣分。30天后可以再次尝试。"
}
```

---

## 五、里程碑相关API

### 5.1 第2单完成触发器

**接口**: `POST /api/milestone/second-task-complete`

**请求参数**:
```json
{
  "userId": "uuid"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "你现在可以独立接单了。平台不锁住你，但你的成长报告永远在这里，随时回来更新。"
}
```

### 5.2 获取OPC故事墙

**接口**: `GET /api/story-wall`

**响应示例**:
```json
{
  "success": true,
  "stories": [
    {
      "studentId": "uuid",
      "username": "张三",
      "avatar": "https://...",
      "opcTag": "visual_storyteller",
      "level": 5,
      "completedTasks": 50,
      "storyText": "我当初也在配色这里卡过很久，你也可以。",
      "currentStatus": "独立OPC"
    }
    // ... 更多故事
  ]
}
```

### 5.3 提交故事到故事墙

**接口**: `POST /api/story-wall/submit`

**请求参数**:
```json
{
  "userId": "uuid",
  "storyText": "我当初也在配色这里卡过很久，你也可以。",
  "currentStatus": "独立OPC"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "故事提交成功"
}
```

**错误响应**:
```json
{
  "error": "需要达到Lv.4（自流者）才能提交故事"
}
```

---

## 六、错误码说明

| 状态码 | 说明 |
|---|---|
| 200 | 成功 |
| 400 | 参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

---

## 七、使用示例

### 前端调用示例（JavaScript）

```javascript
// 1. 提交OPC测试结果
async function submitOPCTest(userId, answers) {
  const response = await fetch('/api/opc/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, answers })
  });
  
  const data = await response.json();
  console.log('OPC测试结果:', data.result);
  return data;
}

// 2. 获取智能匹配的项目
async function getMatchedTasks(userId) {
  const response = await fetch(`/api/tasks/match/${userId}?limit=20`);
  const data = await response.json();
  console.log('匹配的项目:', data.tasks);
  return data;
}

// 3. 申请跳级挑战
async function applyChallenge(userId, taskId) {
  const response = await fetch('/api/level/challenge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, taskId })
  });
  
  const data = await response.json();
  if (data.success) {
    console.log('挑战申请成功:', data.message);
  } else {
    console.error('申请失败:', data.error);
  }
  return data;
}
```

---

## 八、定时任务配置

以下API需要配置定时任务定期调用：

1. **检测学生卡点**: `POST /api/mentor/detect-stuck`
   - 建议频率：每10分钟
   
2. **检测习惯形成**: `POST /api/mentor/detect-habits`
   - 建议频率：每天1次

---

## 九、数据库依赖

确保以下数据库表已创建：

1. `opc_test_questions` - OPC测试题库
2. `user_opc_results` - 用户OPC测试结果
3. `mentor_observations` - 导师观察记录
4. `stretch_challenges` - 跳级挑战记录
5. `story_wall` - OPC故事墙

---

**文档版本**: 1.0
**最后更新**: 2024-04-12
