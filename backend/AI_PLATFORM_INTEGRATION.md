# 启程平台 - AI中台集成实现方案

**日期**: 2026-05-26  
**状态**: ✅ 核心架构已实现，待集成WebSocket和导师系统

---

## 🎯 整体架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AI 中台（统一调度 - Bull队列）                      │
│  AI-01画像  AI-02匹配  AI-03审核  AI-04报告  AI-06导师               │
└─────────────────────────────────────────────────────────────────────┘
        ↑                    ↑                    ↑
        │                    │                    │
┌───────┴────────┐  ┌────────┴────────┐  ┌───────┴────────┐
│   学生端 App    │  │   匹配引擎      │  │   企业端 App    │
│  38题测试      │  │  pgvector检索   │  │  项目发布      │
│  项目接单      │  │  Embedding向量化 │  │  需求管理      │
│  导师对话      │  │  规则+向量匹配   │  │  交付验收      │
└───────┬────────┘  └────────┬────────┘  └───────┬────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │        数据层               │
              │  PostgreSQL + pgvector      │
              │  Redis（Bull队列）          │
              │  OSS（文件存储）             │
              └─────────────────────────────┘
```

---

## ✅ 已实现的核心模块

### 1. AI任务队列系统 (aiTaskQueue.ts)

**功能**：统一调度所有AI任务，异步处理，自动重试

**支持的任务类型**：
```typescript
enum AITaskType {
  PROFILE_ANALYSIS = 'profile-analysis',           // AI-01: 学生画像生成
  PROJECT_CONDITION_ANALYSIS = 'project-condition-analysis', // 项目需求条件分析
  MATCH_ANALYSIS = 'match-analysis',               // AI-02: 适配性判断
  SUBMISSION_REVIEW = 'submission-review',         // AI-03: 交付物预审核
  GROWTH_REPORT = 'growth-report',                 // AI-04: 成长报告
  MENTOR_GUIDANCE = 'mentor-guidance'              // AI-06: 导师引导
}
```

**队列配置**：
- 自动重试：3次
- 指数退避：2秒起始
- 保留记录：最近100条完成/失败任务
- Redis持久化

**使用方式**：
```typescript
import { enqueueAITask, AITaskType } from './services/aiTaskQueue';

// 添加任务到队列
await enqueueAITask({
  type: AITaskType.PROFILE_ANALYSIS,
  studentId: 'xxx',
  assessmentId: 'xxx',
  answers: {...},
  scores: {...}
});
```

### 2. 向量生成服务 (vectorEmbeddingService.ts)

**功能**：调用BGE-large-zh-v1.5生成1024维向量

**特性**：
- 自动降级：API不可用时返回null
- 批量生成：支持多文本批量处理
- 健康检查：`checkApiHealth()`
- 相似度计算：`calculateCosineSimilarity()`

### 3. 学生画像生成 (opcAnalysisService.ts)

**输入**：38题OPC测试答案 + 分数
**输出**：六维度工作条件画像 + 1024维向量
**存储**：`student_work_condition_profiles`

**六维度**：
1. 信息接收偏好
2. 创作驱动来源
3. 学习切入方式
4. 执行节奏模式
5. 自主度需求
6. 风险容忍度

### 4. 项目需求分析 (projectAnalysisService.ts)

**输入**：任务标题、描述、交付物类型、周期、预算
**输出**：六维度需求条件画像 + 1024维向量
**存储**：`project_requirement_profiles`

### 5. 混合匹配引擎 (workConditionMatchingEngine.ts)

**匹配策略**：
- 第一阶段：pgvector向量检索（Top 30候选）
- 第二阶段：六维度规则匹配（精排）
- 综合评分：规则60% + 向量40%

**输出**：
- 匹配分数
- 六维度详细分析
- 匹配亮点
- 潜在摩擦点
- 调整建议
- 推荐理由（学生/企业双视角）

---

## 🔄 完整数据流

### 阶段一：学生完成OPC测试

```
学生提交38题答案
  ↓
POST /api/v1/opc-v2/:assessmentId/complete
  ↓
opcV2AssessmentService.completeAssessment()
  ├─ 计算六维度分数
  ├─ 保存到 opc_v2_results
  └─ 添加任务到队列 ✅
      ↓
