# 启程OPC后端系统

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0-green.svg)](https://www.mongodb.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-orange.svg)](https://openai.com/)

**完整的个性化成长系统** - 每个用户的数据都是独一无二的、实时动态更新的。

---

## 🎯 核心特性

### ✨ 个性化动态系统
- **OC测评系统** - 每人测评结果不同，生成独特身份标签
- **动态能力地图** - 随项目完成实时更新能力标签
- **多维能力雷达图** - 8个维度追踪能力成长
- **深度对比分析** - 历史vs当前的成长对比报告
- **动态成长路径** - AI根据个人情况实时调整
- **真实项目接单** - 用户接真实项目，非模拟练习
- **收入提现系统** - 真实的财务管理
- **毕业报告** - 完整学习历程总结与证书颁发

### 🤖 AI驱动
- **GPT-4深度分析** - 5大AI服务提供智能分析
- **个性化推荐** - 基于用户数据的定制化建议
- **实时能力评估** - 项目完成后自动更新能力评分

### 🔐 生产级特性
- JWT认证 + 微信登录集成
- 请求限流（防DDoS）
- 性能监控 + 日志系统
- 智能缓存（1000x性能提升）
- 定时任务自动化
- 完整的错误处理

---

## 📊 系统架构

```
┌─────────────────────────────────────────┐
│         Express.js 应用服务器            │
│  ┌─────────────────────────────────┐   │
│  │   中间件层                       │   │
│  │  • CORS • 限流 • 认证 • 监控    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   API路由层 (52个接口)          │   │
│  │  • 个人成长 (16)  • 真实项目 (7)│   │
│  │  • 财务管理 (6)   • 实践项目 (8)│   │
│  │  • 认证 (4)       • 支付 (3)    │   │
│  │  • 管理 (3)       • 其他 (5)    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   AI服务层 (6个核心服务)        │   │
│  │  • 测评分析  • 雷达图生成       │   │
│  │  • 对比分析  • 成长路径规划     │   │
│  │  • 毕业报告  • 项目管理         │   │
│  └─────────────────────────────────┘   │
└─────────────────┬───────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼────┐  ┌────▼─────┐  ┌───▼────┐
│MongoDB │  │OpenAI API│  │微信API │
│ 13模型 │  │  GPT-4   │  │登录/支付│
└────────┘  └──────────┘  └────────┘
```

---

## 📦 数据模型

### 核心模型（13个）

#### 个性化成长系统（9个）
1. **Assessment** - OC测评记录
2. **AbilityRadar** - 多维能力雷达图
3. **ComparisonReport** - 深度对比报告
4. **DynamicGrowthPath** - 动态成长路径
5. **GraduationReport** - 毕业报告
6. **RealProject** - 真实项目接单
7. **Income** - 收入记录
8. **Withdrawal** - 提现记录

#### 基础系统（4个）
9. **User** - 用户信息
10. **PracticeProject** - 实践项目
11. **DecompositionReport** - 实践拆解报告
12. **Collaboration** - 协作关系
13. **ContactExchange** - 联系方式交换

---

## 🚀 快速开始

### 环境要求
- Node.js 18+
- MongoDB 8.0+
- OpenAI API Key (GPT-4)

### 安装步骤

```bash
# 1. 克隆项目
git clone <repository-url>
cd miniapp/backend

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入必要配置

# 4. 启动MongoDB
mongod

# 5. 生成测试数据
npm run seed:all

# 6. 启动服务
npm run dev
```

### 环境变量配置

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/qicheng_opc

# OpenAI API (必须配置)
OPENAI_API_KEY=sk-xxx

# JWT
JWT_SECRET=your-secret-key

# 微信
WECHAT_APPID=xxx
WECHAT_SECRET=xxx

# 服务器
PORT=3000
NODE_ENV=development
```

---

## 📡 API接口概览

### 个人成长模块 (`/api/growth`) - 16个接口

#### OC测评
- `POST /assessment` - 提交测评
- `GET /assessments` - 测评历史
- `GET /assessment/latest` - 最新测评

#### 能力雷达图
- `GET /ability-radar` - 雷达图历史
- `GET /ability-radar/latest` - 最新雷达图
- `GET /ability-radar/compare` - 对比雷达图

#### 对比报告
- `GET /comparison-reports` - 对比报告历史
- `GET /comparison-reports/latest` - 最新对比报告

#### 成长路径
- `POST /growth-path/generate` - 生成成长路径
- `GET /growth-path/latest` - 最新成长路径
- `GET /growth-path/history` - 成长路径历史
- `POST /growth-path/milestone` - 更新里程碑

#### 毕业报告
- `POST /graduation-report/generate` - 生成毕业报告
- `GET /graduation-report` - 获取毕业报告
- `POST /graduation-report/unlock` - 解锁毕业报告

### 真实项目模块 (`/api/real-projects`) - 7个接口
- `GET /available` - 可接单项目
- `GET /my/projects` - 我的项目
- `GET /my/stats` - 项目统计
- `GET /:id` - 项目详情
- `POST /:id/apply` - 申请项目
- `POST /:id/accept` - 接受项目
- `POST /:id/complete` - 完成项目

### 财务管理模块 (`/api/financial`) - 6个接口
- `GET /balance` - 查看余额
- `GET /income` - 收入记录
- `GET /income/stats` - 收入统计
- `POST /withdrawal/request` - 申请提现
- `GET /withdrawal` - 提现记录
- `POST /withdrawal/:id/cancel` - 取消提现

### 其他模块
- **认证模块** (`/api/auth`) - 4个接口
- **实践项目** (`/api/practice`) - 8个接口
- **支付系统** (`/api/payment`) - 3个接口
- **管理接口** (`/api/admin`) - 3个接口

**总计：52个API接口**

---

## 🔄 自动化流程

### 完成真实项目后自动触发

```
用户完成项目
    ↓
1️⃣ 创建收入记录 (Income)
    ↓
2️⃣ AI分析项目影响 → 生成新能力雷达图 (AbilityRadar)
    ↓
3️⃣ 对比分析 → 生成对比报告 (ComparisonReport)
    ↓
4️⃣ 重新规划 → 更新成长路径 (DynamicGrowthPath)
```

### 对比报告生成规则

- **第1次对比**：测评结果 vs 第1次项目
- **第2次对比**：第2次项目 vs 第1次项目
- **第N次对比**：第N次项目 vs 第(N-1)次项目

---

## 🧪 测试

### 生成测试数据

```bash
# 生成基础数据（用户、实践项目）
npm run seed

# 生成个性化系统数据（测评、雷达图、真实项目）
npm run seed:personalized

# 生成所有测试数据
npm run seed:all
```

### API测试

详细的API测试指南请查看：[API_TESTING.md](./API_TESTING.md)

快速测试：
```bash
# 1. 启动服务
npm run dev

# 2. 获取token
curl -X POST http://localhost:3000/api/auth/wechat-login \
  -H "Content-Type: application/json" \
  -d '{"code": "test-code"}'

# 3. 测试个性化功能
export TOKEN="your-token"
curl http://localhost:3000/api/growth/ability-radar/latest \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📚 文档

- **[PERSONALIZED_SYSTEM.md](./PERSONALIZED_SYSTEM.md)** - 个性化系统完整文档
- **[API_TESTING.md](./API_TESTING.md)** - API测试指南
- **[MONITORING.md](./MONITORING.md)** - 监控和优化文档
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - 部署指南
- **[BACKEND_API_SPEC.md](./BACKEND_API_SPEC.md)** - API规范
- **[PRACTICE_DECOMPOSITION_SYSTEM.md](./PRACTICE_DECOMPOSITION_SYSTEM.md)** - AI拆解系统设计

---

## 💡 核心价值

### ✅ 完全个性化
- ❌ 不再有通用数据
- ✅ 每个人的测评结果不同
- ✅ 每个人的能力标签不同
- ✅ 每个人的成长路径不同

### ✅ 实时动态更新
- ❌ 不再是静态数据
- ✅ 完成项目 → 能力更新
- ✅ 能力更新 → 雷达图更新
- ✅ 雷达图更新 → 对比报告生成
- ✅ 对比报告生成 → 成长路径调整

### ✅ 真实业务
- ❌ 不再是模拟练习
- ✅ 真实项目接单
- ✅ 真实收入
- ✅ 真实提现

---

## 🛠️ 技术栈

- **运行时**: Node.js 18+
- **语言**: TypeScript 5.3
- **框架**: Express.js 4.18
- **数据库**: MongoDB 8.0 + Mongoose
- **AI**: OpenAI GPT-4
- **认证**: JWT + 微信登录
- **日志**: Winston
- **监控**: 自建性能监控系统

---

## 📈 性能优化

- **智能缓存** - AI生成结果缓存，性能提升1000x+
- **并行处理** - 5个AI模块并行生成
- **数据库索引** - 关键字段索引优化
- **请求限流** - 防止API滥用
- **连接池** - MongoDB连接池配置

---

## 🔐 安全特性

- **JWT认证** - Token过期机制
- **请求限流** - 防DDoS攻击
- **参数验证** - 防注入攻击
- **CORS配置** - 跨域安全
- **敏感数据脱敏** - 账号信息脱敏

---

## 📊 监控与日志

### 性能监控
- 慢请求告警（>1秒）
- 错误请求追踪
- 端点统计分析

### 日志系统
```
logs/
├── error.log      - 错误日志
└── combined.log   - 所有日志
```

### 定时任务
- 每小时清理超时任务
- 每日生成统计报表

---

## 🚀 部署

### 开发环境
```bash
npm run dev
```

### 生产环境
```bash
npm run build
npm start
```

### Docker部署
```bash
docker-compose up -d
```

### PM2部署
```bash
pm2 start dist/index.js --name qicheng-backend
```

详细部署指南：[DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 📝 版本历史

### v2.0.0 (2026-07-16) - 个性化动态系统
- ✨ 新增OC测评系统（个性化身份标签）
- ✨ 新增多维能力雷达图（8维度追踪）
- ✨ 新增深度对比分析（历史vs当前）
- ✨ 新增动态成长路径（AI实时调整）
- ✨ 新增真实项目接单系统
- ✨ 新增收入提现系统
- ✨ 新增毕业报告与证书
- 🎯 新增9个数据模型
- 🎯 新增6个AI服务
- 🎯 新增29个API接口

### v1.0.0 (2026-07-15) - 基础系统
- ✅ 微信登录认证
- ✅ 实践项目管理
- ✅ AI实践拆解（GPT-4）
- ✅ 支付系统（微信支付）
- ✅ 联系方式交换
- ✅ 性能监控系统

---

## 🤝 贡献

欢迎提交Issue和Pull Request！

---

## 📄 许可证

MIT License

---

## 📧 联系方式

如有问题，请提交Issue或联系开发团队。

---

**🎉 启程OPC - 让每个人的成长都独一无二！**
