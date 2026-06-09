# AI导师系统部署检查清单

## 📋 部署前检查

### 1. 后端检查 ✅

#### 数据库
- [x] 数据库迁移已执行 (`migrations/054_mentor_stage_system.sql`)
- [x] 所有表已创建（mentor_stage_sessions, mentor_stage_messages, mentor_prompt_templates, mentor_feedback_translations）
- [x] 索引已创建
- [x] 外键约束正确
- [x] Prompt模板已初始化（4个阶段的默认模板）

**验证命令**:
```bash
node -e "
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
(async () => {
  const tables = await pool.query(\"SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'mentor%'\");
  console.log('Mentor tables:', tables.rows.map(r => r.tablename));
  const templates = await pool.query('SELECT stage, template_name FROM mentor_prompt_templates');
  console.log('Templates:', templates.rows);
  await pool.end();
})();
"
```

#### 代码
- [x] TypeScript编译通过（mentor系统文件无错误）
- [x] 所有服务已实现（MentorStageService, MentorPromptBuilder, MentorTriggerService）
- [x] 所有控制器已实现（mentorStageController）
- [x] 路由已注册（/api/v1/mentor-stage）
- [x] 集成到现有流程（acceptTask, submitDeliverables, rejectDeliverable）

**验证命令**:
```bash
npm run build 2>&1 | grep -E "mentor" || echo "No mentor-related errors"
```

#### 测试
- [x] 单元测试通过（test-mentor-flow.ts）
- [x] 会话创建测试通过
- [x] 消息保存测试通过
- [x] 阶段转换测试通过
- [x] Prompt构建测试通过

**验证命令**:
```bash
npx ts-node scripts/test-mentor-flow.ts
```

#### 环境变量
- [ ] `DATABASE_URL` 已配置
- [ ] `AI_SERVICE_URL` 已配置（AI服务地址）
- [ ] `JWT_SECRET` 已配置
- [ ] `NODE_ENV` 已设置（production/development）

**检查命令**:
```bash
echo "DATABASE_URL: ${DATABASE_URL:0:20}..."
echo "AI_SERVICE_URL: $AI_SERVICE_URL"
echo "NODE_ENV: $NODE_ENV"
```

---

### 2. AI服务检查 ⚠️

#### AI服务可用性
- [ ] AI服务正常运行（http://localhost:8002 或配置的地址）
- [ ] `/api/ai/chat` 端点可用
- [ ] Claude API密钥已配置
- [ ] API调用限额充足

**验证命令**:
```bash
curl -X POST http://localhost:8002/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "测试"}],
    "model": "claude-sonnet-4-6",
    "max_tokens": 100
  }'
```

#### 成本控制
- [ ] 设置了每任务成本上限
- [ ] 配置了成本监控告警
- [ ] 准备了成本报表

---

### 3. 前端检查 ⏳

#### 组件实现
- [ ] MentorStageChat 组件已实现
- [ ] PreCheckResult 组件已实现
- [ ] StageIndicator 组件已实现
- [ ] 集成到任务详情页

#### API集成
- [ ] 所有API端点已对接
- [ ] 错误处理已实现
- [ ] Loading状态已实现
- [ ] Token刷新机制已实现

#### UI/UX
- [ ] 响应式设计（移动端适配）
- [ ] 动画效果流畅
- [ ] 消息滚动正常
- [ ] 快捷操作按钮可用

---

### 4. 集成测试 ⏳

#### 端到端流程
- [ ] 学生接单 → 导师自动触发（3秒延迟）
- [ ] 学生发送消息 → AI回复正常
- [ ] 需求理解确认 → 自动进入执行引导阶段
- [ ] 学生提交 → 质量预审触发
- [ ] 预审不通过 → 阻止提交并显示建议
- [ ] 预审通过 → 允许提交
- [ ] 企业拒绝 → 沟通桥梁触发

**测试脚本**:
```bash
# 创建端到端测试脚本
# scripts/e2e-test-mentor.sh
```

---

## 🚀 部署步骤

### 步骤1: 备份数据库
```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 步骤2: 运行数据库迁移
```bash
cd backend
node scripts/run-mentor-migration.js
```

### 步骤3: 初始化Prompt模板
```bash
npx ts-node scripts/init-mentor-prompts.ts
```

### 步骤4: 构建后端
```bash
npm run build
```

### 步骤5: 启动后端服务
```bash
# 开发环境
npm run dev

# 生产环境
npm start
```

### 步骤6: 构建前端
```bash
cd ../frontend
npm run build
```

### 步骤7: 启动前端服务
```bash
# 开发环境
npm run dev

# 生产环境
npm start
```

### 步骤8: 验证部署
```bash
# 检查后端健康状态
curl http://localhost:3000/health

# 检查AI服务健康状态
curl http://localhost:8002/api/ai/health

# 测试导师API
curl http://localhost:3000/api/v1/mentor-stage/tasks/{taskId}/session \
  -H "Authorization: Bearer {token}"
