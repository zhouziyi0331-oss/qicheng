# 学生成长数据闭环系统 - 架构设计文档

## 📐 系统架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                        学生成长数据闭环系统                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   模块一        │      │   模块二        │      │   模块三        │
│ 即时成长总结    │      │ 六维能力更新    │      │ Lv.6毕业报告    │
│                 │      │                 │      │                 │
│ • 300-500字     │      │ • 加权平均算法  │      │ • 六章万字报告  │
│ • AI生成        │      │ • AI文字解读    │      │ • 付费解锁      │
│ • 订单完成触发  │      │ • 版本化存储    │      │ • Lv.6触发      │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   growthDataTrigger       │
                    │   (统一触发器)             │
                    └─────────────┬─────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         │                        │                        │
┌────────▼────────┐    ┌─────────▼────────┐    ┌─────────▼────────┐
│ instantGrowth   │    │ abilityDimension │    │ graduationReport │
│ SummaryService  │    │ UpdateService    │    │ Service          │
└────────┬────────┘    └─────────┬────────┘    └─────────┬────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │      Claude API           │
                    │   (Anthropic SDK)         │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │      PostgreSQL           │
                    │   (数据持久化)             │
                    └───────────────────────────┘
```

---

## 🔄 数据流程详解

### 1. 订单完成触发流程

```
用户完成订单
    │
    ▼
订单状态更新为 'completed'
    │
    ▼
触发 growthDataTrigger.onOrderCompleted(orderId)
    │
    ├─────────────────────────────────────────┐
    │                                         │
    ▼                                         ▼
【模块一】生成即时成长总结                【模块二】更新六维能力
    │                                         │
    ├─► 1. 收集数据                          ├─► 1. 获取任务表现数据
    │   • 订单信息                           │   • AI审核分数
    │   • 初始画像                           │   • 客户评分
    │   • 当前画像                           │   • 导师观察
    │   • 导师对话                           │   • 打回次数
    │   • 成长观察                           │   • 独立完成度
    │   • 历史统计                           │
    │                                         ├─► 2. 计算六维表现分
    ├─► 2. 构建AI提示词                      │   • 信息处理 = 任务拆解分
    │   • System Prompt                      │   • 创作驱动 = 匹配度×评分
    │   • User Prompt                        │   • 工具学习 = 新工具数×5
    │                                         │   • 任务执行 = 按时+打回
    ├─► 3. 调用Claude API                    │   • 协作倾向 = 独立完成度
    │   • Model: Sonnet                      │   • 风险态度 = 难度差距
    │   • Max Tokens: 2000                   │
    │   • Temperature: 0.7                   ├─► 3. 加权滑动平均
    │                                         │   新分数 = 旧分数×0.7 + 表现分×0.3
    ├─► 4. 解析AI响应                        │
    │   • 提取JSON                           ├─► 4. 保存新版本画像
    │   • 验证字段                           │   • version++
    │                                         │   • is_current = true
    ├─► 5. 存储结果                          │   • 旧版本 is_current = false
    │   • growth_summary_cache              │
    │   • mentor_growth_observations        ├─► 5. 记录历史变化
    │                                         │   • ability_dimension_history
    └─► 6. 返回总结                          │
                                             ├─► 6. 调用AI生成解读
                                             │   • 对比旧分数和新分数
                                             │   • 生成文字描述
                                             │
                                             └─► 7. 更新维度描述
                                                 • dimension_descriptions
```

### 2. 等级提升触发流程

```
学生完成任务
    │
    ▼
经验值累积
    │
    ▼
达到升级条件
    │
    ▼
等级提升 (current_level++)
    │
    ▼
