# 启程AI服务

基于FastAPI的Python AI服务，为启程平台提供AI能力支持。

## 功能模块

### P0 优先级（已实现）

1. **交付物预检** (`POST /api/ai/pre-check-submission`)
   - 分析学生提交内容
   - 预测通过概率
   - 识别关键问题和亮点
   - 提供改进建议

2. **进步识别** (`POST /api/ai/progress-feedback`)
   - 对比历史表现
   - 生成鼓励性反馈
   - 识别能力提升
   - 提供下一步建议

3. **向量生成** (`POST /api/ai/generate-embedding`)
   - 生成1536维文本向量
   - 支持任务、学生画像向量化

## 技术栈

- **框架**: FastAPI 0.104.1
- **AI模型**: Anthropic Claude Sonnet 4.6
- **数据库**: PostgreSQL + pgvector
- **向量维度**: 1536
- **Python版本**: 3.9+

## 安装部署

### 1. 安装依赖

```bash
cd ai-service
pip install -r requirements.txt
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

编辑 `.env`：

```env
DATABASE_URL=postgresql://user:password@localhost:5432/qicheng
ANTHROPIC_API_KEY=your_api_key_here
HOST=0.0.0.0
PORT=8001
DEBUG=True
EMBEDDING_DIMENSIONS=1536
```

### 3. 启动服务

```bash
# 开发模式（自动重载）
python -m app.main

# 或使用uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### 4. 访问API文档

- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

## API接口

### 交付物预检

```bash
curl -X POST http://localhost:8001/api/ai/pre-check-submission \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "task-uuid",
    "student_id": "student-uuid",
    "submission": {
      "description": "我完成了...",
      "attachments": ["file1.pdf", "file2.png"]
    }
  }'
```

响应：

```json
{
  "pass_probability": 85,
  "issues": [
    {
      "type": "warning",
      "description": "缺少数据分析部分",
      "suggestion": "建议补充数据可视化图表"
    }
  ],
  "highlights": [
    "代码结构清晰",
    "文档完整"
  ],
  "overall_feedback": "整体完成度很好，注意补充数据分析部分。"
}
```

### 进步识别

```bash
curl -X POST http://localhost:8001/api/ai/progress-feedback \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "student-uuid",
    "task_id": "task-uuid",
    "current_performance": {
      "rating": 85,
      "feedback": "完成得很好",
      "completion_time": 8
    }
  }'
```

响应：

```json
{
  "feedback": "🌟 进步亮点：\n• 代码质量从60分提升到85分...",
  "progress": {
    "rating_improvement": 25,
    "time_improvement": 2,
    "stuck_points_reduced": 3
  },
  "has_history": true
}
```

### 向量生成

```bash
curl -X POST http://localhost:8001/api/ai/generate-embedding \
  -H "Content-Type: application/json" \
  -d '{
    "text": "开发一个AI产品调研报告",
    "type": "task_title"
  }'
```

响应：

```json
{
  "embedding": [0.123, -0.456, ...],
  "dimensions": 1536
}
```

## 项目结构

```
ai-service/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI主应用
│   ├── config.py            # 配置管理
│   ├── database.py          # 数据库连接
│   ├── api/
│   │   └── routes.py        # API路由
│   ├── services/
│   │   ├── pre_check.py     # 交付物预检服务
│   │   ├── progress_feedback.py  # 进步识别服务
│   │   └── embedding.py     # 向量生成服务
│   ├── models/
│   │   └── schemas.py       # Pydantic模型
│   └── utils/
│       └── claude_client.py # Claude API客户端
├── requirements.txt
├── .env.example
└── README.md
```

## 与Node.js后端集成

Node.js后端通过HTTP调用AI服务：

```typescript
// backend/src/services/aiServiceClient.ts
import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';

export async function preCheckSubmission(data: any) {
  const response = await axios.post(
    `${AI_SERVICE_URL}/api/ai/pre-check-submission`,
    data
  );
  return response.data;
}

export async function generateProgressFeedback(data: any) {
  const response = await axios.post(
    `${AI_SERVICE_URL}/api/ai/progress-feedback`,
    data
  );
  return response.data;
}
```

## 开发计划

### P1 优先级（待实现）

- [ ] 任务拆解API
- [ ] AI导师对话API
- [ ] 智能匹配优化
- [ ] 能力画像更新API

### P2 优先级（待实现）

- [ ] 语义搜索API
- [ ] 批量向量生成
- [ ] 向量索引优化
- [ ] API性能监控

## 注意事项

1. **API密钥安全**: 不要将 `.env` 文件提交到Git
2. **数据库连接**: 确保PostgreSQL已安装pgvector扩展
3. **CORS配置**: 生产环境需要限制允许的域名
4. **错误处理**: 所有API都有完善的错误处理和日志记录

## 许可证

MIT
