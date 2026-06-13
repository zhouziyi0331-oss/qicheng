# 学生成长数据闭环系统 - 集成指南

## 📋 目录

1. [前置准备](#前置准备)
2. [数据库部署](#数据库部署)
3. [后端集成](#后端集成)
4. [前端集成](#前端集成)
5. [测试验证](#测试验证)
6. [常见问题](#常见问题)

---

## 前置准备

### 1. 环境要求

- Node.js >= 16.x
- PostgreSQL >= 14.x
- Claude API Key（Anthropic）

### 2. 依赖检查

确保已安装以下依赖：

```bash
# 后端
cd backend
npm install @anthropic-ai/sdk

# 前端
cd miniapp
npm install @tarojs/components @tarojs/taro
```

### 3. 配置Claude API Key

在 `backend/src/config/index.ts` 中确认配置：

```typescript
export default {
  ai: {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || 'your-api-key'
  }
}
```

---

## 数据库部署

### 步骤1：执行Migration

```bash
cd backend
npm run migrate
```

这将执行 `082_student_growth_data_loop.sql`，创建：

- **3个新表**：
  - `ability_dimension_history` - 能力历史记录
  - `growth_summary_cache` - 成长总结缓存
  - `graduation_report_payments` - 毕业报告付费记录

- **修改3个表**：
  - `mentor_growth_observations` - 添加即时总结字段
  - `user_ability_profiles` - 添加版本化字段
  - `growth_reports` - 添加付费相关字段

- **1个视图**：
  - `student_growth_overview` - 学生成长概览

### 步骤2：验证数据库

```sql
-- 检查新表是否创建成功
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('ability_dimension_history', 'growth_summary_cache', 'graduation_report_payments');

-- 检查视图是否创建成功
SELECT * FROM student_growth_overview LIMIT 1;
```

---

## 后端集成

### 步骤1：注册API路由

在 `backend/src/app.ts` 中添加：

```typescript
import growthRoutes from './routes/growth';

// 在其他路由注册之后添加
app.use('/api/v1/growth', growthRoutes);
```

### 步骤2：集成到订单完成流程

找到订单完成的代码位置（通常在 `backend/src/routes/orders.ts` 或订单服务中），添加触发器调用：

```typescript
import growthDataTrigger from '../services/growthDataTrigger';

// 在订单状态更新为 completed 之后
async function completeOrder(orderId: string) {
  // ... 现有的订单完成逻辑
  
  // 更新订单状态为 completed
  await updateOrderStatus(orderId, 'completed');
  
  // 🆕 触发成长数据更新（异步，不阻塞）
  growthDataTrigger.onOrderCompleted(orderId).catch(error => {
    console.error('成长数据更新失败:', error);
    // 不影响订单完成流程
  });
  
  // ... 其他后续逻辑
}
```

### 步骤3：集成到等级提升流程

找到学生等级提升的代码位置，添加毕业报告生成：

```typescript
import graduationReportService from '../services/graduationReportService';

// 在学生等级提升到Lv.6时
async function upgradeStudentLevel(userId: string, newLevel: number) {
  // ... 现有的等级提升逻辑
  
  // 更新用户等级
  await updateUserLevel(userId, newLevel);
  
  // 🆕 如果达到Lv.6，生成毕业报告
  if (newLevel >= 6) {
    graduationReportService.generateGraduationReport(userId).catch(error => {
      console.error('生成毕业报告失败:', error);
    });
  }
  
  // ... 其他后续逻辑
}
```

### 步骤4：（可选）批量处理历史订单

如果需要为现有的历史订单生成成长总结：

```typescript
import growthDataTrigger from '../services/growthDataTrigger';

// 处理所有历史订单
await growthDataTrigger.processHistoricalOrders();

// 或处理特定学生的历史订单
await growthDataTrigger.processHistoricalOrders(studentId);
```

**注意**：批量处理会调用大量AI API，建议：
- 在非高峰时段执行
- 分批处理，避免API限流
- 监控API使用量和成本

---

## 前端集成

### 步骤1：配置路由

在 `miniapp/src/app.config.ts` 中添加新页面：

```typescript
export default defineAppConfig({
  pages: [
    // ... 现有页面
    'pages/growth-summaries/index',      // 成长总结列表
    'pages/graduation-report/index',     // 毕业报告
    'pages/ability-trend/index'          // 能力变化趋势
  ],
  // ...
})
```

### 步骤2：添加导航入口

#### 方案A：在个人中心添加入口

在 `miniapp/src/pages/profile/index.tsx` 中添加菜单项：

```tsx
const menuItems = [
  // ... 现有菜单项
  {
    icon: '📈',
    title: '我的成长',
    desc: '查看成长总结',
    path: '/pages/growth-summaries/index'
  },
  {
    icon: '📊',
    title: '能力趋势',
    desc: '六维能力变化',
    path: '/pages/ability-trend/index'
  },
  {
    icon: '🎓',
    title: '毕业报告',
    desc: '万字成长报告',
    path: '/pages/graduation-report/index',
    badge: userLevel >= 6 ? '可解锁' : null
  }
];
```

#### 方案B：在订单完成页添加入口

在订单完成页面（`miniapp/src/pages/order-detail/index.tsx`）添加成长总结卡片：

```tsx
{order.status === 'completed' && (
  <View className="growth-summary-card" onClick={() => {
    Taro.navigateTo({
      url: `/pages/growth-summaries/index?orderId=${order.id}`
    });
  }}>
    <Text className="card-title">📈 查看本次成长总结</Text>
    <Text className="card-desc">AI为你生成了专属的成长分析</Text>
  </View>
)}
```

### 步骤3：添加通知提示

当学生达到Lv.6时，显示毕业报告通知：

```tsx
// 在等级提升后
if (newLevel >= 6) {
  Taro.showModal({
    title: '🎉 恭喜达到Lv.6！',
    content: '你的毕业报告已生成，现在可以解锁查看完整的万字成长报告。',
    confirmText: '查看报告',
    success: (res) => {
      if (res.confirm) {
        Taro.navigateTo({
          url: '/pages/graduation-report/index'
        });
      }
    }
  });
}
```

---

## 测试验证

### 1. 数据库测试

```sql
-- 测试1：检查表是否创建成功
SELECT COUNT(*) FROM ability_dimension_history;
SELECT COUNT(*) FROM growth_summary_cache;
SELECT COUNT(*) FROM graduation_report_payments;

-- 测试2：检查字段是否添加成功
SELECT instant_summary, skills_demonstrated 
FROM mentor_growth_observations 
LIMIT 1;

SELECT version, is_current, dimension_descriptions 
FROM user_ability_profiles 
LIMIT 1;

-- 测试3：检查视图是否正常
SELECT * FROM student_growth_overview LIMIT 5;
```

### 2. 后端API测试

使用Postman或curl测试API：

```bash
# 测试1：获取成长总结列表
curl -X GET http://localhost:3000/api/v1/growth/summaries \
  -H "Authorization: Bearer YOUR_TOKEN"

# 测试2：获取能力版本历史
curl -X GET http://localhost:3000/api/v1/growth/profile-versions \
  -H "Authorization: Bearer YOUR_TOKEN"

# 测试3：获取毕业报告预览
curl -X GET http://localhost:3000/api/v1/growth/graduation-report/preview \
  -H "Authorization: Bearer YOUR_TOKEN"

# 测试4：获取成长概览
curl -X GET http://localhost:3000/api/v1/growth/overview \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. 端到端测试

#### 测试场景1：订单完成后的成长总结

1. 创建一个测试订单
2. 完成订单（状态改为 completed）
3. 等待2-3秒（AI生成时间）
4. 检查 `growth_summary_cache` 表是否有新记录
5. 在前端查看成长总结页面

**预期结果**：
- ✅ 数据库中有新的成长总结记录
- ✅ 前端能正常展示成长总结
- ✅ 包含6个字段：headline、before_after_comparison等

#### 测试场景2：六维能力更新

1. 完成一个订单
2. 等待能力更新完成
3. 检查 `user_ability_profiles` 表的版本号是否增加
4. 检查 `ability_dimension_history` 表是否有新记录
5. 在前端查看能力趋势页面

**预期结果**：
- ✅ 版本号从v1变为v2
- ✅ 六维分数有变化
- ✅ 有AI生成的文字解读
- ✅ 前端能展示对比图表

#### 测试场景3：毕业报告生成

1. 将测试学生的等级提升到Lv.6
2. 等待报告生成（约30-60秒）
3. 检查 `growth_reports` 表是否有新记录
4. 在前端查看毕业报告预览
5. 测试付费解锁流程

**预期结果**：
- ✅ 报告已生成，包含6章内容
- ✅ 预览显示第一章前300字
- ✅ 目录显示完整
- ✅ 付费后能查看完整报告

### 4. 性能测试

```bash
# 测试AI生成速度
time curl -X GET http://localhost:3000/api/v1/growth/summaries/ORDER_ID

# 测试并发请求
ab -n 100 -c 10 http://localhost:3000/api/v1/growth/overview
```

**性能指标**：
- 即时成长总结生成：< 5秒
- 六维能力更新：< 3秒
- 毕业报告生成：< 60秒
- API响应时间：< 500ms

---

## 常见问题

### Q1: AI生成失败怎么办？

**原因**：
- Claude API Key无效或过期
- API限流
- 网络问题

**解决方案**：
```typescript
// 在服务中添加重试逻辑
async function generateWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(2000 * (i + 1)); // 指数退避
    }
  }
}
```

### Q2: 历史订单如何补充成长总结？

**方案1**：批量处理（推荐用于少量数据）
```typescript
await growthDataTrigger.processHistoricalOrders(studentId);
```

**方案2**：按需生成（推荐用于大量数据）
```typescript
// 学生首次访问成长总结页面时，检查是否有未生成的订单
if (summaries.length === 0 && completedOrders > 0) {
  // 只生成最近的5个订单
  await generateRecentSummaries(studentId, 5);
}
```

### Q3: 六维分数更新不合理怎么办？

**调整方案**：

修改 `abilityDimensionUpdateService.ts` 中的计算规则：

```typescript
// 调整加权比例
const newScore = Math.round(oldScore * 0.8 + perfScore * 0.2); // 降低新任务的影响

// 调整表现分计算
if (performance.onTimeDelivery) executionScore += 20; // 提高按时交付的权重
```

### Q4: 毕业报告生成太慢怎么办？

**优化方案**：

1. **异步生成**：不要在等级提升时同步生成
```typescript
// 后台任务队列
jobQueue.add('generate-graduation-report', { userId });
```

2. **分章生成**：先生成第一章，其他章节按需生成
```typescript
// 只生成第一章用于预览
const chapter1 = await generateChapter(1, studentData);
// 其他章节在付费后再生成
```

3. **缓存优化**：缓存常用的数据查询
```typescript
const cachedData = await redis.get(`student:${userId}:data`);
if (!cachedData) {
  const data = await collectStudentData(userId);
  await redis.set(`student:${userId}:data`, JSON.stringify(data), 'EX', 3600);
}
```

### Q5: 如何监控系统运行状态？

**监控指标**：

```typescript
// 添加日志和监控
import logger from './utils/logger';
import metrics from './utils/metrics';

// 记录生成时间
const startTime = Date.now();
await generateInstantSummary(orderId);
const duration = Date.now() - startTime;
metrics.record('growth_summary_generation_time', duration);

// 记录成功率
metrics.increment('growth_summary_success');
// 或
metrics.increment('growth_summary_failure');
```

**推荐工具**：
- 日志：Winston / Pino
- 监控：Prometheus + Grafana
- 告警：PagerDuty / 钉钉机器人

### Q6: 如何控制AI成本？

**成本优化策略**：

1. **缓存结果**：避免重复生成
```typescript
const cached = await checkCache(orderId);
if (cached) return cached;
```

2. **批量处理**：减少API调用次数
```typescript
// 一次调用生成多个总结
const summaries = await generateBatchSummaries(orderIds);
```

3. **降级策略**：高峰期使用模板
```typescript
if (isHighTraffic()) {
  return generateTemplateBasedSummary(order);
} else {
  return generateAISummary(order);
}
```

4. **使用更便宜的模型**：
```typescript
// 对于简单任务使用Haiku
model: 'claude-3-haiku-20240307'

// 对于复杂任务使用Sonnet
model: 'claude-3-5-sonnet-20241022'
```

---

## 附录

### A. API接口完整列表

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 获取成长总结列表 | GET | /api/v1/growth/summaries | 分页获取 |
| 获取单个成长总结 | GET | /api/v1/growth/summaries/:orderId | 按订单ID |
| 标记已查看 | POST | /api/v1/growth/summaries/:summaryId/view | - |
| 提交反馈 | POST | /api/v1/growth/summaries/:summaryId/feedback | helpful/neutral/not_helpful |
| 获取能力历史 | GET | /api/v1/growth/ability-history | 完整历史 |
| 获取画像版本 | GET | /api/v1/growth/profile-versions | 所有版本 |
| 手动更新能力 | POST | /api/v1/growth/ability-update/:orderId | 管理员用 |
| 生成毕业报告 | POST | /api/v1/growth/graduation-report/generate | Lv.6触发 |
| 获取报告预览 | GET | /api/v1/growth/graduation-report/preview | 前300字+目录 |
| 获取完整报告 | GET | /api/v1/growth/graduation-report/:reportId | 需付费 |
| 处理付费 | POST | /api/v1/growth/graduation-report/:reportId/pay | 解锁报告 |
| 检查更新 | GET | /api/v1/growth/graduation-report/check-update | 是否需要更新 |
| 更新报告 | POST | /api/v1/growth/graduation-report/:reportId/update | 重新生成 |
| 获取成长概览 | GET | /api/v1/growth/overview | 所有模块摘要 |

### B. 数据库表结构速查

```sql
-- ability_dimension_history
id, user_id, profile_version, 六维分数, change_trigger, related_order_id, change_details, created_at

-- growth_summary_cache
id, user_id, order_id, summary_json, generated_at, ai_model, user_viewed, user_feedback

-- graduation_report_payments
id, user_id, report_id, amount, payment_method, transaction_id, points_used, status, paid_at

-- mentor_growth_observations (新增字段)
instant_summary, skills_demonstrated

-- user_ability_profiles (新增字段)
version, is_current, updated_reason, dimension_descriptions

-- growth_reports (新增字段)
is_paid, paid_at, payment_amount, preview_content, full_content_json, pdf_url, update_count
```

---

**集成完成后，系统将自动为每个完成的订单生成成长总结，动态更新学生的六维能力，并在学生达到Lv.6时生成专属的万字毕业报告！** 🎉
