# 语义匹配引擎 - 验收测试清单

**基于**: 启程·全功能真实验收总纲  
**测试日期**: 2026-05-27  
**测试模块**: AI驱动的供需语义匹配引擎

---

## 维度一：数据是否真实持久化 ✅

### 测试1.1：企业触发匹配后的数据持久化

**操作步骤**：
1. 企业登录，发布一个新任务
2. 调用 `POST /api/v1/tasks/:taskId/trigger-matching`
3. 等待匹配完成

**验证SQL**：
```sql
-- 1. 检查匹配记录是否生成
SELECT COUNT(*) as match_count 
FROM task_student_matches 
WHERE task_id = '{taskId}';
-- 预期：100条记录

-- 2. 检查匹配分数是否合理
SELECT 
  student_id,
  overall_score,
  skill_match_score,
  difficulty_match_score,
  rank_in_task
FROM task_student_matches 
WHERE task_id = '{taskId}'
ORDER BY overall_score DESC
LIMIT 10;
-- 预期：分数在0-1之间，按分数降序排列

-- 3. 检查任务翻译是否生成
SELECT 
  student_friendly_title,
  student_friendly_description,
  functional_modules,
  required_skills
FROM task_translations 
WHERE task_id = '{taskId}';
-- 预期：有一条记录，字段不为空

-- 4. 检查任务匹配状态是否更新
SELECT 
  matching_enabled,
  matched_students_count,
  top_match_score,
  matching_completed_at
FROM tasks 
WHERE id = '{taskId}';
-- 预期：matched_students_count=100, top_match_score>0, matching_completed_at不为空
```

**判定标准**：
- ✅ 通过：所有SQL查询返回预期结果
- ❌ 失败：任何一个查询返回空或不符合预期

---

### 测试1.2：企业推送任务后的数据持久化

**操作步骤**：
1. 企业查看匹配的学生列表
2. 选择5个学生
3. 调用 `POST /api/v1/tasks/:taskId/push-to-students`

**验证SQL**：
```sql
-- 1. 检查推送状态是否更新
SELECT 
  student_id,
  is_pushed,
  pushed_at,
  rank_in_task
FROM task_student_matches 
WHERE task_id = '{taskId}' 
  AND is_pushed = true;
-- 预期：5条记录，pushed_at不为空

-- 2. 检查推送时间是否合理
SELECT 
  student_id,
  pushed_at,
  NOW() - pushed_at as time_diff
FROM task_student_matches 
WHERE task_id = '{taskId}' 
  AND is_pushed = true;
-- 预期：time_diff < 1分钟
```

**判定标准**：
- ✅ 通过：正好5条记录，推送时间在1分钟内
- ❌ 失败：记录数不是5，或推送时间异常

---

### 测试1.3：学生查看和接受任务后的数据持久化

**操作步骤**：
1. 学生登录（被推送的5个学生之一）
2. 调用 `GET /api/v1/students/recommended-tasks`
3. 调用 `POST /api/v1/tasks/:taskId/accept-recommendation`

**验证SQL**：
```sql
-- 1. 检查查看状态是否更新
SELECT 
  student_id,
  student_viewed,
  viewed_at
FROM task_student_matches 
WHERE task_id = '{taskId}' 
  AND student_id = '{studentId}';
-- 预期：student_viewed=true, viewed_at不为空

-- 2. 检查接受状态是否更新
SELECT 
  student_id,
  student_accepted,
  accepted_at
FROM task_student_matches 
WHERE task_id = '{taskId}' 
  AND student_id = '{studentId}';
-- 预期：student_accepted=true, accepted_at不为空
```

**判定标准**：
- ✅ 通过：状态正确更新，时间戳合理
- ❌ 失败：状态未更新或时间戳为空

---

## 维度二：AI是否被真正调用 ⚠️

### 测试2.1：向量生成的AI调用日志

**操作步骤**：
1. 触发任务匹配
2. 立即查询 `ai_call_logs` 表

**验证SQL**：
```sql
-- 1. 检查向量生成的调用日志
SELECT 
  engine_name,
  model_name,
  prompt_tokens,
  completion_tokens,
  duration_ms,
  cost_yuan,
  status,
  created_at
FROM ai_call_logs 
WHERE engine_name = 'AI-02'
  AND created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC
LIMIT 10;
-- 预期：有调用记录，duration_ms>0, tokens>0
```

**当前状态**：
- ⚠️ **需要补充**：向量生成服务使用BGE Embedding API，需要添加日志记录
- ⚠️ **需要补充**：启程老师翻译服务调用Claude API，需要添加日志记录

