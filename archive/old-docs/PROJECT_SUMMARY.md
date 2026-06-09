# 启程(Qicheng)项目 - 完整开发文档

## 📋 项目概述

**启程(Qicheng)** 是一个AI驱动的学生能力成长与任务匹配平台，帮助大学生通过完成企业任务获得收入，同时提升AI应用能力。

### 核心特色
- 🎯 **OPC能力测评** - 20-30题专业测评，生成个性化能力标签
- 🤖 **AI全程陪伴** - 任务拆解、实时指导、智能验收
- 📊 **六维能力图谱** - 可视化展示学习力、执行力等6个维度
- 🚀 **跳级挑战** - 有经验的学生可快速跳级
- 💰 **首单24h到账** - 降低学生参与门槛
- 🔒 **隐私保护** - 匿名展示，完成2单后解锁联系方式

---

## 🏗️ 技术架构

### 技术栈

#### 后端
- **框架**: Node.js 20 + TypeScript 5 + Express
- **数据库**: PostgreSQL 16 + Redis 7
- **认证**: JWT + bcrypt
- **API文档**: 自动生成的OpenAPI规范

#### AI服务
- **框架**: Python 3.11 + FastAPI
- **AI模型**: Anthropic Claude (Sonnet 4.6)
- **功能**: 任务拆解、能力评估、智能验收

#### 前端
- **框架**: Next.js 16 + React 19
- **样式**: Tailwind CSS 4
- **状态管理**: Zustand
- **图表**: Recharts
- **UI组件**: 自定义组件库

#### 小程序
- **框架**: Taro 3 + React 18
- **平台**: 微信小程序
- **功能**: 与网页端完全对等

### 系统架构图

