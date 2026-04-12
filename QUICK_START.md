# 启程qicheng - 快速启动指南

## 🚀 5分钟快速启动

### 前置要求

- Node.js 16+
- PostgreSQL 14+
- 微信开发者工具（用于小程序开发）
- npm 或 yarn

---

## 📦 一键启动所有服务

### 方法1: 使用启动脚本（推荐）

```bash
cd /Users/alwan/code/qicheng
chmod +x start-all.sh
./start-all.sh
```

这将自动启动：
- ✅ 后端服务 (端口 3000)
- ✅ 前端管理端 (端口 3002)
- ✅ 学生端小程序编译
- ✅ 企业端小程序编译

### 方法2: 手动启动

#### 1. 启动后端服务
```bash
cd backend
npm install
npm run dev
```
访问: http://localhost:3000

#### 2. 启动前端管理端
```bash
cd frontend
npm install
npm run dev
```
访问: http://localhost:3002

#### 3. 启动学生端小程序
```bash
cd miniapp
npm install
npm run dev:weapp
```
然后用微信开发者工具打开 `miniapp/dist` 目录

#### 4. 启动企业端小程序
```bash
cd company-miniapp
npm install
npm run dev:weapp
```
然后用微信开发者工具打开 `company-miniapp/dist` 目录

---

## 🗄️ 数据库设置

### 1. 创建数据库
```bash
psql -U postgres
CREATE DATABASE qicheng;
\q
```

### 2. 运行迁移
```bash
cd backend
npm run migrate
```

### 3. 导入测试数据（可选）
```bash
cd backend
npm run seed
```

---

## 🧪 测试完整业务流程

### 测试场景：企业发布任务 → 学生接单 → 完成验收

#### Step 1: 企业发布任务
1. 打开企业端小程序
2. 点击"发布任务"
3. 填写任务信息：
   - 标题: "设计公司Logo"
   - 描述: "需要一个简洁现代的Logo设计"
   - 类型: "设计"
   - 截止日期: 7天后
4. 点击"获取AI价格建议"
5. 确认价格（例如：¥500）
6. 点击"支付定金"（¥150，30%）

#### Step 2: AI匹配学生
1. 系统自动匹配10名学生
2. 企业查看匹配结果
3. 选择5名学生
4. 点击"发送邀请"

#### Step 3: 学生接单
1. 打开学生端小程序
2. 点击"任务邀请"
3. 查看任务详情（报酬显示¥425，85%）
4. 点击"立即接单"

#### Step 4: 执行任务
1. 学生点击"我的任务"
2. 进入任务详情
3. 点击"更新进度"
4. 输入进度：50%
5. 添加说明："已完成初稿设计"

#### Step 5: 提交交付物
1. 点击"提交作品"
2. 填写作品说明
3. 上传作品截图
4. 点击"提交"

#### Step 6: AI审核
- 系统自动AI审核
- 评分：85/100
- 反馈："设计风格符合要求，建议优化配色"

#### Step 7: 企业验收
1. 企业端查看交付物
2. 查看AI审核结果
3. 点击"验收通过"
4. 支付尾款（¥350，70%）

#### Step 8: 最终确认
- 企业7天内确认完成
- 或等待7天自动确认
- 学生收到报酬¥425

---

## 🔧 常用命令

### 后端
```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start

# 运行测试
npm test

# 数据库迁移
npm run migrate

# 查看日志
tail -f logs/app.log
```

### 前端
```bash
# 开发模式
npm run dev

# 生产构建
npm run build

# 启动生产服务
npm start
```

### 小程序
```bash
# 开发模式（微信）
npm run dev:weapp

# 生产构建
npm run build:weapp

# 开发模式（H5）
npm run dev:h5
```

---

## 📱 微信开发者工具配置

### 学生端小程序
1. 打开微信开发者工具
2. 导入项目
3. 项目目录: `/Users/alwan/code/qicheng/miniapp/dist`
4. AppID: 使用测试号
5. 项目名称: 启程-学生端

### 企业端小程序
1. 打开微信开发者工具
2. 导入项目
3. 项目目录: `/Users/alwan/code/qicheng/company-miniapp/dist`
4. AppID: 使用测试号
5. 项目名称: 启程-企业端

---

