# 启程平台 (Qicheng)

一个面向学生的AI驱动任务平台，帮助学生通过完成企业任务获得收入并成长。

## 项目结构

```
qicheng/
├── backend/          # Express.js 后端
│   ├── src/
│   │   ├── routes/   # API路由 (28个模块)
│   │   ├── utils/    # 工具函数 (7个模块)
│   │   ├── middleware/ # 中间件
│   │   └── jobs/     # 定时任务
│   └── tests/        # 后端测试
├── frontend/         # Next.js 前端
│   ├── app/          # 页面路由 (29个页面)
│   ├── components/   # UI组件
│   ├── lib/          # API客户端
│   └── store/        # 状态管理
├── miniapp/          # Taro 微信小程序
│   ├── src/
│   │   ├── pages/    # 小程序页面 (7个)
│   │   └── app.tsx   # 入口文件
│   └── dist/         # 编译输出
└── docs/             # 文档
```

## 核心功能

### 学生端
- 🎯 任务大厅 - 浏览和接单
- 📝 我的任务 - 任务管理和提交
- 📊 能力成长 - 六维能力雷达图
- 💬 故事墙 - 分享经验
- 🎓 OPC报告 - 职业能力分析
- 🚀 启程之旅 - Onboarding进度
- 📈 成长时间线 - 里程碑记录

### 企业端
- 📢 发布任务 - 创建需求
- 👥 任务管理 - 审核学生提交
- 💼 企业主页 - 信息管理

### 管理员端
- 📊 数据看板 - 平台统计
- 🔍 需求管理 - 任务审核
- 👨‍🎓 学生数据 - 用户管理
- 💰 财务管理 - 提现审批
- 📝 操作日志 - 审计追踪
- 📢 通知广播 - 批量推送
- ⚙️ 系统配置 - 参数设置

## 技术栈

### 后端
- **Runtime**: Node.js 20
- **Framework**: Express 4
- **Language**: TypeScript 5
- **Database**: PostgreSQL 16 + pgvector
- **Cache**: Redis 7
- **Auth**: JWT

### Web 前端
- **Framework**: Next.js 16.2.2
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS
- **Build**: Turbopack

### 微信小程序
- **Framework**: Taro 3.6
- **Language**: TypeScript 5
- **UI**: React 18
- **Styling**: SCSS

## 技术特性

### AI引擎
- OPC能力分析 (基于Claude API)
- 情绪信号检测 (冷却/挫败/兴奋)
- 内容审核 (故事墙发帖过滤)

### 支付系统
- 微信支付/支付宝集成
- 首单平台垫付 (24小时结算)
- 提现管理

### 文件存储
- 本地存储 (开发模式)
- 阿里云OSS (生产模式)

### 定时任务
- 首单自动结算 (每5分钟)
- 情绪信号检测 (每小时)

## 🎨 设计系统

### 配色方案
- **主色调**：紫色渐变 `#8B5CF6` → `#7C3AED`
- **辅助色**：粉色 `#EC4899`
- **点缀色**：青色 `#06B6D4`
- **背景色**：浅紫 `#F5F3FF` → 浅粉 `#FCE7F3` → 浅青 `#ECFEFF`

### 设计风格
- ✨ 扁平插画风格
- 🌈 渐变配色
- 🔮 圆润边角（32px）
- 💫 流畅动画
- 🎭 装饰性元素（光晕、渐变条）

## 快速开始

### 🚀 一键启动（推荐）

```bash
cd /Users/alwan/code/qicheng
./start.sh
```

启动后自动打开浏览器访问：**http://localhost:3000**

详细说明：[START_GUIDE.md](START_GUIDE.md)

### 📱 微信小程序

```bash
cd miniapp
npm run build
```

然后在微信开发者工具中打开 `miniapp/dist` 目录

详细说明：[miniapp/START.md](miniapp/START.md)

### 🎨 设计系统展示

访问：**http://localhost:3000/design-demo**

查看完整的设计系统组件

---

### 手动启动

#### 环境要求
- Node.js 18+
- PostgreSQL 14+
- Redis 6+

#### 安装依赖
```bash
# 后端
cd backend && npm install

# 前端
cd frontend && npm install

# 小程序
cd miniapp && npm install
```

#### 配置环境变量
```bash
# 后端
cp backend/.env.example backend/.env

# 前端
cp frontend/.env.local.example frontend/.env.local
```

#### 启动服务
```bash
# 启动数据库和Redis
docker-compose up -d

# 后端 (http://localhost:3001)
cd backend && npm run dev

# 前端 (http://localhost:3000)
cd frontend && npm run dev

# 小程序（开发模式）
cd miniapp && npm run dev
```

## 开发状态

### 已完成 ✅
- [x] 用户认证系统 (手机号+验证码)
- [x] 任务完整流程 (发布/接单/提交/审核)
- [x] AI引擎集成 (OPC分析、情绪检测、内容审核)
- [x] 支付系统 (微信/支付宝)
- [x] 文件上传 (本地/OSS)
- [x] 实时聊天 (任务沟通)
- [x] 故事墙功能
- [x] 成长时间线
- [x] 后台管理系统 (9大模块)
- [x] 定时任务 (结算、情绪检测)
- [x] Web前端29个页面
- [x] 微信小程序7个页面
- [x] 后端28个路由模块
- [x] 设计系统优化（扁平插画风格）
- [x] 一键启动脚本
- [x] 零TODO项

### 待优化 🔄
- [ ] WebSocket实时推送 (当前使用轮询)
- [ ] 前端E2E测试
- [ ] 性能优化和缓存策略
- [ ] 国际化支持

## 测试

```bash
# 后端测试
cd backend && npm test

# 前端构建测试
cd frontend && npm run build
```

## 部署

详见 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 项目统计

- **Web前端页面**: 29个
- **小程序页面**: 7个
- **后端路由**: 28个模块
- **工具模块**: 7个 (db, redis, logger, payment, sms, oss, moderation)
- **定时任务**: 2个 (首单结算、情绪检测)
- **代码行数**: 约6000+ TypeScript文件

## 许可证

MIT License

## 联系方式

- 技术支持: tech@qicheng.com
- 文档: https://docs.qicheng.com
