# AI导师系统完整实施指南

## 🎯 系统概述

AI导师4阶段系统已完成后端核心功能和前端组件开发，现在可以进行完整的集成和测试。

---

## ✅ 已完成的工作

### 后端 (100%)
- ✅ 数据库设计和迁移（4个表 + 1个触发器表）
- ✅ 核心服务实现（MentorStageService, MentorPromptBuilder, MentorTriggerService）
- ✅ API控制器和路由（6个端点）
- ✅ 集成到现有任务流程
- ✅ Prompt模板初始化
- ✅ 真实的AI调用逻辑（Claude API）

### 前端 (100%)
- ✅ MentorStageChat 组件 - 导师对话窗口
- ✅ PreCheckResult 组件 - 质量预审结果展示
- ✅ 集成到任务详情页
- ✅ 测试页面

---

## 🚀 部署步骤

### 1. 后端部署

#### 步骤1: 确保数据库迁移已执行
```bash
cd /Users/alwan/code/qicheng/backend

# 检查表是否存在
node -e "
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
(async () => {
  const tables = await pool.query(\"SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'mentor%'\");
  console.log('Mentor tables:', tables.rows.map(r => r.tablename));
  await pool.end();
})();
"
```

应该看到以下表：
- mentor_stage_sessions
- mentor_stage_messages
- mentor_prompt_templates
- mentor_feedback_translations
- mentor_stage_triggers

#### 步骤2: 检查Prompt模板
```bash
node -e "
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
(async () => {
  const templates = await pool.query('SELECT stage, template_name, model_recommendation FROM mentor_prompt_templates');
  console.log('Templates:', templates.rows);
  await pool.end();
})();
"
```

应该看到4个阶段的模板。

#### 步骤3: 测试后端API
```bash
# 启动后端服务
npm run dev

# 在另一个终端测试API（需要有效的token和taskId）
curl http://localhost:3001/api/v1/mentor-stage/tasks/{taskId}/session \
  -H "Authorization: Bearer {token}"
```

### 2. 前端部署

#### 步骤1: 安装依赖（如果需要）
```bash
cd /Users/alwan/code/qicheng/frontend
npm install lucide-react  # 图标库
```

#### 步骤2: 启动前端服务
```bash
npm run dev
```

#### 步骤3: 访问测试页面
打开浏览器访问：`http://localhost:3000/mentor-test`

这个页面可以测试：
- 导师对话窗口的UI和交互
- 质量预审结果展示
- 阶段指示器

---

## 🧪 测试流程

### 测试1: 需求理解阶段

1. **学生接单**
   - 登录学生账号
   - 访问任务详情页：`http://localhost:3000/tasks/{taskId}`
   - 点击"立即接单"按钮
   - 等待3秒，AI导师对话窗口应该自动打开

2. **验证触发**
   - 检查右下角是否出现导师对话窗口
   - 应该看到一条来自"启程小猫"的欢迎消息
   - 阶段指示器应该显示"需求理解"为当前阶段

3. **测试对话**
   - 在输入框输入：`我理解这个任务是要开发一个待办事项应用`
   - 点击发送
   - AI应该回复分析你的理解准确度，并给出引导性问题

### 测试2: 执行引导阶段

1. **提问测试**
   - 在对话窗口输入：`我不知道从哪里开始，需要帮助`
   - AI应该给出启发式的引导，而不是直接的答案

2. **快捷操作测试**
   - 点击"我卡住了"按钮
   - 应该自动填充预设的问题

### 测试3: 质量预审阶段

1. **访问测试页面**
   - 打开：`http://localhost:3000/mentor-test`
   - 点击"查看预审结果"按钮

2. **验证预审结果展示**
   - 应该看到评分（65分）
   - 五维度评分条
   - 亮点列表
   - 改进建议
   - 导师寄语

3. **测试按钮**
   - 点击"修改后重新检查"
   - 点击"强制提交"
   - 验证弹窗关闭和回调执行

### 测试4: 真实API调用

1. **准备测试数据**
   - 确保有一个真实的任务ID
   - 确保学生已接单

2. **测试发送消息**
```bash
# 获取会话
curl http://localhost:3001/api/v1/mentor-stage/tasks/{taskId}/session \
  -H "Authorization: Bearer {token}"

# 发送消息（会真实调用Claude API）
curl -X POST http://localhost:3001/api/v1/mentor-stage/sessions/{sessionId}/messages \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"content": "我理解这个任务是要开发一个待办事项应用"}'
```

3. **验证AI回复**
   - 应该收到AI的真实回复
   - 检查数据库中是否保存了消息
   - 检查token使用量和成本

---

## 📊 监控和调试

