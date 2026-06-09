# 启程平台新增API文档

**版本**: v1.0  
**创建日期**: 2026-05-27  
**状态**: ✅ 已完成并注册

---

## 📋 API概览

本文档涵盖以下新增功能的API：

1. **三次审核兜底系统** - 5个端点
2. **组队系统** - 7个端点
3. **社区板块** - 7个端点
4. **大师系统** - 8个端点

**总计**: 27个新增API端点

---

## 🔐 认证说明

所有API都需要JWT认证，请在请求头中包含：

```
Authorization: Bearer <your_jwt_token>
```

---

## 1. 三次审核兜底系统 API

### 1.1 获取三次审核兜底状态

**端点**: `GET /api/v1/tasks/:taskId/three-strike-status`

**权限**: 学生本人

**响应**:
```json
{
  "success": true,
  "data": {
    "submissionCount": 3,
    "isFinalFail": true,
    "submissions": [...],
    "status": "in_progress",
    "hasTransferred": false,
    "hasMaster": false
  }
}
```

---

### 1.2 获取可转单的学生列表

**端点**: `GET /api/v1/tasks/:taskId/transfer-candidates`

**权限**: 学生本人

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nickname": "学生A",
      "avatar_url": "...",
      "current_level": 3,
      "tasks_completed": 10,
      "avg_task_quality": 0.85,
      "active_tasks": 1
    }
  ]
}
```

---

### 1.3 执行转单

**端点**: `POST /api/v1/tasks/:taskId/transfer`

**权限**: 学生本人

**请求体**:
```json
{
  "toStudentId": "uuid",
  "reason": "任务难度超出能力范围"
}
```

**响应**:
```json
{
  "success": true,
  "message": "转单成功，你将获得20%的转单费用"
}
```

**说明**: 
- 原学生获得20%的转单费用
- 接包学生获得80%的任务费用

---

### 1.4 获取可召唤的大师列表

**端点**: `GET /api/v1/tasks/:taskId/available-masters`

**权限**: 学生本人

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nickname": "大师A",
      "avatar_url": "...",
      "master_specialties": ["React", "Node.js"],
      "master_fee": 200.00,
      "master_total_tasks": 50,
      "master_avg_rating": 4.8,
      "master_bio": "10年前端开发经验"
    }
  ]
}
```

---

### 1.5 召唤大师

**端点**: `POST /api/v1/tasks/:taskId/summon-master`

**权限**: 学生本人

**请求体**:
```json
{
  "masterId": "uuid",
  "message": "需要React组件优化方面的指导"
}
```

**响应**:
```json
{
  "success": true,
  "message": "大师已召唤，大师费用已冻结"
}
```

---

## 2. 组队系统 API

### 2.1 创建队伍

**端点**: `POST /api/v1/teams-new`

**权限**: 仅Lv.6学生

**请求体**:
```json
{
  "name": "前端开发小队",
  "taskId": "uuid",
  "maxMembers": 5,
  "requiredSkills": ["React", "TypeScript"],
  "description": "寻找前端开发伙伴",
  "track": "dev"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "teamId": "uuid"
  },
  "message": "队伍创建成功"
}
```

---

### 2.2 获取队伍详情

**端点**: `GET /api/v1/teams-new/:id`