```

---

## 📊 监控指标

### 1. 性能指标
- [ ] API响应时间 < 5秒
- [ ] AI响应时间 < 10秒
- [ ] 数据库查询时间 < 100ms
- [ ] 消息加载时间 < 1秒

### 2. 业务指标
- [ ] 导师会话创建成功率 > 99%
- [ ] AI回复成功率 > 95%
- [ ] 预审通过率（目标：60-70%）
- [ ] 学生满意度（通过反馈收集）

### 3. 成本指标
- [ ] 每任务平均成本 < $0.35
- [ ] 每日总成本监控
- [ ] 异常高频调用告警

### 4. 错误监控
- [ ] API错误率 < 1%
- [ ] AI服务超时率 < 5%
- [ ] 数据库连接错误监控
- [ ] 日志错误级别监控

---

## 🔧 故障排查

### 问题1: 导师会话创建失败
**可能原因**:
- 数据库连接失败
- 外键约束错误（task_id或student_id不存在）
- 权限问题

**排查步骤**:
```bash
# 检查数据库连接
node -e "require('dotenv').config(); const {Pool} = require('pg'); new Pool({connectionString: process.env.DATABASE_URL}).query('SELECT 1').then(() => console.log('DB OK')).catch(console.error);"

# 检查任务是否存在
node -e "require('dotenv').config(); const {Pool} = require('pg'); new Pool({connectionString: process.env.DATABASE_URL}).query('SELECT id FROM tasks WHERE id = \$1', ['task-id']).then(r => console.log('Task exists:', r.rows.length > 0)).catch(console.error);"
```

### 问题2: AI回复超时
**可能原因**:
- AI服务不可用
- 网络问题
- Prompt过长导致处理时间过长

**排查步骤**:
```bash
# 检查AI服务
curl http://localhost:8002/api/ai/health

# 检查网络连接
ping ai-service-host

# 查看AI服务日志
tail -f /path/to/ai-service/logs/app.log
```

### 问题3: 预审不工作
**可能原因**:
- 触发器未正确集成
- AI服务返回格式错误
- 提交内容为空

**排查步骤**:
```bash
# 检查触发器代码
grep -n "triggerQualityReview" src/routes/tasks/studentFlowController.ts

# 测试预审API
curl -X POST http://localhost:3000/api/v1/mentor-stage/tasks/{taskId}/quality-review \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"submission": "测试提交内容"}'
```

### 问题4: 消息历史加载慢
**可能原因**:
- 消息数量过多
- 数据库索引缺失
- 查询未优化

**排查步骤**:
```sql
-- 检查索引
SELECT * FROM pg_indexes WHERE tablename = 'mentor_stage_messages';

-- 分析查询性能
EXPLAIN ANALYZE SELECT * FROM mentor_stage_messages WHERE session_id = 'xxx' ORDER BY created_at DESC LIMIT 50;
```

---

## 📝 回滚计划

### 如果需要回滚

#### 步骤1: 停止服务
```bash
# 停止后端
pm2 stop backend

# 停止前端
pm2 stop frontend
```

#### 步骤2: 恢复数据库
```bash
# 删除新表（如果需要）
psql $DATABASE_URL -c "DROP TABLE IF EXISTS mentor_feedback_translations CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS mentor_stage_messages CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS mentor_prompt_templates CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS mentor_stage_sessions CASCADE;"

# 或恢复备份
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

#### 步骤3: 回滚代码
```bash
git revert <commit-hash>
# 或
git checkout <previous-commit>
```

#### 步骤4: 重新部署
```bash
npm run build
npm start
```

---

## 📞 支持联系

### 技术支持
- **开发团队**: dev@qicheng.com
- **紧急联系**: +86 xxx-xxxx-xxxx
- **文档**: /docs/ai-mentor-system

### 相关文档
- [API文档](./API_DOCUMENTATION.md)
- [前端集成指南](./FRONTEND_INTEGRATION_GUIDE.md)
- [最终实施报告](./AI_MENTOR_FINAL_SUMMARY.md)

---

## ✅ 部署完成确认

部署完成后，请确认以下所有项目：

- [ ] 数据库迁移成功
- [ ] Prompt模板已初始化
- [ ] 后端服务正常运行
- [ ] 前端服务正常运行
- [ ] AI服务连接正常
- [ ] 端到端测试通过
- [ ] 监控系统已配置
- [ ] 告警规则已设置
- [ ] 文档已更新
- [ ] 团队已培训

**签字确认**:
- 开发负责人: _____________ 日期: _______
- 测试负责人: _____________ 日期: _______
- 运维负责人: _____________ 日期: _______

---

## 🎉 上线后观察期

### 第1天
- [ ] 每小时检查一次错误日志
- [ ] 监控API响应时间
- [ ] 收集用户反馈
- [ ] 检查成本消耗

### 第1周
- [ ] 每天检查关键指标
- [ ] 分析用户使用模式
- [ ] 优化Prompt模板
- [ ] 调整成本控制策略

### 第1月
- [ ] 生成月度报告
- [ ] 评估系统效果
- [ ] 规划下一步优化
- [ ] 收集改进建议

---

**文档版本**: v1.0.0  
**创建日期**: 2026-05-08  
**最后更新**: 2026-05-08  
**状态**: 准备部署
