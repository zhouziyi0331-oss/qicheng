# 天赋标签系统 - 部署指南

## ✅ 当前状态

**代码完整性验证**: 100% 通过 ✅

- ✅ 4个服务文件可以导入
- ✅ 控制器5个方法全部存在
- ✅ 4个迁移文件存在且语法正确
- ✅ 路由配置完整
- ✅ 前端集成完成

---

## 📋 部署步骤

### 第1步：确保PostgreSQL运行

```bash
# 检查PostgreSQL是否运行
psql --version

# 如果未安装，在macOS上安装：
brew install postgresql@14
brew services start postgresql@14

# 创建数据库（如果还不存在）
psql -U postgres -c "CREATE DATABASE qicheng;"
```

### 第2步：运行数据库迁移

按顺序运行4个迁移文件：

```bash
cd backend

# 1. 核心天赋标签系统（8张表 + 54个核心天赋标签）
psql $DATABASE_URL -f migrations/200_talent_tag_system.sql

# 2. 补充天赋标签
psql $DATABASE_URL -f migrations/201_more_talent_tags.sql

# 3. 能力累积和需求拆解标签
psql $DATABASE_URL -f migrations/202_capability_and_requirement_tags.sql

# 4. 业务场景标签（86个电商+Agent场景）
psql $DATABASE_URL -f migrations/203_more_business_scenarios.sql
```

**验证迁移是否成功**：

```bash
# 检查表是否创建
psql $DATABASE_URL -c "\dt" | grep -E "(talent_tags|student_talent|business_scenario)"

# 检查天赋标签数量（应该 ≥54个）
psql $DATABASE_URL -c "SELECT COUNT(*) FROM talent_tags;"

# 检查业务场景标签数量（应该 ≥86个）
psql $DATABASE_URL -c "SELECT COUNT(*) FROM business_scenario_tags;"
```

### 第3步：启动后端服务

```bash
cd backend

# 安装依赖（如果还没有）
npm install

# 启动开发服务器
npm run dev
```

服务应该在 `http://localhost:3517` 启动。

### 第4步：测试API端点

打开新终端，测试API是否正常：

```bash
# 获取天赋标签列表（需要先登录获取token）
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3517/api/v1/talent/tags

# 获取业务场景标签
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3517/api/v1/talent/scenarios

# 获取自己的天赋画像
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3517/api/v1/talent/profile
```

**注意**: 如果返回401，说明需要认证token，这是正常的。

### 第5步：启动前端小程序

```bash
cd miniapp

# 安装依赖（如果还没有）
npm install

# 启动微信小程序开发模式
npm run dev:weapp
```

在微信开发者工具中打开 `miniapp` 目录。

### 第6步：测试完整流程

在小程序中测试以下流程：

1. **完成OPC测评** → 系统自动推断天赋标签
2. **查看首页** → 应该显示"天赋卡片"
3. **进入个人中心** → 应该显示"天赋统计"
4. **点击天赋卡片** → 跳转到"天赋画像"页面
5. **查看推荐任务** → 使用天赋匹配算法推荐
6. **完成任务** → 自动提取能力、累积经验

---

## 🔍 验证系统是否正常工作

### 验证数据库

```bash
# 运行验证脚本
cd backend
node tests/talent-system-test.js

# 或使用TypeScript版本
npx ts-node tests/talent-system-verify.ts
```

### 验证后端API

创建测试学生并完成OPC：

```sql
-- 1. 插入测试学生的OPC结果
INSERT INTO opc_v2_results (
  student_id,
  info_processing_score,
  creation_drive_score,
  tool_learning_score,
  task_execution_score,
  collaboration_score,
  risk_attitude_score
) VALUES (
  'test-student-id',
  75, -- 信息加工
  80, -- 创造驱动
  70, -- 工具学习
  85, -- 任务执行
  60, -- 协作
  75  -- 风险态度
);

-- 2. 触发天赋推断
-- 通过API调用：POST /api/v1/talent/infer/opc

-- 3. 查看推断结果
SELECT tt.tag_name, stt.strength, stt.confidence
FROM student_talent_tags stt
JOIN talent_tags tt ON stt.tag_id = tt.id
WHERE stt.student_id = 'test-student-id'
ORDER BY stt.confidence DESC;
```

### 验证前端页面

1. **天赋画像页面**: `pages/talent-profile/index`
   - 显示4个标签页：天赋、工具、案例、领域
   - 天赋强度分级：emerging/clear/prominent/core
   - 工具熟练度：basic/intermediate/advanced/expert

2. **首页天赋卡片**:
   - 完成OPC后自动显示
   - 显示Top 4天赋
   - 点击跳转到天赋画像

3. **个人中心天赋卡**:
   - 显示天赋/工具/案例/领域的数量统计
   - 显示Top 3天赋
   - 点击跳转到天赋画像