检查是否达到 Lv.6
    │
    ├─► 否：结束
    │
    └─► 是：触发毕业报告生成
            │
            ▼
        【模块三】生成毕业报告
            │
            ├─► 1. 收集学生所有数据
            │   • 基本信息
            │   • 所有订单记录
            │   • 能力画像版本历史
            │   • 导师对话记录
            │   • 成长观察记录
            │   • 组队记录
            │   • 等级变化历史
            │
            ├─► 2. 生成六章报告
            │   │
            │   ├─► 第一章：成长轨迹 (1500字)
            │   │   • 时间线叙事
            │   │   • 六维变化趋势
            │   │   • 关键转折点
            │   │
            │   ├─► 第二章：核心优势体系 (2000字)
            │   │   • 六维深度解读
            │   │   • 人格标签分析
            │   │   • 核心优势提炼
            │   │
            │   ├─► 第三章：OPC定位与市场机会 (2500字)
            │   │   • 3个定位方向
            │   │   • 市场需求分析
            │   │   • 独特卖点
            │   │
            │   ├─► 第四章：客户获取地图 (2000字)
            │   │   • 目标客户画像
            │   │   • 获取渠道
            │   │   • 接触策略
            │   │
            │   ├─► 第五章：独立接单工具箱 (1500字)
            │   │   • 工具栈推荐
            │   │   • 交付模板
            │   │   • 工作流程SOP
            │   │
            │   └─► 第六章：从OPC到联合体 (1000字)
            │       • 生态位分析
            │       • 合作推荐
            │       • 共创项目
            │
            ├─► 3. 生成预览内容
            │   • 第一章前300字
            │   • 完整目录
            │
            ├─► 4. 保存报告
            │   • growth_reports
            │   • is_paid = false
            │
            └─► 5. 发送通知
                • 小程序通知
                • 站内消息
```

### 3. 付费解锁流程

```
学生查看毕业报告预览
    │
    ▼
点击"解锁完整报告"
    │
    ▼
显示付费信息
    • 价格：¥299
    • 权益说明
    │
    ▼
确认支付
    │
    ├─► 1. 调用支付接口
    │   • 微信支付 / 支付宝
    │   • 积分抵扣（可选）
    │
    ├─► 2. 支付成功回调
    │   │
    │   ├─► 创建付费记录
    │   │   • graduation_report_payments
    │   │   • status = 'completed'
    │   │
    │   └─► 更新报告状态
    │       • is_paid = true
    │       • paid_at = NOW()
    │
    └─► 3. 解锁完整报告
        • 前端展示六章内容
        • 提供PDF下载
```

---

## 🗄️ 数据库设计详解

### 核心表关系图

```
┌─────────────────┐
│     users       │
│  (学生信息)      │
└────────┬────────┘
         │ 1
         │
         │ N
┌────────▼────────────────────────────────────────────┐
│                                                      │
│  ┌──────────────────┐    ┌──────────────────┐     │
│  │ user_ability_    │    │ ability_         │     │
│  │ profiles         │───▶│ dimension_       │     │
│  │ (能力画像)        │ N  │ history          │     │
│  │                  │    │ (历史记录)        │     │
│  └──────────────────┘    └──────────────────┘     │
│                                                      │
│  ┌──────────────────┐    ┌──────────────────┐     │
│  │ orders           │    │ growth_summary_  │     │
│  │ (订单)           │───▶│ cache            │     │
│  │                  │ 1  │ (成长总结)        │     │
│  └──────────────────┘    └──────────────────┘     │
│                                                      │
│  ┌──────────────────┐    ┌──────────────────┐     │
│  │ growth_reports   │    │ graduation_      │     │
│  │ (毕业报告)        │───▶│ report_payments  │     │
│  │                  │ 1  │ (付费记录)        │     │
│  └──────────────────┘    └──────────────────┘     │
│                                                      │
│  ┌──────────────────┐                              │
│  │ mentor_growth_   │                              │
│  │ observations     │                              │
│  │ (成长观察)        │                              │
│  └──────────────────┘                              │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 数据版本化设计

```
user_ability_profiles 表的版本化存储：

┌─────────┬─────────┬────────────┬──────────────────┐
│ user_id │ version │ is_current │ updated_reason   │
├─────────┼─────────┼────────────┼──────────────────┤
│ user123 │    1    │   false    │ 初始版本         │
│ user123 │    2    │   false    │ 完成订单#001     │
│ user123 │    3    │   false    │ 完成订单#002     │
│ user123 │    4    │   true     │ 完成订单#003     │ ← 当前版本
└─────────┴─────────┴────────────┴──────────────────┘

优势：
1. 可追溯历史变化
2. 支持回滚
3. 可生成趋势图
4. 数据不丢失
```

---

## 🎯 核心算法详解

### 1. 六维能力加权滑动平均算法

