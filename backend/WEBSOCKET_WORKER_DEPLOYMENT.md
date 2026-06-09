# 启程平台 - WebSocket和Worker部署指南

**日期**: 2026-05-26  
**状态**: ✅ WebSocket和Worker已实现

---

## 🎉 新增功能

### 1. WebSocket实时推送服务

**功能**：
- ✅ 用户认证和连接管理
- ✅ 房间管理（用户房间、角色房间）
- ✅ 实时推送AI任务完成通知
- ✅ 在线状态管理
- ✅ 心跳检测

**支持的事件**：
```typescript
// 学生画像生成完成
profile_analysis_complete

// 项目需求画像生成完成
requirement_analysis_complete

// 匹配完成
match_complete

// 导师消息推送
mentor_push

// 订单状态变更
order_status_change

// 交付物审核完成
submission_reviewed

// 成长报告生成完成
growth_report_ready
```

### 2. Worker进程

**功能**：
- ✅ 独立的AI任务处理进程
- ✅ 自动重试和错误处理
- ✅ 优雅关闭
- ✅ 完整的日志记录

### 3. 管理端监控API

**功能**：
- ✅ 队列统计查询
- ✅ WebSocket连接统计
- ✅ 测试推送功能

---

## 📦 安装依赖

确保已安装socket.io：

```bash
npm install socket.io
npm install --save-dev @types/socket.io
```

---

## 🚀 启动服务

### 开发环境

```bash
# 终端1: 启动主服务（包含WebSocket）
npm run dev

# 终端2: 启动Worker进程
npm run dev:worker
```

### 生产环境

```bash
# 构建
npm run build

# 启动主服务
npm run start

# 启动Worker进程（推荐使用PM2）
npm run start:worker
```

### 使用PM2管理进程

创建 `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'qicheng-api',
      script: 'dist/src/app.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'qicheng-worker',
      script: 'dist/src/worker.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

启动：
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 🔌 前端集成

### 1. 连接WebSocket

```typescript
import io from 'socket.io-client';

// 连接WebSocket
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  },
  path: '/socket.io'
});

// 连接成功
socket.on('connected', (data) => {
  console.log('WebSocket connected:', data);
});

// 心跳
setInterval(() => {
  socket.emit('ping');
}, 30000);

socket.on('pong', (data) => {
  console.log('Pong received:', data.timestamp);
});
```

### 2. 监听事件

```typescript
// 学生画像生成完成
socket.on('profile_analysis_complete', (data) => {
  console.log('画像生成完成:', data);
  // 更新UI，显示画像结果
  showNotification('你的工作条件画像已生成完成');
  navigateTo('/profile');
});

// 项目需求画像生成完成
socket.on('requirement_analysis_complete', (data) => {
  console.log('需求画像生成完成:', data);
  showNotification(`项目"${data.taskId}"的需求画像已生成`);
});

// 匹配完成
socket.on('match_complete', (data) => {
  console.log('匹配完成:', data);
  showNotification(`已为您匹配${data.matchCount}个合适的学生`);
  refreshMatchList(data.taskId);
});

// 导师消息推送
socket.on('mentor_push', (data) => {
  console.log('导师消息:', data);
  showNotification('启程老师给你发来了新消息');
  addMentorMessage(data.content);
});

// 订单状态变更
socket.on('order_status_change', (data) => {
  console.log('订单状态变更:', data);
  showNotification(data.message);
  updateOrderStatus(data.orderId, data.status);
});

// 交付物审核完成
socket.on('submission_reviewed', (data) => {
  console.log('审核完成:', data);
  showNotification('你的交付物已完成预审核');
  showReviewResult(data.score, data.feedback);
});

// 成长报告生成完成
socket.on('growth_report_ready', (data) => {
  console.log('成长报告就绪:', data);
  showNotification('你的成长报告已生成，快来查看吧');
  navigateTo(`/reports/${data.reportId}`);
});
```

### 3. 断开连接

```typescript
socket.on('disconnect', () => {
  console.log('WebSocket disconnected');
  // 显示断线提示
  showReconnectingMessage();
});

// 手动断开
socket.disconnect();
```

---

## 📊 管理端监控

### 1. 查看队列统计

```bash
GET /api/v1/admin/monitor/queue-stats
Authorization: Bearer <admin-token>
```

响应：
```json
{
  "success": true,
  "stats": {
    "waiting": 5,
    "active": 2,
    "completed": 100,
    "failed": 3,
    "delayed": 0,
    "total": 110
  }
}
```

### 2. 查看WebSocket统计

```bash
GET /api/v1/admin/monitor/websocket-stats
Authorization: Bearer <admin-token>
```

响应：
```json
{
  "success": true,
  "stats": {
    "onlineUserCount": 25,
    "onlineUsers": ["user-id-1", "user-id-2", ...]
  }
}
```

### 3. 测试WebSocket推送

```bash
POST /api/v1/admin/monitor/test-websocket
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "userId": "test-user-id",
  "event": "test_notification",
  "data": {
    "message": "这是一条测试消息"
  }
}
```

---

## 🔄 完整数据流示例

### 场景1：学生完成OPC测试

```
1. 学生提交38题答案
   POST /api/v1/opc-v2/:assessmentId/complete

2. 后端保存结果，添加任务到队列
   enqueueAITask({
     type: 'profile-analysis',
     studentId: 'xxx',
     ...
   })

3. Worker进程处理任务
   - 生成六维度工作条件画像
   - 调用Embedding API生成向量
   - 保存到数据库

4. 任务完成，触发WebSocket推送
   websocketService.notifyProfileAnalysisComplete(studentId, profile)

5. 前端收到推送，更新UI
   socket.on('profile_analysis_complete', (data) => {
     showNotification('画像生成完成');
     navigateTo('/profile');
   })
