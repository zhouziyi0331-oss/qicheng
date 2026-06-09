# 🚀 AI导师系统快速启动指南

**目标：** 30分钟内完成P0+P1功能部署  
**前置条件：** 已有启程平台后端环境  
**适用人员：** 后端开发、运维

---

## ⚡ 快速部署（5步）

### Step 1: 数据库迁移（5分钟）

```bash
cd /Users/alwan/code/qicheng/backend

# 执行P0迁移
psql -U qicheng_user -d qicheng_db -f migrations/085_mentor_enhancement_p0.sql

# 执行P1迁移
psql -U qicheng_user -d qicheng_db -f migrations/086_mentor_enhancement_p1.sql

# 验证表创建
psql -U qicheng_user -d qicheng_db -c "\dt mentor_*"
```

**预期输出：**
```
 mentor_alert_rules
 mentor_alerts
 mentor_growth_observations
 mentor_sessions
 mentor_student_profile_cache
 mentor_retrospectives
```

---

### Step 2: 安装依赖（2分钟）

```bash
cd /Users/alwan/code/qicheng/backend

# 检查依赖
npm list node-cron uuid @anthropic-ai/sdk

# 如果缺失，安装
npm install node-cron uuid @anthropic-ai/sdk
npm install --save-dev @types/node-cron @types/uuid
```

---

### Step 3: 配置环境变量（1分钟）

```bash
# 编辑.env文件
nano .env

# 确保有以下配置
ANTHROPIC_API_KEY=sk-ant-xxxxx
DATABASE_URL=postgresql://qicheng_user:password@localhost:5432/qicheng_db
REDIS_URL=redis://localhost:6379
```

---

### Step 4: 注册路由和定时任务（10分钟）

编辑 `src/app.ts`：

```typescript
// 1. 在文件顶部添加import
import mentorP1Routes from './routes/mentorP1Routes';

// 2. 在路由注册部分添加（第163行附近）
app.use('/api/v1/mentor', mentorRoutes); // 已有
app.use('/api/v1/mentor', mentorP1Routes); // 新增P1路由

// 3. 在定时任务部分添加（第85-110行附近）
if (process.env.NODE_ENV !== 'test') {
  // 现有的定时任务...
  
  // 【新增】AI导师预警定时任务
  const mentorAlertJob = require('./jobs/mentorAlertJob').default;
  mentorAlertJob.start();
  logger.info('✅ AI导师预警定时任务已启动（每15分钟扫描一次）');
  
  // 【新增】AI导师复盘定时任务
  const mentorRetrospectiveJob = require('./jobs/mentorRetrospectiveJob').default;
  mentorRetrospectiveJob.start();
  logger.info('✅ AI导师复盘定时任务已启动（每5分钟扫描一次）');
  
  // 优雅关闭时停止定时任务
  process.on('SIGTERM', () => {
    cronScheduler.stop();
    matchingScheduler.stop();
    mentorAlertJob.stop(); // 新增
    mentorRetrospectiveJob.stop(); // 新增
  });
  process.on('SIGINT', () => {
    cronScheduler.stop();
    matchingScheduler.stop();
    mentorAlertJob.stop(); // 新增
    mentorRetrospectiveJob.stop(); // 新增
  });
}
```

---

### Step 5: 重启服务（2分钟）

```bash
# 开发环境
npm run dev

# 或生产环境
pm2 restart qicheng-backend

# 查看日志确认启动成功
tail -f logs/app.log | grep -E "Mentor|✅"
```

**预期日志：**
```
✅ AI导师预警定时任务已启动（每15分钟扫描一次）
✅ AI导师复盘定时任务已启动（每5分钟扫描一次）
[MentorAlertJob] 定时任务已启动，每15分钟执行一次
[MentorRetrospectiveJob] 定时任务已启动，每5分钟执行一次
```

---

## ✅ 快速验证（5分钟）

### 验证1: 数据库

```bash
psql -U qicheng_user -d qicheng_db << 'EOF'
-- 检查预警规则
SELECT rule_type, is_active FROM mentor_alert_rules;

-- 检查学生画像（应该有初始数据）
SELECT COUNT(*) FROM mentor_student_profile_cache;

-- 检查表结构
\d mentor_retrospectives
EOF
```

### 验证2: API接口

