# 启程平台 · 等级体系部署检查清单

## 重要说明

✅ **已解决新旧系统并存问题**

通过创建 `student_profiles` 视图作为兼容层，旧代码无需修改即可继续工作。详见：`COMPATIBILITY_LAYER.md`

---

## 一、数据库准备

### 1. 运行Migrations（按顺序执行）

```bash
cd /Users/alwan/code/qicheng/backend

# 执行所有新的migrations
psql $DATABASE_URL -f migrations/078_level_track_system.sql
psql $DATABASE_URL -f migrations/079_jump_test_system.sql
psql $DATABASE_URL -f migrations/080_team_community_system.sql
psql $DATABASE_URL -f migrations/081_migrate_student_profiles_to_users.sql
psql $DATABASE_URL -f migrations/082_create_student_profiles_compatibility_view.sql

# 或使用npm命令
npm run migrate
```

**关键：** Migration 082 会将 `student_profiles` 表改为视图，实现向后兼容。

### 2. 验证表结构

```sql
-- 检查新表是否创建成功
\dt level_configs
\dt teams
\dt team_members
\dt community_posts
\dt jump_test_records
\dt student_capabilities

-- 检查student_profiles是否变为视图
\dv student_profiles

-- 检查users表新字段
\d users
```

### 3. 验证预置数据

```sql
-- 检查等级配置（应该有12条）
SELECT level, name, track FROM level_configs ORDER BY track, level;

-- 检查跳级测试模板（应该有4条）
SELECT id, track, target_level FROM jump_test_templates;
```

---

## 二、数据迁移验证

### 1. 检查迁移结果

```sql
-- 查看学生赛道分布
SELECT track, COUNT(*) FROM users WHERE role = 'student' GROUP BY track;

-- 查看等级分布
SELECT track, current_level, COUNT(*) 
FROM users 
WHERE role = 'student' 
GROUP BY track, current_level 
ORDER BY track, current_level;

-- 检查student_capabilities初始化
SELECT COUNT(*) FROM student_capabilities;
SELECT COUNT(*) FROM users WHERE role = 'student';
-- 两个数字应该相等
```

### 2. 修复缺失数据（如果需要）

```sql
-- 如果有学生没有track
UPDATE users SET track = 'content' WHERE role = 'student' AND track IS NULL;

-- 如果有学生没有current_level
UPDATE users SET current_level = 0 WHERE role = 'student' AND current_level IS NULL;

-- 如果有学生没有student_capabilities记录
INSERT INTO student_capabilities (student_id, skills, tasks_completed)
SELECT id, '{}'::jsonb, 0
FROM users
WHERE role = 'student'
  AND NOT EXISTS (SELECT 1 FROM student_capabilities WHERE student_id = users.id);
```

---

## 三、API测试

### 1. 等级过滤测试

```bash
# 获取学生任务列表（应该根据等级过滤）
curl -X GET "http://localhost:3000/api/v1/tasks/matched" \
  -H "Authorization: Bearer <student_token>"

# 检查返回的任务是否符合学生等级
# 返回应该包含：studentLevel, allowedDifficulties
```

### 2. 跳级流程测试

```bash
# 检查跳级资格
curl -X GET "http://localhost:3000/api/v1/students/jump-eligibility" \
  -H "Authorization: Bearer <student_token>"

# 应该返回：eligible, currentLevel, targetLevel, reasons, missingConditions
```

### 3. 组队功能测试

```bash
# 创建队伍（需要Lv.6学生）
curl -X POST "http://localhost:3000/api/v1/teams" \
  -H "Authorization: Bearer <lv6_student_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试队伍",
    "track": "content",
    "description": "测试描述",
    "maxMembers": 5,
    "requiredSkills": ["React", "设计"]
  }'

# 如果是Lv.5以下学生，应该返回403错误
```

### 4. 社区板块测试

```bash
# 发布招募帖
curl -X POST "http://localhost:3000/api/v1/community/posts" \
  -H "Authorization: Bearer <student_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "recruit",
    "title": "招募前端开发",
    "content": "需要React开发者",
    "requiredSkills": ["React", "TypeScript"],
    "track": "dev",
    "vacancyCount": 2
  }'

# 获取帖子详情（应该包含teamMembers字段）
curl -X GET "http://localhost:3000/api/v1/community/posts/<postId>" \
  -H "Authorization: Bearer <student_token>"
```

---

## 四、功能验证清单

### ✅ 等级系统

- [ ] Lv.0学生只能看到难度1的任务
- [ ] Lv.3学生可以看到难度1-3的任务
- [ ] 修改`level_configs`表后，升级条件立即生效
- [ ] 学生完成足够订单后自动升级
- [ ] 升级后收到导师消息

### ✅ 赛道隔离

- [ ] content学生只能看到content和mixed任务
- [ ] dev学生只能看到dev和mixed任务
- [ ] 修改学生赛道后，任务列表立即变化

### ✅ 跳级流程

- [ ] 不满足条件时，`jump-eligibility` API返回 `eligible: false`
- [ ] 满足条件时可以申请跳级
- [ ] 申请后收到跳级测试任务（`order_type='jump_test'`）
- [ ] 提交低质量交付物被AI拒绝（分数<85）
- [ ] 提交高质量交付物通过（分数≥85）
- [ ] 通过后等级跳2级
- [ ] 失败后进入冷却期（需完成2个新订单）

### ✅ 组队系统

- [ ] Lv.5以下学生无法创建队伍（返回403）
- [ ] Lv.6学生可以创建队伍
- [ ] Lv.4以下学生无法申请加入（返回403）
- [ ] Lv.5学生可以申请加入
- [ ] 队长可以审核申请
- [ ] 队伍满员后自动关闭招募
- [ ] 外部邀请码可以使用
- [ ] 外部成员超过30%时拒绝

### ✅ 社区板块

- [ ] 可以发布招募帖、展示帖、共创帖
- [ ] 帖子列表显示正确
- [ ] 帖子详情包含团队成员信息
- [ ] 成员信息包含技能标签（从`student_capabilities.skills`读取）
- [ ] 可以申请加入招募帖
- [ ] 作者可以审核申请

---

## 五、性能检查

### 1. 索引验证

```sql
-- 检查关键索引是否存在
\di idx_level_configs_track_level
\di idx_users_track_level
\di idx_tasks_track_difficulty
\di idx_student_capabilities_student
\di idx_matches_task
\di idx_matches_student
```

### 2. 查询性能测试

```sql
-- 测试等级过滤查询性能
EXPLAIN ANALYZE
SELECT t.*
FROM tasks t
WHERE t.status = 'open'
  AND t.track IN ('content', 'mixed')
  AND t.required_level <= 3
  AND t.difficulty = ANY(ARRAY[1,2,3]);

-- 应该使用索引，执行时间<50ms
```

---

## 六、完成检查

- [ ] 所有migrations执行成功
- [ ] 数据迁移完成，无缺失
- [ ] 等级过滤功能正常
- [ ] 跳级流程可用
- [ ] 组队系统可用
- [ ] 社区板块可用
- [ ] 性能指标达标
- [ ] 错误处理正确
- [ ] 日志记录完整

**部署负责人签字：** ___________  
**部署日期：** ___________  
**验证人签字：** ___________
