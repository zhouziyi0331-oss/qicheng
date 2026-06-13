# AI导师P0功能部署指南

**版本：** v1.0  
**日期：** 2026-05-27  
**功能：** 主动预警系统、长期记忆系统、风格自适应引导

---

## 一、功能概述

本次部署包含3个P0级AI导师增强功能：

### 1. 主动预警系统（T-06）
- **功能**：定时扫描风险条件，提前介入
- **触发条件**：
  - 接高难度项目（等级跨度≥2）
  - 连续同类问题打回（2次）
  - 截止时间紧迫（剩余<30%）
  - 方向偏差（AI-03检测）
- **扫描频率**：每15分钟
- **核心文件**：
  - `backend/src/services/mentorAlertService.ts`
  - `backend/src/jobs/mentorAlertJob.ts`
  - `backend/migrations/085_mentor_enhancement_p0.sql`

### 2. 长期记忆系统
- **功能**：跨订单记忆学生画像，提供个性化引导
- **记忆内容**：
  - 200字画像摘要
  - Top 3高频卡点
  - Top 3最近突破
  - 能力快照（六维画像）
  - 工作模式（交付速度、修改轮数、评分）
- **更新时机**：每次订单完成后
- **核心文件**：
  - `backend/src/services/mentorMemoryService.ts`
  - `backend/migrations/085_mentor_enhancement_p0.sql`

### 3. 风格自适应引导
- **功能**：根据学生六维画像调整引导风格
- **风格类型**：
  - 视觉型（创作驱动≥65）：画面感类比
  - 逻辑型（创作驱动≤45）：结构化步骤
  - 独立型（协作倾向≤45）：多问少答
  - 协作型（协作倾向≥65）：社交化引导
  - 冒险型（风险态度≥65）：大胆建议
  - 稳健型（风险态度≤45）：小步迭代
- **集成位置**：`mentorCoreService.buildPrompt()`

---

## 二、部署步骤

### Step 1: 数据库迁移

```bash
cd /Users/alwan/code/qicheng/backend

# 执行迁移
npm run migrate

# 验证表创建成功
psql -U qicheng_user -d qicheng_db -c "\dt mentor_*"
```

**预期输出：**
```
                    List of relations
 Schema |              Name               | Type  |    Owner     
--------+---------------------------------+-------+--------------
 public | mentor_alert_rules              | table | qicheng_user
 public | mentor_alerts                   | table | qicheng_user
 public | mentor_growth_observations      | table | qicheng_user
 public | mentor_sessions                 | table | qicheng_user
 public | mentor_student_profile_cache    | table | qicheng_user
```

**验证数据：**
```sql
-- 检查预警规则是否初始化
SELECT rule_type, rule_name, is_active FROM mentor_alert_rules;

-- 预期：4条规则（level_gap, repeated_rejection, deadline_pressure, direction_mismatch）
```

### Step 2: 安装依赖

```bash
cd /Users/alwan/code/qicheng/backend

# 检查是否已安装必要依赖
npm list node-cron uuid @anthropic-ai/sdk

# 如果缺失，安装
npm install node-cron uuid @anthropic-ai/sdk
```

### Step 3: 配置环境变量

编辑 `.env` 文件，确保包含：

```bash
# Anthropic API Key（必需）
ANTHROPIC_API_KEY=sk-ant-xxxxx

# 数据库连接（已有）
DATABASE_URL=postgresql://qicheng_user:password@localhost:5432/qicheng_db

# Redis连接（已有，用于缓存）
REDIS_URL=redis://localhost:6379
```

### Step 4: 注册路由

编辑 `backend/src/app.ts` 或主路由文件，添加：

```typescript
import mentorRoutes from './routes/mentorRoutes';

// 注册导师路由
app.use('/api/v1/mentor', mentorRoutes);
```

### Step 5: 启动定时任务

编辑 `backend/src/server.ts` 或启动文件，添加：

```typescript
import mentorAlertJob from './jobs/mentorAlertJob';

// 启动服务器后，启动定时任务
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // 启动AI导师预警定时任务
  mentorAlertJob.start();
  console.log('✅ AI导师预警定时任务已启动（每15分钟扫描一次）');
});
```

### Step 6: 初始化学生画像

```bash
# 方式1：通过API批量初始化（推荐）
curl -X POST http://localhost:3000/api/v1/mentor/admin/batch-init-profiles \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json"

# 方式2：通过数据库脚本
psql -U qicheng_user -d qicheng_db -c "
SELECT mentorMemoryService.batchInitializeProfiles();
"
```

**注意：** 批量初始化会为所有现有学生生成画像，可能需要几分钟。

### Step 7: 重启服务

```bash
# 开发环境
npm run dev

# 生产环境
pm2 restart qicheng-backend
```

---

## 三、验证部署