---

## 🎯 核心功能说明

### 1. 天赋推断（从OPC到天赋）

**触发时机**: 学生完成OPC测评后

**算法**: 
- 信息加工 → 信息挖掘者、数据分析思维
- 创造驱动 → 创新者、概念构建
- 工具学习 → 工具快学者、技术适应
- 任务执行 → 执行专注、结构化思维
- 协作 → 协作共创、同理心倾听
- 风险态度 → 探索精神、试错韧性

**API**: `POST /api/v1/talent/infer/opc`

### 2. 天赋匹配（任务推荐）

**触发时机**: 学生查看推荐任务时

**算法**: 
- 50% 天赋匹配度
- 20% OPC兼容性
- 30% 成长潜力

**API**: `GET /api/v1/talent/match/task/:taskId`

**集成点**: `studentController.ts` 的任务列表接口

### 3. 能力提取（从任务到能力）

**触发时机**: 企业通过学生的任务提交后

**提取内容**:
- 工具使用（从描述中识别工具名称）
- 案例经验（电商/agent场景类型）
- 领域理解（业务领域知识）

**API**: `POST /api/v1/talent/extract/task/:taskId`

**集成点**: `companyController.ts` 的任务审批接口

### 4. 天赋验证（从任务表现到天赋强化）

**触发时机**: 任务完成后根据表现

**强化逻辑**:
- 高分完成 → 提升相关天赋的confidence
- 按时交付 → 验证执行类天赋
- 主动沟通 → 验证协作类天赋
- 优化建议 → 验证创新类天赋

**天赋强度升级路径**:
```
emerging (萌芽) → clear (清晰) → prominent (突出) → core (核心)
    0.3           0.5            0.7             0.85
```

**集成点**: `companyController.ts` 的任务审批接口

---

## 📊 数据库表结构

### 核心表

1. **talent_tags** - 天赋标签定义（54个固定标签）
2. **student_talent_tags** - 学生天赋画像
3. **business_scenario_tags** - 业务场景标签（86个）
4. **student_tool_usage** - 工具使用记录（动态累积）
5. **student_case_experience** - 案例经验（动态累积）
6. **student_domain_understanding** - 领域理解（动态累积）
7. **task_requirement_breakdown** - 任务需求拆解（3级）
8. **tag_extraction_rules** - 标签提取规则

---

## 🔧 故障排查

### 问题1: 数据库连接失败

```bash
# 检查DATABASE_URL配置
cat backend/.env | grep DATABASE_URL

# 测试连接
psql $DATABASE_URL -c "SELECT 1;"
```

### 问题2: 迁移失败

```bash
# 查看错误详情
psql $DATABASE_URL -f migrations/200_talent_tag_system.sql 2>&1 | grep ERROR

# 回滚（如果需要）
psql $DATABASE_URL -c "DROP TABLE IF EXISTS talent_tags CASCADE;"
```

### 问题3: API返回401

原因：需要认证token

解决：
1. 先登录获取token
2. 在请求头添加：`Authorization: Bearer YOUR_TOKEN`

### 问题4: 前端页面找不到

检查路由配置：

```bash
# 确认页面已注册
grep "talent-profile" miniapp/src/app.config.ts
```

### 问题5: TypeScript编译错误

```bash
# 重新安装依赖
cd backend
rm -rf node_modules package-lock.json
npm install

# 运行验证
npx ts-node tests/talent-system-verify.ts
```

---

## 📈 监控指标

部署后应监控的关键指标：

1. **天赋推断成功率**
   - OPC完成 → 天赋标签生成的成功率

2. **匹配准确度**
   - 推荐任务 → 学生接单率
   - 匹配分数 vs 实际完成质量

3. **能力累积速度**
   - 每个学生平均工具数量增长
   - 案例经验累积速度

4. **天赋强度演进**
   - emerging → clear → prominent → core 的升级速度

---

## 🎉 完成标志

系统100%可用的标志：

- ✅ 所有数据库表创建成功
- ✅ 天赋标签 ≥54个
- ✅ 业务场景标签 ≥86个
- ✅ 后端服务正常启动
- ✅ API端点返回200或401（认证）
- ✅ 前端页面可以访问
- ✅ OPC测评后能看到天赋推断结果
- ✅ 任务完成后能提取能力
- ✅ 天赋匹配算法正常工作

---

## 📚 相关文档

- [天赋系统实施报告](TALENT_SYSTEM_IMPLEMENTATION.md)
- [验证清单](VERIFICATION_CHECKLIST.md)
- [真实完成情况](TALENT_SYSTEM_REAL_STATUS.md)

---

**最后更新**: 2026-06-29  
**状态**: 代码100%完成，等待部署 ✅