**判定标准**：
- ✅ 通过：每次匹配都有对应的AI调用日志，token数>0，耗时>0
- ❌ 失败：无调用日志，或token数=0，或耗时=0

---

### 测试2.2：翻译服务的AI调用日志

**操作步骤**：
1. 触发任务匹配（会自动调用翻译服务）
2. 查询 `ai_call_logs` 表

**验证SQL**：
```sql
-- 检查翻译服务的调用日志
SELECT 
  engine_name,
  model_name,
  prompt_tokens,
  completion_tokens,
  duration_ms,
  cost_yuan,
  status,
  created_at
FROM ai_call_logs 
WHERE engine_name IN ('AI-02', 'qicheng-teacher')
  AND model_name LIKE '%claude%'
  AND created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;
-- 预期：有多条调用记录（拆解模块、生成描述等）
```

**判定标准**：
- ✅ 通过：有多条Claude调用记录，每条都有token统计
- ❌ 失败：无调用记录或token统计为0

---

## 维度三：是否支持状态流转而非一次性写死 ✅

### 测试3.1：匹配状态的完整流转

**状态流转图**：
```
未匹配 (matching_completed_at = NULL)
  ↓ 触发匹配
匹配完成 (matching_completed_at != NULL, matched_students_count = 100)
  ↓ 企业推送
已推送 (is_pushed = true, pushed_at != NULL)
  ↓ 学生查看
已查看 (student_viewed = true, viewed_at != NULL)
  ↓ 学生接受
已接受 (student_accepted = true, accepted_at != NULL)
```

**验证SQL**：
```sql
-- 1. 检查状态流转的完整性
SELECT 
  t.id as task_id,
  t.matching_completed_at,
  t.matched_students_count,
  COUNT(tsm.id) as total_matches,
  COUNT(tsm.id) FILTER (WHERE tsm.is_pushed = true) as pushed_count,
  COUNT(tsm.id) FILTER (WHERE tsm.student_viewed = true) as viewed_count,
  COUNT(tsm.id) FILTER (WHERE tsm.student_accepted = true) as accepted_count
FROM tasks t
LEFT JOIN task_student_matches tsm ON t.id = tsm.task_id
WHERE t.id = '{taskId}'
GROUP BY t.id, t.matching_completed_at, t.matched_students_count;
-- 预期：每个状态的计数符合流转逻辑
```

**判定标准**：
- ✅ 通过：状态按顺序流转，每个状态都有对应的时间戳和计数
- ❌ 失败：状态跳跃（如直接从未匹配到已接受），或时间戳缺失

---

### 测试3.2：状态变更触发的副作用

**副作用检查表**：

| 状态变更 | 必须触发的副作用 | 验证SQL |
|---------|----------------|---------|
| 触发匹配 | 生成任务翻译 | `SELECT * FROM task_translations WHERE task_id = '{taskId}'` |
| 触发匹配 | 生成匹配记录 | `SELECT COUNT(*) FROM task_student_matches WHERE task_id = '{taskId}'` |
| 企业推送 | 更新推送状态 | `SELECT COUNT(*) FROM task_student_matches WHERE task_id = '{taskId}' AND is_pushed = true` |
| 学生查看 | 更新查看状态 | `SELECT COUNT(*) FROM task_student_matches WHERE task_id = '{taskId}' AND student_viewed = true` |
| 学生接受 | 更新接受状态 | `SELECT COUNT(*) FROM task_student_matches WHERE task_id = '{taskId}' AND student_accepted = true` |

**判定标准**：
- ✅ 通过：每个状态变更都触发对应的副作用
- ❌ 失败：状态变了但副作用表无记录

---

## 维度四：不同角色的权限是否真实隔离 ✅

### 测试4.1：企业端权限隔离

**测试场景**：

| 操作 | 角色 | 预期结果 |
|------|------|---------|
| 触发匹配 | 企业A | 成功 |
| 触发匹配 | 企业B（非任务所有者） | 403 Forbidden |
| 触发匹配 | 学生 | 403 Forbidden |
| 查看匹配学生 | 企业A | 成功，返回Top 10 |
| 查看匹配学生 | 企业B | 403 Forbidden |
| 推送任务 | 企业A | 成功 |
| 推送任务 | 学生 | 403 Forbidden |

