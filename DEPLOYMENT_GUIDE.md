# 🚀 部署指南 - 体验优化功能完整部署手册

## 📋 部署前检查清单

### 环境要求
- ✅ Node.js >= 14.x
- ✅ PostgreSQL >= 12.x
- ✅ Redis >= 6.x（可选，用于缓存）
- ✅ npm 或 yarn

### 必需的环境变量
```bash
# .env 文件
DATABASE_URL=postgresql://user:password@localhost:5432/qicheng_db
JWT_ACCESS_SECRET=your-secret-key-here
ANTHROPIC_API_KEY=sk-ant-xxxxx  # Claude AI API密钥
NODE_ENV=production
PORT=3000
```

---

## 🗄️ 数据库部署

### 步骤1: 创建数据库
```bash
# 创建数据库
createdb qicheng_db

# 或使用psql
psql -U postgres
CREATE DATABASE qicheng_db;
\q
```

### 步骤2: 执行所有迁移
```bash
cd /Users/alwan/code/qicheng/backend

# 按顺序执行（重要！）
psql -d qicheng_db -f migrations/113_cultivation_plan.sql
psql -d qicheng_db -f migrations/114_task_experience_optimization.sql
psql -d qicheng_db -f migrations/115_matching_enhancements.sql
psql -d qicheng_db -f migrations/116_task_tracking_system.sql
psql -d qicheng_db -f migrations/117_acceptance_system.sql
```

### 步骤3: 验证数据
```bash
# 验证表创建
psql -d qicheng_db -c "\dt" | grep -E "task_templates|trial_invitations|task_milestones"

# 验证预置数据
psql -d qicheng_db -c "SELECT COUNT(*) FROM task_templates WHERE is_official = true;"
# 应该返回：3

psql -d qicheng_db -c "SELECT COUNT(*) FROM revision_comment_templates WHERE is_official = true;"
# 应该返回：7
```

### 步骤4: 验证触发器
```bash
psql -d qicheng_db -c "\df" | grep -E "create_progress_snapshot|update_cooperation_stats"
```

---

## 🔧 后端部署

### 步骤1: 安装依赖
```bash
cd /Users/alwan/code/qicheng/backend
npm install
```

### 步骤2: 编译TypeScript
```bash
npm run build
```

### 步骤3: 启动服务
```bash
# 开发环境
npm run dev

# 生产环境
npm start
```

### 步骤4: 验证API
```bash
# 健康检查
curl http://localhost:3000/health

# 测试模板列表API
curl http://localhost:3000/api/v1/task-experience/templates

# 应该返回3个官方模板
```

---

## 📱 前端部署

### 步骤1: 配置路由
编辑 `company-miniapp/src/app.config.ts`：

```typescript
export default {
  pages: [
    'pages/index/index',
    'pages/login/index',
    // ... 现有页面
    
    // 新增：体验优化功能页面
    'pages/template-market/index',
    'pages/trial-management/index',
    'pages/student-comparison/index',
    'pages/student-search/index',
    'pages/task-progress/index',
    'pages/milestones/index',
    'pages/acceptance-checklist/index',
    'pages/dimensional-score/index',
    'pages/revision-templates/index',
    'pages/ip-declaration/index',
    'pages/refund-request/index',
    'pages/notifications/index',
    'pages/communication-archives/index',
  ],
  
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'WeChat',
    navigationBarTextStyle: 'black'
  }
}
```

### 步骤2: 配置API地址
编辑 `company-miniapp/src/config/index.ts`：

```typescript
export const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.yourcompany.com'
  : 'http://localhost:3000'
```

### 步骤3: 安装依赖
```bash
cd /Users/alwan/code/qicheng/company-miniapp
npm install
```

### 步骤4: 编译运行
```bash
# 微信小程序
npm run dev:weapp

# H5
npm run dev:h5

# 生产构建
npm run build:weapp
```

---

## 🧪 功能测试

### 测试1: 任务模板市场
```bash
# 1. 打开小程序
# 2. 导航到 "模板市场"
# 3. 应该看到3个官方模板：
#    - 电商AI产品图设计
#    - 公众号AI文案撰写
#    - 小红书AI种草笔记
# 4. 点击"使用模板"
# 5. 应该跳转到任务发布页面
```

