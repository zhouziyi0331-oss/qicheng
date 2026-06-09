# 企业端双模式派单系统 - 完整实现报告

## 📊 项目概述

**实现日期**: 2026-05-27  
**系统名称**: 企业端双模式派单系统  
**核心功能**: 常规派单（价格推荐）+ 指定大师派单（协商定价）

---

## ✅ 已完成的功能模块

### 模块一：常规派单价格推荐系统

#### 1.1 数据库Schema
- ✅ `tasks` 表扩展：添加 `dispatch_mode`, `estimated_hours`, `price_min`, `price_max`, `enterprise_price`, `designated_master_id`
- ✅ `price_calculation_history` 表：记录价格计算历史
- ✅ 创建索引优化查询性能

#### 1.2 价格推荐算法
**文件**: `backend/src/services/priceRecommendationService.ts`

**核心功能**:
- ✅ 基于赛道、难度、工时、交付物类型计算基准价格
- ✅ 查询历史同类项目数据优化推荐
- ✅ 生成推荐价格区间（下限 = 基准价 × 0.85，上限 = 基准价 × 1.3）
- ✅ 计算指定大师兜底价（推荐上限 × 1.5）
- ✅ 验证企业出价合理性

**价格计算公式**:
```
基准价 = 赛道基础价 × 难度系数 × 交付物复杂度系数 × 预估工时

赛道基础价：
  A (content): ¥50/小时
  B (dev): ¥80/小时
  AB (混合): ¥65/小时

难度系数：
  1: 0.7
  2: 0.85
  3: 1.0
  4: 1.3
  5: 1.6

交付物复杂度系数：
  image: 1.0
  video: 1.4
  document: 0.8
  code: 1.5
  mixed: 1.3
```

**示例计算**:
```
输入：赛道A, 难度2, 5小时, 图片交付
基准价 = 50 × 0.85 × 1.0 × 5 = ¥212.5
推荐区间：¥181 - ¥276
指定大师兜底价：¥414
```

### 模块二：指定大师派单系统

#### 2.1 数据库Schema
- ✅ `users` 表扩展：添加大师相关字段
  - `is_master`: 是否为认证大师
  - `master_min_hourly_rate`: 最低时薪
  - `master_min_order_price`: 接单起报价
  - `master_accept_designated`: 是否接受指定邀请
  - `master_allow_negotiation`: 是否接受协商
  - `master_specialties`: 擅长领域标签
  - `master_online`: 当前在线状态
  - `master_current_load`: 当前项目负载

- ✅ `project_invitations` 表：邀请记录
  - 企业出价、大师还价
  - 邀请状态（pending/accepted/negotiating/rejected/expired）
  - 48小时自动过期机制

- ✅ `master_overview` 视图：大师概览
  - 聚合大师基本信息、统计数据、评分

#### 2.2 指定大师服务
**文件**: `backend/src/services/designatedMasterService.ts`

**核心功能**:
- ✅ 获取大师列表（支持筛选：赛道、擅长领域、在线状态、最低评分）
- ✅ 获取大师详情（包含完成任务数、平均评分）
- ✅ 发送邀请给大师（验证最低接单价）
- ✅ 大师响应邀请（接受/拒绝/协商）
- ✅ 自动创建任务分配（大师接受后）
- ✅ 自动过期超时邀请（48小时）

### 模块三：API接口

**文件**: `backend/src/routes/dispatch.ts`

#### 3.1 价格推荐API
- ✅ `POST /api/v1/dispatch/price-recommendation` - 获取价格推荐
- ✅ `POST /api/v1/dispatch/validate-price` - 验证企业出价

#### 3.2 指定大师API
- ✅ `GET /api/v1/dispatch/masters` - 获取大师列表
- ✅ `GET /api/v1/dispatch/masters/:masterId` - 获取大师详情
- ✅ `POST /api/v1/dispatch/invitations` - 发送邀请
- ✅ `POST /api/v1/dispatch/invitations/:invitationId/respond` - 大师响应邀请
- ✅ `GET /api/v1/dispatch/invitations/:invitationId` - 获取邀请详情
- ✅ `POST /api/v1/dispatch/invitations/expire` - 清理过期邀请

