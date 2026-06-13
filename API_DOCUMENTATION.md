# 📚 API文档 - 体验优化功能完整接口说明

## 基础信息

### Base URL
```
开发环境: http://localhost:3000/api/v1
生产环境: https://api.yourcompany.com/api/v1
```

### 认证
所有需要认证的接口都需要在请求头中携带JWT token：

```http
Authorization: Bearer <your-token>
```

### 统一响应格式

#### 成功响应
```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

#### 错误响应
```json
{
  "success": false,
  "message": "错误信息",
  "code": "ERROR_CODE"
}
```

---

## 核心API清单

### 1. 任务体验优化 (13个端点)

**模板市场**
- GET `/task-experience/templates` - 获取模板列表
- GET `/task-experience/templates/:id` - 获取模板详情
- POST `/task-experience/templates/:id/use` - 使用模板创建草稿

**预算建议**
- POST `/task-experience/budget-suggestion` - 获取AI预算建议

**草稿箱**
- POST `/task-experience/drafts` - 保存草稿
- PUT `/task-experience/drafts/:id` - 更新草稿
- GET `/task-experience/drafts` - 获取草稿列表
- DELETE `/task-experience/drafts/:id` - 删除草稿

### 2. 匹配增强 (11个端点)

**试稿机制**
- POST `/matching-enhancement/trial-invitations` - 创建试稿邀请
- GET `/matching-enhancement/trial-invitations` - 获取邀请列表
- POST `/matching-enhancement/trial-invitations/:id/respond` - 学生响应
- POST `/matching-enhancement/trial-invitations/:id/submit` - 学生提交试稿
- POST `/matching-enhancement/trial-invitations/:id/evaluate` - 企业评估

**学生筛选**
- POST `/matching-enhancement/compare-students` - 对比学生
- POST `/matching-enhancement/search-students` - 搜索学生

### 3. 任务追踪 (18个端点)

**进度追踪**
- GET `/task-tracking/tasks/:id/progress-dashboard` - 进度仪表盘
- POST `/task-tracking/tasks/:id/milestones` - 创建里程碑
- POST `/task-tracking/milestones/:id/confirm` - 确认里程碑

**通知归档**
- GET `/task-tracking/delivery-notifications` - 获取通知列表
- POST `/task-tracking/delivery-notifications/:id/read` - 标记已读
- POST `/task-tracking/tasks/:id/archive-communication` - 创建归档
- GET `/task-tracking/tasks/:id/archives` - 获取归档列表

**预警介入**
- GET `/task-tracking/tasks/:id/delay-warnings` - 获取延期预警
- POST `/task-tracking/emergency-interventions` - 紧急介入申请

### 4. 验收系统 (17个端点)

**验收清单**
- POST `/acceptance/tasks/:id/checklist` - 创建验收清单
- PUT `/acceptance/checklists/:id/items/:itemId` - 更新清单项
- GET `/acceptance/tasks/:id/checklist` - 获取验收清单

**评分评价**
- POST `/acceptance/tasks/:id/dimensional-score` - 创建维度化评分
- GET `/acceptance/tasks/:id/dimensional-score` - 获取评分
- POST `/acceptance/cooperation-willingness` - 记录合作意愿
- GET `/acceptance/mutual-cooperation-partners` - 获取互相愿意合作的记录

**知识产权**
- POST `/acceptance/tasks/:id/ip-declaration` - 创建知识产权声明
- POST `/acceptance/ip-declarations/:id/confirm` - 确认声明
- GET `/acceptance/tasks/:id/ip-declaration` - 获取声明

**退款补偿**
- POST `/acceptance/refund-requests` - 创建退款申请
- GET `/acceptance/refund-requests` - 获取申请列表

---

## 完整的API示例

### 示例1: 使用模板发布任务完整流程

```bash
# 1. 获取模板列表
curl -X GET "http://localhost:3000/api/v1/task-experience/templates"

# 2. 使用模板创建草稿
curl -X POST "http://localhost:3000/api/v1/task-experience/templates/TEMPLATE_ID/use" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "产品类型": "数码产品",
    "产品名称": "蓝牙耳机"
  }'

# 3. 获取AI预算建议
curl -X POST "http://localhost:3000/api/v1/task-experience/budget-suggestion" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task_category": "设计类",
    "quality_expectation": "standard"
  }'

# 4. 发布任务（使用草稿）
# ... 调用任务发布接口
```

### 示例2: 学生筛选和对比

```bash
# 1. 搜索学生
curl -X POST "http://localhost:3000/api/v1/matching-enhancement/search-students" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filters": {
      "student_level_min": 3,
      "min_rating": 4.0,
      "max_hourly_rate": 100
    }
  }'

# 2. 对比选中的学生
curl -X POST "http://localhost:3000/api/v1/matching-enhancement/compare-students" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_ids": ["student-1", "student-2", "student-3"],
    "task_id": "TASK_ID"
  }'
```

### 示例3: 里程碑管理流程

```bash
# 1. 创建里程碑
curl -X POST "http://localhost:3000/api/v1/task-tracking/tasks/TASK_ID/milestones" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "milestone_name": "设计稿完成",
    "description": "完成首页设计稿",
    "sequence_number": 1,
    "due_date": "2024-01-15",
    "budget_allocation": 100
  }'

# 2. 学生提交（学生端调用）
# ... 

# 3. 企业确认里程碑
curl -X POST "http://localhost:3000/api/v1/task-tracking/milestones/MILESTONE_ID/confirm" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "approved": true,
    "feedback": "设计质量很好，通过验收"
  }'
```

---

## Postman Collection

导入以下JSON到Postman快速测试所有API：

[下载Postman Collection](./postman_collection.json)

---

**更多详细信息请参考在线文档：https://docs.yourcompany.com/api** 📖
