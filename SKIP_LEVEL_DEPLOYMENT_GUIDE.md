# 跳级系统完整部署指南

## ✅ 已完成的工作

### 前端部分
1. ✅ 8个完整页面（含样式）
2. ✅ 前端API服务层 (`/src/services/skipLevel.ts`)
3. ✅ 路由配置（`app.config.ts`）
4. ✅ TypeScript类型定义

### 后端部分
1. ✅ Controller层 (`/backend/src/controllers/skipLevelController.ts`)
2. ✅ Service层 (`/backend/src/services/skipLevelService.ts`)
3. ✅ 路由配置 (`/backend/src/routes/skipLevel.ts`)
4. ✅ 数据库迁移文件 (`/backend/migrations/skip_level_system.sql`)
5. ✅ 在app.ts中注册路由

## 🚀 部署步骤

### 第一步：数据库迁移

```bash
# 连接到数据库
mysql -u your_username -p your_database

# 执行迁移文件
source /path/to/backend/migrations/skip_level_system.sql

# 或者直接执行
mysql -u your_username -p your_database < backend/migrations/skip_level_system.sql

# 验证表是否创建成功
SHOW TABLES LIKE 'skip_level%';
```

应该看到6张表：
- skip_level_applications
- skip_level_tasks
- skip_level_progress
- skip_level_submissions
- skip_level_scores
- skip_level_cooldowns

### 第二步：编译后端

```bash
cd backend

# 安装依赖（如果需要）
npm install

# 编译TypeScript
npm run build

# 或者使用开发模式
npm run dev
```

### 第三步：编译前端

```bash
cd miniapp

# 安装依赖（如果需要）
npm install

# 编译微信小程序
npm run dev:weapp
```

### 第四步：配置环境变量

确保后端 `.env` 文件包含数据库配置：
```env
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database
```

### 第五步：添加入口（可选）

在"我的"页面或合适位置添加跳级入口：

```typescript
// 在pages/profile/index.tsx 或其他页面
Taro.navigateTo({
  url: '/packageGrowth/pages/skip-level-intro/index'
})
```

## 📋 API端点清单

所有端点都在 `/api/skip-level` 路径下：

1. `GET /api/skip-level/eligibility` - 检查资格
2. `POST /api/skip-level/apply` - 申请跳级
3. `GET /api/skip-level/task/:taskId` - 获取任务详情
4. `POST /api/skip-level/task/:taskId/receive` - 领取任务
5. `GET /api/skip-level/progress/:taskId` - 获取进度
6. `PUT /api/skip-level/progress/:taskId/subtask/:subTaskId` - 更新进度
7. `POST /api/skip-level/submit/:taskId` - 提交作品
8. `POST /api/skip-level/score/:taskId/request` - 申请评分
9. `GET /api/skip-level/score/:taskId` - 获取评分
10. `GET /api/skip-level/rewards/:taskId` - 获取奖励
11. `POST /api/skip-level/rewards/:taskId/claim` - 领取奖励
12. `GET /api/skip-level/improvement/:taskId` - 获取改进建议

## 🧪 测试步骤

### 1. 测试资格检查
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/skip-level/eligibility
```

### 2. 测试申请跳级
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"targetLevel": 4}' \
  http://localhost:3000/api/skip-level/apply
```

### 3. 在微信开发者工具中测试
1. 打开项目
2. 导航到跳级说明页
3. 测试完整流程

## 🔧 导师评分功能

导师评分需要单独开发界面。可以创建一个导师端页面：

```typescript
// backend/src/routes/skipLevel.ts 添加导师评分接口
router.post('/score/:taskId/submit', authenticateToken, async (req, res) => {
  const { taskId } = req.params;
  const { totalScore, breakdown, comment } = req.body;
  const mentorId = req.user.id;

  // 保存评分
  await pool.query(
    'INSERT INTO skip_level_scores (task_id, total_score, breakdown, mentor_id, mentor_comment) VALUES (?, ?, ?, ?, ?)',
    [taskId, totalScore, JSON.stringify(breakdown), mentorId, comment]
  );

  // 更新申请状态
  const status = totalScore >= 80 ? 'passed' : 'failed';
  await pool.query(
    'UPDATE skip_level_applications SET status = ? WHERE task_id = ?',
    [status, taskId]
  );

  // 如果失败，创建冷却期
  if (totalScore < 80) {
    const [apps] = await pool.query(
      'SELECT student_id FROM skip_level_applications WHERE task_id = ?',
      [taskId]
    );
    await pool.query(
      'INSERT INTO skip_level_cooldowns (student_id, levels_required) VALUES (?, 2)',
      [apps[0].student_id]
    );
  }

  res.json({ success: true });
});
```

## ⏰ 定时任务（超时检查）

创建定时任务检查超时：

```typescript
// backend/src/cron/skipLevelCron.ts
import cron from 'node-cron';
import pool from '../config/database';

// 每小时检查一次
cron.schedule('0 * * * *', async () => {
  console.log('检查跳级任务超时...');

  const [expiredTasks] = await pool.query(
    'SELECT task_id, student_id FROM skip_level_applications WHERE status = "in_progress" AND deadline < NOW()'
  );

  for (const task of expiredTasks) {
    // 标记为失败
    await pool.query(
      'UPDATE skip_level_applications SET status = "failed" WHERE task_id = ?',
      [task.task_id]
    );

    // 创建冷却期
    await pool.query(
      'INSERT INTO skip_level_cooldowns (student_id, levels_required) VALUES (?, 2)',
      [task.student_id]
    );

    console.log(`任务 ${task.task_id} 已超时`);
  }
});
```

然后在 `app.ts` 中导入：
```typescript
import './cron/skipLevelCron';
```

## 📊 监控学员升级（更新冷却期）

在学员升级的逻辑中添加：

```typescript
// backend/src/services/studentService.ts
async function onLevelUp(studentId: number) {
  // 更新冷却期
  await pool.query(
    'UPDATE skip_level_cooldowns SET levels_completed = levels_completed + 1 WHERE student_id = ? AND levels_completed < levels_required',
    [studentId]
  );
}
```

## 🎯 功能验证清单

- [ ] 数据库表已创建
- [ ] 后端编译成功
- [ ] 前端编译成功
- [ ] 可以访问跳级说明页
- [ ] 资格检查API工作正常
- [ ] 可以申请跳级
- [ ] 可以领取任务
- [ ] 可以提交作品
- [ ] 导师可以评分
- [ ] 通过后可以领取奖励
- [ ] 失败后进入冷却期
- [ ] 超时自动失败

## 🐛 常见问题

### 1. 编译错误：找不到模块
```bash
# 确保所有依赖已安装
npm install
```

### 2. 数据库连接失败
检查 `.env` 文件配置是否正确

### 3. 路由404
确保 `app.ts` 中已注册路由：
```typescript
app.use('/api/skip-level', skipLevelRoutes);
```

### 4. 前端页面找不到
检查 `app.config.ts` 中 `packageGrowth` 分包是否包含所有页面

## 📞 需要帮助？

如果遇到问题：
1. 检查控制台错误日志
2. 验证数据库表是否正确创建
3. 确认所有文件路径正确
4. 检查用户认证是否正常

## 🎉 完成！

部署完成后，用户可以：
1. 从"我的"页面进入跳级系统
2. 查看跳级规则和可跳级路径
3. 选择目标级别并申请
4. 完成挑战任务
5. 等待导师评分
6. 领取奖励或查看改进建议
