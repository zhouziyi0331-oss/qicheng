# 启程 (Qicheng) — 系统架构文档 v7.0

## 核心定位

双边平台型 App，连接高校生（供给端）与企业（需求端）。  
**不是招聘，不是培训，不是抢单。** 是帮每一个学生成为独立 OPC，脱离平台。

---

## 技术架构图

```
Mobile App (iOS/Android)
        │
        ▼
  [Node.js Backend]     ←→   [Python AI Service]
   Express + TypeScript        FastAPI + Claude API
        │                              │
        ├── PostgreSQL + pgvector      │
        ├── Redis (缓存/锁/验证码)      │
        └── Cron Jobs                 │
              ├── firstTaskSettlement  │
              └── emotionSignalDetect  │
                                      │
              Claude API (主) / OpenAI (备)
```

---

## 数据库设计（21张表）

| 分组 | 表名 | 用途 |
|------|------|------|
| 用户 | users | 基础信息，role 注册锁定 |
| 用户 | student_profiles | 学生能力档案，六维评分 |
| 用户 | company_profiles | 企业档案，审核机制 |
| 用户 | student_balances | 余额 (乐观锁 version 字段) |
| 认证 | refresh_tokens | JWT 刷新令牌 |
| 测试 | test_results | 25 题答案 + pgvector 向量 |
| 任务 | tasks | 任务状态机 |
| 任务 | task_assignments | 接单记录 |
| 任务 | task_submissions | 交付物 (AI审核 max 2次) |
| 任务 | task_steps | 正计时进度步骤 |
| 支付 | payments | 幂等键 payment_id |
| 支付 | withdrawals | 自动/人工分流 |
| 支付 | contact_unlocks | 2单解锁企业联系方式 |
| 报告 | opc_reports | 付费报告 + 预览钩子 |
| v7新增 | growth_timeline | 成长时间线 (level_up 含具体对比) |
| v7新增 | emotion_signals | 情绪状态信号 (兴奋/平静/挫败/冷却) |
| v7新增 | story_wall_posts | 故事墙 (永不按 likes 排序) |
| 系统 | user_tags | 多维度标签 |
| 系统 | notifications | 多渠道通知 |
| 系统 | chat_messages | AI中转沟通 (过滤联系方式) |
| 系统 | admin_operation_logs | **不可删除/修改** |
| 系统 | onboarding_status | J1-J8 Onboarding 状态机 |

---

## 5 个 AI 引擎

| 引擎 | 端点 | 触发时机 | 核心输出 |
|------|------|----------|---------|
| AI-01 | POST /ai/analyze-test | 提交25题测试 | OPC标签 + 五维评分 + 分享卡片 |
| AI-02 | POST /ai/match-task | 学生查看推荐任务 | 2-3个定向匹配任务 |
| AI-03 | POST /ai/breakdown-task | 接单后 <3秒 | 3-6步骤指令 (第一步立刻开始) |
| AI-04 | POST /ai/review-delivery | 提交交付物 | 通过/打回 (成长信号格式) |
| AI-05 | POST /ai/generate-report | 付费购买报告 | 万字级个性化OPC报告 |

---

## 关键业务规则

### 1. 首单 24h 结算 (v7 核心)
```
企业验收通过 → 触发平台垫付 → cron job 扫描 (每5分钟)
→ 满24小时 → 余额到账 → 庆祝推送 → Onboarding J8 完成
```
代码: `backend/src/jobs/firstTaskSettlement.ts`

### 2. 禁止排行榜 (PRD Ch.09)
- SQL 层: `story_wall_posts` 查询无 `ORDER BY likes`
- 代码层: 每个社群查询函数注释 `// RULE: NO LEADERBOARD`
- 路由层: `story/controller.ts` 明确注释
- 代码: `backend/src/routes/story/controller.ts`

### 3. 情绪信号状态机 (v7 新增)
```
连续3天未登录 → cooling → 推送同类人故事 (不催促)
被打回2次    → frustrated → 推送更简单任务
完成后24h登录 → excited → 推送挑战任务
分享雷达图   → identified → 推送报告预览
```
代码: `backend/src/jobs/emotionSignalDetector.ts`

### 4. AI-04 打回反馈格式 (v7 硬性规范)
```
✅ 你已经做到了 [X]。需要改进的是 [Y]。
   修改方法: 1.[具体步骤] 2.[具体步骤]
   很多人第一次都需要修改，这很正常。

❌ 禁用词: 不合格、质量差、失败、不通过、不达标
```
代码: `ai-service/engines/ai04_delivery_reviewer.py`

### 5. 联系方式解锁 (非毕业触发)
- 学生与同一企业完成 **2单** → 自动解锁联系方式
- 毕业 **不触发** 批量解锁 (PRD Ch.20 v6修正)
- 代码: `backend/src/routes/tasks/companyController.ts::checkContactUnlock`

### 6. 支付幂等性
- 每笔支付使用唯一 `payment_id` (UUID)
- 回调先检查: `SELECT status FROM payments WHERE payment_id = ?`
- Redis 双重保险: `SET payment:idem:{id} NX EX 86400`

### 7. 余额乐观锁
```sql
UPDATE student_balances
SET balance = balance + ?, version = version + 1
WHERE user_id = ? AND version = ?
```
版本不匹配则重试，最多 3 次。

---