---

## 📦 文件清单

### 后端实现（4个文件）
1. ✅ `migrations/083_enterprise_dual_dispatch_system.sql` - 数据库迁移
2. ✅ `services/priceRecommendationService.ts` - 价格推荐服务
3. ✅ `services/designatedMasterService.ts` - 指定大师服务
4. ✅ `routes/dispatch.ts` - API路由

### 文档（1个文件）
1. ✅ `ENTERPRISE_DUAL_DISPATCH_IMPLEMENTATION.md` - 本文档

**总计：5个文件**

---

## 🔧 技术实现细节

### 1. 价格推荐算法的优化策略

**历史数据优先**:
- 当同赛道、同难度的已完成任务 ≥ 5个时，使用历史均价计算区间
- 历史数据不足时，回退到基准价公式

**动态调整**:
- 每次价格计算都记录到 `price_calculation_history` 表
- 可用于后续算法优化和A/B测试

### 2. 指定大师匹配的核心逻辑

**大师筛选**:
```sql
SELECT * FROM master_overview
WHERE is_master = true
  AND master_accept_designated = true
  AND master_online = true  -- 可选
  AND avg_rating >= 4.5     -- 可选
  AND master_specialties && ARRAY['AI品牌视觉']  -- 可选
ORDER BY avg_rating DESC, completed_tasks DESC
LIMIT 50
```

**邀请验证**:
1. 验证大师是否接受指定邀请
2. 验证企业出价 ≥ 大师最低接单价
3. 检查是否已有待处理邀请（避免重复）

**自动过期机制**:
- 邀请创建时设置 `expires_at = NOW() + 48小时`
- 定时任务或手动触发清理过期邀请

### 3. 协商流程状态机

```
pending (待响应)
  │
  ├─→ accepted (接受) → 创建任务分配
  ├─→ rejected (拒绝) → 企业可重新选择大师
  ├─→ negotiating (协商中) → 大师提出还价
  └─→ expired (过期) → 48小时未响应
```

---

## 🎯 核心业务规则

### 1. 常规派单

| 规则 | 说明 |
|------|------|
| 价格区间计算 | 基于公式 + 历史数据 |
| 企业定价自由度 | 可低于下限或高于上限，但会有提示 |
| 低价提示 | "低于推荐价格可能影响匹配速度" |
| 高价提示 | "系统将为你匹配过往评分最高的学生" |
| 平台抽佣 | 15-20%（按学生等级） |

### 2. 指定大师

| 规则 | 说明 |
|------|------|
| 兜底价计算 | 常规推荐上限 × 1.5 |
| 最低接单价 | 大师自行设定，不低于兜底价 |
| 邀请有效期 | 48小时 |
| 协商轮次 | 无限制（但建议前端限制3轮） |
| 平台抽佣 | 10%（低于常规派单） |
| 大师负载 | 接受邀请后 `master_current_load + 1` |

---

## 📊 数据库表结构

### tasks 表新增字段

| 字段 | 类型 | 说明 |
|------|------|------|
| dispatch_mode | ENUM | random/designated |
| estimated_hours | INTEGER | 预估工时 |
| price_min | DECIMAL(10,2) | 推荐价格下限 |
| price_max | DECIMAL(10,2) | 推荐价格上限 |
| enterprise_price | DECIMAL(10,2) | 企业设定价格 |
| designated_master_id | UUID | 指定的大师ID |

### users 表新增字段（大师相关）

| 字段 | 类型 | 说明 |
|------|------|------|
| is_master | BOOLEAN | 是否为认证大师 |
| master_min_hourly_rate | DECIMAL(10,2) | 最低时薪 |
| master_min_order_price | DECIMAL(10,2) | 接单起报价 |
| master_accept_designated | BOOLEAN | 是否接受指定邀请 |
| master_allow_negotiation | BOOLEAN | 是否接受协商 |
| master_specialties | TEXT[] | 擅长领域标签 |
| master_online | BOOLEAN | 当前在线状态 |
| master_current_load | INTEGER | 当前项目负载 |

