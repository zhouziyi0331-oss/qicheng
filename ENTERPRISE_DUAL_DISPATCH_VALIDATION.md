# 企业端双模式派单系统 - 验收指南

## 📋 验收概述

本文档提供完整的验收测试方法，确保企业端双模式派单系统符合技术规格。

---

## 🎯 验收目标

### 模块一：常规派单价格推荐
- ✅ 价格区间动态计算正确
- ✅ 基于历史数据优化推荐
- ✅ 企业出价验证逻辑正确
- ✅ 指定大师兜底价计算正确

### 模块二：指定大师派单
- ✅ 大师列表筛选功能正确
- ✅ 邀请发送和验证逻辑正确
- ✅ 大师响应流程完整
- ✅ 协商机制运作正常
- ✅ 自动过期机制有效

---

## 🧪 验收测试清单

### 一、数据库结构验证

#### 1.1 验证新增表

```sql
-- 检查 project_invitations 表
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'project_invitations';

-- 检查 price_calculation_history 表
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'price_calculation_history';

-- 检查 master_overview 视图
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public' AND table_name = 'master_overview';
```

**预期结果**: 3个对象都存在

#### 1.2 验证 tasks 表新增字段

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
  AND column_name IN (
    'dispatch_mode', 'estimated_hours', 'price_min', 
    'price_max', 'enterprise_price', 'designated_master_id'
  );
```

**预期结果**: 返回6个字段

#### 1.3 验证 users 表新增字段

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name LIKE 'master_%';
```

**预期结果**: 返回8个大师相关字段

---

### 二、价格推荐算法验证

#### 2.1 基准价格计算验证

**测试用例1**: content赛道, 难度2, 5小时, 图片交付

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

**预期结果**:
```json
{
  "success": true,
  "data": {
    "basePrice": 213,      // 50 × 0.85 × 1.0 × 5 = 212.5 → 213
    "priceMin": 181,       // 213 × 0.85 = 181.05 → 181
    "priceMax": 277,       // 213 × 1.3 = 276.9 → 277
    "floorPrice": 416      // 277 × 1.5 = 415.5 → 416
  }
}
```

**验证标准**: 
- ✅ basePrice = 213 (±1)
- ✅ priceMin = 181 (±1)
- ✅ priceMax = 277 (±1)
- ✅ floorPrice = 416 (±1)

**测试用例2**: dev赛道, 难度4, 10小时, 代码交付

```bash
curl -X POST http://localhost:3000/api/v1/dispatch/price-recommendation \
  -H "Content-Type: application/json" \
  -d '{
    "track": "B",
    "difficulty": 4,
    "estimatedHours": 10,
    "deliverableType": "code"
  }'
```

**预期结果**:
```json
{
  "basePrice": 1560,     // 80 × 1.3 × 1.5 × 10 = 1560
  "priceMin": 1326,      // 1560 × 0.85 = 1326
  "priceMax": 2028,      // 1560 × 1.3 = 2028
  "floorPrice": 3042     // 2028 × 1.5 = 3042
}
```

#### 2.2 历史数据优化验证

**准备工作**: 创建测试数据

```sql
-- 插入5个已完成的同类任务
INSERT INTO tasks (company_id, title, description, track, difficulty, status, student_price)
VALUES 
  ('test-company-id', 'Test 1', 'Test', 'A', 2, 'completed', 250),
  ('test-company-id', 'Test 2', 'Test', 'A', 2, 'completed', 260),
  ('test-company-id', 'Test 3', 'Test', 'A', 2, 'completed', 240),
  ('test-company-id', 'Test 4', 'Test', 'A', 2, 'completed', 270),
  ('test-company-id', 'Test 5', 'Test', 'A', 2, 'completed', 230);

-- 为每个任务创建已完成的分配记录
INSERT INTO task_assignments (task_id, student_id, status)
SELECT id, 'test-student-id', 'completed' FROM tasks WHERE title LIKE 'Test %';
```

**测试**: 再次请求价格推荐

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

**预期结果**:
```json
{
  "basePrice": 213,
  "priceMin": 200,           // 250 × 0.8 = 200 (基于历史均价)
  "priceMax": 375,           // 250 × 1.5 = 375 (基于历史均价)
  "floorPrice": 563,         // 375 × 1.5 = 562.5 → 563
  "historicalAvgPrice": 250, // (250+260+240+270+230)/5 = 250
  "similarTasksCount": 5
}
```

**验证标准**:
- ✅ historicalAvgPrice 存在且 = 250
- ✅ similarTasksCount = 5
- ✅ priceMin 基于历史均价计算
- ✅ priceMax 基于历史均价计算

#### 2.3 企业出价验证

**测试用例1**: 出价在区间内

```bash
curl -X POST http://localhost:3000/api/v1/dispatch/validate-price \
  -H "Content-Type: application/json" \
  -d '{
    "enterprisePrice": 220,
    "recommendation": {
      "priceMin": 181,
      "priceMax": 277
    }
  }'
```