## 🌐 访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 后端API | http://localhost:3000 | RESTful API |
| 管理端 | http://localhost:3002 | 管理后台 |
| 学生端 | 微信开发者工具 | 小程序 |
| 企业端 | 微信开发者工具 | 小程序 |
| API文档 | http://localhost:3000/api-docs | Swagger文档 |
| 健康检查 | http://localhost:3000/health | 服务状态 |

---

## 🐛 常见问题排查

### 问题1: 端口被占用
```bash
# 查看端口占用
lsof -i :3000
lsof -i :3002

# 杀死进程
kill -9 <PID>
```

### 问题2: 数据库连接失败
```bash
# 检查PostgreSQL是否运行
pg_isready

# 启动PostgreSQL
brew services start postgresql
```

### 问题3: 小程序编译失败
```bash
# 清除缓存
rm -rf node_modules
rm -rf dist
npm install
npm run dev:weapp
```

### 问题4: 前端页面404
```bash
# 清除Next.js缓存
rm -rf .next
npm run dev
```

### 问题5: 定时任务未执行
```bash
# 查看日志
tail -f backend/logs/app.log | grep "自动确认"

# 手动触发（开发环境）
# 定时任务会在启动时自动执行一次
```

---

## 📊 监控和日志

### 查看实时日志
```bash
# 后端日志
tail -f backend/logs/app.log

# 错误日志
tail -f backend/logs/error.log

# 定时任务日志
tail -f backend/logs/cron.log
```

### 数据库查询
```bash
# 连接数据库
psql -U postgres -d qicheng

# 查看任务列表
SELECT id, title, status, created_at FROM tasks ORDER BY created_at DESC LIMIT 10;

# 查看支付记录
SELECT * FROM payments ORDER BY created_at DESC LIMIT 10;

# 查看匹配记录
SELECT * FROM task_matches WHERE task_id = 'xxx';
```

---

## 🔐 环境变量配置

### backend/.env
```env
NODE_ENV=development
PORT=3000

# 数据库
DB_HOST=localhost
DB_PORT=5432
DB_NAME=qicheng
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# AI服务
AI_SERVICE_URL=http://localhost:8001

# 微信小程序
WECHAT_APP_ID=your_app_id
WECHAT_APP_SECRET=your_app_secret
```

### frontend/.env.local
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

---

## 📚 相关文档

- [完整业务流程文档](./COMPLETE_BUSINESS_FLOW.md)
- [API接口文档](./API_DOCUMENTATION.md)
- [数据库设计文档](./DATABASE_SCHEMA.md)
- [前端开发指南](./FRONTEND_GUIDE.md)

---

## 🎯 下一步

1. ✅ 阅读[完整业务流程文档](./COMPLETE_BUSINESS_FLOW.md)
2. ✅ 运行测试流程验证功能
3. ✅ 查看API文档了解接口
4. ✅ 自定义配置和样式
5. ✅ 部署到生产环境

---

## 💡 开发技巧

### 快速重启所有服务
```bash
./stop-all.sh && ./start-all.sh
```

### 只启动后端和前端（不启动小程序）
```bash
# 终端1
cd backend && npm run dev

# 终端2
cd frontend && npm run dev
```

### 热重载开发
- 后端: 使用 `nodemon` 自动重启
- 前端: Next.js 自动热重载
- 小程序: Taro 自动编译

### 调试技巧
1. 使用 VS Code 断点调试
2. 查看浏览器 Network 面板
3. 使用微信开发者工具的调试器
4. 查看后端日志文件

---

## 🚨 紧急停止

如果需要立即停止所有服务：

```bash
./stop-all.sh
```

或手动停止：
```bash
# 停止所有Node进程
pkill -f node

# 停止特定端口
lsof -ti:3000 | xargs kill -9
lsof -ti:3002 | xargs kill -9
```

---

## ✅ 启动检查清单

- [ ] PostgreSQL 已启动
- [ ] 数据库已创建
- [ ] 数据库迁移已运行
- [ ] 后端服务已启动 (端口3000)
- [ ] 前端服务已启动 (端口3002)
- [ ] 学生端小程序已编译
- [ ] 企业端小程序已编译
- [ ] 微信开发者工具已打开
- [ ] 环境变量已配置
- [ ] 可以访问健康检查接口

---

## 📞 获取帮助

如遇到问题：
1. 查看本文档的"常见问题排查"部分
2. 查看日志文件
3. 查看完整业务流程文档
4. 联系开发团队

---

**祝你开发愉快！🎉**
