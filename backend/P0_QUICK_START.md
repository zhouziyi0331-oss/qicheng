# 🚀 30分钟快速启动指南

**目标**: 完成P0任务，使系统达到可测试状态

---

## 当前状态

- ✅ 代码实现完成（95%）
- ✅ 数据库已部署（100%）
- ✅ 服务已启动（端口3000）
- ⚠️ 缺少依赖（bull、socket.io）
- ⚠️ Redis未运行

---

## 步骤1：修复npm权限（5分钟）

```bash
# 修复npm缓存权限
sudo chown -R $(whoami) ~/.npm

# 验证
npm config get prefix
```

---

## 步骤2：安装依赖（10分钟）

```bash
cd /Users/alwan/code/qicheng/backend

# 安装依赖
npm install bull @types/bull socket.io @types/socket.io

# 验证
npm list bull socket.io
```

---

## 步骤3：启动Redis（5分钟）

```bash
# 安装（如果未安装）
brew install redis

# 启动为后台服务
brew services start redis

# 验证
redis-cli ping
# 应返回：PONG
```

---

## 步骤4：取消代码注释（5分钟）

编辑 `src/app.ts`，取消以下注释：

**位置1（第70-71行）**：
```typescript
import adminMonitorRoutes from './routes/adminMonitorRoutes';
import orderFlowRoutes from './routes/orderFlowRoutes';
```

**位置2（第98-99行）**：
```typescript
const matchingScheduler = require('./services/matchingScheduler').default;
matchingScheduler.start();
```

**位置3（第103-104行和107-108行）**：
```typescript
matchingScheduler.stop();
```

**位置4（第205-206行）**：
```typescript
app.use('/api/v1/admin/monitor', adminMonitorRoutes);
app.use('/api/v1/orders', orderFlowRoutes);
```

---

## 步骤5：重启服务（5分钟）

```bash
# 停止现有服务
pkill -f "ts-node-dev"

# 清理日志
rm -f logs/*.log

# 重启
npm run dev

# 等待启动
sleep 10
```

---

## 验证成功

```bash
# 1. 健康检查
curl http://localhost:3000/health
# 应返回：{"status":"ok",...}

# 2. 检查端口
lsof -i :3000 | grep LISTEN
# 应看到node进程

# 3. 检查日志
tail -50 logs/app.log | grep ERROR
# 应无错误

# 4. 检查Redis
redis-cli ping
# 应返回：PONG
```

---

## 成功标志

✅ 健康检查返回200 OK  
✅ 日志中无Redis错误  
✅ 日志中无"Cannot find module"错误  
✅ matchingScheduler启动成功

---

## 下一步

参考 [NEXT_STEPS_ACTION_PLAN.md](NEXT_STEPS_ACTION_PLAN.md) 继续执行P1任务。

---

**预计时间**: 30分钟  
**难度**: ⭐⭐☆☆☆
