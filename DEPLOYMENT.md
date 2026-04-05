# 启程平台 - 部署指南

## 项目概述
启程是一个学生任务平台，包含学生端、企业端和管理员端三个角色系统。

## 技术栈
- **前端**: Next.js 16.2.2 (Turbopack), TypeScript, Tailwind CSS
- **后端**: Express.js, TypeScript, PostgreSQL, Redis
- **AI引擎**: Anthropic Claude API
- **支付**: 微信支付、支付宝
- **存储**: 阿里云OSS
- **短信**: 阿里云短信服务

## 快速开始

### 1. 环境准备
```bash
# 安装依赖
cd backend && npm install
cd ../frontend && npm install

# 启动数据库和Redis (Docker)
docker-compose up -d postgres redis
```

### 2. 数据库初始化
```bash
cd backend
psql -U postgres -d qicheng -f schema.sql
```

### 3. 配置环境变量
```bash
# 后端
cp backend/.env.example backend/.env
# 编辑 .env 填入必要配置

# 前端
cp frontend/.env.local.example frontend/.env.local
```

### 4. 启动服务
```bash
# 后端 (开发模式)
cd backend
npm run dev

# 前端 (开发模式)
cd frontend
npm run dev
```

访问: http://localhost:3001

## 生产部署

### 1. 构建
```bash
# 后端
cd backend
npm run build

# 前端
cd frontend
npm run build
```

### 2. 启动生产服务
```bash
# 后端
cd backend
NODE_ENV=production node dist/app.js

# 前端
cd frontend
npm start
```

### 3. 使用PM2管理进程
```bash
# 安装PM2
npm install -g pm2

# 启动后端
cd backend
pm2 start dist/app.js --name qicheng-api

# 启动前端
cd frontend
pm2 start npm --name qicheng-web -- start

# 保存配置
pm2 save
pm2 startup
```

## 功能模块

### 核心功能
- ✅ 用户认证 (手机号+验证码)
- ✅ 任务流程 (发布/接单/提交/审核)
- ✅ AI引擎 (OPC分析、情绪信号、内容审核)
- ✅ 支付系统 (充值/提现/首单垫付)
- ✅ 文件上传 (本地/OSS)
- ✅ 实时聊天 (任务沟通)
- ✅ 故事墙 (用户分享)
- ✅ 成长时间线 (里程碑记录)
- ✅ 后台管理 (9大模块)

### 定时任务
- 首单24小时结算 (每5分钟)
- 情绪信号检测 (每小时)

## 环境变量说明

### 必需配置
- `DB_*`: PostgreSQL数据库连接
- `REDIS_*`: Redis缓存连接
- `JWT_SECRET`: JWT签名密钥

### 可选配置
- `ALIYUN_*`: 阿里云短信/OSS (未配置时使用开发模式)
- `WECHAT_*` / `ALIPAY_*`: 支付接口 (未配置时返回模拟参数)
- `ANTHROPIC_API_KEY`: AI功能 (未配置时跳过AI审核)

## 测试

### 后端测试
```bash
cd backend
npm test
```

### 前端构建测试
```bash
cd frontend
npm run build
```

## 监控和日志

### 日志位置
- 后端日志: `backend/logs/app.log`
- 错误日志: `backend/logs/error.log`

### PM2监控
```bash
pm2 monit
pm2 logs qicheng-api
pm2 logs qicheng-web
```

## 常见问题

### 1. Redis连接失败
确保Redis服务已启动: `docker-compose up -d redis`

### 2. 数据库连接失败
检查PostgreSQL配置和连接字符串

### 3. 文件上传失败
- 开发模式: 确保 `uploads/` 目录存在
- 生产模式: 配置OSS环境变量

### 4. AI功能不工作
配置 `ANTHROPIC_API_KEY` 环境变量

## 安全建议

1. **生产环境必须修改**:
   - JWT_SECRET (至少32位随机字符串)
   - 数据库密码
   - Redis密码

2. **HTTPS配置**:
   使用Nginx反向代理并配置SSL证书

3. **防火墙规则**:
   只开放必要端口 (80, 443)

4. **定期备份**:
   - 数据库每日备份
   - 文件存储定期快照

## 联系方式
- 技术支持: tech@qicheng.com
- 文档: https://docs.qicheng.com
