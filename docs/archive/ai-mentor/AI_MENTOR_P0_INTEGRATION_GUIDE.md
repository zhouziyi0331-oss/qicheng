# AI导师P0功能集成指南

**目标：** 将新实现的P0功能集成到现有启程平台  
**日期：** 2026-05-27  
**状态：** 待执行

---

## 一、集成概述

现有系统已经有基础的mentor路由（`/api/v1/mentor`），我们需要：
1. 替换现有的mentorRoutes为新的P0增强版本
2. 启动定时任务（mentorAlertJob）
3. 执行数据库迁移
4. 初始化学生画像

---

## 二、集成步骤

### Step 1: 备份现有文件

```bash
cd /Users/alwan/code/qicheng/backend

# 备份现有的mentor相关文件
cp src/routes/mentor.ts src/routes/mentor.backup.ts
cp src/routes/mentorRoutes.ts src/routes/mentorRoutes.backup.ts 2>/dev/null || true

# 查看现有mentor路由文件
ls -la src/routes/mentor*
```

### Step 2: 检查路由冲突

```bash
# 查看现有mentor路由的内容
cat src/routes/mentor.ts | head -50

# 检查是否有路由冲突
grep -r "GET.*mentor/alerts" src/routes/
grep -r "GET.*mentor/profile" src/routes/
```

**处理方案：**
- 如果现有路由与新路由冲突，需要合并或重命名
- 建议：将新的P0路由注册到 `/api/v1/mentor-p0` 避免冲突

### Step 3: 注册新路由（方案A：独立路由）

编辑 `src/app.ts`，在第163行后添加：

```typescript
// 在现有的 app.use('/api/v1/mentor', mentorRoutes); 之后添加
import mentorP0Routes from './routes/mentorRoutes'; // 新的P0路由

// 注册P0增强路由
app.use('/api/v1/mentor-p0', mentorP0Routes);
```

**或者方案B：替换现有路由**

如果确认现有mentor路由可以完全替换：

```typescript
// 替换现有的 mentorRoutes import
// import mentorRoutes from './routes/mentor';
import mentorRoutes from './routes/mentorRoutes'; // 使用新的P0版本

// 路由注册保持不变
app.use('/api/v1/mentor', mentorRoutes);
```

### Step 4: 启动定时任务

编辑 `src/app.ts`，在第85-110行的定时任务部分添加：

```typescript
// 在现有的定时任务启动代码中添加
if (process.env.NODE_ENV !== 'test') {
  require('./jobs/emotionSignalDetector');
  require('./jobs/firstTaskSettlement');
  require('./cron/mentorNudge').startMentorNudgeCron();
  require('./jobs/invitationCron');

  // 【新增】启动AI导师预警定时任务
  const mentorAlertJob = require('./jobs/mentorAlertJob').default;
  mentorAlertJob.start();
  logger.info('✅ AI导师预警定时任务已启动（每15分钟扫描一次）');

  // 启动定时任务调度器（7天自动确认等）
  const { pool } = require('./utils/db');
  const { CronScheduler } = require('./cron/scheduler');
  const cronScheduler = new CronScheduler(pool);
  cronScheduler.start();

  // 启动匹配调度器（每天自动重新匹配）
  const matchingScheduler = require('./services/matchingScheduler').default;
  matchingScheduler.start();

  // 优雅关闭时停止定时任务
  process.on('SIGTERM', () => {
    cronScheduler.stop();
    matchingScheduler.stop();
    mentorAlertJob.stop(); // 【新增】停止预警任务
  });
  process.on('SIGINT', () => {
    cronScheduler.stop();
    matchingScheduler.stop();
    mentorAlertJob.stop(); // 【新增】停止预警任务
  });
}
```

### Step 5: 执行数据库迁移

```bash
cd /Users/alwan/code/qicheng/backend

# 检查迁移文件
ls -la migrations/085_mentor_enhancement_p0.sql

# 执行迁移
npm run migrate

# 或者手动执行
psql -U qicheng_user -d qicheng_db -f migrations/085_mentor_enhancement_p0.sql
```

**验证迁移成功：**

```sql
-- 连接数据库
psql -U qicheng_user -d qicheng_db

-- 检查表是否创建
\dt mentor_*

-- 预期输出：
-- mentor_alert_rules
-- mentor_alerts
-- mentor_growth_observations
-- mentor_sessions
-- mentor_student_profile_cache

-- 检查预警规则
SELECT rule_type, rule_name, is_active FROM mentor_alert_rules;

-- 预期：4条规则
```

### Step 6: 安装依赖

```bash
cd /Users/alwan/code/qicheng/backend

# 检查依赖
npm list node-cron uuid @anthropic-ai/sdk

# 如果缺失，安装
npm install node-cron
npm install uuid
npm install @anthropic-ai/sdk

# 检查类型定义
npm install --save-dev @types/node-cron
npm install --save-dev @types/uuid
```