**预期结果**:
```json
{
  "success": true,
  "data": {
    "valid": true,
    "level": "ok"
  }
}
```

**测试用例2**: 出价低于下限

```bash
curl -X POST http://localhost:3000/api/v1/dispatch/validate-price \
  -H "Content-Type: application/json" \
  -d '{
    "enterprisePrice": 150,
    "recommendation": {
      "priceMin": 181,
      "priceMax": 277
    }
  }'
```

**预期结果**:
```json
{
  "success": true,
  "data": {
    "valid": true,
    "level": "low",
    "warning": "低于推荐价格可能影响匹配速度。推荐区间：¥181 - ¥277"
  }
}
```

**测试用例3**: 出价高于上限

```bash
curl -X POST http://localhost:3000/api/v1/dispatch/validate-price \
  -H "Content-Type: application/json" \
  -d '{
    "enterprisePrice": 350,
    "recommendation": {
      "priceMin": 181,
      "priceMax": 277
    }
  }'
```

**预期结果**:
```json
{
  "success": true,
  "data": {
    "valid": true,
    "level": "high",
    "warning": "你出的价格高于推荐上限。系统将为你匹配过往评分最高的学生。"
  }
}
```

---

### 三、指定大师功能验证

#### 3.1 准备测试数据

```sql
-- 创建测试大师
UPDATE users 
SET is_master = true,
    master_min_hourly_rate = 120,
    master_min_order_price = 500,
    master_accept_designated = true,
    master_allow_negotiation = true,
    master_specialties = ARRAY['AI品牌视觉', '社交媒体内容'],
    master_online = true,
    master_current_load = 2
WHERE id = 'test-master-id-1';

UPDATE users 
SET is_master = true,
    master_min_hourly_rate = 180,
    master_min_order_price = 800,
    master_accept_designated = true,
    master_allow_negotiation = false,
    master_specialties = ARRAY['代码开发', 'API设计'],
    master_online = false,
    master_current_load = 5
WHERE id = 'test-master-id-2';
```

#### 3.2 大师列表验证

**测试用例1**: 获取所有大师

```bash
curl -X GET "http://localhost:3000/api/v1/dispatch/masters"
```

**预期结果**: 返回所有 `is_master=true` 且 `master_accept_designated=true` 的用户

**测试用例2**: 筛选在线大师

```bash
curl -X GET "http://localhost:3000/api/v1/dispatch/masters?onlineOnly=true"
```

**预期结果**: 只返回 `master_online=true` 的大师

**测试用例3**: 筛选高评分大师

```bash
curl -X GET "http://localhost:3000/api/v1/dispatch/masters?minRating=4.5"
```

**预期结果**: 只返回 `avg_rating >= 4.5` 的大师

**测试用例4**: 筛选擅长领域

```bash
curl -X GET "http://localhost:3000/api/v1/dispatch/masters?specialties=AI品牌视觉"
```

**预期结果**: 只返回 `master_specialties` 包含 "AI品牌视觉" 的大师

#### 3.3 发送邀请验证

**测试用例1**: 正常发送邀请

```bash
curl -X POST http://localhost:3000/api/v1/dispatch/invitations \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "test-task-id",
    "enterpriseId": "test-enterprise-id",
    "masterId": "test-master-id-1",
    "enterpriseOffer": 600,
    "message": "希望您能承接这个项目"
  }'
```

**预期结果**:
```json
{
  "success": true,
  "data": {
    "invitationId": "uuid",
    "status": "pending"
  }
}
```

**验证数据库**:
```sql
SELECT * FROM project_invitations WHERE id = 'invitation-id';
```

**预期**: 
- ✅ status = 'pending'
- ✅ enterprise_offer = 600
- ✅ expires_at = created_at + 48小时

**测试用例2**: 出价低于最低接单价

```bash
curl -X POST http://localhost:3000/api/v1/dispatch/invitations \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "test-task-id",
    "enterpriseId": "test-enterprise-id",
    "masterId": "test-master-id-1",
    "enterpriseOffer": 300
  }'
```

**预期结果**:
```json
{
  "success": false,
  "message": "出价不得低于大师最低接单价 ¥500"
}
```

**测试用例3**: 重复邀请

```bash
# 发送第二次邀请给同一大师
curl -X POST http://localhost:3000/api/v1/dispatch/invitations \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "test-task-id",
    "enterpriseId": "test-enterprise-id",
    "masterId": "test-master-id-1",
    "enterpriseOffer": 600
  }'
```

**预期结果**:
```json
{
  "success": false,
  "message": "已有待处理的邀请，请等待大师响应"
}
```

#### 3.4 大师响应验证

**测试用例1**: 大师接受邀请

```bash
curl -X POST http://localhost:3000/api/v1/dispatch/invitations/{invitationId}/respond \
  -H "Content-Type: application/json" \
  -d '{
    "masterId": "test-master-id-1",
    "action": "accept"
  }'
```