**权限**: 所有认证用户

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "前端开发小队",
    "creator_name": "创建者",
    "status": "recruiting",
    "current_members": 2,
    "max_members": 5,
    "members": [
      {
        "user_id": "uuid",
        "nickname": "成员A",
        "role": "leader",
        "assigned_module": "用户界面"
      }
    ]
  }
}
```

---

### 2.3 申请加入队伍

**端点**: `POST /api/v1/teams-new/:id/apply`

**权限**: Lv.5+学生

**请求体**:
```json
{
  "message": "我擅长React开发，希望加入"
}
```

**响应**:
```json
{
  "success": true,
  "message": "申请已提交，等待队长审核"
}
```

---

### 2.4 审核入队申请

**端点**: `POST /api/v1/teams-new/:id/review-application`

**权限**: 仅队长

**请求体**:
```json
{
  "applicationId": "uuid",
  "approved": true,
  "assignedModule": "数据处理模块"
}
```

**响应**:
```json
{
  "success": true,
  "message": "申请已通过"
}
```

---

### 2.5 分配任务模块

**端点**: `POST /api/v1/teams-new/:id/assign-module`

**权限**: 队长

**请求体**:
```json
{
  "memberId": "uuid",
  "moduleName": "用户认证模块",
  "moduleDescription": "实现用户登录注册功能"
}
```

**响应**:
```json
{
  "success": true,
  "message": "模块分配成功"
}
```

---

### 2.6 生成外部成员邀请链接

**端点**: `GET /api/v1/teams-new/:id/invite-link`

**权限**: 队长

**响应**:
```json
{
  "success": true,
  "data": {
    "inviteToken": "base64_token",
    "inviteUrl": "https://qicheng.com/teams/join/base64_token"
  }
}
```

**说明**: 外部成员不能超过队伍总人数的30%

---

### 2.7 获取队伍列表

**端点**: `GET /api/v1/teams-new`

**权限**: 所有认证用户

**查询参数**:
- `track`: 赛道过滤 (content/dev/mixed)
- `requiredSkills`: 技能过滤 (逗号分隔)
- `limit`: 每页数量 (默认20)
- `offset`: 偏移量 (默认0)

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "前端开发小队",
      "creator_name": "创建者",
      "status": "recruiting",
      "current_members": 2,
      "max_members": 5
    }
  ]
}
```

---

## 3. 社区板块 API

### 3.1 发布社区帖子

**端点**: `POST /api/v1/community-new/posts`

**权限**: 
- `recruit`类型：仅Lv.6
- 其他类型：Lv.4+

**请求体**:
```json
{
  "type": "recruit",
  "title": "招募前端开发伙伴",
  "content": "我们正在开发一个电商平台...",
  "requiredSkills": ["React", "TypeScript"],
  "teamId": "uuid",
  "track": "dev",
  "vacancyCount": 2
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "postId": "uuid"
  },
  "message": "帖子发布成功"
}
```

---

### 3.2 获取社区帖子列表

**端点**: `GET /api/v1/community-new/posts`

**权限**: Lv.4+

**查询参数**:
- `type`: 帖子类型 (recruit/showcase/collab/discussion)
- `track`: 赛道过滤
- `authorId`: 作者过滤
- `limit`: 每页数量
- `offset`: 偏移量

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "recruit",
      "title": "招募前端开发伙伴",
      "author_name": "作者",
      "author_level": 6,
      "view_count": 100,
      "reply_count": 5,
      "created_at": "2026-05-27T10:00:00Z"
    }
  ]
}
```

---

### 3.3 获取帖子详情

**端点**: `GET /api/v1/community-new/posts/:id`

**权限**: Lv.4+

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "recruit",
    "title": "招募前端开发伙伴",
    "content": "详细内容...",
    "author_name": "作者",
    "replies": [...],
    "userApplication": "pending"
  }
}
```

---

### 3.4 申请加入招募

**端点**: `POST /api/v1/community-new/posts/:id/apply`

**权限**: Lv.5+

**请求体**:
```json
{
  "message": "我有3年React开发经验"
}
```

**响应**:
```json
{
  "success": true,
  "message": "申请已提交"
}
```

---

### 3.5 回复帖子

**端点**: `POST /api/v1/community-new/posts/:id/reply`

**权限**: Lv.4+

**请求体**:
```json
{
  "content": "这个项目很有意思",
  "parentReplyId": "uuid"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "replyId": "uuid"
  },
  "message": "回复成功"
}
```

---

### 3.6 关闭招募帖

**端点**: `POST /api/v1/community-new/posts/:id/close`

**权限**: 仅帖子作者

**响应**:
```json
{
  "success": true,
  "message": "招募已关闭"
}
```

---

### 3.7 获取我的申请列表

**端点**: `GET /api/v1/community-new/my-applications`