### Step 7: 配置环境变量

编辑 `.env` 文件：

```bash
# 确保有Anthropic API Key
ANTHROPIC_API_KEY=sk-ant-xxxxx

# 如果没有，添加
echo "ANTHROPIC_API_KEY=your-api-key-here" >> .env
```

### Step 8: 编译TypeScript

```bash
cd /Users/alwan/code/qicheng/backend

# 编译
npm run build

# 检查编译错误
# 如果有错误，根据提示修复
```

### Step 9: 重启服务

```bash
# 开发环境
npm run dev

# 或生产环境
pm2 restart qicheng-backend

# 查看日志
pm2 logs qicheng-backend

# 或
tail -f logs/app.log
```

**验证启动成功：**

查看日志中是否有：
```
✅ AI导师预警定时任务已启动（每15分钟扫描一次）
[MentorAlertJob] 定时任务已启动，每15分钟执行一次
```

### Step 10: 初始化学生画像

```bash
# 方式1：通过API（推荐）
curl -X POST http://localhost:3000/api/v1/mentor-p0/admin/batch-init-profiles \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json"

# 方式2：通过数据库脚本
psql -U qicheng_user -d qicheng_db << 'EOF'
-- 为所有学生初始化画像（迁移脚本已包含）
SELECT COUNT(*) FROM mentor_student_profile_cache;
EOF
```

---

## 三、验证集成

### 3.1 健康检查

```bash
# 1. 检查服务是否启动
curl http://localhost:3000/health

# 2. 检查新路由是否可访问
curl http://localhost:3000/api/v1/mentor-p0/alerts \
  -H "Authorization: Bearer <student_token>"

# 预期：返回200或401（需要认证）
```

### 3.2 数据库验证

```sql
-- 1. 检查预警规则
SELECT COUNT(*) FROM mentor_alert_rules WHERE is_active = true;
-- 预期：4

-- 2. 检查学生画像
SELECT COUNT(*) FROM mentor_student_profile_cache;
-- 预期：等于学生总数

-- 3. 检查成长观察表扩展
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'mentor_growth_observations' 
  AND column_name IN ('observation_category', 'is_significant', 'tags');
-- 预期：3行
```

### 3.3 定时任务验证

```bash
# 查看日志，等待15分钟
tail -f logs/app.log | grep MentorAlert

# 预期输出（每15分钟）：
# [MentorAlertJob] 开始执行预警扫描
# [MentorAlert] 找到 X 个进行中的订单
# [MentorAlert] 风险扫描完成
# [MentorAlertJob] 预警扫描完成，耗时 XXXms
```

### 3.4 功能测试

```bash
# 1. 获取学生画像
curl -X GET http://localhost:3000/api/v1/mentor-p0/profile \
  -H "Authorization: Bearer <student_token>"

# 2. 手动触发预警扫描（管理员）
curl -X POST http://localhost:3000/api/v1/mentor-p0/admin/trigger-alert-scan \
  -H "Authorization: Bearer <admin_token>"

# 3. 发送消息给导师
curl -X POST http://localhost:3000/api/v1/mentor-p0/message \
  -H "Authorization: Bearer <student_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test-order-id",
    "message": "我卡住了"
  }'
```

---

## 四、常见问题处理

### 问题1：路由冲突

**症状：** 启动时报错 "Route already registered"

**解决方案：**
```typescript
// 使用独立的路由前缀
app.use('/api/v1/mentor-p0', mentorP0Routes);

// 或者合并路由
// 将新路由的内容合并到现有的 mentor.ts 文件中
```

### 问题2：定时任务未启动

**症状：** 日志中没有 `[MentorAlertJob]` 输出

**排查步骤：**
```bash
# 1. 检查是否在测试环境
echo $NODE_ENV

# 2. 检查app.ts中是否添加了启动代码
grep -A 5 "mentorAlertJob" src/app.ts

# 3. 手动测试定时任务
node -e "
const mentorAlertJob = require('./dist/jobs/mentorAlertJob').default;
mentorAlertJob.triggerManually().then(() => console.log('Done'));
"
```

### 问题3：数据库迁移失败

**症状：** 表未创建或字段缺失

**解决方案：**
```bash
# 1. 检查迁移历史
psql -U qicheng_user -d qicheng_db -c "SELECT * FROM migrations ORDER BY id DESC LIMIT 5;"

# 2. 手动执行迁移
psql -U qicheng_user -d qicheng_db -f migrations/085_mentor_enhancement_p0.sql

# 3. 如果表已存在但字段缺失，单独添加
psql -U qicheng_user -d qicheng_db << 'EOF'
ALTER TABLE mentor_growth_observations
ADD COLUMN IF NOT EXISTS observation_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_significant BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tags TEXT[];
EOF
```

