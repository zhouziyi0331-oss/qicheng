# 🎯 启程平台语义匹配系统 - 部署文档

**版本：** v1.0  
**状态：** ✅ 已实现，待部署  
**完成日期：** 2026-05-27

---

## 📖 项目简介

启程平台核心语义匹配引擎，实现AI驱动的供需精准匹配。

### 核心功能

1. **任务语义理解** - AI理解企业任务需求，自动拆解功能模块
2. **学生能力向量化** - 基于OPC测评和历史表现生成能力画像
3. **6维度精准匹配** - 技能、难度、领域、成长潜力、可靠性、偏好
4. **启程老师翻译** - 将专业术语翻译成学生能懂的语言
5. **智能推送** - 只推送给最匹配的5个学生

### 用户价值

**企业端：**
- ❌ 之前：发布任务后，所有学生都能看到，需要手动筛选大量申请
- ✅ 现在：AI自动匹配Top 100学生，企业选择5个推送，精准高效

**学生端：**
- ❌ 之前：看到任务描述，不确定自己能不能做，理解不了专业术语
- ✅ 现在：只收到最适合自己的任务推荐，启程老师帮忙翻译和拆解

---

## 🚀 快速部署

### 前置条件

1. **PostgreSQL 14+** 已安装
2. **pgvector扩展** 已安装
3. **Node.js 16+** 已安装
4. **Anthropic API Key** 已配置

### 一键部署

```bash
cd /Users/alwan/code/qicheng/backend

# 1. 执行数据库迁移
psql -U qicheng_user -d qicheng_db -f migrations/084_semantic_matching_system.sql

# 2. 验证部署
chmod +x verify_semantic_matching.sh
./verify_semantic_matching.sh

# 3. 初始化学生能力画像（可选，会在学生完成任务后自动生成）
# npm run init-student-capabilities

# 4. 初始化任务向量（可选，会在任务发布时自动生成）
# npm run init-task-vectors

# 5. 重启服务
npm run dev  # 开发环境
# 或
pm2 restart qicheng-backend  # 生产环境
```

---

## 📁 项目结构

```
backend/
├── migrations/
│   └── 084_semantic_matching_system.sql          # 数据库迁移
├── src/
│   ├── services/
│   │   ├── vectorGenerationService.ts            # 向量生成服务
│   │   ├── semanticMatchingEngine.ts             # 6维度匹配引擎
│   │   ├── qichengTeacherService.ts              # 启程老师翻译服务
│   │   └── matchingScheduler.ts                  # 匹配调度器
│   └── routes/
│       └── tasks/
│           ├── matchingController.ts             # 匹配API控制器
│           └── index.ts                          # 路由注册
├── verify_semantic_matching.sh                   # 验证脚本
└── SEMANTIC_MATCHING_DEPLOYMENT.md               # 本文档
```

---

## 🗄️ 数据库表

### 新增表（3张）

| 表名 | 说明 | 关键字段 |
|---|---|---|
| `student_capabilities` | 学生能力画像表 | skill_vector, combined_vector, skills, opc_* |
| `task_student_matches` | 任务学生匹配记录表 | overall_score, 6个维度分数, is_pushed |
| `task_translations` | 任务翻译表 | functional_modules, student_friendly_* |

### 扩展表（1张）

| 表名 | 新增字段 | 说明 |
|---|---|---|
| `tasks` | matching_enabled, matched_students_count, top_match_score | 匹配状态 |

### 新增视图（2个）

- `student_matching_overview` - 学生匹配概览
- `task_matching_overview` - 任务匹配概览

---

## 🔌 API接口

### 企业端接口（5个）

```bash
# 触发AI匹配
POST /api/v1/tasks/:taskId/trigger-matching
# 返回：匹配的学生数量

# 查看匹配的学生列表
GET /api/v1/tasks/:taskId/matched-students?limit=10
# 返回：Top N学生，包含匹配分数和详情

# 推送任务给选中的学生
POST /api/v1/tasks/:taskId/push-to-students
# Body: {studentIds: [id1, id2, id3, id4, id5]}

# 查看匹配统计
GET /api/v1/tasks/:taskId/matching-stats
# 返回：总匹配数、推送数、查看数、接受数

# 手动触发重新匹配
POST /api/v1/tasks/:taskId/rematch
```

### 学生端接口（3个）

```bash
# 查看推荐任务
GET /api/v1/students/recommended-tasks
# 返回：推送给该学生的任务列表

# 查看任务翻译
GET /api/v1/tasks/:taskId/translation
# 返回：学生友好的任务描述、功能模块拆解

# 接受推荐任务
POST /api/v1/tasks/:taskId/accept-recommendation
```

---

## 🎯 核心算法

### 6维度匹配算法

```typescript
总分 = 技能匹配(35%) + 难度匹配(20%) + 领域匹配(15%) 
     + 成长潜力(15%) + 可靠性(10%) + 偏好对齐(5%)
```

