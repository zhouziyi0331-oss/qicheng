# 启程项目 - 三端联调测试指南

## 📋 项目概览

启程OPC孵化平台包含以下三个端口：

1. **学生端网页** (Next.js) - 端口 3002
2. **企业端网页** (Next.js) - 端口 3002 (同一应用，不同路由)
3. **管理端网页** (Next.js) - 端口 3002 (同一应用，不同路由)
4. **小程序** (Taro) - 微信开发者工具

## 🚀 快速启动

### 方式一：一键启动（推荐）

```bash
cd /Users/alwan/code/qicheng
./start-all.sh
```

这将自动启动：
- PostgreSQL + Redis (Docker)
- 后端服务 (端口 3000)
- AI服务 (端口 8001)
- 前端服务 (端口 3002)
- 小程序编译服务

### 方式二：手动启动

```bash
# 1. 启动数据库
docker-compose up -d postgres redis

# 2. 启动后端 (终端1)
cd backend
npm run build
node dist/src/app.js

# 3. 启动AI服务 (终端2)
cd ai-service
source venv/bin/activate
uvicorn main:app --port 8001

# 4. 启动前端 (终端3)
cd frontend
npm run dev -- --port 3002

# 5. 启动小程序 (终端4)
cd miniapp
npm run dev:weapp
```

### 停止所有服务

```bash
./stop-all.sh
```

## 🌐 访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 学生端 | http://localhost:3002 | 未登录显示Landing页，登录后跳转任务大厅 |
| 企业端 | http://localhost:3002/company/tasks | 企业任务管理 |
| 管理端 | http://localhost:3002/admin | 平台管理后台 |
| 小程序 | 微信开发者工具 | 打开 `miniapp/dist` 目录 |
| 后端API | http://localhost:3000/api/v1 | RESTful API |
| AI服务 | http://localhost:8001 | FastAPI服务 |

## 🧪 测试流程

### 1. 学生端测试

#### 1.1 注册登录
1. 访问 http://localhost:3002
2. 点击"免费注册"
3. 填写信息，选择角色为"学生"
4. 完成注册并登录

#### 1.2 OPC能力测评
1. 登录后自动跳转到 `/onboarding`
2. 完成25道测评题
3. 查看测评结果和OPC标签

#### 1.3 任务流程
1. 访问 `/tasks` 查看任务大厅
2. 点击任务查看详情
3. 接受任务
4. 在 `/my-tasks` 查看我的任务
5. 完成任务步骤
6. 提交交付物

#### 1.4 AI导师
1. 在任务详情页点击"问AI导师"
2. 或访问 `/mentor`
3. 与AI导师对话

#### 1.5 能力成长
1. 访问 `/ability` 查看六维能力雷达图
2. 访问 `/timeline` 查看成长时间线
3. 访问 `/story` 查看故事墙

### 2. 企业端测试

#### 2.1 注册登录
1. 访问 http://localhost:3002
2. 点击"企业注册"
3. 填写企业信息，选择角色为"企业"
4. 完成注册并登录

#### 2.2 发布任务
1. 访问 `/company/post`
2. 填写任务信息：
   - 任务标题
   - 任务描述
   - 验收标准
   - 赛道选择 (A/B/AB)
   - 所需等级
   - 预算（最低30元）
   - 任务类型（普通匹配/邀请指定）
3. 提交任务

#### 2.3 任务管理
1. 访问 `/company/tasks`
2. 查看已发布的任务
3. 查看学生提交
4. 审核通过或打回

#### 2.4 企业信息
1. 访问 `/company/profile`
2. 查看和编辑企业信息

### 3. 管理端测试

#### 3.1 仪表盘
1. 访问 `/admin`
2. 查看平台数据概览：
   - 总用户数
   - 活跃任务数
   - 待处理提现
   - 累计流水

#### 3.2 学生管理
1. 访问 `/admin/students`
2. 搜索学生
3. 查看学生详情
4. 查看OPC标签和能力数据

#### 3.3 任务管理
1. 访问 `/admin/tasks`
2. 查看所有任务
3. 下架违规任务

#### 3.4 财务管理
1. 访问 `/admin/finance`
2. 查看提现申请
3. 审核通过或拒绝
4. 查看首单垫付记录

#### 3.5 客服工具
1. 访问 `/admin/support`
2. 查看工单列表
3. 处理用户申诉
4. 发送通知

#### 3.6 广播通知
1. 访问 `/admin/broadcast`
2. 选择推送对象（全部/学生/企业）
3. 设置优先级
4. 发送通知

#### 3.7 操作日志
1. 访问 `/admin/logs`
2. 查看所有管理员操作记录
3. 不可删除、不可修改

#### 3.8 系统配置
1. 访问 `/admin/config`
2. 修改系统参数（仅超管）

### 4. 小程序测试

#### 4.1 准备工作
1. 安装微信开发者工具
2. 打开 `miniapp/dist` 目录
3. 使用测试AppID或不校验域名

#### 4.2 核心功能测试
1. **首页**
   - 微信一键登录
   - 查看推荐任务
   - OPC测评入口

2. **任务大厅** (`pages/tasks/index`)
   - 浏览任务列表
   - 筛选任务
   - 查看任务详情

3. **AI导师** (`pages/mentor/index`)
   - 发送消息
   - 查看对话历史
   - 快捷回复