### 测试2: AI预算建议
```bash
# API测试
curl -X POST http://localhost:3000/api/v1/task-experience/budget-suggestion \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "task_category": "设计类",
    "quality_expectation": "standard"
  }'

# 预期响应：
{
  "success": true,
  "data": {
    "suggested_min": 250,
    "suggested_max": 500,
    "suggested_optimal": 350,
    "similar_tasks_count": 100,
    "reasoning": "基于100个同类任务的成交数据..."
  }
}
```

### 测试3: 学生搜索
```bash
curl -X POST http://localhost:3000/api/v1/matching-enhancement/search-students \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "filters": {
      "student_level_min": 3,
      "min_rating": 4.0,
      "max_hourly_rate": 100
    }
  }'
```

### 测试4: 里程碑管理
```bash
# 创建里程碑
curl -X POST http://localhost:3000/api/v1/task-tracking/tasks/TASK_ID/milestones \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "milestone_name": "设计稿完成",
    "description": "完成首页设计稿",
    "sequence_number": 1,
    "due_date": "2024-01-15",
    "budget_allocation": 100
  }'
```

### 测试5: 维度化评分
```bash
curl -X POST http://localhost:3000/api/v1/acceptance/tasks/TASK_ID/dimensional-score \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "student_id": "STUDENT_ID",
    "quality_score": 4.5,
    "completeness_score": 4.0,
    "timeliness_score": 4.5,
    "communication_score": 5.0,
    "professionalism_score": 4.0,
    "overall_comment": "本次合作非常愉快，学生专业能力强..."
  }'

# 预期：总分自动计算为 4.3
```

---

## 🔍 故障排查

### 问题1: 数据库连接失败
```bash
# 检查PostgreSQL是否运行
pg_isready -h localhost -p 5432

# 检查数据库是否存在
psql -l | grep qicheng_db

# 检查连接字符串
echo $DATABASE_URL
```

### 问题2: API返回401未授权
```bash
# 检查token是否有效
# 在前端console查看
console.log(Taro.getStorageSync('token'))

# 检查后端JWT配置
echo $JWT_ACCESS_SECRET
```

### 问题3: 预置数据缺失
```bash
# 重新插入官方模板
psql -d qicheng_db << 'SQL'
DELETE FROM task_templates WHERE is_official = true;
-- 然后重新执行 114_task_experience_optimization.sql
SQL
```

### 问题4: Claude API调用失败
```bash
# 检查API密钥
echo $ANTHROPIC_API_KEY

# 测试API连接
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "test"}]
  }'
```

### 问题5: 前端页面空白
```bash
# 检查路由配置
grep "template-market" company-miniapp/src/app.config.ts

# 检查编译错误
npm run dev:weapp 2>&1 | grep -i error

# 清除缓存重新编译
rm -rf dist/ && npm run dev:weapp
```

---

## 📊 性能优化

### 数据库优化
```sql
-- 创建额外索引（如果查询慢）
CREATE INDEX CONCURRENTLY idx_tasks_category_status 
ON tasks(category, status) WHERE status = 'completed';

CREATE INDEX CONCURRENTLY idx_messages_task_created 
ON messages(task_id, created_at DESC);

-- 分析表
ANALYZE task_templates;
ANALYZE trial_invitations;
ANALYZE task_milestones;
```

### API缓存
在后端添加Redis缓存（可选）：

```typescript
// services/taskExperienceService.ts
import Redis from 'ioredis'
const redis = new Redis(process.env.REDIS_URL)

async getTemplates(category?: string) {
  const cacheKey = `templates:${category || 'all'}`
  
  // 尝试从缓存获取
  const cached = await redis.get(cacheKey)
  if (cached) {
    return JSON.parse(cached)
  }
  
  // 从数据库查询
  const result = await pool.query(...)
  
  // 缓存5分钟
  await redis.setex(cacheKey, 300, JSON.stringify(result.rows))
  
  return result.rows
}
```

### 前端优化
```typescript
// 图片懒加载
<image src={avatar} mode='aspectFill' lazy-load />

// 列表虚拟滚动（大列表）
<VirtualList
  height={600}
  itemHeight={100}
  itemCount={students.length}
  renderItem={(index) => <StudentCard {...students[index]} />}
/>
```

---

## 🔐 安全配置