```typescript
/**
 * 加权滑动平均算法
 * 
 * 目的：平衡历史表现和当前表现
 * 
 * 公式：新分数 = (旧分数 × 0.7) + (本次表现分 × 0.3)
 * 
 * 参数说明：
 * - 0.7：历史权重，保持稳定性
 * - 0.3：当前权重，体现最新表现
 * 
 * 示例：
 * 旧分数 = 60
 * 本次表现分 = 80
 * 新分数 = 60 × 0.7 + 80 × 0.3 = 42 + 24 = 66
 */

function calculateNewScore(oldScore: number, performanceScore: number): number {
  const HISTORY_WEIGHT = 0.7;
  const CURRENT_WEIGHT = 0.3;
  
  const newScore = Math.round(
    oldScore * HISTORY_WEIGHT + performanceScore * CURRENT_WEIGHT
  );
  
  // 限制在0-100范围内
  return Math.max(0, Math.min(newScore, 100));
}
```

**为什么选择7:3的权重？**

1. **稳定性**：70%的历史权重避免单次任务造成剧烈波动
2. **响应性**：30%的当前权重确保能及时反映学生进步
3. **心理学**：符合人的成长规律，既不会"一夜暴富"，也不会"停滞不前"

**权重调整建议**：

| 场景 | 历史权重 | 当前权重 | 说明 |
|------|----------|----------|------|
| 新手期（<5单） | 0.5 | 0.5 | 快速建立画像 |
| 成长期（5-20单） | 0.7 | 0.3 | 平衡稳定和成长 |
| 成熟期（>20单） | 0.8 | 0.2 | 强调稳定性 |

### 2. 任务表现分计算规则

```typescript
/**
 * 六维表现分计算
 * 
 * 每个维度根据不同的数据源计算0-100的分数
 */

interface TaskPerformance {
  // 信息处理：基于AI审核的任务拆解完整度
  information_processing: number;  // 0-10 → 0-100
  
  // 创作驱动：基于任务类型匹配度和客户评分
  creative_drive: number;          // (匹配度 × 客户评分) × 10
  
  // 工具学习：基于新工具使用数量
  tool_learning: number;           // 50 + 新工具数×5，上限100
  
  // 任务执行：基于按时交付和打回次数
  task_execution: number;          // 50 + 按时(15) + 无打回(15) - 打回次数×5
  
  // 协作倾向：基于独立完成度
  collaboration_tendency: number;  // 独立65，需协助45
  
  // 风险态度：基于任务难度与学生等级的差距
  risk_attitude: number;           // 差距>2: 65, 差距>0: 55, 同级: 51
}
```

**计算示例**：

```
学生完成一个订单：
- AI审核：任务拆解分 = 8/10
- 客户评分：4.5/5
- 新工具：使用了2个新工具（Figma, Notion）
- 按时交付：是
- 打回次数：1次
- 独立完成：是
- 任务难度：7，学生等级：5

计算结果：
- 信息处理 = 8 × 10 = 80
- 创作驱动 = 4.5 × 2 × 10 = 90
- 工具学习 = 50 + 2 × 5 = 60
- 任务执行 = 50 + 15 + 15 - 1×5 = 75
- 协作倾向 = 65（独立完成）
- 风险态度 = 55（难度差距=2）

假设旧分数都是60，新分数：
- 信息处理 = 60×0.7 + 80×0.3 = 66
- 创作驱动 = 60×0.7 + 90×0.3 = 69
- 工具学习 = 60×0.7 + 60×0.3 = 60
- 任务执行 = 60×0.7 + 75×0.3 = 64.5 ≈ 65
- 协作倾向 = 60×0.7 + 65×0.3 = 61.5 ≈ 62
- 风险态度 = 60×0.7 + 55×0.3 = 58.5 ≈ 59
```

---

## 🔐 安全性设计

### 1. 数据隔离

```typescript
// 所有API都需要身份验证
router.get('/summaries', authenticateToken, async (req, res) => {
  const userId = req.user.id; // 从token中获取
  
  // 只能查看自己的数据
  const summaries = await getSummaries(userId);
});
```

### 2. 付费验证

```typescript
// 查看完整报告前验证付费状态
async function getFullReport(reportId: string) {
  const report = await db.query(
    'SELECT * FROM growth_reports WHERE id = $1',
    [reportId]
  );
  
  if (!report.is_paid) {
    throw new Error('报告尚未付费解锁');
  }
  
  return report.full_content_json;
}
```

### 3. 防止重复付费

