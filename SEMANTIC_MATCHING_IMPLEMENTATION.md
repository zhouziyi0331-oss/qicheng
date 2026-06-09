# 启程平台核心语义匹配引擎 - 实现报告

**实现日期**: 2026-05-27  
**系统名称**: AI驱动的供需语义匹配引擎  
**核心功能**: 任务语义理解 + 学生能力向量化 + 精准匹配推荐 + 启程老师翻译

---

## ✅ 实现状态

**后端系统**: 100% 完成  
**数据库Schema**: 100% 完成  
**API接口**: 100% 完成  
**前端实现**: 待开发

---

## 📊 系统概述

### 核心问题
启程平台之前缺少最核心的功能：**AI驱动的供需语义匹配引擎**。

**之前的问题**：
- ❌ 企业发布任务 → 所有学生都能看到（广播模式）
- ❌ 学生手动搜索 → 自己判断能不能做
- ❌ 没有AI理解任务需求
- ❌ 没有智能推荐最合适的学生
- ❌ 没有精准的点对点匹配

**现在的解决方案**：
- ✅ AI理解企业任务：需要什么能力？难度如何？适合什么阶段的学生？
- ✅ 学生能力向量化：基于OPC测评 + 历史任务表现
- ✅ 精准匹配推荐：**只推送给最匹配的5个学生**（其他人看不到）
- ✅ 启程老师翻译：将专业术语翻译成学生能懂的语言

---

## 🗄️ 数据库设计

### 1. 新增表

#### `student_capabilities` - 学生能力画像表
存储学生的技能向量、学习轨迹、质量指标等。

**核心字段**：
- `skill_vector` (vector 1536) - 技能向量
- `trajectory_vector` (vector 512) - 学习轨迹向量
- `quality_vector` (vector 512) - 质量向量
- `preference_vector` (vector 512) - 偏好向量
- `combined_vector` (vector 1536) - 组合向量（用于快速检索）
- `skills` (JSONB) - 技能熟练度矩阵
- `tasks_completed` - 完成任务数
- `avg_task_quality` - 平均任务质量
- `avg_client_satisfaction` - 平均客户满意度
- `on_time_delivery_rate` - 准时交付率
- `quality_trend` - 质量趋势（improving/stable/declining）
- `opc_openness/persistence/creativity` - OPC测评结果

#### `task_student_matches` - 任务学生匹配记录表
存储每个任务与学生的匹配分数和详情。

**核心字段**：
- `overall_score` - 综合匹配分数（0-1）
- `skill_match_score` - 技能匹配分数
- `difficulty_match_score` - 难度匹配分数
- `domain_match_score` - 领域匹配分数
- `growth_potential_score` - 成长潜力分数
- `reliability_score` - 可靠性分数
- `preference_score` - 偏好匹配分数
- `match_breakdown` (JSONB) - 匹配详情
- `is_pushed` - 是否已推送
- `student_viewed` - 学生是否已查看
- `student_accepted` - 学生是否已接受
- `rank_in_task` - 在该任务中的排名

#### `task_translations` - 任务翻译表（启程老师）
启程老师将企业任务翻译成学生能理解的语言。

**核心字段**：
- `functional_modules` (JSONB) - 功能模块拆解
- `student_friendly_title` - 学生友好标题
- `student_friendly_description` - 学生友好描述
- `what_you_will_do` - 你需要做什么
- `what_you_will_learn` - 你会学到什么
- `required_skills` (JSONB) - 结构化技能要求
- `difficulty_technical/cognitive/execution/communication` - 多维度难度评估
- `learning_value` - 学习价值
- `career_impact` - 职业影响

### 2. 扩展现有表

#### `tasks` 表新增字段
- `matching_enabled` - 是否启用AI匹配
- `matched_students_count` - 匹配的学生数量
- `top_match_score` - 最高匹配分数
- `matching_completed_at` - 匹配完成时间

### 3. 视图

#### `student_matching_overview` - 学生匹配概览
汇总学生的能力、匹配历史等信息。