### 问题4：AI调用失败

**症状：** 画像生成失败，日志显示 "AI服务暂时不可用"

**排查步骤：**
```bash
# 1. 检查API Key
echo $ANTHROPIC_API_KEY

# 2. 测试API连接
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-haiku-4-5",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Hello"}]
  }'

# 3. 检查网络连接
ping api.anthropic.com
```

### 问题5：学生画像为空

**症状：** API返回 "画像不存在"

**解决方案：**
```bash
# 1. 检查学生是否有完成的订单
psql -U qicheng_user -d qicheng_db -c "
SELECT COUNT(*) FROM orders 
WHERE student_id = '<student_id>' AND status = 'completed';
"

# 2. 手动为该学生生成画像
curl -X POST http://localhost:3000/api/v1/mentor-p0/profile/refresh \
  -H "Authorization: Bearer <student_token>"

# 3. 批量初始化所有学生
curl -X POST http://localhost:3000/api/v1/mentor-p0/admin/batch-init-profiles \
  -H "Authorization: Bearer <admin_token>"
```

---

## 五、回滚方案

如果集成后出现严重问题，可以快速回滚：

### 5.1 停止定时任务

```typescript
// 在 src/app.ts 中注释掉
// const mentorAlertJob = require('./jobs/mentorAlertJob').default;
// mentorAlertJob.start();
```

### 5.2 禁用新路由

```typescript
// 在 src/app.ts 中注释掉
// app.use('/api/v1/mentor-p0', mentorP0Routes);
```

### 5.3 恢复备份文件

```bash
# 恢复原有的mentor路由
cp src/routes/mentor.backup.ts src/routes/mentor.ts

# 重启服务
pm2 restart qicheng-backend
```

### 5.4 回滚数据库（慎用）

```sql
-- 只在必要时执行
DROP TABLE IF EXISTS mentor_alerts CASCADE;
DROP TABLE IF EXISTS mentor_alert_rules CASCADE;
DROP TABLE IF EXISTS mentor_student_profile_cache CASCADE;

ALTER TABLE mentor_growth_observations
DROP COLUMN IF EXISTS observation_category,
DROP COLUMN IF EXISTS is_significant,
DROP COLUMN IF EXISTS tags;
```

---

## 六、监控和维护

### 6.1 日志监控

```bash
# 实时监控预警任务
tail -f logs/app.log | grep -E "MentorAlert|MentorMemory"

# 监控错误
tail -f logs/error.log | grep -E "mentor|alert"
```

### 6.2 性能监控

```sql
-- 预警扫描性能
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as alert_count,
  AVG(EXTRACT(EPOCH FROM (created_at - created_at))) as avg_latency
FROM mentor_alerts
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- 画像更新频率
SELECT
  DATE(last_updated) as date,
  COUNT(*) as profiles_updated
FROM mentor_student_profile_cache
WHERE last_updated > NOW() - INTERVAL '7 days'
GROUP BY DATE(last_updated)
ORDER BY date DESC;
```

### 6.3 定期维护

```bash
# 每周执行一次
# 1. 清理过期预警（可选）
psql -U qicheng_user -d qicheng_db -c "
DELETE FROM mentor_alerts 
WHERE created_at < NOW() - INTERVAL '30 days';
"

# 2. 重建索引
psql -U qicheng_user -d qicheng_db -c "
REINDEX TABLE mentor_alerts;
REINDEX TABLE mentor_student_profile_cache;
"

# 3. 更新统计信息
psql -U qicheng_user -d qicheng_db -c "
ANALYZE mentor_alerts;
ANALYZE mentor_student_profile_cache;
"
```

---

## 七、下一步

集成完成并验证通过后：

1. **观察7天**：收集预警触发率、学生响应率等数据
2. **调整阈值**：根据实际数据优化预警触发条件
3. **收集反馈**：询问学生对个性化引导的感受
4. **开始P1**：实现范例展示、提交前自查、项目复盘

---

## 附录：快速命令参考

```bash
# 启动服务
npm run dev

# 查看日志
tail -f logs/app.log | grep MentorAlert

# 手动触发预警扫描
curl -X POST http://localhost:3000/api/v1/mentor-p0/admin/trigger-alert-scan \
  -H "Authorization: Bearer <admin_token>"

# 检查数据库
psql -U qicheng_user -d qicheng_db -c "SELECT COUNT(*) FROM mentor_alerts;"

# 重启服务
pm2 restart qicheng-backend

# 查看进程
pm2 list
```

---

**集成负责人：** __________  
**集成日期：** __________  
**验证状态：** □ 待执行  □ 进行中  □ 已完成
