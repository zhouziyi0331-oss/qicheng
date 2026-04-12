# 启程项目 - 三端架构总览

## 项目结构

```
qicheng/
├── backend/              # 后端服务 (Node.js + Express + TypeScript)
├── ai-service/           # AI服务 (Python + FastAPI)
├── frontend/             # 管理端网页 (Next.js 16)
├── miniapp/              # 学生端小程序 (Taro 3 + React)
├── company-miniapp/      # 企业端小程序 (Taro 3 + React) ✨新建
└── docs/                 # 文档
```

## 三端说明

### 1. 学生端小程序 (`miniapp/`)

**目标用户：** 大学生

**核心功能：**
- 任务浏览与接单
- AI智能匹配推荐
- 能力图谱与成长追踪
- AI导师辅导
- 学习报告与数据分析
- 跳级挑战测试

**技术栈：**
- Taro 3.6.39
- React 18
- TypeScript
- 微信小程序

**页面列表：** 16个页面
- index - 首页
- tasks - 任务列表
- my-tasks - 我的任务
- ability - 能力图谱
- level-challenge - 跳级挑战
- mentor - AI导师
- reports - 学习报告
- timeline - 成长时间线
- profile - 个人中心
- notifications - 通知中心
- story - 故事模式
- login/register - 登录注册
- 等

---

### 2. 企业端小程序 (`company-miniapp/`) ✨

**目标用户：** 企业/创业者

**核心功能：**
- 发布任务需求
- AI智能匹配学生
- 任务进度跟踪
- 学生能力查看
- 付款管理
- 数据统计

**技术栈：**
- Taro 3.6.39
- React 18
- TypeScript
- 微信小程序

**页面列表：** 5个页面
- index - 企业首页（数据概览、快速操作）
- tasks - 任务管理（全部/进行中/待处理/已完成）
- publish - 发布任务（表单填写、AI匹配）
- payments - 付款管理（待处理/已完成）
- profile - 企业中心（企业信息、统计数据）

**业务流程：**
1. 企业发布任务
2. AI匹配5位合适学生
3. 推送邀请给学生
4. 学生接受/拒绝
5. 企业选择1位学生
6. 学生执行任务
7. 企业查看进度
8. 学生提交交付物
9. 企业确认并付款

---

### 3. 管理端网页 (`frontend/`)

**目标用户：** 平台管理员

**核心功能：**
- 用户管理（学生、企业）
- 任务审核与管理
- 数据统计与可视化
- 财务管理
- 客服工具
- 通知推送
- 操作日志

**技术栈：**
- Next.js 16
- React 18
- TypeScript
- Tailwind CSS

**访问地址：** http://localhost:3002

**页面列表：** 10+个页面
- /admin - 管理后台首页
- /admin/tasks - 需求管理
- /admin/students - 学生数据
- /admin/finance - 财务管理
- /admin/support - 客服工具
- /admin/broadcast - 通知推送
- /admin/logs - 操作日志
- 等

---

## 后端服务

### 1. 主后端 (`backend/`)

**技术栈：** Node.js + Express + TypeScript + PostgreSQL

**端口：** 3000

**核心API：**
- `/api/auth/*` - 认证相关
- `/api/tasks/*` - 任务管理
- `/api/students/*` - 学生相关
- `/api/company/*` - 企业相关
- `/api/admin/*` - 管理员相关
- `/api/payments/*` - 付款相关

### 2. AI服务 (`ai-service/`)

**技术栈：** Python + FastAPI

**端口：** 8000

**核心功能：**
- AI智能匹配（学生-任务）
- 任务拆解与指导
- 能力评估
- 学习路径推荐

---

## 启动指南

### 方式一：启动所有服务

```bash
# 启动所有服务（包含两个小程序编译）
./start-all-with-miniapps.sh

# 停止所有服务
./stop-all-with-miniapps.sh
```

### 方式二：分别启动

```bash
# 1. 启动Docker
docker-compose up -d

# 2. 启动后端
cd backend && npm run dev

# 3. 启动AI服务
cd ai-service && source venv/bin/activate && python main.py

# 4. 启动管理端网页
cd frontend && npm run dev

# 5. 启动学生端小程序
cd miniapp && npm run dev

# 6. 启动企业端小程序
cd company-miniapp && npm run dev
```

### 微信开发者工具

1. 打开微信开发者工具
2. 导入项目 - 选择 `miniapp` 目录（学生端）
3. 再打开一个窗口 - 选择 `company-miniapp` 目录（企业端）

---

## 服务端口

| 服务 | 端口 | 访问地址 |
|------|------|----------|
| 后端API | 3000 | http://localhost:3000 |
| AI服务 | 8000 | http://localhost:8000 |
| 管理端网页 | 3002 | http://localhost:3002 |
| 学生端小程序 | - | 微信开发者工具 |
| 企业端小程序 | - | 微信开发者工具 |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |

---

## 数据流转

```
学生端小程序 ←→ 后端API ←→ 数据库
                ↓
企业端小程序 ←→ AI服务 ←→ 智能匹配
                ↓
管理端网页   ←→ 数据统计
```

---

## 开发状态

✅ 后端服务 - 完成
✅ AI服务 - 完成
✅ 管理端网页 - 完成
✅ 学生端小程序 - 完成
✨ 企业端小程序 - 新建完成

---

## 下一步计划

1. 测试企业端小程序功能
2. 对接后端API
3. 完善AI智能匹配逻辑
4. 三端数据联调
5. 用户体验优化

---

## 文档索引

- [产品需求文档](PRODUCT_REQUIREMENTS.md)
- [实现计划](IMPLEMENTATION_PLAN.md)
- [API文档](BACKEND_API_COMPLETED.md)
- [AI匹配流程](AI_MATCHING_GUIDE.md)
- [测试指南](TESTING_GUIDE.md)
- [部署指南](DEPLOYMENT.md)
