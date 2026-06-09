# 启程平台 - 完整部署和使用指南 v2.0

## 📋 快速导航

- [系统概述](#系统概述)
- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [数据初始化](#数据初始化)
- [API使用](#api使用)
- [验收测试](#验收测试)
- [监控维护](#监控维护)

---

## 系统概述

### ✅ 已实现的核心功能

| 功能模块 | 状态 | 说明 |
|---------|------|------|
| OPC测评（AI-01） | ✅ 真AI | 38题热情探索，生成6维能力画像 |
| 项目需求分析（AI-02） | ✅ 真AI | 理解企业需求，生成结构化画像 |
| 交付物预审核（AI-03） | ✅ 真AI | 自动审核学生提交物 |
| 成长报告（AI-04） | ✅ 真AI | 基于真实数据的成长分析 |
| AI导师T01-T05（AI-06） | ✅ 真AI | 5个场景的智能引导 |
| 语义匹配引擎 | ✅ 真AI | 6维度智能匹配 |
| 启程老师翻译 | ✅ 真AI | 理解双方语言并转化 |
| 工作条件匹配 | ✅ 真AI | 基于工作风格的匹配 |

### 🎯 AI导师5个场景

1. **T01: 接单引导** - 根据学生画像生成个性化任务拆解
2. **T02: 学生求助** - 苏格拉底式提问引导思考
3. **T03: 翻译反馈** - 把企业模糊反馈翻译成具体修改方向
4. **T04: 轻推** - 无操作2小时后温和提醒
5. **T05: 里程碑见证** - 引用历史数据庆祝成长

---

## 环境要求

### 必需软件
- Node.js >= 16.x
- PostgreSQL >= 14.x (需要pgvector扩展)
- Redis >= 6.x

### 必需API密钥
- **Claude API**: https://console.anthropic.com/
- **BGE向量API**: 自建或云服务

---

## 快速开始

### 1. 安装依赖

```bash
cd /path/to/qicheng/backend
npm install
```

### 2. 配置环境变量

创建 `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/qicheng
REDIS_HOST=localhost
REDIS_PORT=6379
ANTHROPIC_API_KEY=sk-ant-xxxxx
EMBEDDING_API_URL=https://your-embedding-api.com
EMBEDDING_API_KEY=your-api-key
PORT=3000
NODE_ENV=production
```

### 3. 安装pgvector扩展

```sql
psql -U postgres -d qicheng
CREATE EXTENSION IF NOT EXISTS vector;
```

### 4. 运行数据库迁移

```bash
psql $DATABASE_URL -f migrations/076_task_student_semantic_matching.sql
```

### 5. 启动服务

```bash
# 编译
npm run build

# 启动主服务
npm start

# 启动Worker（另一个终端）
npm run start:worker
```

### 6. 验证

```bash
curl http://localhost:3000/health
# 预期: {"status":"ok","service":"qicheng-backend"}
```

---

## 数据初始化

### 为现有数据生成向量

```bash
ts-node src/scripts/initializeData.ts
```

**脚本功能**：
- 为所有学生初始化能力画像
- 为所有任务生成向量和翻译
- 自动跳过已有数据

**预计时间**：100学生+50任务 ≈ 15分钟

---

## API使用

### 企业端：触发匹配

```bash
POST /api/v1/tasks/:taskId/trigger-matching
Authorization: Bearer {token}

# 响应
{
  "success": true,
  "matchedCount": 100,
  "topScore": 0.87
}
```

### 企业端：查看匹配学生

```bash
GET /api/v1/tasks/:taskId/matched-students?limit=10
Authorization: Bearer {token}
```

### 企业端：推送给学生

```bash
POST /api/v1/tasks/:taskId/push-to-students
Content-Type: application/json

{
  "studentIds": ["uuid1", "uuid2", "uuid3", "uuid4", "uuid5"]
}
```

### 学生端：查看推荐任务

```bash
GET /api/v1/students/recommended-tasks
Authorization: Bearer {token}
```

### 学生端：查看任务翻译

```bash
GET /api/v1/tasks/:taskId/translation
Authorization: Bearer {token}
```

---

## 验收测试

### 快速验收（5分钟）

**测试T-03（最关键）**：

1. 企业端打回交付物，写："整体感觉可以更好"
2. 学生端查看导师消息
3. **期望**：导师翻译成具体建议，不是原封不动转述

✅ **如果通过，说明核心AI是真的**

### 完整验收清单

- [ ] AI调用有1-3秒延迟
- [ ] 同样操作两次，内容略有不同
- [ ] 不同学生收到的消息真的不同
- [ ] 能理解模糊语言并转化
- [ ] 能引用历史数据
- [ ] AI日志表有记录

---

## 监控维护

### 检查AI成本

```sql
-- 今日成本
SELECT SUM(cost_yuan) FROM ai_call_logs WHERE created_at >= CURRENT_DATE;

-- 按引擎统计
SELECT engine_name, COUNT(*), SUM(cost_yuan) 
FROM ai_call_logs 
WHERE created_at >= CURRENT_DATE
GROUP BY engine_name;
```

### 检查失败调用

```sql
SELECT engine_name, error_message, created_at
FROM ai_call_logs
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 20;
```

### 检查队列状态

```bash
redis-cli
LLEN bull:ai-tasks:wait
LLEN bull:ai-tasks:active
LLEN bull:ai-tasks:failed
```

---

## 常见问题

### Q: AI调用失败率高？

**检查**：
```bash
echo $ANTHROPIC_API_KEY
tail -f logs/error.log | grep "AI call failed"
```

### Q: 向量检索很慢？

**优化**：
```sql
CREATE INDEX CONCURRENTLY idx_student_capabilities_vector 
ON student_capabilities 
USING ivfflat (combined_vector vector_cosine_ops) 
WITH (lists = 100);

ANALYZE student_capabilities;
```

### Q: Worker进程崩溃？

**使用PM2**：
```bash
pm2 start src/worker.ts --name worker --max-memory-restart 500M
pm2 logs worker
```

---

## 成本估算

### AI调用成本（1000用户/月）

| 功能 | 单次成本 | 月成本 |
|------|---------|--------|
| OPC测评 | ¥0.15 | ¥150 |
| 任务翻译 | ¥0.10 | ¥100 |
| AI导师 | ¥0.05×5 | ¥250 |
| 交付物审核 | ¥0.08 | ¥80 |
| 成长报告 | ¥0.12 | ¥120 |
| **总计** | - | **¥700** |

### 服务器成本

- 应用服务器（4核8G）：¥300/月
- 数据库（4核16G）：¥500/月
- Redis（2G）：¥100/月
- **总计**：¥900/月

### 总成本：¥1600/月（1000活跃用户）

---

## 相关文档

- **验收手册**: `验收手册.md`
- **AI导师修复报告**: `AI_MENTOR_FIX_REPORT.md`
- **语义匹配实现**: `SEMANTIC_MATCHING_IMPLEMENTATION.md`
- **最终实现总结**: `FINAL_IMPLEMENTATION_SUMMARY.md`

---

**版本**: v2.0  
**更新**: 2026-05-26  
**状态**: ✅ 生产就绪
