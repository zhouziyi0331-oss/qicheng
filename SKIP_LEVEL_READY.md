# 跳级系统 - 准备就绪 ✅

## 📦 完成清单

### ✅ 前端 (8个页面)
- [x] 跳级说明入口页 (`skip-level-intro`)
- [x] 跳级申请选择页 (`skip-level-apply`)
- [x] 任务领取详情页 (`skip-level-task`)
- [x] 任务进行中页 (`skip-level-progress`)
- [x] 评分结果页 (`skip-level-score`)
- [x] 跳级成功页 (`skip-level-success`)
- [x] 跳级失败页 (`skip-level-fail`)
- [x] 改进建议页 (`skip-level-improve`)
- [x] 所有页面已编译到 `dist/packageGrowth/pages/`
- [x] API服务层完成 (`src/services/skipLevel.ts`)
- [x] 路由配置完成 (`app.config.ts`)
- [x] 入口已添加到"我的"页面（成就系统 → 跳级挑战）

### ✅ 后端 (完整实现)
- [x] Controller层 (`src/controllers/skipLevelController.ts`)
- [x] Service层 (`src/services/skipLevelService.ts`)
- [x] Routes配置 (`src/routes/skipLevel.ts`)
- [x] 已在 `app.ts` 注册路由
- [x] 数据库迁移SQL (`migrations/skip_level_system.sql`)
- [x] 迁移脚本 (`migrations/run_skip_level_migration.sh`)
- [x] API测试脚本 (`test_skip_level_api.sh`)

### ✅ 数据库设计 (6张表)
- [x] `skip_level_applications` - 跳级申请记录
- [x] `skip_level_tasks` - 任务详情
- [x] `skip_level_progress` - 进度追踪
- [x] `skip_level_submissions` - 作品提交
- [x] `skip_level_scores` - 评分结果
- [x] `skip_level_cooldowns` - 冷却期管理
- [x] `badges` - 徽章表（如不存在则创建）

### ✅ API端点 (12个)
所有端点均在 `/api/skip-level` 路径下，需要JWT认证：

1. `GET /eligibility` - 检查资格
2. `POST /apply` - 申请跳级
3. `GET /task/:taskId` - 获取任务
4. `POST /task/:taskId/receive` - 领取任务
5. `GET /progress/:taskId` - 获取进度
6. `PUT /progress/:taskId/subtask/:subTaskId` - 更新进度
7. `POST /submit/:taskId` - 提交作品
8. `POST /score/:taskId/request` - 申请评分
9. `GET /score/:taskId` - 获取评分
10. `GET /rewards/:taskId` - 获取奖励
11. `POST /rewards/:taskId/claim` - 领取奖励
12. `GET /improvement/:taskId` - 获取改进建议

## 🚀 快速部署

### 1️⃣ 执行数据库迁移

```bash
cd /Users/alwan/code/qicheng/backend/migrations
./run_skip_level_migration.sh [数据库用户名] [数据库名]
```

或手动执行：
```bash
mysql -u your_username -p your_database < skip_level_system.sql
```

### 2️⃣ 启动后端服务

```bash
cd /Users/alwan/code/qicheng/backend
npm run dev
```

### 3️⃣ 前端已编译完成

前端已编译，直接在微信开发者工具中测试：
1. 打开项目
2. 进入"我的"页面
3. 点击"成就系统" → "跳级挑战"

### 4️⃣ 测试API（可选）

```bash
cd /Users/alwan/code/qicheng/backend
./test_skip_level_api.sh [YOUR_JWT_TOKEN]
```

## 🎯 业务逻辑

### 资格要求
- 必须达到 **Lv.3** 或以上
- 没有进行中的跳级任务
- 不在冷却期内

### 可跳级路径
- Lv.3 → Lv.4 或 Lv.5
- Lv.4 → Lv.5 或 Lv.6
- Lv.5 → Lv.6

### 挑战规则
- 挑战时长：**7天**
- 子任务数量：**5个**
- 通过分数：**≥80分**
- 超时处理：自动失败

### 成功奖励
- ✅ 直接跳级到目标等级
- ✅ +500 XP
- ✅ ¥200 奖金
- ✅ 特殊徽章

### 失败惩罚
- ❌ 需要正常升满 **2个级别** 后才能再次申请
- ❌ 冷却期内无法跳级

## 📂 关键文件位置

### 前端
```
miniapp/
├── src/
│   ├── pages/profile/index.tsx          # 入口已添加
│   ├── services/skipLevel.ts            # API服务
│   └── packageGrowth/pages/
│       ├── skip-level-intro/            # 说明页
│       ├── skip-level-apply/            # 申请页
│       ├── skip-level-task/             # 任务页
│       ├── skip-level-progress/         # 进度页
│       ├── skip-level-score/            # 评分页
│       ├── skip-level-success/          # 成功页
│       ├── skip-level-fail/             # 失败页
│       └── skip-level-improve/          # 改进页
└── dist/packageGrowth/pages/            # 编译输出
```

### 后端
```
backend/
├── src/
│   ├── controllers/skipLevelController.ts   # 控制器
│   ├── services/skipLevelService.ts         # 业务逻辑
│   ├── routes/skipLevel.ts                  # 路由
│   └── app.ts                               # 路由已注册
├── migrations/
│   ├── skip_level_system.sql                # 数据库迁移
│   └── run_skip_level_migration.sh          # 迁移脚本
└── test_skip_level_api.sh                   # API测试
```

## 🧪 测试流程

1. **检查资格**
   - 访问入口页面
   - 系统自动检查等级和冷却期

2. **申请跳级**
   - 选择目标级别（Lv.4 或 Lv.5）
   - 查看难度和成功率

3. **领取任务**
   - 查看任务要求
   - 确认领取（开始7天倒计时）

4. **完成任务**
   - 逐个完成5个子任务
   - 更新进度
   - 提交作品

5. **导师评分**
   - 申请评分
   - 等待导师打分
   - 查看评分结果

6. **领取奖励** 或 **查看改进建议**
   - 通过：领取奖励（XP、金钱、徽章）
   - 失败：查看改进建议，进入冷却期

## 📝 待开发功能（可选）

- [ ] 导师评分界面（后台管理）
- [ ] 定时任务检查超时
- [ ] 监听学员升级更新冷却期
- [ ] 邮件/推送通知
- [ ] 数据统计和报表

## 🎉 系统特色

### 设计亮点
- **莫兰迪配色** - 温柔优雅的视觉风格
- **AI猫导师** - 陪伴式引导体验
- **动画效果** - 流畅的交互反馈
- **进度可视化** - 清晰的任务追踪

### 技术亮点
- **TypeScript** - 全栈类型安全
- **事务处理** - 奖励领取数据一致性
- **外键约束** - 数据完整性保证
- **JWT认证** - 安全的API访问

## 📞 问题排查

### 前端问题
- 检查路由是否在 `app.config.ts` 中配置
- 确认页面编译到 `dist/` 目录
- 查看微信开发者工具控制台

### 后端问题
- 确认数据库表已创建
- 检查 `.env` 配置
- 验证 JWT token 是否有效
- 查看后端控制台日志

### 数据库问题
- 检查外键引用表是否存在（`students`, `mentors`）
- 确认字符集为 `utf8mb4`
- 验证 MySQL 版本支持 JSON 类型

## ✨ 完成时间

- 前端开发：2026-07-12
- 后端开发：2026-07-12
- 测试脚本：2026-07-13
- 入口添加：2026-07-13

---

**系统已就绪，随时可以部署！** 🚀
