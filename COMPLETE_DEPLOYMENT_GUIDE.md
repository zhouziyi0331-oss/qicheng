# 🚀 启程平台完整部署指南

**适用场景：** 完整部署语义匹配系统 + AI导师系统 + 前端UI  
**预计时间：** 30分钟

---

## 📋 前置条件检查

### 1. 环境变量 ✅

已配置：
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/qicheng`
- `ANTHROPIC_API_KEY=sk-78d5f32890db34a7e8470a567991a3da8f3ced300f56b5d392c8b8b964409045`

### 2. PostgreSQL

需要确认PostgreSQL已安装并运行。

**检查方法：**
```bash
# 方法1: 通过Homebrew安装的PostgreSQL
/opt/homebrew/bin/psql --version

# 方法2: 通过Postgres.app安装的PostgreSQL
/Applications/Postgres.app/Contents/Versions/latest/bin/psql --version

# 方法3: 系统默认安装
/usr/local/bin/psql --version
```

---

## 🗄️ Phase 1: 部署数据库（语义匹配系统）

### 步骤1: 找到psql命令

```bash
# 尝试不同的路径
/opt/homebrew/bin/psql postgresql://postgres:postgres@localhost:5432/qicheng

# 或
/Applications/Postgres.app/Contents/Versions/latest/bin/psql postgresql://postgres:postgres@localhost:5432/qicheng

# 或使用GUI工具（推荐）
# - Postico
# - pgAdmin
# - DBeaver
```

### 步骤2: 执行语义匹配系统migration

**文件位置：** `/Users/alwan/code/qicheng/backend/migrations/084_semantic_matching_system.sql`

**执行方法：**

**方法A: 命令行**
```bash
cd /Users/alwan/code/qicheng/backend

# 使用正确的psql路径
/opt/homebrew/bin/psql postgresql://postgres:postgres@localhost:5432/qicheng \
  -f migrations/084_semantic_matching_system.sql
```

**方法B: GUI工具（推荐）**
1. 打开Postico/pgAdmin/DBeaver
2. 连接到数据库：`qicheng`
3. 打开SQL编辑器
4. 复制粘贴 `084_semantic_matching_system.sql` 的内容
5. 执行

**期望结果：**
```
CREATE EXTENSION
CREATE TABLE
CREATE TABLE
CREATE TABLE
ALTER TABLE
CREATE INDEX
...
✅ 语义匹配系统数据库Schema创建完成！
```

### 步骤3: 验证表创建

```sql
-- 检查3个新表
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('student_capabilities', 'task_student_matches', 'task_translations');

-- 期望返回3行
```

---

## 🗄️ Phase 2: 部署数据库（AI导师系统）

### 检查是否已部署

```sql
-- 检查AI导师系统的表
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('mentor_alert_rules', 'mentor_alerts', 'mentor_student_profile_cache', 'mentor_retrospectives');

-- 如果返回4行，说明已部署
-- 如果返回0行，需要执行以下步骤
```

### 如果未部署，执行migration

**文件位置：**
- `/Users/alwan/code/qicheng/backend/migrations/085_mentor_enhancement_p0.sql`
- `/Users/alwan/code/qicheng/backend/migrations/086_mentor_enhancement_p1.sql`

**执行方法：**
```bash
# 方法A: 命令行
/opt/homebrew/bin/psql postgresql://postgres:postgres@localhost:5432/qicheng \
  -f migrations/085_mentor_enhancement_p0.sql

/opt/homebrew/bin/psql postgresql://postgres:postgres@localhost:5432/qicheng \
  -f migrations/086_mentor_enhancement_p1.sql

# 方法B: GUI工具
# 依次执行两个SQL文件
```

---

## 🚀 Phase 3: 重启后端服务

### 步骤1: 编译TypeScript

```bash
cd /Users/alwan/code/qicheng/backend

# 编译
npm run build
```

### 步骤2: 重启服务

```bash
# 开发环境
npm run dev

# 或生产环境
pm2 restart qicheng-backend

# 或如果没有pm2
node dist/server.js
```

### 步骤3: 验证服务启动

```bash
# 查看日志
tail -f logs/app.log | grep -E "Matching|Mentor|启动"

# 期望看到：
# ✅ Matching scheduler started
# ✅ AI导师预警定时任务已启动
# ✅ AI导师复盘定时任务已启动
# ✅ Server is running on port 3000
```

### 步骤4: 测试API

```bash
# 测试健康检查
curl http://localhost:3000/health

