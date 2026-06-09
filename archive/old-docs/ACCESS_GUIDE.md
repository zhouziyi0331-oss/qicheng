# 启程项目 - 三端访问指南

## 🌐 服务访问地址

### 前端应用（统一入口）
- **地址**: http://localhost:3002
- **说明**: 所有三个端口都通过这个地址访问，根据路由区分

### 后端API
- **地址**: http://localhost:3000
- **健康检查**: http://localhost:3000/health

### AI服务
- **地址**: http://localhost:8001
- **健康检查**: http://localhost:8001/health

---

## 📱 三个端口访问路径

### 1. 学生端（你原有的代码，未被覆盖）

#### 首页和核心功能
- **首页**: http://localhost:3002/
- **登录**: http://localhost:3002/login
- **注册**: http://localhost:3002/register
- **OPC测评**: http://localhost:3002/onboarding

#### 任务相关
- **任务大厅**: http://localhost:3002/tasks
- **任务详情**: http://localhost:3002/tasks/[id]
- **我的任务**: http://localhost:3002/my-tasks

#### 能力成长
- **能力图谱**: http://localhost:3002/ability
- **跳级挑战**: http://localhost:3002/level-challenge ✨新增
- **成长时间线**: http://localhost:3002/timeline
- **启程之旅**: http://localhost:3002/journey

#### 其他功能
- **AI导师**: http://localhost:3002/mentor
- **故事墙**: http://localhost:3002/story
- **OPC报告**: http://localhost:3002/reports
- **个人中心**: http://localhost:3002/profile
- **提现**: http://localhost:3002/withdraw
- **通知中心**: http://localhost:3002/notifications
- **聊天**: http://localhost:3002/chat/[id]

---

### 2. 企业端

#### 核心功能
- **企业首页**: http://localhost:3002/company
- **发布任务**: http://localhost:3002/company/post
- **任务管理**: http://localhost:3002/company/tasks
- **企业设置**: http://localhost:3002/company/settings

---

### 3. 管理端

#### 核心功能
- **管理后台**: http://localhost:3002/admin
- **数据看板**: http://localhost:3002/admin （含图表）✨增强
- **任务管理**: http://localhost:3002/admin/tasks
- **学生管理**: http://localhost:3002/admin/students
- **学生详情**: http://localhost:3002/admin/students/[id]
- **客服工具**: http://localhost:3002/admin/support
- **财务管理**: http://localhost:3002/admin/finance
- **通知推送**: http://localhost:3002/admin/broadcast
- **操作日志**: http://localhost:3002/admin/logs
- **系统配置**: http://localhost:3002/admin/config

---

## 🔑 测试账号

### 学生账号
```
手机号: 13800138000
密码: test123456
```

### 企业账号
```
手机号: 13900139000
密码: test123456
```

### 管理员账号
```
手机号: 13700137000
密码: admin123456
```

---

## ✅ 功能验证清单

### 学生端功能
- [ ] 登录/注册
- [ ] OPC测评
- [ ] 浏览任务大厅
- [ ] 接受任务
- [ ] 查看任务详情
- [ ] **AI拆解指导** ✨新增
- [ ] 提交任务
- [ ] 查看能力图谱
- [ ] **跳级挑战** ✨新增
- [ ] AI导师聊天
- [ ] 查看成长时间线
- [ ] 发布故事
- [ ] 提现

### 企业端功能
- [ ] 企业登录
- [ ] 发布任务
- [ ] 查看任务列表
- [ ] **查看学生能力画像（匿名）** ✨新增
- [ ] **查看任务进度** ✨新增
- [ ] 验收任务
- [ ] 企业设置

### 管理端功能
- [ ] 管理员登录
- [ ] 查看数据看板
- [ ] **查看数据图表（用户增长、任务状态、月度收入）** ✨新增
- [ ] 审核任务
- [ ] 管理学生
- [ ] 查看学生详情
- [ ] 客服工具
- [ ] 财务管理
- [ ] 发送通知
- [ ] 查看操作日志

---

## 🚀 快速启动

### 方法1: 一键启动（推荐）
```bash
cd /Users/alwan/code/qicheng
./start-all.sh
```

### 方法2: 手动启动
```bash
# 1. 启动后端
cd backend
npm run dev

# 2. 启动AI服务
cd ../ai-service
python main.py

# 3. 启动前端
cd ../frontend
npm run dev
```

---

## 🔍 故障排查

### 前端打不开
```bash
# 检查端口占用
lsof -i:3002

# 杀掉占用进程
lsof -ti:3002 | xargs kill -9

# 重新启动
cd frontend
npm run dev
```

### 后端连接失败
```bash
# 检查后端是否运行
curl http://localhost:3000/health

# 检查环境变量
cat frontend/.env.local
```

### 页面显示错误
```bash
# 查看前端日志
cd frontend
tail -f .next/dev/logs/next-development.log

# 查看后端日志
cd backend
tail -f logs/app.log
```

---

## 📝 重要说明

### 关于学生端代码
✅ **你的学生端代码完全没有被覆盖！**

我只是在以下文件中**新增**了功能：
1. `frontend/app/tasks/[id]/page.tsx` - 添加了AI拆解按钮
2. `frontend/app/ability/page.tsx` - 添加了跳级挑战入口
3. `frontend/app/level-challenge/page.tsx` - 新增页面
4. `frontend/components/StudentProfileModal.tsx` - 新增组件
5. `frontend/components/TaskProgressView.tsx` - 新增组件

所有原有的学生端功能都保持不变，只是增强了部分功能。

### 路由说明
- 学生端路由: `/` `/tasks` `/ability` `/timeline` 等
- 企业端路由: `/company/*`
- 管理端路由: `/admin/*`

三个端口通过路由前缀区分，共用一个Next.js应用。

---

## 🎯 下一步

1. 访问 http://localhost:3002 查看首页
2. 使用测试账号登录
3. 测试各个功能模块
4. 如有问题，查看故障排查部分

---

**更新时间**: 2026-04-09  
**版本**: v1.1.0