## Onboarding Journey J1-J8

| 步骤 | 事件 | 核心体验 |
|------|------|---------|
| J1 | 注册完成 | 入口叙事: 「你正在开始一段OPC旅程」 |
| J2 | 25题测试完成 | OPC人格标签动态揭晓 + 分享卡片 |
| J3 | 分享测试结果 | 第一个传播节点 |
| J4 | 分配首单任务 | 「你的第一单，我们保证你能完成」 |
| J5 | 接受首单 | 接单成功 |
| J6 | 看到第一步指令 | AI立刻推送: 「现在做: [操作]，用[工具]...」 |
| J7 | 提交首单 | 等待企业验收 |
| J8 | 首单收入到账 | 🎉 仪式感庆祝 + 成长时间线里程碑 |

---

## 项目目录结构

```
qicheng/
├── backend/                    Node.js + TypeScript
│   ├── src/
│   │   ├── app.ts              Express 入口
│   │   ├── routes/
│   │   │   ├── auth/           注册/登录 (指令1)
│   │   │   ├── student/        学生档案 + 测试 (指令1-2)
│   │   │   ├── company/        企业档案 (指令1)
│   │   │   ├── tasks/          任务全流程 (指令4)
│   │   │   ├── ability/        雷达图 + 时间线 (指令5)
│   │   │   ├── reports/        OPC报告 (指令5)
│   │   │   ├── story/          故事墙 (指令6)
│   │   │   ├── admin/          后台9模块 (指令7)
│   │   │   ├── payments/       支付提现 (指令8)
│   │   │   └── chat/           沟通中转 (指令8)
│   │   ├── middleware/
│   │   │   ├── auth.ts         JWT 认证 + 角色守卫
│   │   │   ├── contactFilter.ts 联系方式过滤
│   │   │   ├── adminLogger.ts  不可删操作日志
│   │   │   └── errorHandler.ts 统一错误处理
│   │   ├── jobs/
│   │   │   ├── firstTaskSettlement.ts  首单24h结算
│   │   │   └── emotionSignalDetector.ts 情绪信号检测
│   │   └── utils/
│   │       ├── db.ts           PostgreSQL 连接池 + 乐观锁
│   │       ├── redis.ts        Redis 客户端 + 工具函数
│   │       └── logger.ts       Winston 结构化日志
│   ├── config/index.ts         环境变量管理
│   └── package.json
├── ai-service/                 Python FastAPI
│   ├── engines/
│   │   ├── ai01_test_analyzer.py   测试分析 → OPC标签
│   │   ├── ai02_task_matcher.py    任务匹配
│   │   ├── ai03_task_assistant.py  任务拆解
│   │   ├── ai04_delivery_reviewer.py 交付审核 (禁「不合格」)
│   │   └── ai05_report_generator.py 报告生成
│   ├── utils/claude_client.py   Claude API 客户端
│   └── main.py
├── scripts/db/
│   ├── 001_init_schema.sql     完整 DDL (23张表)
│   ├── 002_indexes.sql         性能索引
│   ├── 003_seed_data.sql       OPC标签库(50+) + 25题题目
│   └── 004_vector_setup.sql    pgvector 扩展
├── docker-compose.yml          本地开发环境
├── .env.example                环境变量模板
└── docs/architecture.md        本文档
```

---

## 启动方式

### 本地开发
```bash
# 1. 启动数据库和 Redis
docker-compose up -d postgres redis

# 2. 初始化数据库
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/qicheng
psql $DATABASE_URL -f scripts/db/001_init_schema.sql
psql $DATABASE_URL -f scripts/db/002_indexes.sql
psql $DATABASE_URL -f scripts/db/003_seed_data.sql
psql $DATABASE_URL -f scripts/db/004_vector_setup.sql

# 3. 启动 Node.js 后端
cd backend && npm install && npm run dev

# 4. 启动 Python AI 服务
cd ai-service && pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 完整 Docker 环境
```bash
cp .env.example .env
# 编辑 .env 填入 API Keys
docker-compose up -d
```

---

## API 端点总览

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/v1/auth/register | 注册 (角色锁定) |
| POST | /api/v1/auth/login | 登录 |
| GET  | /api/v1/student/test/questions | 获取25题 |
| POST | /api/v1/student/test/submit | 提交测试 → AI-01 |
| GET  | /api/v1/tasks/recommended | 获取推荐任务 → AI-02 |
| POST | /api/v1/tasks/:id/accept | 接单 → AI-03 立刻推第一步 |
| POST | /api/v1/tasks/:id/submit | 提交交付物 → AI-04 |
| POST | /api/v1/company/tasks | 企业发布任务 |
| POST | /api/v1/company/:id/approve | 企业验收通过 |
| GET  | /api/v1/ability/radar | 六维雷达图 |
| GET  | /api/v1/ability/timeline | 成长时间线 |
| GET  | /api/v1/reports | 报告列表 + 预览钩子 |
| POST | /api/v1/reports/order | 购买报告 |
| GET  | /api/v1/story/feed | 故事墙 (非排行) |
| GET  | /api/v1/story/peers | 同类人信息流 |
| POST | /api/v1/payments/withdraw | 申请提现 |
| POST | /api/v1/chat/:taskId/messages | 发消息 (过滤联系方式) |
| GET  | /api/v1/admin/dashboard | M1 数据看板 |