#### `task_matching_overview` - 任务匹配概览
汇总任务的匹配情况、推送情况等。

---

## 🔧 后端服务

### 1. 向量生成服务 (`vectorGenerationService.ts`)

**已存在** ✅

**核心功能**：
- 使用Claude API生成任务和学生的embedding向量
- 使用BGE-large-zh-v1.5模型（1024维中文语义向量）
- 支持降级方案（TF-IDF）
- 缓存向量结果（1小时TTL）

**关键方法**：
- `generateTaskVectors(taskId)` - 生成任务向量
- `generateStudentVectors(studentId)` - 生成学生向量
- `updateTaskEmbedding(taskId)` - 更新任务embedding
- `updateStudentEmbedding(studentId)` - 更新学生embedding
- `cosineSimilarity(vecA, vecB)` - 计算余弦相似度

### 2. 语义匹配引擎 (`semanticMatchingEngine.ts`)

**已存在** ✅

**核心功能**：
- 6维度匹配算法
- 余弦相似度计算
- 批量匹配和排序

**6个维度**：
1. **技能匹配** (30%) - 基于向量相似度 + 技能标签匹配
2. **难度匹配** (20%) - 任务难度与学生能力的匹配度
3. **领域匹配** (15%) - 学生在该领域的经验
4. **成长潜力** (15%) - 该任务对学生的学习价值
5. **可靠性** (10%) - 学生的历史表现
6. **偏好匹配** (10%) - 任务与学生偏好的匹配度

**关键方法**：
- `matchTaskWithStudent(taskId, studentId)` - 计算单个匹配分数
- `findBestStudentsForTask(taskId, limit)` - 找出最适合任务的学生
- `findBestTasksForStudent(studentId, limit)` - 找出最适合学生的任务
- `saveMatchResults(taskId, matchResults)` - 保存匹配结果
- `pushTaskToTopStudents(taskId, topN)` - 推送任务给Top N学生

### 3. 启程老师翻译服务 (`qichengTeacherService.ts`)

**已存在** ✅

**核心功能**：
- 理解企业任务，拆解功能模块
- 翻译专业术语为学生能懂的语言
- 生成学生友好的任务描述
- 评估任务难度（多维度）

**关键方法**：
- `analyzeAndTranslateTask(taskId)` - 分析任务并生成翻译
- `translateRequirement(taskId)` - 翻译企业需求
- `breakdownFunctionalModules(taskDescription)` - 拆解功能模块
- `generateStudentFriendlyDescription(task)` - 生成学生友好描述
- `assessTaskDifficulty(task)` - 评估任务难度

### 4. 学生能力更新服务 (`studentCapabilityService.ts`)

**已存在** ✅

**核心功能**：
- 基于任务完成情况更新学生能力
- 动态计算学生成长速度
- 更新学生向量

**关键方法**：
- `initializeCapability(studentId, opcResults)` - 初始化学生能力画像
- `updateAfterTaskCompletion(studentId, taskId, performance)` - 任务完成后更新能力
- `calculateGrowthTrend(studentId)` - 计算学生成长趋势
- `updateStudentVectors(studentId)` - 更新学生向量

---

## 🌐 API接口

### 企业端API

#### 1. 触发AI匹配
```
POST /api/v1/tasks/:taskId/trigger-matching
```
企业发布任务后，触发AI匹配，找出最合适的100个学生。

**流程**：
1. 生成任务向量
2. 生成任务翻译
3. 找出最匹配的100个学生
4. 保存匹配结果到数据库

#### 2. 查看匹配的学生列表
```
GET /api/v1/tasks/:taskId/matched-students?limit=10
```
企业查看匹配的学生列表，默认返回Top 10。

**返回数据**：
- 学生基本信息（姓名、头像、简介）
- 匹配分数（综合分数 + 6个维度分数）
- 匹配原因（为什么推荐这个学生）
- 学生历史表现（完成任务数、平均质量、满意度）

#### 3. 推送任务给选中的学生
```
POST /api/v1/tasks/:taskId/push-to-students
Body: { studentIds: [id1, id2, id3, id4, id5] }
```
企业选择5个学生，推送任务给他们。

