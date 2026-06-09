# 🚀 语义匹配系统 - 5分钟快速启动

**适用场景：** 快速部署和测试语义匹配系统  
**预计时间：** 5分钟

---

## 📋 前置检查

```bash
# 1. 检查PostgreSQL
psql --version
# 期望: PostgreSQL 14+

# 2. 检查Node.js
node --version
# 期望: v16+

# 3. 检查当前目录
pwd
# 期望: /Users/alwan/code/qicheng/backend
```

---

## ⚡ 一键部署

### 步骤1: 执行数据库迁移（1分钟）

```bash
cd /Users/alwan/code/qicheng/backend

# 执行migration
psql -U qicheng_user -d qicheng_db -f migrations/084_semantic_matching_system.sql

# 期望输出:
# CREATE EXTENSION
# CREATE TABLE
# CREATE INDEX
# ...
# ✅ 语义匹配系统数据库Schema创建完成！
```

### 步骤2: 验证部署（2分钟）

```bash
# 给脚本添加执行权限
chmod +x verify_semantic_matching.sh

# 运行验证
./verify_semantic_matching.sh

# 期望输出:
# [PASS] 表 student_capabilities 存在
# [PASS] 表 task_student_matches 存在
# [PASS] 表 task_translations 存在
# ...
# ✅ 所有测试通过！语义匹配系统已就绪！
```

### 步骤3: 重启服务（1分钟）

```bash
# 开发环境
npm run dev

# 或生产环境
pm2 restart qicheng-backend

# 查看日志确认启动
tail -f logs/app.log | grep -E "Matching|启动"

# 期望看到:
# Matching scheduler started
# Server is running on port 3000
```

### 步骤4: 测试API（1分钟）

```bash
# 测试健康检查
curl http://localhost:3000/health

# 期望返回: {"status":"ok"}
```

---

## 🎯 快速测试

### 测试企业端匹配流程

```bash
# 1. 企业发布任务后，触发匹配
curl -X POST http://localhost:3000/api/v1/tasks/{taskId}/trigger-matching \
  -H "Authorization: Bearer {company_token}" \
  -H "Content-Type: application/json"

# 期望返回:
# {
#   "success": true,
#   "matchedCount": 100,
#   "topScore": 0.85,
#   "message": "成功匹配100个学生"
# }

# 2. 查看匹配的学生列表
curl http://localhost:3000/api/v1/tasks/{taskId}/matched-students?limit=10 \
  -H "Authorization: Bearer {company_token}"

# 期望返回: 学生列表，包含匹配分数

# 3. 推送给5个学生
curl -X POST http://localhost:3000/api/v1/tasks/{taskId}/push-to-students \
  -H "Authorization: Bearer {company_token}" \
  -H "Content-Type: application/json" \
  -d '{"studentIds": ["id1", "id2", "id3", "id4", "id5"]}'

# 期望返回:
# {
#   "success": true,
#   "pushedCount": 5,
#   "message": "已推送给5个学生"
# }
```

### 测试学生端推荐流程

```bash
# 1. 学生查看推荐任务
curl http://localhost:3000/api/v1/students/recommended-tasks \
  -H "Authorization: Bearer {student_token}"

# 期望返回: 推送给该学生的任务列表

# 2. 查看任务翻译
curl http://localhost:3000/api/v1/tasks/{taskId}/translation \
  -H "Authorization: Bearer {student_token}"

# 期望返回: 学生友好的任务描述、功能模块拆解

# 3. 接受推荐任务
curl -X POST http://localhost:3000/api/v1/tasks/{taskId}/accept-recommendation \
  -H "Authorization: Bearer {student_token}"

# 期望返回:
# {
#   "success": true,
#   "message": "已接受任务推荐"
# }
```

---

## 🔍 验证数据

### 检查数据库表

```bash
# 连接数据库
psql -U qicheng_user -d qicheng_db

# 检查表是否创建
\dt student_capabilities
\dt task_student_matches
\dt task_translations

# 检查学生能力画像数量
SELECT COUNT(*) FROM student_capabilities;

# 检查匹配记录数量
SELECT COUNT(*) FROM task_student_matches;

# 退出
\q
```

### 查看匹配统计

```sql
-- 最近7天的匹配统计
SELECT
  COUNT(*) as total_matches,
  AVG(overall_score) as avg_score,
  COUNT(*) FILTER (WHERE is_pushed = true) as pushed_count,
  COUNT(*) FILTER (WHERE student_accepted = true) as accepted_count
FROM task_student_matches
WHERE created_at > NOW() - INTERVAL '7 days';
```

---

## 🐛 常见问题

### 问题1: pgvector扩展未安装

**错误信息：** `extension "vector" does not exist`

**解决方法：**
```bash
psql -U qicheng_user -d qicheng_db -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### 问题2: 表已存在

**错误信息：** `relation "student_capabilities" already exists`

**说明：** Migration已经执行过，跳过即可。

### 问题3: API返回401

**错误信息：** `Unauthorized`

**解决方法：** 检查Authorization token是否正确。

### 问题4: 匹配结果为空

**原因：** 学生能力画像未初始化

**解决方法：** 等待学生完成任务后自动生成，或手动初始化。

---

## 📊 监控命令

```bash
# 查看实时日志
tail -f logs/app.log | grep Matching

# 查看错误日志
tail -f logs/error.log

# 查看进程状态
pm2 list

# 查看数据库连接
psql -U qicheng_user -d qicheng_db -c "SELECT COUNT(*) FROM pg_stat_activity;"
```

---

## 📚 完整文档

- 📖 [完整部署文档](SEMANTIC_MATCHING_DEPLOYMENT.md)
- 📊 [系统状态报告](SEMANTIC_MATCHING_STATUS_REPORT.md)
- 🔧 [验证脚本](verify_semantic_matching.sh)

---

## ✅ 部署成功标志

如果看到以下输出，说明部署成功：

```bash
# 1. 验证脚本通过
✅ 所有测试通过！语义匹配系统已就绪！

# 2. 服务日志显示
Matching scheduler started
Server is running on port 3000

# 3. API测试成功
{"success": true, "matchedCount": 100}
```

---

**恭喜！语义匹配系统已成功部署！** 🎉

下一步：
1. 测试完整的匹配流程
2. 监控匹配质量指标
3. 根据数据优化算法权重

有问题？查看 [故障排查指南](SEMANTIC_MATCHING_DEPLOYMENT.md#故障排查)