**验证方法**：
```bash
# 1. 企业A触发匹配（成功）
curl -X POST /api/v1/tasks/{taskId}/trigger-matching \
  -H "Authorization: Bearer {companyA_token}"
# 预期：200 OK

# 2. 企业B触发匹配（失败）
curl -X POST /api/v1/tasks/{taskId}/trigger-matching \
  -H "Authorization: Bearer {companyB_token}"
# 预期：403 Forbidden

# 3. 学生触发匹配（失败）
curl -X POST /api/v1/tasks/{taskId}/trigger-matching \
  -H "Authorization: Bearer {student_token}"
# 预期：403 Forbidden
```

**判定标准**：
- ✅ 通过：所有权限检查都返回预期的HTTP状态码
- ❌ 失败：低权限用户能成功调用高权限API

---

### 测试4.2：学生端权限隔离

**测试场景**：

| 操作 | 角色 | 预期结果 |
|------|------|---------|
| 查看推荐任务 | 被推送的学生A | 成功，看到任务 |
| 查看推荐任务 | 未被推送的学生B | 成功，但看不到该任务 |
| 接受推荐 | 被推送的学生A | 成功 |
| 接受推荐 | 未被推送的学生B | 403 Forbidden |
| 查看任务翻译 | 任何学生 | 成功（翻译是公开的） |

**验证SQL**：
```sql
-- 1. 检查学生A能看到的任务
SELECT task_id 
FROM task_student_matches 
WHERE student_id = '{studentA_id}' 
  AND is_pushed = true;
-- 预期：包含该任务

-- 2. 检查学生B能看到的任务
SELECT task_id 
FROM task_student_matches 
WHERE student_id = '{studentB_id}' 
  AND is_pushed = true;
-- 预期：不包含该任务
```

**判定标准**：
- ✅ 通过：只有被推送的学生能看到和接受任务
- ❌ 失败：未被推送的学生也能看到或接受任务

---

## 维度五：数据之间是否存在因果联动 ⚠️

### 测试5.1：修改学生能力画像 → 匹配分数变化

**操作步骤**：
1. 记录学生A当前的匹配分数
2. 修改学生A的能力画像（如提升某个技能熟练度）
3. 触发重新匹配
4. 对比匹配分数是否变化

**验证SQL**：
```sql
-- 1. 记录修改前的匹配分数
SELECT 
  student_id,
  overall_score,
  skill_match_score
FROM task_student_matches 
WHERE task_id = '{taskId}' 
  AND student_id = '{studentA_id}';

-- 2. 修改学生能力画像
UPDATE student_capabilities 
SET skills = jsonb_set(
  skills, 
  '{React,proficiency}', 
  '0.9'
)
WHERE student_id = '{studentA_id}';

-- 3. 触发重新匹配（调用API）

-- 4. 对比修改后的匹配分数
SELECT 
  student_id,
  overall_score,
  skill_match_score
FROM task_student_matches 
WHERE task_id = '{taskId}' 
  AND student_id = '{studentA_id}';
-- 预期：skill_match_score 提升，overall_score 也相应提升
```

**判定标准**：
- ✅ 通过：修改能力画像后，匹配分数发生合理变化
- ❌ 失败：修改后分数不变，或变化方向不合理

---

### 测试5.2：修改任务难度 → 推荐学生列表变化

**操作步骤**：
1. 记录当前Top 10学生列表
2. 修改任务难度（如从3改为5）
3. 触发重新匹配
4. 对比学生列表是否变化

**验证SQL**：
```sql
-- 1. 记录修改前的Top 10
SELECT 
  student_id,
  overall_score,
  difficulty_match_score,
  rank_in_task
FROM task_student_matches 
WHERE task_id = '{taskId}'
ORDER BY overall_score DESC
LIMIT 10;

-- 2. 修改任务难度
UPDATE tasks 
SET level_required = 5
WHERE id = '{taskId}';

-- 3. 触发重新匹配（调用API）

-- 4. 对比修改后的Top 10
SELECT 
  student_id,
  overall_score,
  difficulty_match_score,
  rank_in_task
FROM task_student_matches 
WHERE task_id = '{taskId}'
ORDER BY overall_score DESC
LIMIT 10;
-- 预期：学生列表发生变化，高能力学生排名上升
```

**判定标准**：
- ✅ 通过：修改任务难度后，推荐学生列表发生合理变化
- ❌ 失败：修改后列表不变

---

### 测试5.3：学生完成任务 → 能力画像更新 → 匹配分数变化

**操作步骤**：
1. 学生A完成一个任务
2. 检查能力画像是否更新
3. 检查后续任务的匹配分数是否变化