**限制**：
- 最多推送给5个学生
- 只有匹配过的学生才能推送

#### 4. 查看匹配统计
```
GET /api/v1/tasks/:taskId/matching-stats
```
查看任务的匹配统计数据。

**返回数据**：
- 总匹配学生数
- 已推送数
- 已查看数
- 已接受数
- 平均匹配分数
- 最高匹配分数

#### 5. 重新匹配
```
POST /api/v1/tasks/:taskId/rematch
```
手动触发重新匹配（更新匹配结果）。

### 学生端API

#### 1. 查看推荐任务
```
GET /api/v1/students/recommended-tasks
```
学生查看推送给自己的任务列表。

**返回数据**：
- 任务标题（学生友好版本）
- 任务描述（学生友好版本）
- 匹配分数
- 匹配原因（为什么推荐给你）
- 你会学到什么
- 预计工作时间
- 难度评估

#### 2. 查看任务翻译
```
GET /api/v1/tasks/:taskId/translation
```
查看启程老师对任务的翻译。

**返回数据**：
- 学生友好标题和描述
- 功能模块拆解
- 你需要做什么
- 你会学到什么
- 技能要求（结构化）
- 多维度难度评估
- 学习价值和职业影响

#### 3. 接受推荐任务
```
POST /api/v1/tasks/:taskId/accept-recommendation
```
学生接受推荐的任务。

---

## 🔄 完整业务流程

### 企业端流程

1. **发布任务**
   - 企业填写任务信息（标题、描述、技能要求、预算等）
   - 提交任务

2. **触发AI匹配**
   - 系统自动调用 `POST /tasks/:taskId/trigger-matching`
   - AI分析任务需求
   - 启程老师翻译任务
   - 找出最匹配的100个学生

3. **查看匹配结果**
   - 企业查看 Top 10 学生
   - 每个学生显示：
     - 匹配分数（百分比）
     - 匹配原因（技能匹配、成长潜力等）
     - 历史表现（完成任务数、质量、满意度）

4. **选择学生推送**
   - 企业选择5个学生
   - 点击"推送给选中的学生"
   - 系统调用 `POST /tasks/:taskId/push-to-students`

5. **等待学生响应**
   - 查看推送统计
   - 查看哪些学生已查看、已接受

### 学生端流程

1. **查看推荐任务**
   - 学生打开"为你精选"页面
   - 系统调用 `GET /students/recommended-tasks`
   - 显示推送给该学生的任务列表

2. **查看任务详情**
   - 点击任务，查看详情
   - 系统调用 `GET /tasks/:taskId/translation`
   - 显示启程老师的翻译：
     - 功能模块拆解
     - 你需要做什么
     - 你会学到什么
     - 难度评估
     - 匹配度分析

3. **接受任务**
   - 学生点击"接受任务"
   - 系统调用 `POST /tasks/:taskId/accept-recommendation`
   - 进入任务执行流程

---

## 📈 匹配算法详解

### 6维度匹配算法

#### 1. 技能匹配 (30%)

**计算方法**：
- 向量相似度（60%）：任务向量 × 学生向量的余弦相似度
- 技能标签匹配（40%）：匹配的技能数 / 所需技能总数

**示例**：
```
任务需要：React, Node.js, Docker
学生掌握：React (熟练度0.8), Node.js (熟练度0.7)
技能匹配率 = 2/3 = 0.67
向量相似度 = 0.85
技能匹配分数 = 0.85 × 0.6 + 0.67 × 0.4 = 0.78
```

#### 2. 难度匹配 (20%)

**计算方法**：
- 任务难度：1-5
- 学生能力：学生等级 × 平均任务质量
- 匹配度：基于差值计算

**匹配规则**：
- 差值 ≤ 0.5：完美匹配（1.0分）
- 差值 ≤ 1.0：非常合适（0.9分）
- 差值 ≤ 1.5：有一定挑战（0.7分）
- 差值 ≤ 2.0：挑战较大（0.5分）
- 差值 > 2.0：不太合适（0.3分）

