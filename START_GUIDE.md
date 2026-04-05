# 🚀 启程平台 - 快速启动指南

## 一键启动

```bash
cd /Users/alwan/code/qicheng
./start.sh
```

启动后会自动打开浏览器访问：**http://localhost:3000**

---

## 手动启动

### 1. 启动后端
```bash
cd /Users/alwan/code/qicheng/backend
npm run dev
```

### 2. 启动前端（新终端）
```bash
cd /Users/alwan/code/qicheng/frontend
npm run dev
```

### 3. 访问
打开浏览器访问：**http://localhost:3000**

---

## 🎯 测试功能

### 首页
- 🐱 启程小猫Logo
- 🎨 渐变背景
- 📊 功能卡片

### 登录注册
- 📱 手机号登录
- 🔐 验证码验证

### OPC测评
- 📝 25题测评
- 🤖 AI分析
- 🎯 OPC标签生成

### 任务系统
- 💼 任务大厅
- 📋 任务详情
- 🐱 AI导师聊天
- ✅ 任务提交

### 个人主页
- 👤 个人信息
- 📊 六维能力图
- 💰 余额提现

---

## 🛑 停止服务

```bash
# 查找进程
lsof -ti:3000,3001

# 停止服务
kill $(lsof -ti:3000,3001)
```

---

## 📝 查看日志

```bash
# 后端日志
tail -f /tmp/qicheng-backend.log

# 前端日志
tail -f /tmp/qicheng-frontend.log
```

---

## 🎨 设计系统展示

访问：**http://localhost:3000/design-demo**

可以看到完整的设计系统：
- 按钮组件
- 卡片组件
- 标签组件
- 输入框组件
- 进度条组件
- 加载动画
- 统计卡片
- 任务卡片
- 个人资料卡片
- 空状态
- Toast通知
- 渐变文字
- 装饰性形状

---

## 💡 提示

- 首次启动可能需要等待几秒
- 如果端口被占用，脚本会自动关闭占用进程
- 浏览器会自动打开，如果没有请手动访问 http://localhost:3000