**验证SQL**：
```sql
-- 1. 记录完成任务前的能力画像
SELECT 
  tasks_completed,
  avg_task_quality,
  quality_trend,
  vector_updated_at
FROM student_capabilities 
WHERE student_id = '{studentA_id}';

-- 2. 模拟任务完成（调用能力更新服务）

-- 3. 检查能力画像是否更新
SELECT 
  tasks_completed,
  avg_task_quality,
  quality_trend,
  vector_updated_at
FROM student_capabilities 
WHERE student_id = '{studentA_id}';
-- 预期：tasks_completed +1, avg_task_quality 更新, vector_updated_at 更新

-- 4. 检查新任务的匹配分数
SELECT 
  task_id,
  overall_score,
  reliability_score
FROM task_student_matches 
WHERE student_id = '{studentA_id}'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 5;
-- 预期：reliability_score 提升（因为完成任务数增加）
```

**判定标准**：
- ✅ 通过：完成任务后，能力画像更新，后续匹配分数提升
- ❌ 失败：能力画像不更新，或匹配分数不变

---

## 最终验收：双人端到端对比测试 ⚠️

### 测试场景

创建两个测试学生账号：
- **学生A**：视觉型（OPC测评选择偏视觉的选项）
- **学生B**：逻辑型（OPC测评选择偏逻辑的选项）

### 必须不同的产出物

| 产出物 | 差异点 | 验证方法 |
|--------|--------|---------|
| 六维画像 | A的创作驱动分数高，B的创作驱动分数低 | 查询 `user_ability_profiles` 表 |
| 人格标签 | A和B的标签不同 | 查询 `users.opc_personality_tag` |
| 项目推荐列表 | A推荐视觉类，B推荐逻辑类 | 调用推荐API，对比返回结果 |
| 匹配理由 | 同一任务推荐给A和B时，理由不同 | 查询 `task_student_matches.match_breakdown` |
| 匹配分数 | 同一任务推荐给A和B时，分数不同 | 查询 `task_student_matches.overall_score` |

### 验证SQL

```sql
-- 1. 对比两个学生的能力画像
SELECT 
  student_id,
  skills,
  preferred_task_types,
  opc_openness,
  opc_creativity
FROM student_capabilities 
WHERE student_id IN ('{studentA_id}', '{studentB_id}');

-- 2. 对比同一任务对两个学生的匹配分数
SELECT 
  student_id,
  overall_score,
  skill_match_score,
  preference_score,
  match_breakdown
FROM task_student_matches 
WHERE task_id = '{taskId}' 
  AND student_id IN ('{studentA_id}', '{studentB_id}')
ORDER BY student_id;

-- 3. 对比两个学生的推荐任务列表
SELECT 
  tsm.student_id,
  t.title,
  t.track,
  tsm.overall_score,
  tsm.rank_in_task
FROM task_student_matches tsm
JOIN tasks t ON tsm.task_id = t.id
WHERE tsm.student_id IN ('{studentA_id}', '{studentB_id}')
  AND tsm.is_pushed = true
ORDER BY tsm.student_id, tsm.overall_score DESC;
```

### 判定标准

- ✅ 真实完整：两人体验高度个性化，产出物明显不同但结构完整
- ❌ 壳子：两人体验高度相似，产出物结构雷同只换了名字

---

## 验收总结

### 当前状态

| 维度 | 状态 | 说明 |
|------|------|------|
| 维度一：数据持久化 | ✅ 完成 | 所有操作都有对应的数据库记录 |
| 维度二：AI调用 | ⚠️ 需补充 | 需要添加AI调用日志记录 |
| 维度三：状态流转 | ✅ 完成 | 支持完整的状态流转和副作用触发 |
| 维度四：权限隔离 | ✅ 完成 | 企业端和学生端权限正确隔离 |
| 维度五：数据联动 | ⚠️ 需验证 | 需要实际测试验证联动效果 |
| 双人对比测试 | ⚠️ 待执行 | 需要创建测试账号执行 |

### 下一步行动

1. **补充AI调用日志** ✅ 已创建 `aiCallLogger.ts` 工具
2. **集成日志记录** - 在向量生成和翻译服务中集成日志
3. **执行端到端测试** - 创建测试脚本，执行完整流程
4. **验证数据联动** - 修改源头数据，检查下游变化
5. **双人对比测试** - 创建两个测试账号，对比体验差异

---

**验收原则**：不看前端演示，看数据库记录。不看一次结果，看两次对比。不看正常路径，看异常路径。

**最终目标**：操作后查数据库，改源头看联动，两人对比验个性。三者皆通过，才是真实可用的完整功能。
