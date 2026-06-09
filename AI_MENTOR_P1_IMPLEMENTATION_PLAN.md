# AI导师P1功能实现计划

**版本：** P1 v1.0  
**开始日期：** 2026-05-27  
**预计完成：** 3-5天  
**前置条件：** P0功能已部署并稳定运行

---

## 一、P1功能概述

### 功能1：范例展示（T-02增强）

**场景：** 学生连续2次说"还是不会"时，展示相似项目案例

**核心价值：**
- 从"只给线索"到"先看范例"
- 降低理解门槛
- 提供具体参考

**技术实现：**
- 调用pgvector检索相似项目复盘
- 从知识中台获取Top 1相似案例
- 展示：项目类型+等级+评分+做法摘要
- 触发条件：连续2次求助且包含"不会"关键词

**预计工作量：** 1天

---

### 功能2：提交前自查（T-07）

**场景：** 学生在提交页停留>5分钟或点击"帮我看看"

**核心价值：**
- 减少被打回概率
- 提升交付质量
- 培养自查习惯

**技术实现：**
- 后端API已实现（`generatePreSubmitChecklist`）
- 需要前端集成：
  - 提交页添加"提交前帮我看看"按钮
  - 停留时间检测（5分钟）
  - 自查清单展示组件
- 同步调用（3秒超时）

**预计工作量：** 1天（后端已完成，主要是前端）

---

### 功能3：项目复盘引导（T-05增强）

**场景：** 订单完成后60秒，自动发送复盘引导

**核心价值：**
- 沉淀经验到成长记录
- 形成可复用的知识
- 提升学生反思能力

**技术实现：**
- 订单完成后延迟60秒触发
- AI生成3个复盘问题：
  1. 最大难点是什么？怎么解决的？
  2. 下次会哪里做得不一样？
  3. 用了哪些工具？哪个最顺手？
- 学生回复后存入`mentor_growth_observations`
- 精华复盘进入知识中台

**预计工作量：** 1.5天

---

## 二、技术架构

### 2.1 新增服务

```
mentorExampleService.ts      - 范例检索和展示
mentorRetrospectiveService.ts - 项目复盘引导
```

### 2.2 修改服务

```
mentorCoreService.ts          - 增强T-02场景，集成范例展示
mentorRoutes.ts               - 新增复盘相关API
```

### 2.3 新增表

```
mentor_retrospectives         - 项目复盘记录表
```

### 2.4 前端组件（学生端小程序）

```
pages/tasks/submit/index.tsx  - 提交页（添加自查按钮）
components/PreSubmitChecklist.tsx - 自查清单组件
```

---

## 三、详细实现方案

### 3.1 范例展示（T-02增强）

#### 数据库设计

无需新表，使用现有的：
- `mentor_growth_observations` - 读取项目复盘
- `orders` - 获取项目信息
- `projects` - 获取项目描述

#### 服务实现

**文件：** `backend/src/services/mentorExampleService.ts`

**核心方法：**
```typescript
class MentorExampleService {
  // 检索相似项目案例
  async findSimilarCase(
    currentProjectId: string,
    studentLevel: number
  ): Promise<SimilarCase | null>

  // 格式化案例展示
  formatCaseForDisplay(case: SimilarCase): string
}
```

**检索逻辑：**
1. 使用pgvector检索相似项目（基于项目描述向量）
2. 过滤条件：
   - 已完成的订单
   - 等级差距≤1
   - 评分≥4.0
   - 有复盘记录
3. 返回Top 1相似案例

#### 集成到mentorCoreService

**修改：** `mentorCoreService.ts` 的 `chat()` 方法

**逻辑：**
```typescript
// 检测连续求助
if (isStuckMessage && consecutiveStuckCount >= 2) {
  // 检索相似案例
  const similarCase = await mentorExampleService.findSimilarCase(
    taskId,
    student.level
  );
  
  if (similarCase) {
    // 在Prompt中注入案例
    prompt += `\n\n## 参考案例\n${similarCase.formatted}`;
  }
}
```

---

### 3.2 提交前自查（T-07）

#### 后端状态

✅ **已完成：** `mentorCoreService.generatePreSubmitChecklist()`

#### 前端实现

**文件1：** `miniapp/src/pages/tasks/submit/index.tsx`

**新增功能：**
```typescript
// 1. 添加"提交前帮我看看"按钮
<Button onClick={handlePreSubmitCheck}>
  提交前帮我看看
</Button>

// 2. 停留时间检测
useEffect(() => {
  const timer = setTimeout(() => {
    // 5分钟后自动触发
    handlePreSubmitCheck();
  }, 5 * 60 * 1000);
  
  return () => clearTimeout(timer);
}, []);

// 3. 调用API
const handlePreSubmitCheck = async () => {
  const res = await api.post('/mentor/pre-submit-check', {
    orderId,
    submissionPreview: formData.description
  });
  
  setChecklist(res.data.checklist);
  setShowChecklist(true);
};
```

**文件2：** `miniapp/src/components/PreSubmitChecklist.tsx`

**组件功能：**
```typescript
interface Props {
  checklist: string;
  onClose: () => void;
}