### 3.1 验证数据库

```sql
-- 1. 检查预警规则
SELECT COUNT(*) FROM mentor_alert_rules WHERE is_active = true;
-- 预期：4

-- 2. 检查学生画像缓存
SELECT COUNT(*) FROM mentor_student_profile_cache;
-- 预期：等于学生总数

-- 3. 检查成长观察表扩展
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'mentor_growth_observations' 
  AND column_name IN ('observation_category', 'is_significant', 'tags');
-- 预期：3行
```

### 3.2 验证API

```bash
# 1. 获取学生画像
curl -X GET http://localhost:3000/api/v1/mentor/profile \
  -H "Authorization: Bearer <student_token>"

# 预期响应：
{
  "success": true,
  "data": {
    "student_id": "xxx",
    "profile_summary": "该学生属于...",
    "top_stuck_points": [...],
    "recent_breakthroughs": [...],
    "guidance_style": {...}
  }
}

# 2. 获取未读预警
curl -X GET http://localhost:3000/api/v1/mentor/alerts \
  -H "Authorization: Bearer <student_token>"

# 预期响应：
{
  "success": true,
  "data": {
    "alerts": [],
    "count": 0
  }
}

# 3. 手动触发预警扫描（管理员）
curl -X POST http://localhost:3000/api/v1/mentor/admin/trigger-alert-scan \
  -H "Authorization: Bearer <admin_token>"

# 预期响应：
{
  "success": true,
  "message": "预警扫描已完成"
}
```

### 3.3 验证定时任务

```bash
# 查看日志，确认定时任务正在运行
tail -f logs/app.log | grep MentorAlert

# 预期输出（每15分钟）：
[2026-05-27 10:00:00] [MentorAlertJob] 开始执行预警扫描
[2026-05-27 10:00:02] [MentorAlert] 找到 15 个进行中的订单
[2026-05-27 10:00:03] [MentorAlert] 风险扫描完成
[2026-05-27 10:00:03] [MentorAlertJob] 预警扫描完成，耗时 3200ms
```

### 3.4 验证长期记忆集成

创建测试对话，验证AI回复中是否包含学生历史信息：

```bash
# 发送测试消息
curl -X POST http://localhost:3000/api/v1/mentor/message \
  -H "Authorization: Bearer <student_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test-order-id",
    "message": "我又卡住了"
  }'

# 检查AI回复是否引用了学生历史卡点
# 预期：AI回复中包含类似"我注意到你之前在XX上也卡过..."的内容
```

---

## 四、监控指标

### 4.1 预警系统监控

```sql
-- 预警统计（最近7天）
SELECT
  rule_type,
  COUNT(*) as total_alerts,
  COUNT(CASE WHEN student_viewed THEN 1 END) as viewed_count,
  COUNT(CASE WHEN student_responded THEN 1 END) as responded_count,
  ROUND(AVG(EXTRACT(EPOCH FROM (viewed_at - created_at)) / 60), 2) as avg_view_time_minutes
FROM mentor_alerts
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY rule_type
ORDER BY total_alerts DESC;
```

**关键指标：**
- 预警总数：每天应有5-20条（取决于活跃订单数）
- 查看率：>60%
- 响应率：>40%
- 平均查看时间：<2小时

### 4.2 长期记忆监控

```sql
-- 画像更新统计
SELECT
  DATE(last_updated) as date,
  COUNT(*) as profiles_updated,
  AVG(LENGTH(profile_summary)) as avg_summary_length
FROM mentor_student_profile_cache
WHERE last_updated > NOW() - INTERVAL '7 days'
GROUP BY DATE(last_updated)
ORDER BY date DESC;
```

**关键指标：**
- 每日更新画像数：应等于每日完成订单数
- 摘要平均长度：150-200字

### 4.3 AI调用监控

```sql
-- AI-06调用统计（最近24小时）
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as call_count,
  AVG(EXTRACT(EPOCH FROM (created_at - created_at))) as avg_latency_seconds
FROM ai_call_logs
WHERE engine_name = 'AI-06'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;
```

**关键指标：**
- 每小时调用量：5-50次（取决于活跃度）
- 平均延迟：<3秒（使用Haiku模型）

---

## 五、故障排查

### 问题1：定时任务未启动

**症状：** 日志中没有 `[MentorAlertJob]` 相关输出

**排查步骤：**
```bash
# 1. 检查server.ts是否调用了mentorAlertJob.start()
grep -n "mentorAlertJob.start" backend/src/server.ts

# 2. 检查node-cron是否安装
npm list node-cron

# 3. 手动触发测试
curl -X POST http://localhost:3000/api/v1/mentor/admin/trigger-alert-scan \
  -H "Authorization: Bearer <admin_token>"
```

### 问题2：学生画像为空

**症状：** API返回 `"画像不存在，请先完成至少一个订单"`