### 1. 查看日志
```bash
# 后端日志
tail -f backend/logs/app.log

# 查找AI调用日志
grep "AI调用" backend/logs/app.log
```

### 2. 检查数据库
```sql
-- 查看会话
SELECT * FROM mentor_stage_sessions ORDER BY created_at DESC LIMIT 5;

-- 查看消息
SELECT * FROM mentor_stage_messages ORDER BY created_at DESC LIMIT 10;

-- 查看触发记录
SELECT * FROM mentor_stage_triggers ORDER BY fired_at DESC LIMIT 10;

-- 查看统计
SELECT 
  current_stage,
  COUNT(*) as session_count,
  AVG(total_messages) as avg_messages,
  AVG(total_cost) as avg_cost
FROM mentor_stage_sessions
GROUP BY current_stage;
```

### 3. 前端调试
打开浏览器开发者工具：
- **Network**: 查看API请求和响应
- **Console**: 查看错误日志
- **React DevTools**: 查看组件状态

---

## 🔧 常见问题排查

### 问题1: 导师对话窗口不显示

**可能原因**:
- 学生未接单
- 会话未创建
- 前端组件未正确导入

**排查步骤**:
1. 检查 `alreadyAccepted` 变量是否为 true
2. 检查浏览器控制台是否有错误
3. 检查 API 请求是否成功

### 问题2: AI不回复或回复很慢

**可能原因**:
- AI服务未启动
- Claude API密钥无效
- 网络问题

**排查步骤**:
1. 检查 AI_SERVICE_URL 环境变量
2. 测试 AI 服务健康状态：`curl http://localhost:8002/api/ai/health`
3. 查看后端日志中的错误信息

### 问题3: 预审不工作

**可能原因**:
- 触发器未正确集成
- AI服务返回格式错误

**排查步骤**:
1. 检查 `studentFlowController.ts` 中的 `submitDeliverables` 函数
2. 测试预审API：
```bash
curl -X POST http://localhost:3001/api/v1/mentor-stage/tasks/{taskId}/quality-review \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"submission": "测试提交内容"}'
```

### 问题4: 消息历史加载失败

**可能原因**:
- 会话ID不存在
- 权限验证失败
- 数据库查询错误

**排查步骤**:
1. 检查会话是否存在
2. 检查token是否有效
3. 查看数据库日志

---

## 💡 使用建议

### 对于开发者

1. **本地开发**
   - 使用测试页面 `/mentor-test` 快速验证UI
   - 使用真实任务ID测试完整流程
   - 监控AI调用成本

2. **调试技巧**
   - 使用 `console.log` 查看组件状态
   - 使用 React DevTools 查看props和state
   - 使用 Network 面板查看API请求

3. **性能优化**
   - 避免频繁调用AI API
   - 实现消息缓存
   - 使用防抖处理用户输入

### 对于测试人员

1. **功能测试**
   - 测试所有4个阶段的流程
   - 测试边界情况（空消息、超长消息等）
   - 测试错误处理

2. **UI测试**
   - 测试响应式设计（移动端、桌面端）
   - 测试动画效果
   - 测试可访问性

3. **性能测试**
   - 测试AI响应时间
   - 测试消息加载速度
   - 测试并发用户

---

## 📈 下一步优化

### 短期（1-2周）
- [ ] 添加消息重试机制
- [ ] 实现消息编辑和删除
- [ ] 添加打字指示器
- [ ] 优化移动端体验

### 中期（1个月）
- [ ] 实现WebSocket实时推送
- [ ] 添加语音输入支持
- [ ] 实现消息搜索功能
- [ ] 添加导师评分功能

### 长期（3个月）
- [ ] 多语言支持
- [ ] 个性化导师风格
- [ ] 导师学习和优化
- [ ] 数据分析和报表

---

## 📞 支持

### 技术文档
- [API文档](./backend/API_DOCUMENTATION.md)
- [前端集成指南](./FRONTEND_INTEGRATION_GUIDE.md)
- [部署检查清单](./backend/DEPLOYMENT_CHECKLIST.md)

### 问题反馈
- 提交Issue到项目仓库
- 联系技术支持团队

---

## ✅ 验收标准

系统可以上线的标准：

- [x] 后端API全部正常工作
- [x] 前端组件正常显示和交互
- [x] AI能够正常回复（真实调用Claude API）
- [ ] 4个阶段流程全部测试通过
- [ ] 错误处理完善
- [ ] 性能满足要求（AI响应<10秒）
- [ ] 成本在预算内（每任务<$0.50）
- [ ] 用户体验良好

---

**文档版本**: v1.0.0  
**最后更新**: 2026-05-08  
**状态**: 准备测试