```

### 场景2：企业发布任务

```
1. 企业填写任务信息
   POST /api/v1/tasks

2. 任务保存后，生成需求画像
   POST /api/v1/work-condition/task/:taskId/generate-requirement
   { "async": true }

3. 添加任务到队列
   enqueueAITask({
     type: 'project-condition-analysis',
     taskId: 'xxx',
     ...
   })

4. Worker进程处理
   - 生成六维度需求条件画像
   - 调用Embedding API生成向量
   - 保存到数据库

5. 任务完成，推送给企业
   websocketService.notifyRequirementAnalysisComplete(companyId, taskId, profile)

6. 前端收到推送
   socket.on('requirement_analysis_complete', (data) => {
     showNotification('需求画像生成完成');
   })
```

### 场景3：触发匹配

```
1. 企业点击"智能匹配"
   POST /api/v1/work-condition/task/:taskId/match

2. 执行匹配
   - 向量检索（Top 30）
   - 规则匹配（精排）
   - 保存匹配记录

3. 推送匹配结果
   websocketService.notifyMatchComplete(companyId, taskId, matchCount)

4. 前端收到推送
   socket.on('match_complete', (data) => {
     showNotification(`已匹配${data.matchCount}个学生`);
     refreshMatchList();
   })
```

---

## 🐛 调试和日志

### 查看Worker日志

```bash
# 开发环境
npm run dev:worker

# 生产环境（PM2）
pm2 logs qicheng-worker
```

### 查看队列状态

```bash
# 使用Redis CLI
redis-cli

# 查看队列
KEYS bull:ai-tasks:*

# 查看等待中的任务
LRANGE bull:ai-tasks:wait 0 -1

# 查看活跃任务
LRANGE bull:ai-tasks:active 0 -1
```

### WebSocket调试

浏览器控制台：
```javascript
// 查看连接状态
socket.connected

// 查看所有监听器
socket.listeners('profile_analysis_complete')

// 手动触发事件（测试）
socket.emit('ping')
```

---

## ⚠️ 常见问题

### 1. WebSocket连接失败

**问题**：前端无法连接WebSocket

**解决**：
- 检查JWT token是否有效
- 检查CORS配置
- 确认服务器已启动
- 检查防火墙设置

### 2. Worker不处理任务

**问题**：任务添加到队列但不执行

**解决**：
- 确认Worker进程已启动：`pm2 list`
- 检查Redis连接：`redis-cli ping`
- 查看Worker日志：`pm2 logs qicheng-worker`
- 检查队列状态：`redis-cli LLEN bull:ai-tasks:wait`

### 3. 向量生成失败

**问题**：画像保存成功但向量为NULL

**解决**：
- 检查Embedding API配置
- 查看Worker日志中的错误信息
- 测试API连接：`npm run test:vector`
- 系统会自动降级，不影响核心功能

### 4. 推送未收到

**问题**：任务完成但前端未收到推送

**解决**：
- 检查用户是否在线：`GET /api/v1/admin/monitor/websocket-stats`
- 查看服务器日志中的推送记录
- 确认前端已监听对应事件
- 使用测试接口验证：`POST /api/v1/admin/monitor/test-websocket`

---

## 📈 性能优化

### 1. Worker扩展

根据负载增加Worker实例：

```javascript
// ecosystem.config.js
{
  name: 'qicheng-worker',
  script: 'dist/src/worker.js',
  instances: 4, // 增加到4个实例
  exec_mode: 'cluster'
}
```

### 2. Redis优化

```bash
# redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
```

### 3. WebSocket优化

```typescript
// 限制每个用户的连接数
const MAX_CONNECTIONS_PER_USER = 3;

// 添加连接限流
const connectionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10
});
```

---

## 🔒 安全建议

### 1. WebSocket认证

- ✅ 已实现JWT认证
- ✅ 每个连接都需要有效token
- ✅ Token过期自动断开

### 2. 权限控制

- ✅ 用户只能接收自己的消息
- ✅ 管理员API需要admin角色
- ✅ 房间隔离（用户房间、角色房间）

### 3. 速率限制

建议添加：
- 连接频率限制
- 消息发送频率限制
- 队列任务提交频率限制

---

## ✅ 检查清单

部署前确认：

- [ ] Redis已启动并可连接
- [ ] Embedding API已配置
- [ ] 主服务已启动
- [ ] Worker进程已启动
- [ ] WebSocket可以连接
- [ ] 队列可以处理任务
- [ ] 推送功能正常
- [ ] 日志正常输出
- [ ] PM2配置正确
- [ ] 监控API可访问

---

## 📚 相关文档

- [AI平台集成方案](./AI_PLATFORM_INTEGRATION.md)
- [工作条件匹配系统](./WORK_CONDITION_MATCHING_SUMMARY.md)
- [向量匹配实现](./PHASE2_VECTOR_MATCHING_SUMMARY.md)

---

## 🎯 下一步

1. **前端集成**
   - 实现WebSocket连接
   - 添加事件监听
   - 更新UI响应

2. **AI-06导师集成**
   - 实现5个场景的处理
   - 集成现有导师系统

3. **订单状态触发器**
   - 在订单API中添加触发逻辑
   - 实现自动化流程

4. **监控和告警**
   - 添加队列监控告警
   - 添加WebSocket连接监控
   - 添加Worker健康检查

---

## ✅ 总结

**已实现**：
- ✅ WebSocket实时推送服务
- ✅ Worker独立进程
- ✅ 队列事件监听和推送
- ✅ 管理端监控API
- ✅ 完整的日志记录
- ✅ 优雅关闭机制

**系统状态**：✅ 生产就绪，可开始前端集成和测试