**权限**: 所有认证用户

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "post_title": "招募前端开发伙伴",
      "status": "pending",
      "created_at": "2026-05-27T10:00:00Z"
    }
  ]
}
```

---

## 4. 大师系统 API

### 4.1 申请成为大师

**端点**: `POST /api/v1/master/apply`

**权限**: Lv.5+学生

**请求体**:
```json
{
  "specialties": ["React", "Node.js", "TypeScript"],
  "fee": 200.00,
  "minTaskPrice": 1000.00,
  "bio": "10年全栈开发经验，擅长前端架构设计",
  "acceptDesignated": true,
  "allowNegotiation": true
}
```

**响应**:
```json
{
  "success": true,
  "message": "申请已提交，等待管理员审核"
}
```

---

### 4.2 获取大师中心数据

**端点**: `GET /api/v1/master/dashboard`

**权限**: 仅认证大师

**响应**:
```json
{
  "success": true,
  "data": {
    "stats": {
      "total_tasks": 50,
      "completed_tasks": 45,
      "total_earnings": 9000.00,
      "avg_fee": 200.00
    },
    "pendingRequests": [...]
  }
}
```

---

### 4.3 更新大师设置

**端点**: `PUT /api/v1/master/settings`

**权限**: 仅认证大师

**请求体**:
```json
{
  "fee": 250.00,
  "minTaskPrice": 1200.00,
  "acceptDesignated": false
}
```

**响应**:
```json
{
  "success": true,
  "message": "设置已更新"
}
```

---

### 4.4 浏览大师列表

**端点**: `GET /api/v1/masters`

**权限**: 所有认证用户

**查询参数**:
- `track`: 赛道过滤
- `limit`: 每页数量
- `offset`: 偏移量

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nickname": "大师A",
      "master_specialties": ["React", "Node.js"],
      "master_fee": 200.00,
      "master_total_tasks": 50,
      "master_avg_rating": 4.8
    }
  ]
}
```

---

### 4.5 企业邀请大师

**端点**: `POST /api/v1/tasks/:id/invite-master`

**权限**: 仅企业（任务所有者）

**请求体**:
```json
{
  "masterId": "uuid",
  "offer": 2000.00,
  "message": "希望您能指导这个React项目"
}
```

**响应**:
```json
{
  "success": true,
  "message": "邀请已发送"
}
```

---

### 4.6 大师响应邀请

**端点**: `POST /api/v1/invitations/:id/respond`

**权限**: 仅被邀请的大师

**请求体**:
```json
{
  "action": "accept",
  "counterOffer": 2500.00
}
```

**说明**: 
- `action`: "accept" | "reject" | "negotiate"
- `counterOffer`: 仅在negotiate时需要

**响应**:
```json
{
  "success": true,
  "message": "已接受邀请"
}
```

---

### 4.7 大师发送指导消息

**端点**: `POST /api/v1/master/guidance/:taskId`

**权限**: 仅指派的大师

**请求体**:
```json
{
  "message": "你的React组件可以这样优化..."
}
```

**响应**:
```json
{
  "success": true,
  "message": "指导消息已发送"
}
```

---

## 🧪 测试指南

### 使用Postman测试

1. **设置环境变量**:
   - `BASE_URL`: http://localhost:3000
   - `JWT_TOKEN`: 你的JWT token

2. **测试三次审核兜底**:
   ```
   1. 提交3次任务（都不通过）
   2. GET /api/v1/tasks/:taskId/three-strike-status
   3. GET /api/v1/tasks/:taskId/transfer-candidates
   4. POST /api/v1/tasks/:taskId/transfer
   ```

3. **测试组队系统**:
   ```
   1. POST /api/v1/teams-new (Lv.6用户)
   2. GET /api/v1/teams-new/:id
   3. POST /api/v1/teams-new/:id/apply (Lv.5用户)
   4. POST /api/v1/teams-new/:id/review-application (队长)
   ```

4. **测试社区板块**:
   ```
   1. POST /api/v1/community-new/posts (Lv.6用户)
   2. GET /api/v1/community-new/posts
   3. POST /api/v1/community-new/posts/:id/apply (Lv.5用户)
   ```

5. **测试大师系统**:
   ```
   1. POST /api/v1/master/apply (Lv.5用户)
   2. GET /api/v1/masters
   3. POST /api/v1/tasks/:id/invite-master (企业)
   4. POST /api/v1/invitations/:id/respond (大师)
   ```

---

## 📝 错误码说明

| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

---

## 🔄 下一步

1. **前端集成**: 根据此API文档开发前端页面
2. **端到端测试**: 完整测试所有业务流程
3. **性能优化**: 监控API响应时间
4. **文档完善**: 添加更多示例和说明

---

**文档版本**: v1.0  
**最后更新**: 2026-05-27  
**维护者**: Claude (Kiro AI)