4. **能力图谱** (`pages/ability/index`)
   - 查看六维雷达图
   - 查看能力详情
   - 查看提升建议

5. **故事墙** (`pages/story/index`)
   - 浏览故事
   - 发布故事
   - 点赞互动

6. **个人中心** (`pages/profile/index`)
   - 查看个人信息
   - 查看余额
   - 提现功能

## 🔗 API接口测试

### 健康检查
```bash
# 后端
curl http://localhost:3000/api/v1/health

# AI服务
curl http://localhost:8001/health
```

### 认证接口
```bash
# 发送验证码
curl -X POST http://localhost:3000/api/v1/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000"}'

# 注册
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone":"13800138000",
    "code":"123456",
    "password":"password123",
    "role":"student",
    "nickname":"测试学生",
    "userType":"student"
  }'

# 登录
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone":"13800138000",
    "password":"password123"
  }'
```

### 任务接口
```bash
# 获取任务市场（需要token）
curl http://localhost:3000/api/v1/tasks/market \
  -H "Authorization: Bearer YOUR_TOKEN"

# 获取推荐任务
curl http://localhost:3000/api/v1/tasks/recommended \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🐛 常见问题

### 1. 数据库连接失败
```bash
# 检查Docker容器状态
docker ps

# 重启数据库
docker-compose restart postgres redis
```

### 2. 端口被占用
```bash
# 查找占用端口的进程
lsof -i :3000  # 后端
lsof -i :3002  # 前端
lsof -i :8001  # AI服务

# 杀死进程
kill -9 <PID>
```

### 3. 前端编译错误
```bash
cd frontend
rm -rf .next node_modules
npm install
npm run dev -- --port 3002
```

### 4. 小程序编译失败
```bash
cd miniapp
rm -rf dist node_modules
npm install
npm run dev:weapp
```

### 5. AI服务启动失败
```bash
cd ai-service
# 检查Python版本（需要3.8+）
python3 --version

# 重新创建虚拟环境
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## 📊 数据库初始化

如果需要重置数据库：

```bash
# 进入数据库容器
docker exec -it qicheng-postgres psql -U postgres -d qicheng

# 执行初始化脚本
\i /docker-entrypoint-initdb.d/000_extensions.sql
\i /docker-entrypoint-initdb.d/001_init_schema.sql
\i /docker-entrypoint-initdb.d/002_indexes.sql
\i /docker-entrypoint-initdb.d/003_seed_data.sql
\i /docker-entrypoint-initdb.d/004_vector_setup.sql
```

或者重建容器：

```bash
docker-compose down -v
docker-compose up -d postgres redis
```

## 🔐 测试账号

### 学生账号
- 手机号: 13800138001
- 密码: student123
- 角色: 学生

### 企业账号
- 手机号: 13800138002
- 密码: company123
- 角色: 企业

### 管理员账号
- 手机号: 13800138000
- 密码: admin123
- 角色: 管理员

## 📝 测试清单

### 学生端
- [ ] 注册登录
- [ ] OPC测评
- [ ] 浏览任务
- [ ] 接受任务
- [ ] 提交交付物
- [ ] AI导师对话
- [ ] 查看能力图谱
- [ ] 发布故事
- [ ] 申请提现

### 企业端
- [ ] 注册登录
- [ ] 发布任务（普通匹配）
- [ ] 发布任务（邀请指定）
- [ ] 查看任务列表
- [ ] 审核学生提交
- [ ] 打回重做
- [ ] 编辑企业信息

### 管理端
- [ ] 查看仪表盘
- [ ] 搜索学生
- [ ] 查看学生详情
- [ ] 下架任务
- [ ] 审核提现
- [ ] 处理工单
- [ ] 发送广播
- [ ] 查看日志
- [ ] 修改配置

### 小程序
- [ ] 微信登录
- [ ] OPC测评
- [ ] 浏览任务
- [ ] AI导师
- [ ] 能力图谱
- [ ] 故事墙
- [ ] 个人中心

## 🎯 核心业务流程测试

### 完整任务流程
1. 企业发布任务 → 2. 平台审核 → 3. 学生接单 → 4. AI导师辅导 → 5. 学生提交 → 6. 企业审核 → 7. 自动结算 → 8. 能力更新

### 首单24小时结算
1. 学生完成首单 → 2. 企业审核通过 → 3. 平台垫付 → 4. 24小时内到账

### 联系方式解锁
1. 同一学生完成同一企业2单 → 2. 自动解锁联系方式

### 情绪信号检测
1. 学生发送消息 → 2. AI检测情绪 → 3. 记录情绪状态 → 4. 触发关怀机制

## 📈 性能测试

### 并发测试
```bash
# 使用Apache Bench测试
ab -n 1000 -c 10 http://localhost:3000/api/v1/tasks/market
```

### 数据库性能
```sql
-- 查看慢查询
SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;
```

## 🔄 持续集成

项目已配置：
- 后端测试: `cd backend && npm test`
- AI服务测试: `cd ai-service && pytest tests/`
- 前端Lint: `cd frontend && npm run lint`

## 📞 技术支持

如遇问题，请检查：
1. 所有服务是否正常启动
2. 环境变量是否正确配置
3. 数据库是否初始化完成
4. 网络端口是否被占用

---

**最后更新**: 2026-04-09
**版本**: v1.0.0
