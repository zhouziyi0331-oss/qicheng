# OPC孵化计划 - 后端API实现规范

## 概述
本文档定义了OPC孵化计划新增功能的后端API接口规范，包括真实实践项目和联系方式交换功能。

---

## 1. 真实实践项目 API

### 1.1 获取实践项目列表
**接口**: `GET /api/v1/practice/projects`

**Query参数**:
- `status` (可选): `ongoing` | `completed` - 项目状态
- `track` (可选): `content` | `dev` - 赛道类型
- `page` (可选): number - 页码，默认1
- `limit` (可选): number - 每页数量，默认20

**响应示例**:
```json
{
  "projects": [
    {
      "id": "1",
      "title": "小红书账号冷启动 · 美妆博主",
      "company": "美妆博主",
      "track": "content",
      "status": "ongoing",
      "tags": ["内容赛道", "内容策略", "账号运营"],
      "insight": "解决了博主账号"内容同质化、无差异化定位"的卡点，通过垂直人群精准策略实现冷启动破局。",
      "progress": 65,
      "startDate": "2026-06-20",
      "expectedEndDate": "2026-08-15",
      "budget": 3200,
      "icon": "◆"
    },
    {
      "id": "2",
      "title": "企业微信自动化工作流搭建",
      "company": "教育机构",
      "track": "dev",
      "status": "completed",
      "tags": ["A站开发赛道", "自动化流程"],
      "insight": "解决了中小企业"人工重复操作耗时"的卡点，自动化流程节省团队每日12小时工作量。",
      "startDate": "2026-04-10",
      "endDate": "2026-05-30",
      "budget": 2800,
      "icon": "▲"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20
}
```

**字段说明**:
- `id`: 项目唯一标识
- `title`: 项目标题
- `company`: 企业/客户名称
- `track`: 赛道类型 (content: 内容赛道, dev: 开发赛道)
- `status`: 项目状态 (ongoing: 进行中, completed: 已完成)
- `tags`: 项目标签数组
- `insight`: 核心洞察（解决的核心问题）
- `progress`: 进度百分比 (0-100)，仅ongoing项目需要
- `startDate`: 开始日期 (YYYY-MM-DD)
- `endDate`: 完成日期 (YYYY-MM-DD)，仅completed项目需要
- `expectedEndDate`: 预计完成日期 (YYYY-MM-DD)，仅ongoing项目需要
- `budget`: 项目金额
- `icon`: 显示图标 (◆ 或 ▲)

---

### 1.2 获取实践统计数据
**接口**: `GET /api/v1/practice/stats`

**响应示例**:
```json
{
  "completed": 7,
  "ongoing": 3,
  "totalIncome": 12400,
  "avgRating": 4.8
}
```

**字段说明**:
- `completed`: 已完成项目数
- `ongoing`: 进行中项目数
- `totalIncome`: 累计收入
- `avgRating`: 综合评分

---

### 1.3 获取项目详细报告
**接口**: `GET /api/v1/practice/projects/:projectId/report`

**路径参数**:
- `projectId`: 项目ID