#### 1. 技能匹配 (35%)
- **向量相似度** (60%): 使用余弦相似度计算任务向量和学生向量的相似度
- **技能覆盖率** (40%): 学生掌握的技能占任务要求技能的比例

#### 2. 难度匹配 (20%)
- 任务难度与学生能力水平的匹配度
- 允许适度挑战（+1级），但不能过度超纲

#### 3. 领域匹配 (15%)
- 学生在该领域的项目经验
- 基于历史任务的领域分布

#### 4. 成长潜力 (15%)
- 该任务对学生的学习价值
- 能够学到新技能的数量和重要性

#### 5. 可靠性 (10%)
- 准时交付率
- 平均任务质量
- 客户满意度

#### 6. 偏好对齐 (5%)
- 任务类型与学生偏好的匹配度
- 工作风格的契合度

---

## 🔄 业务流程

### 企业发布任务流程

```
1. 企业发布任务
   ↓
2. 系统自动触发匹配
   - 生成任务向量
   - 生成任务翻译（启程老师）
   - 找出Top 100匹配学生
   ↓
3. 企业查看匹配结果
   - 查看学生列表
   - 查看匹配分数和原因
   ↓
4. 企业选择5个学生推送
   ↓
5. 学生收到推荐任务通知
```

### 学生查看推荐任务流程

```
1. 学生登录查看推荐任务
   ↓
2. 查看任务详情
   - 学生友好标题和描述
   - 功能模块拆解
   - 你需要做什么
   - 你会学到什么
   - 匹配度分析
   ↓
3. 学生接受任务
   ↓
4. 进入正常任务流程
```

---

## 📊 监控指标

### 关键SQL查询

```sql
-- 匹配质量统计（最近7天）
SELECT
  COUNT(*) as total_matches,
  AVG(overall_score) as avg_score,
  COUNT(*) FILTER (WHERE overall_score > 0.8) as high_quality_matches,
  COUNT(*) FILTER (WHERE is_pushed = true) as pushed_count,
  COUNT(*) FILTER (WHERE student_accepted = true) as accepted_count,
  ROUND(COUNT(*) FILTER (WHERE student_accepted = true)::numeric / 
        NULLIF(COUNT(*) FILTER (WHERE is_pushed = true), 0) * 100, 2) as acceptance_rate
FROM task_student_matches
WHERE created_at > NOW() - INTERVAL '7 days';

-- 学生能力画像覆盖率
SELECT
  COUNT(DISTINCT u.id) as total_students,
  COUNT(DISTINCT sc.student_id) as has_capability,
  ROUND(COUNT(DISTINCT sc.student_id)::numeric / COUNT(DISTINCT u.id) * 100, 2) as coverage_rate
FROM users u
LEFT JOIN student_capabilities sc ON u.id = sc.student_id
WHERE u.role = 'student';

-- 任务向量生成进度
SELECT
  COUNT(*) as total_tasks,
  COUNT(*) FILTER (WHERE combined_embedding IS NOT NULL) as has_vector,
  ROUND(COUNT(*) FILTER (WHERE combined_embedding IS NOT NULL)::numeric / COUNT(*) * 100, 2) as vector_rate
FROM tasks
WHERE status != 'deleted';
```

---

## 🐛 故障排查

### 常见问题

#### 1. pgvector扩展未安装

**症状：** 执行migration时报错 `extension "vector" does not exist`

**解决：**
```bash
# 安装pgvector扩展
psql -U qicheng_user -d qicheng_db -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

#### 2. 向量生成失败

**症状：** 日志显示 `Failed to generate embedding`

**原因：** Embedding API不可用或API Key未配置

**解决：**
```bash
# 检查环境变量
cat .env | grep EMBEDDING_API_URL
cat .env | grep ANTHROPIC_API_KEY

# 如果未配置，添加到.env
echo "EMBEDDING_API_URL=https://api.siliconflow.cn/v1/embeddings" >> .env
echo "EMBEDDING_API_KEY=your_api_key_here" >> .env
```

#### 3. 匹配结果为空

**症状：** 触发匹配后，`matched_students_count = 0`

**原因：** 学生能力画像未初始化

**解决：**
```bash
# 检查学生能力画像数量
psql -U qicheng_user -d qicheng_db -c "SELECT COUNT(*) FROM student_capabilities;"

# 如果为0，需要初始化
# 方法1: 等待学生完成任务后自动生成
# 方法2: 手动批量初始化（需要实现初始化脚本）
```

#### 4. API返回500错误

**症状：** 调用匹配API时返回500

**解决：**
```bash
# 查看错误日志
tail -100 logs/error.log

# 检查数据库连接
psql -U qicheng_user -d qicheng_db -c "SELECT 1;"

# 检查服务状态
pm2 list
```

---

## 📈 性能优化

### 向量检索优化

```sql
-- 使用IVFFlat索引加速向量检索
CREATE INDEX idx_student_capabilities_vector ON student_capabilities
  USING ivfflat (combined_vector vector_cosine_ops) WITH (lists = 100);