# 期望返回: {"status":"ok"}
```

---

## 🎨 Phase 4: 前端UI实现

### 企业端 - 任务匹配流程

**文件位置：** `/Users/alwan/code/qicheng/company-miniapp/src/pages/task-detail/index.tsx`

**需要添加的功能：**

1. **触发匹配按钮**
```tsx
// 任务发布后显示
<Button onClick={handleTriggerMatching}>
  AI智能匹配学生
</Button>
```

2. **匹配结果展示**
```tsx
// 显示Top 10学生列表
<View className="matched-students">
  {students.map(student => (
    <View key={student.id} className="student-card">
      <Image src={student.avatar} />
      <Text>{student.name}</Text>
      <Text>匹配度: {student.matchScore}%</Text>
      <Text>原因: {student.matchReason}</Text>
      <Checkbox onChange={(e) => handleSelectStudent(student.id, e)} />
    </View>
  ))}
</View>
```

3. **推送按钮**
```tsx
<Button 
  onClick={handlePushToStudents}
  disabled={selectedStudents.length !== 5}
>
  推送给选中的{selectedStudents.length}个学生
</Button>
```

### 学生端 - 推荐任务展示

**文件位置：** `/Users/alwan/code/qicheng/miniapp/src/pages/tasks/recommended.tsx`

**需要创建的页面：**

```tsx
import { View, Text, Image } from '@tarojs/components';
import { useEffect, useState } from 'react';
import { getRecommendedTasks } from '@/api/tasks';

export default function RecommendedTasks() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    loadRecommendedTasks();
  }, []);

  const loadRecommendedTasks = async () => {
    const res = await getRecommendedTasks();
    setTasks(res.data.tasks);
  };

  return (
    <View className="recommended-tasks">
      <Text className="title">为你精选的任务</Text>
      {tasks.map(task => (
        <View key={task.id} className="task-card">
          <Text className="task-title">{task.title}</Text>
          <View className="match-info">
            <Text>匹配度: {task.matchScore}%</Text>
            <Text>原因: {task.matchReason}</Text>
          </View>
          <Text className="learning">你会学到: {task.whatYouWillLearn}</Text>
          <Button onClick={() => viewTaskDetail(task.id)}>
            查看详情
          </Button>
        </View>
      ))}
    </View>
  );
}
```

### 学生端 - 任务翻译展示

**文件位置：** `/Users/alwan/code/qicheng/miniapp/src/pages/tasks/detail.tsx`

**需要添加的模块：**

```tsx
// 在任务详情页添加"启程老师帮你理解"模块
<View className="teacher-translation">
  <Text className="section-title">🎓 启程老师帮你理解这个任务</Text>
  
  {/* 功能模块拆解 */}
  <View className="modules">
    <Text className="subtitle">功能模块拆解：</Text>
    {translation.functionalModules.map((module, index) => (
      <View key={index} className="module">
        <Text>{index + 1}. {module.module}</Text>
        <Text>{module.description}</Text>
        <Text>难度: {'⭐'.repeat(module.difficulty)}</Text>
      </View>
    ))}
  </View>

  {/* 你需要做什么 */}
  <View className="what-to-do">
    <Text className="subtitle">你需要做什么：</Text>
    <Text>{translation.whatYouWillDo}</Text>
  </View>

  {/* 你会学到什么 */}
  <View className="what-to-learn">
    <Text className="subtitle">你会学到什么：</Text>
    <Text>{translation.whatYouWillLearn}</Text>
  </View>

  {/* 难度评估 */}
  <View className="difficulty">
    <Text className="subtitle">难度评估：</Text>
    <Text>技术难度: {translation.difficulty.technical}/10</Text>
    <Text>认知难度: {translation.difficulty.cognitive}/10</Text>
    <Text>执行难度: {translation.difficulty.execution}/10</Text>
  </View>
</View>
```

---

## 🧪 Phase 5: 测试完整流程

### 测试1: 企业端匹配流程

```bash
# 1. 企业发布任务
curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Authorization: Bearer {company_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "开发一个电商小程序",
    "description": "需要实现商品展示、购物车、订单管理等功能",
    "required_skills": ["React", "Node.js", "微信小程序"]
  }'

# 2. 触发匹配
curl -X POST http://localhost:3000/api/v1/tasks/{taskId}/trigger-matching \
  -H "Authorization: Bearer {company_token}"

# 期望返回:
# {
#   "success": true,
#   "matchedCount": 100,
#   "topScore": 0.85
# }

# 3. 查看匹配学生
curl http://localhost:3000/api/v1/tasks/{taskId}/matched-students?limit=10 \
  -H "Authorization: Bearer {company_token}"