### project_invitations 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 邀请ID |
| task_id | UUID | 任务ID |
| enterprise_id | UUID | 企业ID |
| master_id | UUID | 大师ID |
| enterprise_offer | DECIMAL(10,2) | 企业出价 |
| master_counter_offer | DECIMAL(10,2) | 大师还价 |
| status | ENUM | pending/accepted/negotiating/rejected/expired |
| message | TEXT | 企业留言 |
| master_note | TEXT | 大师回复 |
| created_at | TIMESTAMPTZ | 创建时间 |
| responded_at | TIMESTAMPTZ | 响应时间 |
| expires_at | TIMESTAMPTZ | 过期时间 |

---

## 🚀 部署步骤

### 1. 执行数据库迁移

```bash
cd /path/to/backend
docker exec -i qicheng-postgres psql -U postgres -d qicheng < migrations/083_enterprise_dual_dispatch_system.sql
```

### 2. 注册API路由

在 `backend/src/app.ts` 中添加：

```typescript
import dispatchRoutes from './routes/dispatch';

app.use('/api/v1/dispatch', dispatchRoutes);
```

### 3. 配置定时任务（可选）

添加定时任务清理过期邀请：

```typescript
import cron from 'node-cron';
import designatedMasterService from './services/designatedMasterService';

// 每小时执行一次
cron.schedule('0 * * * *', async () => {
  await designatedMasterService.expireOldInvitations();
});
```

### 4. 重启服务

```bash
npm run build
npm run start
```

---

## 🧪 API测试示例

### 1. 获取价格推荐

```bash
curl -X POST http://localhost:3000/api/v1/dispatch/price-recommendation \
  -H "Content-Type: application/json" \
  -d '{
    "track": "A",
    "difficulty": 2,
    "estimatedHours": 5,
    "deliverableType": "image"
  }'
```

**预期响应**:
```json
{
  "success": true,
  "data": {
    "basePrice": 213,
    "priceMin": 181,
    "priceMax": 277,
    "floorPrice": 416,
    "historicalAvgPrice": 250,
    "similarTasksCount": 12
  }
}
```

### 2. 获取大师列表

```bash
curl -X GET "http://localhost:3000/api/v1/dispatch/masters?onlineOnly=true&minRating=4.5"
```

### 3. 发送邀请

```bash
curl -X POST http://localhost:3000/api/v1/dispatch/invitations \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "task-uuid",
    "enterpriseId": "enterprise-uuid",
    "masterId": "master-uuid",
    "enterpriseOffer": 500,
    "message": "希望您能承接这个项目"
  }'
```

### 4. 大师响应邀请

```bash
curl -X POST http://localhost:3000/api/v1/dispatch/invitations/{invitationId}/respond \
  -H "Content-Type: application/json" \
  -d '{
    "masterId": "master-uuid",
    "action": "accept"
  }'
```

---

## 📝 下一步工作

### 前端实现（待开发）

1. **企业端项目发布页**
   - 模式选择Tab（常规派单 / 指定大师）
   - 常规派单表单 + 价格推荐展示
   - 指定大师表单 + 大师列表

2. **大师列表页**
   - 大师卡片展示
   - 筛选功能
   - 大师详情弹窗

3. **邀请管理页**
   - 邀请列表
   - 协商历史展示
   - 接受/拒绝/协商操作

4. **大师端设置页**
   - 最低接单价设置
   - 接受指定邀请开关
   - 擅长领域标签管理

### 功能增强（可选）

1. **智能推荐**
   - 基于企业历史偏好推荐大师
   - 基于大师擅长领域匹配项目

2. **通知系统**
   - 邀请发送通知
   - 大师响应通知
   - 邀请即将过期提醒

3. **数据分析**
   - 价格推荐准确率分析
   - 大师接单率统计
   - 协商成功率分析

---

## ✅ 系统状态

- ✅ **数据库Schema**: 100%完成
- ✅ **后端服务**: 100%完成
- ✅ **API接口**: 100%完成
- ⏳ **前端实现**: 待开发
- ✅ **文档**: 100%完成

**后端系统已100%完成，可以立即部署和测试！**

---

**最后更新**: 2026-05-27  
**文档版本**: 1.0  
**系统状态**: ✅ 后端完成，前端待开发