-- 调整lists参数（根据数据量）
-- 数据量 < 1000: lists = 10
-- 数据量 1000-10000: lists = 100
-- 数据量 > 10000: lists = 1000
```

### 缓存策略

```typescript
// 向量生成服务已实现缓存
private embeddingCache: Map<string, number[]> = new Map();
private readonly CACHE_TTL = 3600000; // 1小时缓存
```

### 批量处理

```typescript
// 避免API限流，批量处理时添加延迟
for (const task of tasks) {
  await processTask(task);
  await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒延迟
}
```

---

## 🎯 业务指标

### 目标指标

| 指标 | 目标值 | 测量方法 |
|---|---|---|
| 匹配准确率 | >60% | 推送的学生中接受任务的比例 |
| 任务完成质量 | >4.0/5.0 | 匹配推送任务的平均质量评分 |
| 响应速度 | >70% | 学生24小时内响应推荐任务的比例 |
| 企业满意度 | >80% | 企业对推荐学生的满意度 |
| 学生满意度 | >75% | 学生对推荐任务的满意度 |

### 监控命令

```bash
# 查看实时日志
tail -f logs/app.log | grep -E "Matching|SemanticMatching"

# 查看匹配统计
psql -U qicheng_user -d qicheng_db -c "
SELECT 
  COUNT(*) as total,
  AVG(overall_score) as avg_score,
  COUNT(*) FILTER (WHERE is_pushed) as pushed,
  COUNT(*) FILTER (WHERE student_accepted) as accepted
FROM task_student_matches
WHERE created_at > NOW() - INTERVAL '7 days';"
```

---

## 🔧 维护命令

```bash
# 查看匹配调度器状态
tail -f logs/app.log | grep MatchingScheduler

# 手动触发全量重新匹配
curl -X POST http://localhost:3000/api/v1/admin/rematch-all-tasks \
  -H "Authorization: Bearer <admin_token>"

# 查看数据库表状态
psql -U qicheng_user -d qicheng_db -c "\dt *matching*"
psql -U qicheng_user -d qicheng_db -c "\dt student_capabilities"
psql -U qicheng_user -d qicheng_db -c "\dt task_translations"

# 查看索引状态
psql -U qicheng_user -d qicheng_db -c "
SELECT schemaname, tablename, indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('student_capabilities', 'task_student_matches', 'task_translations');"

# 重建向量索引（如果性能下降）
psql -U qicheng_user -d qicheng_db -c "
REINDEX INDEX idx_student_capabilities_vector;"
```

---

## 📝 测试清单

### 功能测试

- [ ] 企业发布任务后，自动触发匹配
- [ ] 匹配结果包含Top 100学生
- [ ] 企业可以查看学生列表和匹配分数
- [ ] 企业可以选择5个学生推送
- [ ] 学生可以查看推荐任务
- [ ] 学生可以查看任务翻译
- [ ] 学生可以接受推荐任务
- [ ] 匹配调度器每天凌晨3点自动运行

### 性能测试

- [ ] 单个任务匹配耗时 < 10秒（100个学生）
- [ ] 向量生成耗时 < 5秒（单个任务/学生）
- [ ] 向量检索耗时 < 2秒（1000个学生）
- [ ] API响应时间 < 3秒

### 数据完整性测试

- [ ] 所有学生都有能力画像
- [ ] 所有任务都有向量
- [ ] 所有任务都有翻译
- [ ] 匹配分数在0-1之间
- [ ] 6个维度分数总和等于总分

---

## 📞 获取帮助

### 文档资源

- 📚 [语义匹配系统设计方案](/.claude/plans/expressive-sleeping-wozniak.md)
- 🚀 [快速部署指南](#快速部署)
- 🐛 [故障排查](#故障排查)

### 快速链接

- 数据库迁移：`migrations/084_semantic_matching_system.sql`
- 核心服务：`src/services/semanticMatchingEngine.ts`
- API控制器：`src/routes/tasks/matchingController.ts`
- 验证脚本：`verify_semantic_matching.sh`

---

## 📝 更新日志

### v1.0 (2026-05-27)

**核心功能：**
- ✅ 6维度语义匹配引擎
- ✅ 向量生成服务（BGE-large-zh-v1.5）
- ✅ 启程老师翻译服务
- ✅ 匹配调度器（每天凌晨3点）
- ✅ 8个API接口（企业5个 + 学生3个）

**数据库：**
- ✅ 3个新表 + 1个扩展表
- ✅ 2个视图 + 1个辅助函数
- ✅ pgvector索引优化

**交付物：**
- ✅ ~2000行生产级代码
- ✅ 1份完整文档
- ✅ 1个验证脚本

---

## 👥 贡献者

- 语义匹配项目组
- 启程平台技术团队

---

## 📄 许可证

内部项目 - 启程平台

---

**最后更新：** 2026-05-27  
**文档版本：** v1.0  
**项目状态：** ✅ 已实现，待部署

开始部署吧！🚀