# 4. 推送给5个学生
curl -X POST http://localhost:3000/api/v1/tasks/{taskId}/push-to-students \
  -H "Authorization: Bearer {company_token}" \
  -H "Content-Type: application/json" \
  -d '{"studentIds": ["id1", "id2", "id3", "id4", "id5"]}'
```

### 测试2: 学生端推荐流程

```bash
# 1. 学生查看推荐任务
curl http://localhost:3000/api/v1/students/recommended-tasks \
  -H "Authorization: Bearer {student_token}"

# 2. 查看任务翻译
curl http://localhost:3000/api/v1/tasks/{taskId}/translation \
  -H "Authorization: Bearer {student_token}"

# 3. 接受推荐任务
curl -X POST http://localhost:3000/api/v1/tasks/{taskId}/accept-recommendation \
  -H "Authorization: Bearer {student_token}"
```

### 测试3: AI导师系统

```bash
# 1. 查看预警
curl http://localhost:3000/api/v1/mentor/alerts \
  -H "Authorization: Bearer {student_token}"

# 2. 查看学生画像
curl http://localhost:3000/api/v1/mentor/profile \
  -H "Authorization: Bearer {student_token}"

# 3. 发送消息给AI导师
curl -X POST http://localhost:3000/api/v1/mentor/message \
  -H "Authorization: Bearer {student_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order_id",
    "message": "我不知道怎么开始这个任务"
  }'
```

---

## 📊 Phase 6: 监控和验证

### 查看日志

```bash
# 实时日志
tail -f logs/app.log | grep -E "Matching|Mentor"

# 错误日志
tail -f logs/error.log

# 查看匹配统计
curl http://localhost:3000/api/v1/tasks/{taskId}/matching-stats \
  -H "Authorization: Bearer {company_token}"
```

### 数据库验证

```sql
-- 检查匹配记录
SELECT COUNT(*) FROM task_student_matches;

-- 检查学生能力画像
SELECT COUNT(*) FROM student_capabilities;

-- 检查任务翻译
SELECT COUNT(*) FROM task_translations;

-- 检查AI导师预警
SELECT COUNT(*) FROM mentor_alerts;

-- 检查学生画像缓存
SELECT COUNT(*) FROM mentor_student_profile_cache;
```

---

## ✅ 部署完成检查清单

### 数据库

- [ ] 语义匹配系统表已创建（3个新表）
- [ ] AI导师系统表已创建（4个新表）
- [ ] 所有索引已创建
- [ ] 所有视图已创建

### 后端服务

- [ ] 服务已重启
- [ ] 日志显示调度器已启动
- [ ] API健康检查通过
- [ ] 8个匹配API可访问
- [ ] 11个导师API可访问

### 前端UI

- [ ] 企业端匹配流程UI已实现
- [ ] 学生端推荐任务UI已实现
- [ ] 任务翻译展示UI已实现

### 功能测试

- [ ] 企业可以触发匹配
- [ ] 企业可以查看匹配学生
- [ ] 企业可以推送给学生
- [ ] 学生可以查看推荐任务
- [ ] 学生可以查看任务翻译
- [ ] 学生可以接受推荐
- [ ] AI导师预警正常工作
- [ ] AI导师对话正常工作

---

## 🐛 常见问题

### 问题1: psql命令找不到

**解决方法：**
```bash
# 查找PostgreSQL安装位置
find /Applications -name psql 2>/dev/null
find /opt -name psql 2>/dev/null
find /usr/local -name psql 2>/dev/null

# 或使用GUI工具
```

### 问题2: 数据库连接失败

**解决方法：**
```bash
# 检查PostgreSQL是否运行
ps aux | grep postgres

# 检查端口
lsof -i :5432

# 重启PostgreSQL
# Homebrew: brew services restart postgresql
# Postgres.app: 重启应用
```

### 问题3: API返回500错误

**解决方法：**
```bash
# 查看错误日志
tail -100 logs/error.log

# 检查环境变量
cat .env | grep -E "DATABASE_URL|ANTHROPIC_API_KEY"

# 重启服务
pm2 restart qicheng-backend
```

---

## 📞 获取帮助

### 文档资源

- 📚 [语义匹配系统文档](README_SEMANTIC_MATCHING.md)
- 📚 [AI导师系统文档](backend/README_MENTOR.md)
- 🚀 [快速启动指南](SEMANTIC_MATCHING_QUICK_START.md)

### 验证脚本

```bash
# 语义匹配系统验证
cd backend && ./verify_semantic_matching.sh

# AI导师系统验证
cd backend && ./verify_mentor_deployment.sh
```

---

**最后更新：** 2026-05-27  
**适用版本：** v1.0

准备好全面部署了！🚀