**排查步骤：**
```sql
-- 1. 检查该学生是否有画像记录
SELECT * FROM mentor_student_profile_cache WHERE student_id = '<student_id>';

-- 2. 检查该学生是否有完成的订单
SELECT COUNT(*) FROM orders WHERE student_id = '<student_id>' AND status = 'completed';

-- 3. 手动触发画像生成
-- 通过API或直接调用服务
```

**解决方案：**
```bash
# 为单个学生初始化画像
curl -X POST http://localhost:3000/api/v1/mentor/profile/refresh \
  -H "Authorization: Bearer <student_token>"
```

### 问题3：AI回复未包含长期记忆

**症状：** AI回复中没有引用学生历史信息

**排查步骤：**
```typescript
// 1. 检查mentorCoreService.buildPrompt()是否正确集成
// 在buildPrompt方法中添加日志
logger.info('学生画像:', profile);

// 2. 检查profile是否为null
if (!profile) {
  logger.warn('学生画像不存在，使用基础Prompt');
}
```

**解决方案：**
- 确保学生已完成至少一个订单
- 手动刷新学生画像
- 检查数据库连接是否正常

### 问题4：预警未触发

**症状：** 满足预警条件但未收到预警消息

**排查步骤：**
```sql
-- 1. 检查预警规则是否激活
SELECT * FROM mentor_alert_rules WHERE is_active = true;

-- 2. 检查是否已发送过预警（24小时内不重复）
SELECT * FROM mentor_alerts 
WHERE student_id = '<student_id>' 
  AND order_id = '<order_id>'
  AND created_at > NOW() - INTERVAL '24 hours';

-- 3. 手动触发扫描并查看日志
```

**解决方案：**
- 检查预警规则的trigger_condition是否正确
- 确认订单状态符合触发条件
- 查看日志中的扫描结果

---

## 六、回滚方案

如果部署后出现严重问题，可以快速回滚：

### 6.1 停止定时任务

```typescript
// 在server.ts中注释掉
// mentorAlertJob.start();
```

### 6.2 禁用预警规则

```sql
UPDATE mentor_alert_rules SET is_active = false;
```

### 6.3 回滚数据库（慎用）

```bash
# 创建回滚脚本
cat > backend/migrations/086_rollback_mentor_enhancement.sql << 'EOF'
-- 回滚P0功能

-- 删除新增表
DROP TABLE IF EXISTS mentor_alerts CASCADE;
DROP TABLE IF EXISTS mentor_alert_rules CASCADE;
DROP TABLE IF EXISTS mentor_student_profile_cache CASCADE;

-- 回滚mentor_growth_observations扩展
ALTER TABLE mentor_growth_observations
DROP COLUMN IF EXISTS observation_category,
DROP COLUMN IF EXISTS is_significant,
DROP COLUMN IF EXISTS tags;

-- 删除索引
DROP INDEX IF EXISTS idx_mentor_alerts_student;
DROP INDEX IF EXISTS idx_mentor_alerts_order;
DROP INDEX IF EXISTS idx_mentor_alerts_unsent;
DROP INDEX IF EXISTS idx_mentor_alerts_rule_type;
DROP INDEX IF EXISTS idx_mentor_profile_cache_updated;
DROP INDEX IF EXISTS idx_mentor_profile_cache_style;
DROP INDEX IF EXISTS idx_growth_obs_category;
DROP INDEX IF EXISTS idx_growth_obs_significant;
DROP INDEX IF EXISTS idx_growth_obs_tags;
EOF

# 执行回滚
npm run migrate
```

---

## 七、性能优化建议

### 7.1 预警扫描优化

如果活跃订单数>1000，考虑：
- 增加扫描间隔到30分钟
- 添加订单优先级过滤（只扫描高优先级订单）
- 使用Redis缓存扫描结果

### 7.2 画像生成优化

如果学生数>10000，考虑：
- 异步批量更新（使用Bull队列）
- 增量更新（只更新有新订单的学生）
- 缓存AI生成的摘要（TTL=7天）

### 7.3 数据库索引优化

```sql
-- 如果查询慢，添加复合索引
CREATE INDEX idx_orders_student_status ON orders(student_id, status, accepted_at);
CREATE INDEX idx_submissions_order_version ON order_submissions(order_id, version DESC);
```

---

## 八、下一步计划

P0功能部署完成后，可以开始P1功能开发：

1. **范例展示**（T-02增强）：学生连续求助时展示相似项目案例
2. **提交前自查**（T-07）：已实现API，需要前端集成
3. **项目复盘引导**（T-05增强）：订单完成后引导结构化复盘

---

## 九、联系方式

如有问题，请联系：
- 技术负责人：[姓名]
- 邮箱：[email]
- 文档版本：v1.0
- 最后更新：2026-05-27
