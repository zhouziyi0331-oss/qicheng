# 启程小猫增强版 - 快速开始指南

## 🚀 5分钟快速启动

### 1. 运行数据库迁移

```bash
cd /Users/alwan/code/qicheng/backend

# 运行PBL系统迁移
psql -U postgres -d qicheng -f migrations/068_pbl_agent_system.sql

# 运行融合系统迁移
psql -U postgres -d qicheng -f migrations/069_dual_mentor_system.sql
```

### 2. 配置环境变量

确保 `.env` 文件包含：

```env
# Anthropic API（必需）
ANTHROPIC_API_KEY=your_api_key_here

# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/qicheng

# 文件上传
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads/pbl-projects

# 代码执行
CODE_EXECUTION_TIMEOUT=30000
CODE_EXECUTION_MAX_TIMEOUT=120000
```

### 3. 启动后端服务

```bash
cd backend
npm install
npm run dev
```

### 4. 测试API

```bash
# 测试统一对话接口
curl -X POST http://localhost:3000/api/v1/mentor/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "我想做一个AI项目"
  }'
```

---

## 📖 核心API使用示例

### 1. 统一对话（情感 + 项目融合）

```typescript
// 情感对话
const emotionalChat = await fetch('/api/v1/mentor/chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: '我最近很迷茫，不知道该学什么'
  })
});

// 项目对话
const projectChat = await fetch('/api/v1/mentor/chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: '我想用AI自动总结会议纪要',
    projectId: 'xxx'  // 可选
  })
});

// 强制使用某种模式
const forcedMode = await fetch('/api/v1/mentor/chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: '帮我分析这段代码',
    forceMode: 'project'  // 强制使用项目模式
  })
});
```

### 2. 初始化项目

```typescript
const response = await fetch('/api/v1/mentor/projects/init', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    initialProblem: '我想用AI自动总结会议纪要',
    title: '会议纪要生成器',
    domain: 'AI',
    learningGoals: ['学习Whisper API', '学习GPT-4提示词']
  })
});

const { projectId, openingQuestions, suggestedPhases } = await response.json();
```

### 3. 任务拆解

```typescript
// 引导拆解
const guidance = await fetch(`/api/v1/mentor/projects/${projectId}/decompose`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    taskDescription: '实现会议录音转文字功能'
  })
});

// 评估拆解
const evaluation = await fetch(`/api/v1/mentor/projects/${projectId}/evaluate-decomposition`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tasks: [
      { title: '录音上传', description: '实现文件上传功能' },
      { title: '调用Whisper API', description: '转录音频为文字' },
      { title: '显示结果', description: '展示转录文本' }
    ]
  })
});
```

### 4. 执行代码

```typescript
const execution = await fetch(`/api/v1/mentor/projects/${projectId}/execute-code`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    language: 'python',
    code: `
import openai

# Whisper转录
audio_file = open('meeting.mp3', 'rb')
transcript = openai.Audio.transcribe('whisper-1', audio_file)

print(transcript.text)
    `,
    timeout: 30000
  })
});

const result = await execution.json();
// {
//   status: 'success',
//   output: '会议内容转录文本...',
//   executionTime: 2500
// }
```

### 5. 上传文件

```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('purpose', 'input');
formData.append('aiAnalyze', 'true');

const upload = await fetch(`/api/v1/mentor/projects/${projectId}/upload`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await upload.json();
// {
//   fileId: 'xxx',
//   filename: 'code.py',
//   fileType: 'code',
//   aiAnalysis: {
//     summary: '这是一个数据处理脚本',
//     issues: ['缺少错误处理'],
//     suggestions: ['添加try-catch块']
//   }
// }
```

### 6. 反思引导

```typescript
// 引导反思
const reflection = await fetch(`/api/v1/mentor/projects/${projectId}/reflect`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    reflectionType: 'project_end'
  })
});

// 保存反思日志
const log = await fetch(`/api/v1/mentor/projects/${projectId}/reflection-log`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    reflectionType: 'project_end',
    whatLearned: '学会了使用Whisper API',
    whatWorked: '任务拆解很有帮助',
    whatDidntWork: '一开始没考虑错误处理',
    whatSurprised: '原来AI API这么简单',
    nextSteps: '想做一个更复杂的项目',
    emotionalState: 'confident'
  })
});
```

---

## 🎯 典型使用场景