```bash
# 测试健康检查
curl http://localhost:3000/health

# 测试获取学生画像（需要token）
curl -X GET http://localhost:3000/api/v1/mentor/profile \
  -H "Authorization: Bearer <student_token>"

# 测试手动触发预警扫描（需要admin token）
curl -X POST http://localhost:3000/api/v1/mentor/admin/trigger-alert-scan \
  -H "Authorization: Bearer <admin_token>"
```

### 验证3: 定时任务

```bash
# 实时监控日志
tail -f logs/app.log | grep -E "MentorAlert|MentorRetrospective"

# 等待15分钟，应该看到预警扫描日志
# 等待5分钟，应该看到复盘扫描日志
```

---

## 🔧 初始化数据（10分钟）

### 初始化学生画像

```bash
# 方式1: 通过API批量初始化（推荐）
curl -X POST http://localhost:3000/api/v1/mentor/admin/batch-init-profiles \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json"

# 方式2: 查看需要初始化的学生数量
psql -U qicheng_user -d qicheng_db -c "
SELECT COUNT(*) as need_init
FROM users u
WHERE u.role = 'student'
  AND NOT EXISTS (
    SELECT 1 FROM mentor_student_profile_cache mspc
    WHERE mspc.student_id = u.id
  );
"
```

---

## 📊 监控面板（持续）

### 实时监控命令

```bash
# 终端1: 监控预警任务
watch -n 60 "psql -U qicheng_user -d qicheng_db -c '
SELECT 
  rule_type,
  COUNT(*) as total,
  COUNT(CASE WHEN student_viewed THEN 1 END) as viewed
FROM mentor_alerts
WHERE created_at > NOW() - INTERVAL '\''24 hours'\''
GROUP BY rule_type;
'"

# 终端2: 监控复盘任务
watch -n 60 "psql -U qicheng_user -d qicheng_db -c '
SELECT 
  status,
  COUNT(*) as count
FROM mentor_retrospectives
WHERE sent_at > NOW() - INTERVAL '\''24 hours'\''
GROUP BY status;
'"

# 终端3: 监控日志
tail -f logs/app.log | grep -E "Mentor|ERROR"
```

### 关键指标查询

```sql
-- 预警统计（最近7天）
SELECT
  rule_type,
  COUNT(*) as total_alerts,
  COUNT(CASE WHEN student_viewed THEN 1 END) as viewed_count,
  ROUND(COUNT(CASE WHEN student_viewed THEN 1 END)::numeric / COUNT(*) * 100, 2) as view_rate
FROM mentor_alerts
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY rule_type;

-- 复盘统计（最近7天）
SELECT
  COUNT(*) as total_sent,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN status = 'skipped' THEN 1 END) as skipped,
  ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END)::numeric / COUNT(*) * 100, 2) as completion_rate
FROM mentor_retrospectives
WHERE sent_at > NOW() - INTERVAL '7 days';

-- 学生画像覆盖率
SELECT
  COUNT(DISTINCT u.id) as total_students,
  COUNT(DISTINCT mspc.student_id) as has_profile,
  ROUND(COUNT(DISTINCT mspc.student_id)::numeric / COUNT(DISTINCT u.id) * 100, 2) as coverage_rate
FROM users u
LEFT JOIN mentor_student_profile_cache mspc ON u.id = mspc.student_id
WHERE u.role = 'student';
```

---

## 🐛 快速故障排查

### 问题1: 定时任务未启动

```bash
# 检查进程
ps aux | grep node

# 检查日志
grep -i "mentor.*job" logs/app.log

# 手动触发测试
curl -X POST http://localhost:3000/api/v1/mentor/admin/trigger-alert-scan \
  -H "Authorization: Bearer <admin_token>"
```

### 问题2: 数据库表不存在

```bash
# 检查迁移历史
psql -U qicheng_user -d qicheng_db -c "
SELECT * FROM migrations ORDER BY id DESC LIMIT 5;
"

# 重新执行迁移
psql -U qicheng_user -d qicheng_db -f migrations/085_mentor_enhancement_p0.sql
psql -U qicheng_user -d qicheng_db -f migrations/086_mentor_enhancement_p1.sql
```

### 问题3: API返回500错误