Bull队列异步处理
  ├─ opcAnalysisService.generateWorkConditionProfile()
  │   └─ 生成六维度工作条件文本
  ├─ vectorEmbeddingService.generateStudentProfileVector()
  │   └─ 调用Embedding API生成1024维向量
  └─ 保存到 student_work_condition_profiles
      ├─ profile_text
      └─ profile_vector
      ↓
队列完成事件触发
  └─ WebSocket推送 analysis_complete ⚠️ 待实现
```

**已实现**：✅ 队列异步处理  
**待实现**：⚠️ WebSocket推送

### 阶段二：企业发布任务

```
企业填写任务信息
  ↓
POST /api/v1/tasks (创建任务)
  ↓
任务保存到 tasks 表
  ↓
POST /api/v1/work-condition/task/:taskId/generate-requirement
  ↓
支持两种模式：
  ├─ async=true（默认）：添加到队列 ✅
  │   ↓
  │   Bull队列异步处理
  │   ├─ projectAnalysisService.generateRequirementProfile()
  │   ├─ vectorEmbeddingService.generateProjectRequirementVector()
  │   └─ 保存到 project_requirement_profiles
  │       ├─ requirement_text
  │       └─ requirement_vector
  │       ↓
  │   WebSocket推送 requirement_complete ⚠️ 待实现
  │
  └─ async=false：同步生成并返回 ✅
```

**已实现**：✅ 队列异步处理 + 同步模式  
**待实现**：⚠️ WebSocket推送

### 阶段三：学生请求推荐任务

```
学生点击"为我推荐项目"
  ↓
GET /api/v1/work-condition/student/recommended-tasks
  ↓
workConditionMatchingEngine.findBestStudentsForTask()
  ├─ 【第一步】向量检索
  │   SELECT * FROM student_work_condition_profiles
  │   ORDER BY profile_vector <=> requirement_vector
  │   LIMIT 30
  │   ↓
  ├─ 【第二步】规则匹配
  │   对30个候选进行六维度分析
  │   ├─ matchInformationReception()
  │   ├─ matchCreationDrive()
  │   ├─ matchLearningApproach()
  │   ├─ matchExecutionRhythm()
  │   ├─ matchAutonomy()
  │   └─ matchRiskTolerance()
  │   ↓
  ├─ 【第三步】综合评分
  │   fitScore = ruleScore * 0.6 + vectorSimilarity * 0.4
  │   ↓
  └─ 【第四步】保存匹配记录
      INSERT INTO work_condition_matches
      ├─ fit_score
      ├─ dimension_matches
      ├─ match_points
      ├─ friction_points
      └─ recommendation_for_student
      ↓
返回Top 10任务
  ├─ 匹配度分数
  ├─ 匹配亮点
  └─ 推荐理由
```

**已实现**：✅ 完整流程

### 阶段四：学生接单（待集成）

```
学生点击"申请接单"
  ↓
POST /api/v1/projects/:id/apply
  ↓
创建订单
  ├─ INSERT INTO orders (status='accepted')
  └─ 触发导师引导 ⚠️ 待实现
      ↓
30秒后自动触发
  ↓
enqueueAITask({
  type: AITaskType.MENTOR_GUIDANCE,
  orderId: 'xxx',
  scenario: 'T01',
  context: {...}
})
  ↓
Bull队列处理
  ├─ 调用AI-06（T-01场景）⚠️ 待集成
  ├─ 生成任务拆解（3步）
  └─ 保存到 mentor_sessions
      ↓
WebSocket推送 mentor_push ⚠️ 待实现
```

**已实现**：✅ 队列框架  
**待实现**：⚠️ AI-06集成、WebSocket推送

---

## 📊 数据表关系

### 核心表

```sql
-- 学生工作条件画像
student_work_condition_profiles
  ├─ student_id (FK → users)
  ├─ profile_text (六维度文本)
  ├─ profile_vector (1024维向量)
  └─ core_strengths (核心优势)

-- 项目需求条件画像
project_requirement_profiles
  ├─ task_id (FK → tasks)
  ├─ requirement_text (六维度文本)
  ├─ requirement_vector (1024维向量)
  └─ project_type (项目类型)