#### 3. 领域匹配 (15%)

**计算方法**：
- 检查学生偏好是否包含该赛道
- 结合学生完成任务数

**匹配规则**：
- 有偏好 + 完成5个以上：0.9分
- 有偏好：0.7分
- 完成10个以上：0.6分
- 其他：0.5分

#### 4. 成长潜力 (15%)

**计算方法**：
- 基于学生的质量趋势和成长速度

**匹配规则**：
- 新手学生（<3个任务）：0.9分（任何任务都有高成长价值）
- 成长中（improving趋势）：0.8分
- 稳定（stable趋势）：0.6分
- 下降（declining趋势）：0.4分

#### 5. 可靠性 (10%)

**计算方法**：
- 综合可靠性 = 平均质量 × 0.4 + 平均满意度 × 0.3 + 准时率 × 0.3

**示例**：
```
平均质量：0.85
平均满意度：0.90
准时率：0.95
可靠性分数 = 0.85 × 0.4 + 0.90 × 0.3 + 0.95 × 0.3 = 0.895
```

#### 6. 偏好匹配 (10%)

**计算方法**：
- 赛道偏好：+0.3分
- 创造性任务 × 学生创造力：+0.2分
- 学生开放性：+0.1分

**示例**：
```
学生偏好A赛道，任务是A赛道：+0.3
任务需要创意，学生创造力8/10：+0.2
学生开放性9/10：+0.1
偏好匹配分数 = 0.6
```

### 综合分数计算

```
综合分数 = 
  技能匹配 × 0.30 +
  难度匹配 × 0.20 +
  领域匹配 × 0.15 +
  成长潜力 × 0.15 +
  可靠性 × 0.10 +
  偏好匹配 × 0.10
```

---

## 🎯 核心业务规则

### 1. 匹配规则

| 规则 | 说明 |
|------|------|
| 匹配范围 | 找出最匹配的100个学生 |
| 推送数量 | 企业最多推送给5个学生 |
| 可见性 | **只有被推送的学生能看到任务** |
| 匹配分数 | 0-1之间，越高越匹配 |
| 排名 | 按综合分数降序排列 |

### 2. 推送规则

| 规则 | 说明 |
|------|------|
| 推送时机 | 企业手动选择学生推送 |
| 推送限制 | 最多5个学生 |
| 推送状态 | is_pushed = true |
| 查看状态 | 学生查看后 student_viewed = true |
| 接受状态 | 学生接受后 student_accepted = true |

### 3. 翻译规则

| 规则 | 说明 |
|------|------|
| 翻译时机 | 任务发布后自动翻译 |
| 翻译内容 | 标题、描述、功能模块、技能要求、难度评估 |
| 翻译目标 | 将专业术语翻译成学生能懂的语言 |
| 翻译存储 | 保存到 task_translations 表 |

---

## 📊 数据流图

```
企业发布任务
    ↓
生成任务向量 (vectorGenerationService)
    ↓
启程老师翻译 (qichengTeacherService)
    ↓
AI匹配学生 (semanticMatchingEngine)
    ├─ 计算技能匹配
    ├─ 计算难度匹配
    ├─ 计算领域匹配
    ├─ 计算成长潜力
    ├─ 计算可靠性
    └─ 计算偏好匹配
    ↓
保存匹配结果 (task_student_matches)
    ↓
企业查看Top 10学生
    ↓
企业选择5个学生推送
    ↓
学生查看推荐任务
    ↓
学生查看任务翻译
    ↓
学生接受任务
```

---

## 🚀 部署步骤

### 1. 数据库Migration

```bash
cd /Users/alwan/code/qicheng/backend
docker exec -i qicheng-postgres psql -U postgres -d qicheng < migrations/084_semantic_matching_system.sql
```

**验证**：
```sql
-- 检查表是否创建
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('student_capabilities', 'task_student_matches', 'task_translations');

-- 检查视图是否创建
SELECT viewname FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('student_matching_overview', 'task_matching_overview');
```

### 2. 环境变量配置