### 1. 环境变量加密
```bash
# 不要把敏感信息提交到git
echo ".env" >> .gitignore
echo "*.secret" >> .gitignore
```

### 2. API限流
```typescript
// app.ts
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 最多100次请求
  message: '请求过于频繁，请稍后再试'
})

app.use('/api/v1/task-experience', limiter, taskExperienceRoutes)
```

### 3. 输入验证
```typescript
// 使用joi验证
import Joi from 'joi'

const budgetSuggestionSchema = Joi.object({
  task_category: Joi.string().required(),
  quality_expectation: Joi.string().valid('basic', 'standard', 'premium')
})

router.post('/budget-suggestion', authenticate, async (req, res) => {
  const { error } = budgetSuggestionSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ success: false, message: error.message })
  }
  // ... 处理请求
})
```

---

## 📈 监控和日志

### 添加日志
```typescript
// utils/logger.ts
import winston from 'winston'

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})

// 在服务中使用
logger.info('Budget suggestion requested', {
  category: params.task_category,
  user: req.user?.userId
})
```

### 监控关键指标
```sql
-- 创建监控视图
CREATE VIEW system_metrics AS
SELECT
  (SELECT COUNT(*) FROM task_templates WHERE is_official = true) as official_templates,
  (SELECT COUNT(*) FROM trial_invitations WHERE created_at > NOW() - INTERVAL '24 hours') as trials_24h,
  (SELECT AVG(usage_count) FROM task_templates WHERE is_official = true) as avg_template_usage,
  (SELECT COUNT(*) FROM budget_suggestions WHERE created_at > NOW() - INTERVAL '1 day') as budget_suggestions_24h;
```

---

## ✅ 部署验证清单

部署完成后，逐项验证：

### 后端验证
- [ ] 健康检查接口返回200
- [ ] 数据库连接正常
- [ ] 所有20个表已创建
- [ ] 3个官方模板已插入
- [ ] 7个修改意见模板已插入
- [ ] 所有触发器已创建
- [ ] JWT认证工作正常
- [ ] Claude API调用成功

### 前端验证
- [ ] 13个页面路由配置完成
- [ ] 模板市场页面显示3个模板
- [ ] 预算建议组件正常工作
- [ ] 学生搜索筛选功能正常
- [ ] 学生对比页面正常显示
- [ ] 里程碑管理功能完整
- [ ] 验收清单功能正常
- [ ] 维度化评分计算正确
- [ ] 通知列表正常显示
- [ ] 所有API调用返回正确

### 功能验证
- [ ] 用户可以浏览和使用模板
- [ ] AI预算建议返回合理数据
- [ ] 学生搜索返回符合条件的结果
- [ ] 试稿邀请可以正常发送和响应
- [ ] 里程碑可以创建和确认
- [ ] 验收清单可以逐项验收
- [ ] 评分自动加权计算正确
- [ ] 通知可以发送和标记已读
- [ ] 归档功能正常工作

---

## 🎯 上线检查

### 生产环境配置
```bash
# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://prod_user:secure_password@db.example.com:5432/qicheng_prod
JWT_ACCESS_SECRET=extremely-secure-random-string-here
ANTHROPIC_API_KEY=sk-ant-production-key
REDIS_URL=redis://redis.example.com:6379
LOG_LEVEL=error
```

### 备份策略
```bash
# 每日数据库备份
0 2 * * * pg_dump qicheng_db | gzip > /backups/qicheng_$(date +\%Y\%m\%d).sql.gz

# 保留30天备份
find /backups -name "qicheng_*.sql.gz" -mtime +30 -delete
```

### 回滚计划
如果部署出现问题：

```bash
# 1. 停止服务
pm2 stop qicheng-backend

# 2. 回滚数据库（如果需要）
psql -d qicheng_db < /backups/qicheng_20240101.sql.gz

# 3. 恢复代码
git checkout v1.0.0
npm install
npm run build

# 4. 重启服务
pm2 start qicheng-backend
```

---

## 📞 支持

遇到问题？

1. 查看日志: `tail -f logs/combined.log`
2. 检查数据库: `psql -d qicheng_db`
3. 重启服务: `pm2 restart qicheng-backend`
4. 清除缓存: `redis-cli FLUSHDB`

**部署成功后，您将拥有一个完整的、企业级的体验优化系统！** 🚀