```typescript
// 使用数据库唯一约束
CREATE UNIQUE INDEX idx_graduation_payments_report 
ON graduation_report_payments(report_id);

// 付费前检查
const existing = await db.query(
  'SELECT * FROM graduation_report_payments WHERE report_id = $1',
  [reportId]
);

if (existing.rows.length > 0) {
  throw new Error('该报告已付费');
}
```

---

## 📊 性能优化策略

### 1. 异步处理

```typescript
// 订单完成后异步触发，不阻塞主流程
growthDataTrigger.onOrderCompleted(orderId).catch(error => {
  console.error('成长数据更新失败:', error);
  // 记录到错误日志，但不影响订单完成
});
```

### 2. 缓存机制

```typescript
// 成长总结缓存
const cached = await redis.get(`summary:${orderId}`);
if (cached) return JSON.parse(cached);

const summary = await generateSummary(orderId);
await redis.set(`summary:${orderId}`, JSON.stringify(summary), 'EX', 86400);
```

### 3. 批量处理

```typescript
// 批量生成历史订单的总结
async function processHistoricalOrders(studentId?: string) {
  const orders = await getUnprocessedOrders(studentId);
  
  for (const order of orders) {
    await generateSummary(order.id);
    await sleep(2000); // 避免API限流
  }
}
```

### 4. 数据库索引

```sql
-- 关键查询的索引
CREATE INDEX idx_growth_summary_user ON growth_summary_cache(user_id, generated_at DESC);
CREATE INDEX idx_ability_history_user ON ability_dimension_history(user_id, created_at DESC);
CREATE INDEX idx_profile_current ON user_ability_profiles(user_id, is_current) WHERE is_current = true;
```

---

## 🎨 前端架构

### 页面结构

```
miniapp/src/pages/
├── growth-summaries/          # 成长总结列表
│   ├── index.tsx
│   └── index.scss
├── graduation-report/         # 毕业报告
│   ├── index.tsx
│   └── index.scss
└── ability-trend/             # 能力变化趋势
    ├── index.tsx
    └── index.scss
```

### 状态管理

```typescript
// 使用React Hooks管理状态
const [loading, setLoading] = useState(true);
const [summaries, setSummaries] = useState<GrowthSummary[]>([]);

// API调用
const loadSummaries = async () => {
  try {
    setLoading(true);
    const res = await Taro.request({
      url: 'http://localhost:3000/api/v1/growth/summaries',
      header: { 'Authorization': `Bearer ${token}` }
    });
    setSummaries(res.data.data);
  } finally {
    setLoading(false);
  }
};
```

---

## 📈 监控和日志

### 关键指标

```typescript
// 1. 生成成功率
metrics.increment('growth_summary_success');
metrics.increment('growth_summary_failure');

// 2. 生成耗时
const startTime = Date.now();
await generateSummary(orderId);
metrics.record('growth_summary_duration', Date.now() - startTime);

// 3. API调用次数
metrics.increment('claude_api_calls');

// 4. 用户反馈
metrics.increment(`growth_summary_feedback_${feedback}`);
```

### 日志记录

```typescript
logger.info('开始生成成长总结', { orderId, userId });
logger.error('生成失败', { orderId, error: error.message });
logger.warn('API限流', { retryAfter: 60 });
```

---

## 🚀 扩展性设计

### 1. 支持多种AI模型

```typescript
interface AIProvider {
  generateSummary(data: any): Promise<string>;
}

class ClaudeProvider implements AIProvider {
  async generateSummary(data: any) {
    // Claude实现
  }
}

class GPTProvider implements AIProvider {
  async generateSummary(data: any) {
    // GPT实现
  }
}

// 根据配置选择
const provider = config.aiProvider === 'claude' 
  ? new ClaudeProvider() 
  : new GPTProvider();
```

### 2. 支持自定义报告模板

```typescript
interface ReportTemplate {
  chapters: ChapterTemplate[];
}

const templates = {
  standard: standardTemplate,
  detailed: detailedTemplate,
  concise: conciseTemplate
};

const report = await generateReport(userId, templates[userPreference]);
```

### 3. 支持多语言

```typescript
const i18n = {
  'zh-CN': {
    'growth.summary.title': '成长总结',
    'growth.summary.empty': '还没有成长总结'
  },
  'en-US': {
    'growth.summary.title': 'Growth Summary',
    'growth.summary.empty': 'No growth summaries yet'
  }
};
```

---

**系统架构设计完成！整个系统采用模块化、可扩展的设计，确保高性能、高可用和易维护。** 🎉