const PreSubmitChecklist: React.FC<Props> = ({ checklist, onClose }) => {
  return (
    <View className="checklist-modal">
      <View className="checklist-header">
        <Text>提交前自查清单</Text>
      </View>
      <View className="checklist-content">
        {/* 渲染Markdown格式的清单 */}
        <Markdown content={checklist} />
      </View>
      <View className="checklist-actions">
        <Button onClick={onClose}>我知道了</Button>
      </View>
    </View>
  );
};
```

---

### 3.3 项目复盘引导（T-05增强）

#### 数据库设计

**新表：** `mentor_retrospectives`

```sql
CREATE TABLE mentor_retrospectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  
  -- 复盘问题和回答
  questions JSONB NOT NULL,
  answers JSONB,
  
  -- 状态
  status VARCHAR(20) DEFAULT 'pending',
  -- 'pending': 已发送问题，等待回答
  -- 'completed': 已完成回答
  -- 'skipped': 学生跳过
  
  -- 精华标记
  is_featured BOOLEAN DEFAULT false,
  featured_reason TEXT,
  
  -- 时间
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(order_id)
);

CREATE INDEX idx_retrospectives_student ON mentor_retrospectives(student_id, created_at DESC);
CREATE INDEX idx_retrospectives_status ON mentor_retrospectives(status);
CREATE INDEX idx_retrospectives_featured ON mentor_retrospectives(is_featured) WHERE is_featured = true;
```

#### 服务实现

**文件：** `backend/src/services/mentorRetrospectiveService.ts`

**核心方法：**
```typescript
class MentorRetrospectiveService {
  // 订单完成后触发复盘
  async triggerRetrospective(
    studentId: string,
    orderId: string
  ): Promise<void>
  
  // 生成复盘问题
  async generateQuestions(
    studentId: string,
    orderId: string
  ): Promise<string[]>
  
  // 保存学生回答
  async saveAnswers(
    retrospectiveId: string,
    answers: string[]
  ): Promise<void>
  
  // 提取精华复盘
  async extractFeaturedInsights(
    retrospectiveId: string
  ): Promise<void>
}
```

#### 触发机制

**方式1：订单状态变更钩子**

在订单完成的代码中添加：

```typescript
// 订单完成后
await updateOrderStatus(orderId, 'completed');

// 延迟60秒触发复盘
setTimeout(async () => {
  await mentorRetrospectiveService.triggerRetrospective(
    studentId,
    orderId
  );
}, 60 * 1000);
```

**方式2：定时任务扫描**

```typescript
// 每5分钟扫描一次
cron.schedule('*/5 * * * *', async () => {
  // 查找60秒前完成的订单，且未发送复盘
  const orders = await db.query(`
    SELECT o.id, o.student_id
    FROM orders o
    LEFT JOIN mentor_retrospectives mr ON o.id = mr.order_id
    WHERE o.status = 'completed'
      AND o.completed_at < NOW() - INTERVAL '60 seconds'
      AND o.completed_at > NOW() - INTERVAL '10 minutes'
      AND mr.id IS NULL
  `);
  
  for (const order of orders.rows) {
    await mentorRetrospectiveService.triggerRetrospective(
      order.student_id,
      order.id
    );
  }
});
```

#### API接口

**新增路由：**

```typescript
// 获取待完成的复盘
GET /api/v1/mentor/retrospectives/pending

// 提交复盘回答
POST /api/v1/mentor/retrospectives/:id/submit

// 跳过复盘
POST /api/v1/mentor/retrospectives/:id/skip

// 获取历史复盘
GET /api/v1/mentor/retrospectives/history
```

---

## 四、实现优先级

### 第1天：范例展示

- [ ] 创建 `mentorExampleService.ts`
- [ ] 实现相似案例检索
- [ ] 集成到 `mentorCoreService.ts`
- [ ] 测试验证

### 第2天：提交前自查（前端）

- [ ] 创建 `PreSubmitChecklist.tsx` 组件
- [ ] 修改提交页添加按钮
- [ ] 实现停留时间检测
- [ ] 测试验证

### 第3天：项目复盘（后端）

- [ ] 创建数据库表
- [ ] 创建 `mentorRetrospectiveService.ts`
- [ ] 实现触发机制
- [ ] 创建API路由

### 第4天：项目复盘（前端）

- [ ] 创建复盘问答组件
- [ ] 集成到订单完成页
- [ ] 实现提交和跳过
- [ ] 测试验证

### 第5天：集成测试和文档

- [ ] 端到端测试
- [ ] 性能测试
- [ ] 编写部署文档
- [ ] 编写测试清单

---

## 五、验收标准

### 范例展示

- [ ] 学生连续2次求助时触发
- [ ] 正确检索相似案例
- [ ] 案例展示格式清晰
- [ ] 不影响正常对话流程

### 提交前自查

- [ ] 按钮点击正常
- [ ] 5分钟自动触发
- [ ] 清单内容准确
- [ ] 响应时间<3秒

### 项目复盘

- [ ] 订单完成60秒后触发
- [ ] 问题生成准确
- [ ] 回答保存成功
- [ ] 精华复盘提取正确

---

## 六、风险和缓解

| 风险 | 影响 | 缓解措施 |
|---|---|---|
| pgvector检索慢 | 范例展示延迟 | 添加索引+缓存 |
| 前端停留时间不准 | 自查触发失败 | 使用可靠的计时器 |
| 学生不回答复盘 | 数据收集不足 | 设计吸引人的问题 |
| 复盘问题太多 | 学生疲劳 | 只问3个核心问题 |

---

## 七、下一步行动

1. **立即开始**：创建 `mentorExampleService.ts`
2. **并行开发**：后端和前端可以并行
3. **持续测试**：每完成一个功能立即测试
4. **文档同步**：边开发边写文档

---

**计划制定时间：** 2026-05-27  
**预计开始时间：** P0部署完成后  
**预计完成时间：** 3-5天