### 场景1：纯情感对话

```typescript
// 用户感到迷茫
const response = await mentorChat({
  message: '我最近很迷茫，不知道未来要做什么'
});

// 启程小猫会：
// 1. 识别为情感类消息
// 2. 使用情感模式响应
// 3. 温暖地倾听和引导
// 4. 如果发现可以转化为项目，会温和建议
```

### 场景2：纯项目对话

```typescript
// 用户想做项目
const response = await mentorChat({
  message: '我想用AI自动总结会议纪要'
});

// 启程小猫会：
// 1. 识别为项目类消息
// 2. 使用项目模式响应
// 3. 用苏格拉底式提问引导
// 4. 帮助拆解任务
// 5. 在卡壳时提供MVP方案
```

### 场景3：协同模式

```typescript
// 用户既有情绪又想做项目
const response = await mentorChat({
  message: '我想学AI，但感觉太难了'
});

// 启程小猫会：
// 1. 识别为混合类消息
// 2. 使用协同模式响应
// 3. 先提供情感支持
// 4. 然后引导到具体项目
// 5. 保持温暖语气贯穿始终
```

---

## 🔧 集成到现有系统

### 1. 在主路由中注册

```typescript
// src/server.ts 或 src/app.ts
import enhancedMentorRoutes from './routes/enhancedMentorRoutes';

app.use('/api/v1/mentor', enhancedMentorRoutes);
```

### 2. 在前端调用

```typescript
// 小程序中使用
import Taro from '@tarojs/taro';

// 统一对话接口
export const mentorChat = async (message: string, options?: any) => {
  const token = Taro.getStorageSync('token');
  
  const response = await Taro.request({
    url: 'http://localhost:3000/api/v1/mentor/chat',
    method: 'POST',
    header: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    data: {
      message,
      ...options
    }
  });
  
  return response.data;
};
```

---

## 📊 监控与调试

### 1. 查看对话历史

```sql
-- 查看用户的对话历史
SELECT 
  role,
  content,
  mentor_type,
  created_at
FROM unified_mentor_conversations
WHERE user_id = 'xxx'
ORDER BY created_at DESC
LIMIT 20;
```

### 2. 查看项目列表

```sql
-- 查看用户的项目
SELECT 
  id,
  title,
  status,
  progress_percentage,
  created_at
FROM pbl_projects
WHERE user_id = 'xxx'
ORDER BY created_at DESC;
```

### 3. 查看导师模式统计

```sql
-- 查看用户的导师使用情况
SELECT * FROM user_mentor_overview
WHERE user_id = 'xxx';
```

### 4. 查看代码执行历史

```sql
-- 查看项目的代码执行记录
SELECT 
  language,
  status,
  execution_time,
  created_at
FROM pbl_code_executions
WHERE project_id = 'xxx'
ORDER BY created_at DESC;
```

---

## 🐛 常见问题

### Q1: API返回401 Unauthorized

**解决方案**：
```typescript
// 确保请求头包含有效的token
headers: {
  'Authorization': `Bearer ${token}`
}
```

### Q2: 代码执行超时

**解决方案**：
```typescript
// 增加超时时间
body: JSON.stringify({
  language: 'python',
  code: '...',
  timeout: 60000  // 60秒
})
```

### Q3: 文件上传失败

**解决方案**：
```typescript
// 检查文件大小（默认限制10MB）
if (file.size > 10 * 1024 * 1024) {
  console.error('文件太大');
}

// 检查文件类型
const allowedTypes = ['image/*', 'text/*', 'application/pdf'];
```

### Q4: AI分析失败

**解决方案**：
```typescript
// 检查ANTHROPIC_API_KEY是否配置
console.log(process.env.ANTHROPIC_API_KEY);

// 检查API配额
// 如果AI分析失败，文件仍会上传，只是没有分析结果
```

---

## 📚 下一步

1. **前端集成** - 在学生端小程序中添加项目管理页面
2. **测试** - 完整测试情感-项目融合流程
3. **优化** - 代码执行沙箱Docker化
4. **扩展** - 添加更多编程语言支持

---

## 🎉 开始使用

现在你可以开始使用启程小猫增强版了！

```bash
# 启动后端
cd backend
npm run dev

# 测试对话
curl -X POST http://localhost:3000/api/v1/mentor/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "我想做一个AI项目"}'
```

**祝你使用愉快！** 🐱✨💼