```bash
# 查看错误日志
tail -100 logs/error.log

# 检查环境变量
echo $ANTHROPIC_API_KEY

# 测试数据库连接
psql -U qicheng_user -d qicheng_db -c "SELECT 1;"
```

### 问题4: 学生画像为空

```bash
# 检查是否有完成的订单
psql -U qicheng_user -d qicheng_db -c "
SELECT COUNT(*) FROM orders WHERE status = 'completed';
"

# 手动为单个学生生成画像
curl -X POST http://localhost:3000/api/v1/mentor/profile/refresh \
  -H "Authorization: Bearer <student_token>"
```

---

## 📱 测试场景（可选）

### 场景1: 测试预警系统

```sql
-- 创建测试订单（高难度）
INSERT INTO orders (id, student_id, project_id, status, accepted_at, deadline_at)
VALUES (
  gen_random_uuid(),
  '<student_id>',
  '<high_level_project_id>',
  'in_progress',
  NOW() - INTERVAL '1 hour',
  NOW() + INTERVAL '2 days'
);

-- 等待15分钟或手动触发扫描
-- 检查是否生成预警
SELECT * FROM mentor_alerts WHERE student_id = '<student_id>' ORDER BY created_at DESC LIMIT 1;
```

### 场景2: 测试复盘系统

```sql
-- 完成一个订单
UPDATE orders SET status = 'completed', completed_at = NOW() WHERE id = '<order_id>';

-- 等待60秒或手动触发
-- 检查是否生成复盘
SELECT * FROM mentor_retrospectives WHERE order_id = '<order_id>';
```

### 场景3: 测试范例展示

```bash
# 连续发送2次求助消息
curl -X POST http://localhost:3000/api/v1/mentor/message \
  -H "Authorization: Bearer <student_token>" \
  -d '{"orderId": "<order_id>", "message": "我不知道怎么做"}'

# 等待回复后再发送
curl -X POST http://localhost:3000/api/v1/mentor/message \
  -H "Authorization: Bearer <student_token>" \
  -d '{"orderId": "<order_id>", "message": "还是不会"}'

# 检查是否展示了范例
SELECT * FROM mentor_sessions 
WHERE trigger_type = 'example_shown' 
ORDER BY created_at DESC LIMIT 1;
```

---

## 📋 部署检查清单

### 部署前

- [ ] 代码已拉取到最新版本
- [ ] 环境变量已配置（ANTHROPIC_API_KEY）
- [ ] 数据库连接正常
- [ ] Redis连接正常
- [ ] 依赖已安装

### 部署中

- [ ] 数据库迁移执行成功
- [ ] 路由注册完成
- [ ] 定时任务启动成功
- [ ] 服务重启成功
- [ ] 日志显示正常

### 部署后

- [ ] API接口返回正常
- [ ] 定时任务执行正常
- [ ] 数据库表有数据
- [ ] 学生画像已初始化
- [ ] 监控指标正常

---

## 🎯 下一步

### 立即行动

1. ✅ 执行上述5步部署
2. ✅ 运行快速验证
3. ✅ 初始化学生画像
4. ✅ 设置监控面板

### 7天观察期

1. 每天查看关键指标
2. 收集用户反馈
3. 调整预警阈值
4. 优化AI Prompt

### 前端开发

1. 开发提交前自查组件
2. 开发复盘问答组件
3. 开发预警消息展示
4. 开发画像查看页面

---

## 📞 获取帮助

**遇到问题？**

1. 查看 [P0集成指南 - 常见问题](AI_MENTOR_P0_INTEGRATION_GUIDE.md#四常见问题处理)
2. 查看 [P0测试清单](AI_MENTOR_P0_TEST_CHECKLIST.md)
3. 查看日志：`tail -f logs/app.log | grep ERROR`

**需要详细文档？**

- [P0部署指南](AI_MENTOR_P0_DEPLOYMENT_GUIDE.md) - 完整部署步骤
- [P0测试清单](AI_MENTOR_P0_TEST_CHECKLIST.md) - 50+测试点
- [完整总结](AI_MENTOR_COMPLETE_SUMMARY.md) - 技术架构

---

**预计部署时间：** 30分钟  
**难度等级：** ⭐⭐☆☆☆（中等）  
**建议人员：** 后端开发 + 运维

开始部署吧！🚀