```
┌─────────────────────────────────────────────────────────┐
│                      用户层                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ 学生端   │  │ 企业端   │  │ 管理端   │             │
│  │ (Web/小程序)│ (Web)    │  │ (Web)    │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│                    API网关层                             │
│              Express + Rate Limiting                     │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│                    业务逻辑层                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ 认证服务 │  │ 任务服务 │  │ 支付服务 │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ 能力服务 │  │ AI服务   │  │ 通知服务 │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│                    数据持久层                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │PostgreSQL│  │  Redis   │  │ 阿里云OSS│             │
│  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 项目结构

```
qicheng/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── routes/         # API路由
│   │   ├── middleware/     # 中间件
│   │   ├── utils/          # 工具函数
│   │   ├── jobs/           # 定时任务
│   │   └── app.ts          # 应用入口
│   ├── migrations/         # 数据库迁移
│   └── package.json
│
├── ai-service/             # AI服务
│   ├── main.py            # FastAPI入口
│   ├── services/          # AI服务模块
│   └── requirements.txt
│
├── frontend/              # 前端应用
│   ├── app/              # Next.js页面
│   ├── components/       # React组件
│   ├── lib/              # 工具库
│   └── package.json
│
├── miniapp/              # 小程序
│   ├── src/
│   │   ├── pages/       # 小程序页面
│   │   ├── components/  # 小程序组件
│   │   └── services/    # API服务
│   └── package.json
│
├── docs/                 # 文档
│   ├── API.md
│   ├── DATABASE.md
│   └── DEPLOYMENT.md
│
├── scripts/              # 脚本
│   ├── start-all.sh     # 一键启动
│   └── stop-all.sh      # 一键停止
│
└── README.md            # 项目说明
```

---

## 🎯 核心功能

### 1. 学生端功能

#### 1.1 OPC能力测评
- 20-30道专业测试题
- AI分析生成能力标签
- 六维能力雷达图
- 个性化成长建议

#### 1.2 任务系统
- **任务大厅**: 浏览所有可接任务
- **定向推送**: AI推荐2-3个匹配任务
- **任务详情**: 查看任务要求和报酬
- **AI拆解**: 获取任务执行步骤指导 ✨新增
- **任务执行**: 分步完成任务
- **任务提交**: 上传交付物
- **进度查看**: 实时查看任务进度 ✨新增

#### 1.3 能力成长
- **能力图谱**: 六维能力可视化
- **跳级挑战**: 5道题测试，通过可跳1-2级 ✨新增
- **成长时间线**: 记录每个里程碑
- **故事墙**: 分享成长故事

#### 1.4 AI导师
- 24/7在线答疑
- 情绪识别与支持
- 个性化学习建议

#### 1.5 收入管理
- 余额查看
- 提现申请
- 收入明细

---

### 2. 企业端功能

#### 2.1 任务管理
- **发布任务**: 填写任务详情和预算
- **任务列表**: 查看所有发布的任务
- **验收管理**: 审核学生提交的交付物
- **进度跟踪**: 实时查看任务执行进度 ✨新增

#### 2.2 学生匹配
- **智能推荐**: AI推荐合适的学生
- **能力画像**: 查看学生匿名能力数据 ✨新增
- **联系解锁**: 完成2单后解锁联系方式

#### 2.3 数据分析
- 任务完成率统计
- 学生表现评价
- 费用明细

---

### 3. 管理端功能

#### 3.1 数据看板 ✨增强
- 用户统计（学生、企业、DAU、WAU）
- 任务统计（总数、完成率、平均时长）
- 财务统计（总收入、平台抽成、已结算）
- **用户增长趋势图** ✨新增
- **任务状态分布图** ✨新增
- **月度收入统计图** ✨新增

#### 3.2 内容管理
- 企业任务审核
- 学生身份验证
- 内容违规处理

#### 3.3 客服工具
- 查看任务聊天记录
- 介入任务纠纷
- 发送系统通知

#### 3.4 财务管理
- 支付记录查询
- 提现审批
- 首单垫付管理

---

## 🆕 本次更新内容 (v1.1.0)

### 新增功能

#### 1. AI拆解指导
- **位置**: 任务详情页
- **功能**: 点击按钮获取AI生成的任务执行步骤、注意事项和推荐资源
- **API**: `GET /api/v1/tasks/:id/breakdown`
- **文件**: 
  - 前端: `frontend/app/tasks/[id]/page.tsx`
  - 后端: `backend/src/routes/tasks/studentController.ts`

#### 2. 跳级挑战
- **位置**: 能力图谱页面
- **功能**: 5道专业能力测试题，通过后可跳级1-2个等级
- **API**: `POST /api/v1/student/level-challenge`
- **文件**:
  - 前端: `frontend/app/level-challenge/page.tsx`
  - 后端: `backend/src/routes/student/controller.ts`
  - 小程序: `miniapp/src/pages/level-challenge/index.tsx`

#### 3. 学生能力画像（匿名）
- **位置**: 企业端任务列表
- **功能**: 弹窗展示学生匿名能力数据，完成2单后解锁联系方式
- **API**: `GET /api/v1/tasks/student-profile/:studentId`
- **文件**:
  - 前端: `frontend/components/StudentProfileModal.tsx`
  - 后端: `backend/src/routes/tasks/companyController.ts`

#### 4. 任务进度实时查看
- **位置**: 任务详情页
- **功能**: 实时显示任务执行进度和步骤状态，每30秒自动刷新
- **API**: `GET /api/v1/tasks/:taskId/progress/:assigneeId`
- **文件**:
  - 前端: `frontend/components/TaskProgressView.tsx`
  - 后端: `backend/src/routes/tasks/studentController.ts`

#### 5. 管理端数据图表
- **位置**: 管理后台
- **功能**: 用户增长趋势、任务状态分布、月度收入统计三个图表
- **API**: `GET /api/v1/admin/dashboard` (增强)
- **文件**:
  - 前端: `frontend/app/admin/page.tsx`
  - 后端: `backend/src/routes/admin/controller.ts`

### 数据库变更

新增3个表：
1. `level_challenges` - 跳级挑战记录
2. `student_tags` - 学生能力标签
3. `task_steps` - 任务执行步骤

迁移文件: `backend/migrations/011_new_features.sql`

### 小程序更新

- ✅ 跳级挑战页面
- ✅ 通知中心页面
- ✅ 能力图谱页面增强（添加跳级入口）

---

## 📊 数据库设计

### 核心表结构

#### users (用户表)
```sql
id              UUID PRIMARY KEY
phone           VARCHAR(11) UNIQUE
password_hash   VARCHAR(255)
role            VARCHAR(20) -- student, company, admin
nickname        VARCHAR(50)
avatar_url      TEXT
created_at      TIMESTAMP
```

#### student_profiles (学生档案)
```sql
user_id         UUID PRIMARY KEY
track           VARCHAR(10) -- A/B赛道
level_a         INT -- 主等级(0-10)
level_b         INT -- 副等级(0-10)
opc_label       VARCHAR(100) -- OPC标签
six_dim_scores  JSONB -- 六维能力分数
total_earnings  DECIMAL(10,2)
task_count      INT
```

#### tasks (任务表)
```sql
id              UUID PRIMARY KEY
company_id      UUID
title           VARCHAR(200)
description     TEXT
budget_gross    DECIMAL(10,2)
budget_net      DECIMAL(10,2)
level_required  INT
status          VARCHAR(20)
created_at      TIMESTAMP
```

#### task_assignments (任务分配)
```sql
id              UUID PRIMARY KEY
task_id         UUID
student_id      UUID
status          VARCHAR(20)
accepted_at     TIMESTAMP
completed_at    TIMESTAMP
```

#### level_challenges (跳级挑战) ✨新增
```sql
id              UUID PRIMARY KEY
user_id         UUID
old_level       INT
new_level       INT
score           INT
passed          BOOLEAN
answers         JSONB
feedback        TEXT
created_at      TIMESTAMP
```

#### student_tags (学生标签) ✨新增
```sql
id              UUID PRIMARY KEY
user_id         UUID
tag_name        VARCHAR(50)
tag_type        VARCHAR(20)
source          VARCHAR(20)
confidence      DECIMAL(3,2)
created_at      TIMESTAMP
```

#### task_steps (任务步骤) ✨新增
```sql
id              UUID PRIMARY KEY
task_id         UUID
student_id      UUID
step_num        INT
step_title      VARCHAR(200)
step_desc       TEXT
status          VARCHAR(20)
completed_at    TIMESTAMP
```

---

## 🚀 部署指南

### 环境要求
- Node.js 20+
- Python 3.11+
- PostgreSQL 16+
- Redis 7+
- Nginx (生产环境)

### 部署步骤

#### 1. 克隆代码
```bash
git clone https://github.com/your-org/qicheng.git
cd qicheng
```

#### 2. 配置环境变量
```bash
# 复制环境变量模板
cp backend/.env.example backend/.env
cp ai-service/.env.example ai-service/.env
cp frontend/.env.example frontend/.env.local