确保以下环境变量已配置：

```bash
# Claude API
ANTHROPIC_API_KEY=your_api_key

# Embedding API（可选，使用硅基流动或阿里云PAI）
EMBEDDING_API_URL=https://api.siliconflow.cn/v1/embeddings
EMBEDDING_API_KEY=your_embedding_api_key
```

### 3. 重启服务

```bash
cd /Users/alwan/code/qicheng/backend
npm run build
npm run start
```

---

## 🧪 测试验证

### 1. 测试任务匹配

```bash
# 1. 触发匹配
curl -X POST http://localhost:3000/api/v1/tasks/{taskId}/trigger-matching \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"

# 2. 查看匹配结果
curl -X GET http://localhost:3000/api/v1/tasks/{taskId}/matched-students?limit=10 \
  -H "Authorization: Bearer {token}"

# 3. 推送给学生
curl -X POST http://localhost:3000/api/v1/tasks/{taskId}/push-to-students \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"studentIds": ["id1", "id2", "id3", "id4", "id5"]}'
```

### 2. 测试学生端

```bash
# 1. 查看推荐任务
curl -X GET http://localhost:3000/api/v1/students/recommended-tasks \
  -H "Authorization: Bearer {student_token}"

# 2. 查看任务翻译
curl -X GET http://localhost:3000/api/v1/tasks/{taskId}/translation \
  -H "Authorization: Bearer {student_token}"

# 3. 接受任务
curl -X POST http://localhost:3000/api/v1/tasks/{taskId}/accept-recommendation \
  -H "Authorization: Bearer {student_token}"
```

---

## 📝 下一步工作

### 前端实现（待开发）

#### 1. 企业端 - 任务发布后的匹配流程

**文件**: `company-miniapp/src/pages/task-detail/index.tsx`

**功能**：
1. 任务发布后，自动触发匹配
2. 显示"AI正在为您匹配最合适的学生..."
3. 匹配完成后，显示Top 10学生列表
4. 每个学生显示：
   - 头像、姓名、等级
   - 匹配度分数（百分比）
   - 匹配原因（技能匹配、成长潜力等）
   - "推送任务"按钮
5. 企业选择5个学生，点击"推送给选中的学生"

#### 2. 学生端 - 推荐任务展示

**文件**: `miniapp/src/pages/tasks/recommended.tsx`

**功能**：
1. 显示"为你精选的任务"列表
2. 每个任务显示：
   - 任务标题（学生友好版本）
   - 匹配度分数
   - 为什么推荐给你（"你的React技能很匹配"）
   - 你会学到什么
   - 预计工作时间
3. 点击任务，查看详情（包含启程老师的翻译）

#### 3. 学生端 - 任务详情页翻译

**文件**: `miniapp/src/pages/tasks/detail.tsx`

**功能**：
1. 显示"启程老师帮你理解这个任务"模块
2. 功能模块拆解（可折叠）
3. 你需要做什么（分步骤）
4. 你会学到什么
5. 难度评估（技术难度、认知难度等）
6. 匹配度分析（为什么推荐给你）

---

## ✅ 系统状态

- ✅ **数据库Schema**: 100%完成
- ✅ **向量生成服务**: 100%完成
- ✅ **语义匹配引擎**: 100%完成
- ✅ **启程老师翻译**: 100%完成
- ✅ **学生能力更新**: 100%完成
- ✅ **API接口**: 100%完成
- ⏳ **前端实现**: 待开发

**后端系统已100%完成，可以立即部署和测试！**

---

## 📚 相关文档

1. [企业端双模式派单系统实现报告](./ENTERPRISE_DUAL_DISPATCH_IMPLEMENTATION.md)
2. [企业端双模式派单系统验证指南](./ENTERPRISE_DUAL_DISPATCH_VALIDATION.md)
3. [语义匹配引擎实现方案](/.claude/plans/expressive-sleeping-wozniak.md)

---

**最后更新**: 2026-05-27  
**文档版本**: 1.0  
**系统状态**: ✅ 后端完成，前端待开发