**响应示例**:
```json
{
  "id": "1",
  "title": "私域流量体系搭建",
  "company": "教育机构复购率提升项目",
  "track": "content",
  "tags": ["内容赛道", "私域运营"],
  "status": "completed",
  "dateRange": "2026.03.10 — 2026.04.18",
  "duration": "历时 39天",
  "budget": 1800,
  "scores": {
    "execution": 92,
    "problemSolving": 88,
    "replicability": 95
  },
  "whatDid": {
    "description": "为一家拥有500+微信好友的教育机构，从零搭建私域流量运营体系。",
    "items": [
      "用户分层标签体系设计（按学习阶段、消费意愿4层）",
      "社群运营SOP制定（入群欢迎、日常激活、保持转化3套话术）",
      "推广内容日历规划（30天内容矩阵）",
      "复购激励机制设计（积分体系+老带新奖励）"
    ]
  },
  "problemSolved": {
    "coreIssue": "核心卡点：流量无法转化成交（复购率8%），用户沉默、社群死寂，运营人员不知道该做什么、怎么做。",
    "rootCause": "根本原因是缺乏用户分层意识，把所有人放在一个群里用同一套话术，导致高意向用户被低质量内容淹没。",
    "improvement": {
      "label": "复购率提升",
      "before": 8,
      "after": 31
    }
  },
  "replicability": {
    "description": "用户分层+差异化运营的底层逻辑，适用于所有拥有私域流量但转化率低的行业。",
    "industries": [
      {
        "name": "美妆/护肤博主",
        "icon": "◆",
        "level": "high"
      },
      {
        "name": "健身/健康服务",
        "icon": "▲",
        "level": "high"
      },
      {
        "name": "家居/装修服务",
        "icon": "○",
        "level": "medium"
      }
    ]
  },
  "learned": {
    "highlight": "这个项目让你真正理解了"精细化运营"的本质：不是做更多内容，而是把对的内容给对的人。",
    "items": [
      "掌握了用户RFM分层模型的实际应用",
      "积累了教育行业私域运营的完整SOP模板",
      "学会了用数据验证运营策略有效性的方法"
    ]
  },
  "rewards": {
    "exp": 350,
    "income": 1800,
    "cases": 1
  }
}
```

**字段说明**:
- `scores`: 三个维度的评分
  - `execution`: 执行质量 (0-100)
  - `problemSolving`: 问题解决 (0-100)
  - `replicability`: 可复制性 (0-100)
- `whatDid`: 做了什么
  - `description`: 项目描述
  - `items`: 具体工作项列表
- `problemSolved`: 解决了什么问题
  - `coreIssue`: 核心卡点描述
  - `rootCause`: 根本原因分析
  - `improvement`: 改进数据
    - `label`: 指标名称
    - `before`: 改进前数值
    - `after`: 改进后数值
- `replicability`: 可复制性分析
  - `description`: 可复制性描述
  - `industries`: 适用行业列表
    - `name`: 行业名称
    - `icon`: 图标
    - `level`: 适用程度 (high/medium)
- `learned`: 学到了什么
  - `highlight`: 核心收获
  - `items`: 具体学习点列表
- `rewards`: 项目完成奖励
  - `exp`: 经验值
  - `income`: 收入
  - `cases`: 案例库数量

---

### 1.4 更新项目进度
**接口**: `PUT /api/v1/practice/projects/:projectId/progress`

**路径参数**:
- `projectId`: 项目ID

**请求体**:
```json
{
  "progress": 75
}
```

**响应**:
```json
{
  "success": true,
  "progress": 75
}
```

---

## 2. 联系方式交换 API

### 2.1 获取合作伙伴列表
**接口**: `GET /api/v1/contact-exchange/partners`

**响应示例**:
```json
{
  "partners": [
    {
      "id": "1",
      "name": "张小美",
      "avatar": "◆",
      "company": "美妆博主",
      "track": "content",
      "level": 3,
      "collaborationCount": 2,
      "rating": 4.9,
      "totalAmount": 5000,
      "projects": [
        {
          "title": "小红书账号冷启动方案",
          "status": "completed"
        },
        {
          "title": "私域流量搭建 SOP",
          "status": "completed"
        }
      ],
      "exchangeStatus": "available",
      "myConfirmed": false,
      "partnerConfirmed": false
    },
    {
      "id": "2",
      "name": "王老师",
      "avatar": "▲",
      "company": "教育机构",
      "track": "content",
      "level": 2,
      "collaborationCount": 1,
      "rating": 4.7,
      "totalAmount": 1800,
      "projects": [
        {
          "title": "企业微信自动化工作流",
          "status": "ongoing"
        }
      ],
      "exchangeStatus": "pending",
      "myConfirmed": false,
      "partnerConfirmed": false
    }
  ]
}
```