# 编辑配置文件
vim backend/.env
```

#### 3. 安装依赖
```bash
# 后端
cd backend && npm install

# AI服务
cd ../ai-service && pip install -r requirements.txt

# 前端
cd ../frontend && npm install

# 小程序
cd ../miniapp && npm install
```

#### 4. 数据库迁移
```bash
cd backend
export DATABASE_URL="postgresql://user:pass@localhost:5432/qicheng"
npm run db:migrate
```

#### 5. 启动服务
```bash
# 使用一键启动脚本
./start-all.sh

# 或手动启动各服务
cd backend && npm run start &
cd ai-service && python main.py &
cd frontend && npm run start &
```

#### 6. 配置Nginx (生产环境)
```nginx
server {
    listen 80;
    server_name qicheng.com;

    # 前端
    location / {
        proxy_pass http://localhost:3002;
    }

    # 后端API
    location /api/ {
        proxy_pass http://localhost:3000;
    }

    # AI服务
    location /ai/ {
        proxy_pass http://localhost:8001;
    }
}
```

---

## 📝 API文档

### 认证相关

#### POST /api/v1/auth/register
注册新用户

**请求体**:
```json
{
  "phone": "13800138000",
  "password": "password123",
  "role": "student",
  "nickname": "张三"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": "uuid",
      "phone": "13800138000",
      "role": "student"
    }
  }
}
```

#### POST /api/v1/auth/login
用户登录

### 任务相关

#### GET /api/v1/tasks/market
获取任务大厅列表

#### GET /api/v1/tasks/:id
获取任务详情

#### POST /api/v1/tasks/:id/accept
接受任务

#### GET /api/v1/tasks/:id/breakdown ✨新增
获取AI拆解指导

#### GET /api/v1/tasks/:taskId/progress/:assigneeId ✨新增
查看任务进度

### 学生相关

#### GET /api/v1/student/profile
获取学生档案

#### POST /api/v1/student/test/submit
提交OPC测评

#### POST /api/v1/student/level-challenge ✨新增
提交跳级挑战

### 企业相关

#### POST /api/v1/tasks/company
发布任务

#### GET /api/v1/tasks/student-profile/:studentId ✨新增
查看学生能力画像

### 管理相关

#### GET /api/v1/admin/dashboard ✨增强
获取管理后台数据（含图表）

完整API文档: [API.md](./docs/API.md)

---

## 🧪 测试

### 运行测试
```bash
# 单元测试
cd backend
npm test

# 端到端测试
./test-e2e.sh

# 测试覆盖率
npm test -- --coverage
```

### 测试文档
- [测试指南](./TESTING.md)
- [测试用例](./backend/src/__tests__/)

---

## 📈 性能指标

### 目标指标
- API响应时间: < 200ms (P95)
- 数据库查询: < 50ms (P95)
- 页面加载时间: < 2s
- 并发用户: 1000+

### 优化措施
- Redis缓存热点数据
- 数据库索引优化
- CDN加速静态资源
- 图片懒加载
- API请求合并

---

## 🔒 安全措施

### 认证与授权
- JWT Token认证
- 密码bcrypt加密
- 角色权限控制
- API访问频率限制

### 数据安全
- SQL注入防护
- XSS攻击防护
- CSRF防护
- 敏感数据加密

### 隐私保护
- 学生信息匿名化
- 联系方式保护机制
- 数据访问日志

---

## 📚 相关文档

- [启动和测试指南](./TESTING_GUIDE.md)
- [后端API完成报告](./BACKEND_API_COMPLETED.md)
- [前端功能完成报告](./MISSING_FEATURES_COMPLETED.md)
- [数据库迁移指南](./backend/migrations/README.md)
- [测试文档](./TESTING.md)
- [三端测试指南](./THREE_PORTS_TEST_GUIDE.md)

---

## 🤝 贡献指南

### 开发流程
1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

### 代码规范
- TypeScript严格模式
- ESLint + Prettier
- 提交信息遵循Conventional Commits

---

## 📄 许可证

本项目采用 MIT 许可证

---

## 👥 团队

- **产品经理**: 负责需求分析和产品设计
- **后端开发**: Node.js + PostgreSQL
- **AI工程师**: Python + Claude API
- **前端开发**: React + Next.js
- **小程序开发**: Taro + React

---

## 📞 联系方式

- 官网: https://qicheng.com
- 邮箱: support@qicheng.com
- GitHub: https://github.com/your-org/qicheng

---

**版本**: v1.1.0  
**更新时间**: 2026-04-09  
**状态**: ✅ 开发完成，可部署测试