**预期结果**:
```json
{
  "success": true,
  "data": {
    "invitationId": "uuid",
    "status": "accepted"
  }
}
```

**验证数据库**:
```sql
-- 检查邀请状态
SELECT status, responded_at FROM project_invitations WHERE id = 'invitation-id';

-- 检查任务分配
SELECT * FROM task_assignments WHERE task_id = 'test-task-id' AND student_id = 'test-master-id-1';

-- 检查任务状态
SELECT status, student_price FROM tasks WHERE id = 'test-task-id';

-- 检查大师负载
SELECT master_current_load FROM users WHERE id = 'test-master-id-1';
```

**预期**:
- ✅ invitation.status = 'accepted'
- ✅ invitation.responded_at 已设置
- ✅ task_assignment 已创建，status = 'in_progress'
- ✅ task.status = 'in_progress'
- ✅ task.student_price = 600
- ✅ master_current_load 增加1

**测试用例2**: 大师拒绝邀请

```bash
curl -X POST http://localhost:3000/api/v1/dispatch/invitations/{invitationId}/respond \
  -H "Content-Type: application/json" \
  -d '{
    "masterId": "test-master-id-1",
    "action": "reject",
    "note": "近期项目较多，暂时无法承接"
  }'
```

**预期结果**:
```json
{
  "success": true,
  "data": {
    "invitationId": "uuid",
    "status": "rejected",
    "masterNote": "近期项目较多，暂时无法承接"
  }
}
```

**测试用例3**: 大师协商

```bash
curl -X POST http://localhost:3000/api/v1/dispatch/invitations/{invitationId}/respond \
  -H "Content-Type: application/json" \
  -d '{
    "masterId": "test-master-id-1",
    "action": "negotiate",
    "counterOffer": 800,
    "note": "该项目复杂度较高，建议价格为¥800"
  }'
```

**预期结果**:
```json
{
  "success": true,
  "data": {
    "invitationId": "uuid",
    "status": "negotiating",
    "masterCounterOffer": 800,
    "masterNote": "该项目复杂度较高，建议价格为¥800"
  }
}
```

#### 3.5 自动过期验证

**准备工作**: 创建一个过期的邀请

```sql
INSERT INTO project_invitations (
  task_id, enterprise_id, master_id, enterprise_offer, status, created_at, expires_at
) VALUES (
  'test-task-id', 'test-enterprise-id', 'test-master-id-1', 500, 
  'pending', NOW() - INTERVAL '50 hours', NOW() - INTERVAL '2 hours'
);
```

**测试**: 触发过期清理

```bash
curl -X POST http://localhost:3000/api/v1/dispatch/invitations/expire
```

**预期结果**:
```json
{
  "success": true,
  "data": {
    "expiredCount": 1
  }
}
```

**验证数据库**:
```sql
SELECT status FROM project_invitations WHERE expires_at < NOW();
```

**预期**: 所有过期邀请的 status = 'expired'

---

## ✅ 验收通过标准

### 数据库结构（100%）
- ✅ 3个新表/视图已创建
- ✅ tasks表6个新字段已添加
- ✅ users表8个新字段已添加

### 价格推荐算法（100%）
- ✅ 基准价格计算正确（误差 ≤ 1元）
- ✅ 推荐区间计算正确
- ✅ 兜底价计算正确
- ✅ 历史数据优化生效
- ✅ 企业出价验证逻辑正确

### 指定大师功能（100%）
- ✅ 大师列表筛选功能正确
- ✅ 邀请发送验证逻辑正确
- ✅ 大师响应流程完整
- ✅ 任务分配自动创建
- ✅ 大师负载自动更新
- ✅ 自动过期机制有效

---

## 📊 验收报告模板

### 验收执行记录

| 测试项 | 执行时间 | 结果 | 备注 |
|--------|----------|------|------|
| 数据库结构验证 | YYYY-MM-DD HH:mm | ✅/❌ | |
| 价格推荐算法验证 | YYYY-MM-DD HH:mm | ✅/❌ | |
| 大师列表验证 | YYYY-MM-DD HH:mm | ✅/❌ | |
| 邀请发送验证 | YYYY-MM-DD HH:mm | ✅/❌ | |
| 大师响应验证 | YYYY-MM-DD HH:mm | ✅/❌ | |
| 自动过期验证 | YYYY-MM-DD HH:mm | ✅/❌ | |

### 验收结果

- **总测试项**: ___
- **通过项**: ___
- **失败项**: ___
- **通过率**: ___%

### 验收结论

- [ ] ✅ **全部通过** - 系统符合技术规格，可以上线
- [ ] ⚠️  **部分通过** - 需要修复以下问题：___________
- [ ] ❌ **未通过** - 系统不符合技术规格，需要重新实现

---

**最后更新**: 2026-05-27  
**文档版本**: 1.0  
**验收状态**: ⏳ 待执行