**字段说明**:
- `id`: 合作伙伴ID
- `name`: 姓名
- `avatar`: 头像图标 (◆/▲/○)
- `company`: 公司/身份
- `track`: 赛道类型 (content/dev)
- `level`: 等级
- `collaborationCount`: 合作次数
- `rating`: 互评分数
- `totalAmount`: 合作总金额
- `projects`: 合作项目列表
  - `title`: 项目标题
  - `status`: 项目状态 (completed/ongoing)
- `exchangeStatus`: 交换状态
  - `available`: 可以发起交换（>=2单合作）
  - `pending`: 等待对方确认
  - `confirmed`: 已交换
- `myConfirmed`: 我是否已确认
- `partnerConfirmed`: 对方是否已确认

---

### 2.2 发起联系方式交换请求
**接口**: `POST /api/v1/contact-exchange/request`

**请求体**:
```json
{
  "partnerId": "1"
}
```

**响应**:
```json
{
  "success": true,
  "message": "已发送交换请求"
}
```

**业务逻辑**:
1. 检查与该合作伙伴的合作次数是否 >= 2
2. 检查是否已经发起过请求
3. 创建交换请求记录
4. 发送通知给对方

---

### 2.3 确认联系方式交换
**接口**: `POST /api/v1/contact-exchange/confirm`

**请求体**:
```json
{
  "partnerId": "1"
}
```

**响应**:
```json
{
  "success": true,
  "contact": {
    "phone": "138****5678",
    "wechat": "zhangxm123"
  }
}
```

**业务逻辑**:
1. 检查是否有待确认的交换请求
2. 标记双方都已确认
3. 返回对方的联系方式
4. 发送通知给对方

---

### 2.4 获取交换状态
**接口**: `GET /api/v1/contact-exchange/status/:partnerId`

**路径参数**:
- `partnerId`: 合作伙伴ID

**响应**:
```json
{
  "exchangeStatus": "confirmed",
  "myConfirmed": true,
  "partnerConfirmed": true,
  "confirmedAt": "2026-07-10T10:30:00Z"
}
```

---

### 2.5 获取已交换的联系方式
**接口**: `GET /api/v1/contact-exchange/contact/:partnerId`

**路径参数**:
- `partnerId`: 合作伙伴ID

**响应**:
```json
{
  "partnerId": "1",
  "partnerName": "张小美",
  "contact": {
    "phone": "138****5678",
    "wechat": "zhangxm123",
    "email": "zhang@example.com"
  },
  "exchangedAt": "2026-07-10T10:30:00Z"
}
```

**注意**: 只有双方都确认后才能访问此接口

---

## 3. 数据库设计建议

### 3.1 实践项目表 (practice_projects)
```sql
CREATE TABLE practice_projects (
  id VARCHAR(36) PRIMARY KEY,
  student_id VARCHAR(36) NOT NULL,
  task_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  track ENUM('content', 'dev') NOT NULL,
  status ENUM('ongoing', 'completed') NOT NULL,
  tags JSON,
  insight TEXT,
  progress INT DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE,
  expected_end_date DATE,
  budget DECIMAL(10,2),
  icon VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_student_id (student_id),
  INDEX idx_status (status),
  INDEX idx_track (track)
);
```

### 3.2 实践报告表 (practice_reports)
```sql
CREATE TABLE practice_reports (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  execution_score INT,
  problem_solving_score INT,
  replicability_score INT,
  what_did_description TEXT,
  what_did_items JSON,
  core_issue TEXT,
  root_cause TEXT,
  improvement_label VARCHAR(100),
  improvement_before INT,
  improvement_after INT,
  replicability_description TEXT,
  replicability_industries JSON,
  learned_highlight TEXT,
  learned_items JSON,
  rewards_exp INT,
  rewards_income DECIMAL(10,2),
  rewards_cases INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES practice_projects(id),
  INDEX idx_project_id (project_id)
);
```