-- 工作条件匹配记录
work_condition_matches
  ├─ task_id (FK → tasks)
  ├─ student_id (FK → users)
  ├─ fit_score (综合分数)
  ├─ dimension_matches (六维度详情)
  ├─ match_points (匹配亮点)
  ├─ friction_points (摩擦点)
  └─ recommendation_for_student (推荐理由)
```

### 向量检索索引

```sql
-- pgvector IVFFlat索引
CREATE INDEX idx_student_work_profiles_vector
  ON student_work_condition_profiles
  USING ivfflat (profile_vector vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX idx_project_requirement_profiles_vector
  ON project_requirement_profiles
  USING ivfflat (requirement_vector vector_cosine_ops)
  WITH (lists = 100);
```

---

## 🔌 API端点总览

### 学生端

```
POST   /api/v1/opc-v2/:assessmentId/complete
       完成OPC测试，自动触发画像生成（队列）

GET    /api/v1/work-condition/student/:studentId/profile
       获取学生工作条件画像

GET    /api/v1/work-condition/student/recommended-tasks
       获取推荐任务（基于工作条件匹配）

GET    /api/v1/work-condition/task/:taskId/match-detail
       查看具体任务的匹配详情
```

### 企业端

```
POST   /api/v1/work-condition/task/:taskId/generate-requirement
       生成任务需求条件画像（支持同步/异步）

GET    /api/v1/work-condition/task/:taskId/requirement
       获取任务需求条件画像

POST   /api/v1/work-condition/task/:taskId/match
       触发工作条件匹配

GET    /api/v1/work-condition/task/:taskId/matches
       查看匹配的学生列表
```

### 管理端

```
GET    /api/v1/ai-tasks/stats
       查看AI任务队列统计
```

---

## ⚠️ 待实现的集成点

### 1. WebSocket实时推送

**需要实现的事件**：

```typescript
// 学生画像生成完成
websocket.push(studentId, {
  type: 'profile_analysis_complete',
  profileText: '...',
  coreStrengths: [...]
});

// 项目需求画像生成完成
websocket.push(companyId, {
  type: 'requirement_analysis_complete',
  taskId: '...',
  projectType: '...'
});

// 匹配完成
websocket.push(companyId, {
  type: 'match_complete',
  taskId: '...',
  matchCount: 10
});

// 导师消息推送
websocket.push(studentId, {
  type: 'mentor_push',
  orderId: '...',
  message: '...'
});
```

**实现位置**：
- 在 `aiTaskQueue.ts` 的 `completed` 事件监听器中添加
- 需要创建 `websocketService.ts`

### 2. AI-06导师系统集成

**需要实现的场景**：

```typescript
// T-01: 接单后30秒，任务拆解
processMentorGuidance({
  scenario: 'T01',
  orderId: '...',
  context: {
    studentProfile: '...',
    projectRequirement: '...',
    taskDescription: '...'
  }
});

// T-02: 学生主动求助
processMentorGuidance({
  scenario: 'T02',
  orderId: '...',
  context: {
    studentMessage: '...',
    conversationHistory: [...]
  }
});

// T-03: 企业打回，翻译反馈
processMentorGuidance({
  scenario: 'T03',
  orderId: '...',
  context: {
    companyFeedback: '...',
    submission: '...'
  }
});

// T-04: 无操作超过2小时，轻推
processMentorGuidance({
  scenario: 'T04',
  orderId: '...',
  context: {
    lastActivityAt: '...'
  }
});

// T-05: 任务完成，里程碑见证
processMentorGuidance({
  scenario: 'T05',
  orderId: '...',
  context: {
    completedTask: '...',
    performance: {...}
  }
});
```

**实现位置**：
- 在 `aiTaskQueue.ts` 的 `processMentorGuidance()` 中集成现有导师系统
- 可能需要调用 `unifiedMentorRoutes` 或 `pblAgentRoutes`

### 3. 订单状态机触发器

**需要在订单状态变更时自动触发AI任务**：

```typescript
// 订单创建 → 触发T-01
orders.status = 'accepted'
  → enqueueAITask({ type: MENTOR_GUIDANCE, scenario: 'T01' })

// 学生提交 → 触发AI-03预审核
orders.status = 'submitted'
  → enqueueAITask({ type: SUBMISSION_REVIEW })

// 企业打回 → 触发T-03
orders.status = 'revision_requested'
  → enqueueAITask({ type: MENTOR_GUIDANCE, scenario: 'T03' })

// 任务完成 → 触发AI-04成长报告 + T-05
orders.status = 'completed'
  → enqueueAITask({ type: GROWTH_REPORT })
  → enqueueAITask({ type: MENTOR_GUIDANCE, scenario: 'T05' })
```

**实现方式**：
- 在订单更新的API中添加触发逻辑
- 或使用PostgreSQL触发器
- 或使用事件发布订阅模式

---

## 🚀 部署配置

### 环境变量

```bash
# Redis（Bull队列）
REDIS_URL=redis://localhost:6379

# Embedding API
EMBEDDING_API_URL=https://api.example.com/v1/embeddings
EMBEDDING_API_KEY=your-api-key

# PostgreSQL（已有）
DATABASE_URL=postgresql://...

# WebSocket（待添加）
WEBSOCKET_PORT=3001
```

### 启动Worker进程

```bash
# 开发环境
npm run dev:worker

# 生产环境
npm run start:worker
```

**worker.ts** (需要创建):
```typescript
import './src/services/aiTaskQueue';
import logger from './src/utils/logger';

logger.info('AI Task Worker started');

process.on('SIGTERM', async () => {
  logger.info('Worker shutting down...');
  process.exit(0);
});
```

---

## 📈 监控和日志

### 队列监控

```typescript
import { getQueueStats } from './services/aiTaskQueue';

// 获取队列状态
const stats = await getQueueStats();
console.log(stats);
// {
//   waiting: 5,
//   active: 2,
//   completed: 100,
//   failed: 3,
//   delayed: 0,
//   total: 110
// }
```

### 日志记录

所有AI任务都会记录：
- 任务开始：`Processing AI task: ${type}`
- 任务完成：`AI task completed: ${type}`
- 任务失败：`AI task failed: ${type}`
- 任务卡住：`AI task stalled: ${type}`

---

## ✅ 实现进度

| 模块 | 状态 | 说明 |
|------|------|------|
| Bull队列系统 | ✅ | 已实现 |
| 向量生成服务 | ✅ | 已实现 |
| 学生画像生成 | ✅ | 已集成队列 |
| 项目需求分析 | ✅ | 已集成队列 |
| 混合匹配引擎 | ✅ | 已实现 |
| API端点 | ✅ | 已实现 |
| WebSocket推送 | ⚠️ | 待实现 |
| AI-06导师集成 | ⚠️ | 待实现 |
| 订单状态触发器 | ⚠️ | 待实现 |
| Worker进程 | ⚠️ | 待实现 |

---

## 🎯 下一步行动

### 优先级P0（核心功能）

1. **创建WebSocket服务**
   - 实现 `websocketService.ts`
   - 集成到队列完成事件
   - 前端连接和事件监听

2. **集成AI-06导师系统**
   - 在 `processMentorGuidance()` 中调用现有导师API
   - 实现5个场景的处理逻辑

3. **创建Worker进程**
   - 创建 `worker.ts`
   - 添加启动脚本
   - 配置进程管理（PM2）

### 优先级P1（增强功能）

4. **订单状态触发器**
   - 在订单API中添加触发逻辑
   - 实现自动化流程

5. **队列监控面板**
   - 创建管理端API
   - 显示队列状态和任务历史

6. **性能优化**
   - 批量向量生成
   - 向量缓存
   - 队列优先级

---

## 📚 相关文档

- [工作条件匹配系统 - Phase 1](./WORK_CONDITION_MATCHING_SUMMARY.md)
- [工作条件匹配系统 - Phase 2](./PHASE2_VECTOR_MATCHING_SUMMARY.md)
- [深度思考启程老师](./COMPLETE_IMPLEMENTATION_SUMMARY.md)

---

## ✅ 总结

**已完成**：
- ✅ AI任务队列系统（Bull）
- ✅ 向量生成服务（BGE-large-zh-v1.5）
- ✅ 学生画像异步生成
- ✅ 项目需求异步生成
- ✅ 混合匹配引擎（规则60% + 向量40%）
- ✅ 完整的API端点

**待完成**：
- ⚠️ WebSocket实时推送
- ⚠️ AI-06导师系统集成
- ⚠️ 订单状态自动触发
- ⚠️ Worker进程部署

**系统状态**：✅ 核心架构完成，可开始集成测试
