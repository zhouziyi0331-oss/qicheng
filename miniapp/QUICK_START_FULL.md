# 启程OPC - 快速启动指南

这是启程OPC实践拆解与孵化系统的完整实现。包含前端小程序和后端服务。

## 📦 项目结构

```
qicheng/miniapp/
├── src/                    # 前端小程序（Taro + React）
├── backend/                # 后端服务（Node.js + Express + MongoDB）
├── docs/                   # 文档
├── BACKEND_API_SPEC.md     # 后端API规范
└── PRACTICE_DECOMPOSITION_SYSTEM.md  # AI拆解系统设计文档
```

## 🚀 一键启动

### 1. 启动后端服务

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑.env，填入OpenAI API Key和MongoDB连接

# 启动开发服务器
npm run dev
```

后端服务将在 `http://localhost:3000` 启动

### 2. 启动前端小程序

```bash
# 回到项目根目录
cd ..

# 启动微信小程序
npm run dev:weapp
```

在微信开发者工具中打开项目目录，即可预览

## ⚙️ 环境配置

### 后端必需配置 (backend/.env)

```env
# OpenAI API (GPT-4) - 必填
OPENAI_API_KEY=sk-your-key-here

# MongoDB - 必填
MONGODB_URI=mongodb://localhost:27017/qicheng_opc

# JWT密钥 - 必填
JWT_SECRET=your-random-secret-key

# 服务端口
PORT=3000
```

### 前端API配置 (src/services/api.ts)

确保baseURL指向后端服务地址：
```typescript
const baseURL = 'http://localhost:3000/api'
```

## 🎯 核心功能

### 1. AI实践拆解系统 ⭐
- 自动分析完成的项目
- 生成5大模块：能力拆解、问题价值、目标客户、获客渠道、成长路径
- 付费解锁机制（¥29.9/份）

### 2. 实践项目管理
- 项目列表（支持筛选）
- 项目详细报告
- 进度跟踪

### 3. 联系方式交换
- 合作2次以上可申请
- 双方确认机制

## 📚 文档

- [后端API完整文档](./backend/README.md)
- [API规范](./BACKEND_API_SPEC.md)
- [AI拆解系统设计](./PRACTICE_DECOMPOSITION_SYSTEM.md)

## 🧪 测试API

后端启动后，访问健康检查：
```bash
curl http://localhost:3000/health
```

## 🐳 Docker部署

```bash
cd backend
docker-compose up -d
```

## ⚠️ 注意事项

1. **OpenAI API Key**: 必须配置有效的GPT-4访问权限
2. **MongoDB**: 确保MongoDB服务运行正常
3. **微信小程序**: 需要在微信公众平台配置服务器域名

## 💰 付费功能

AI拆解报告为付费功能，需要集成微信支付：
- 单次解锁: ¥29.9
- 包月: ¥99
- 终身: ¥499

## 🔧 故障排查

### 前端编译错误
```bash
# 清除缓存重新编译
rm -rf dist/
npm run dev:weapp
```

### 后端连接失败
- 检查MongoDB是否运行
- 检查.env配置是否正确
- 查看后端日志排查错误

## 📞 技术支持

如遇问题，请查看：
1. 后端日志: `npm run dev` 的控制台输出
2. MongoDB日志
3. 微信开发者工具控制台