### 3.3 联系方式交换表 (contact_exchanges)
```sql
CREATE TABLE contact_exchanges (
  id VARCHAR(36) PRIMARY KEY,
  requester_id VARCHAR(36) NOT NULL,
  partner_id VARCHAR(36) NOT NULL,
  requester_confirmed BOOLEAN DEFAULT FALSE,
  partner_confirmed BOOLEAN DEFAULT FALSE,
  status ENUM('pending', 'confirmed', 'rejected') DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP NULL,
  
  INDEX idx_requester_id (requester_id),
  INDEX idx_partner_id (partner_id),
  UNIQUE KEY unique_exchange (requester_id, partner_id)
);
```

---

## 4. 权限和安全

### 4.1 认证
所有API接口都需要在Header中携带认证Token：
```
Authorization: Bearer {access_token}
```

### 4.2 权限检查
- **实践项目API**: 只能查看和修改自己的项目
- **联系方式交换API**: 只能查看与自己有合作关系的伙伴，只能发起与>=2单合作伙伴的交换

### 4.3 数据脱敏
- 联系方式在未完成双向确认前应该脱敏显示（如：138****5678）
- 只有双方都确认后才能看到完整联系方式

---

## 5. 错误响应格式

所有API的错误响应格式统一为：
```json
{
  "error": {
    "code": "INSUFFICIENT_COLLABORATIONS",
    "message": "合作次数不足2次，无法申请交换联系方式",
    "details": {
      "required": 2,
      "current": 1
    }
  }
}
```

### 常见错误码
- `INSUFFICIENT_COLLABORATIONS`: 合作次数不足
- `EXCHANGE_ALREADY_EXISTS`: 已存在交换请求
- `EXCHANGE_NOT_FOUND`: 交换请求不存在
- `UNAUTHORIZED`: 未授权
- `PROJECT_NOT_FOUND`: 项目不存在
- `INVALID_STATUS`: 无效的状态值

---

## 6. 实现优先级

### Phase 1 - 基础功能（必须）
1. ✅ 实践项目列表API
2. ✅ 实践统计数据API
3. ✅ 项目详细报告API
4. ✅ 合作伙伴列表API
5. ✅ 发起交换请求API
6. ✅ 确认交换API

### Phase 2 - 增强功能（建议）
1. 项目进度更新API
2. 交换状态查询API
3. 获取已交换联系方式API

### Phase 3 - 优化功能（可选）
1. 实践项目搜索和过滤
2. 合作伙伴推荐算法
3. 交换请求通知系统

---

## 7. 测试数据

后端实现时可以使用以下测试数据进行开发和调试：

### 测试账号
- 学生A: student_a@test.com (有3个完成项目，2个进行中项目)
- 学生B: student_b@test.com (有2个完成项目，与学生A有2次合作)
- 学生C: student_c@test.com (有1个完成项目，与学生A有1次合作)

### 测试场景
1. 学生A查看自己的实践项目列表
2. 学生A查看某个项目的详细报告
3. 学生A查看可交换联系方式的合作伙伴（应该只看到学生B）
4. 学生A向学生B发起联系方式交换请求
5. 学生B确认交换请求
6. 双方都能看到对方的联系方式

---

## 8. 前端已完成

前端代码已经完成，包括：
- ✅ 实践项目列表页面 (`packagePractice/pages/practice-list`)
- ✅ 实践详细报告页面 (`packagePractice/pages/practice-report`)
- ✅ 联系方式交换页面 (`packageOther/pages/contact-exchange`)
- ✅ Profile页面入口横幅 (`pages/profile`)
- ✅ API调用代码已集成 (`services/api.ts`)

所有前端页面的emoji已替换为几何图标（◆▲○⇄◈✦），设计风格统一使用Morandi配色和大尺寸rpx单位。

---

## 9. 联系方式

如有任何问题，请联系前端开发团队。
