# 启程平台 - 下一步行动计划

**创建时间**: 2026-05-27 23:20  
**目标**: 完成AI导师系统和语义匹配系统的最终部署和测试

---

## 执行摘要

**当前状态**: 
- ✅ 代码实现完成度：95%
- ✅ 数据库部署完成度：100%
- ⚠️ 依赖安装完成度：70%（缺bull、socket.io）
- ❌ 功能测试完成度：0%

**目标**: 在接下来的工作中完成剩余30%，使系统达到生产就绪状态。

---

## Phase 1: 依赖修复（P0 - 必须完成）

### 预计时间：2小时
### 负责人：开发团队

### 1.1 修复npm权限问题

```bash
# 方法1：修复权限（需要sudo）
sudo chown -R $(whoami) ~/.npm

# 方法2：使用用户级npm配置
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

### 1.2 安装缺失依赖

```bash
cd /Users/alwan/code/qicheng/backend

# 安装bull（任务队列）
npm install bull @types/bull

# 安装socket.io（WebSocket）
npm install socket.io @types/socket.io

# 验证安装
npm list bull socket.io
```

### 1.3 启动Redis

```bash
# 安装Redis（如果未安装）
brew install redis

# 启动Redis服务
redis-server

# 或作为后台服务
brew services start redis

# 验证Redis运行
redis-cli ping
# 应返回：PONG
```

### 1.4 取消代码注释

**文件**: `src/app.ts`

需要取消注释的行：
```typescript
// 第70-71行
import adminMonitorRoutes from './routes/adminMonitorRoutes';
import orderFlowRoutes from './routes/orderFlowRoutes';

// 第98-99行
const matchingScheduler = require('./services/matchingScheduler').default;
matchingScheduler.start();

// 第103-104行和107-108行
matchingScheduler.stop();

// 第205-206行
app.use('/api/v1/admin/monitor', adminMonitorRoutes);
app.use('/api/v1/orders', orderFlowRoutes);
```

### 1.5 重启服务

```bash
# 停止现有服务
pkill -f "ts-node-dev"

# 清理日志
rm -f logs/*.log

# 重新启动
npm run dev

# 验证启动成功
sleep 10
curl http://localhost:3000/health
# 应返回：{"status":"ok","service":"qicheng-backend"}

# 检查日志中是否还有错误
tail -50 logs/app.log | grep ERROR
```

### 验收标准

- [ ] npm install成功，无权限错误
- [ ] Redis运行正常，redis-cli ping返回PONG
- [ ] 服务启动成功，端口3000监听
- [ ] 日志中无Redis连接错误
- [ ] 日志中无"Cannot find module"错误
- [ ] matchingScheduler启动成功

---

## Phase 2: 数据初始化（P0 - 必须完成）

### 预计时间：1小时
### 负责人：开发团队

### 2.1 初始化工具提示数据

**目标**: 插入≥50条mentor_tool_hints记录

**创建文件**: `backend/scripts/init-tool-hints.js`

```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const toolHints = [
  // 设计工具
  { category: 'design', tool_name: 'Figma', description: '在线协作设计工具，适合UI/UX设计', when_to_use: '需要设计界面原型时', difficulty: 2 },
  { category: 'design', tool_name: 'Sketch', description: 'Mac平台专业UI设计工具', when_to_use: '需要设计移动端界面时', difficulty: 3 },
  { category: 'design', tool_name: 'Adobe XD', description: 'Adobe的UI/UX设计工具', when_to_use: '需要设计交互原型时', difficulty: 3 },
  
  // 前端工具
  { category: 'frontend', tool_name: 'React DevTools', description: 'React调试工具', when_to_use: 'React组件调试时', difficulty: 2 },
  { category: 'frontend', tool_name: 'Vue DevTools', description: 'Vue调试工具', when_to_use: 'Vue组件调试时', difficulty: 2 },
  { category: 'frontend', tool_name: 'Chrome DevTools', description: '浏览器开发者工具', when_to_use: '前端调试时', difficulty: 1 },
  
  // 后端工具
  { category: 'backend', tool_name: 'Postman', description: 'API测试工具', when_to_use: '测试API接口时', difficulty: 2 },
  { category: 'backend', tool_name: 'Docker', description: '容器化部署工具', when_to_use: '需要部署应用时', difficulty: 4 },
  
  // ... 添加更多工具，总共≥50条
];

async function init() {
  for (const hint of toolHints) {
    await pool.query(`
      INSERT INTO mentor_tool_hints (category, tool_name, description, when_to_use, difficulty)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (tool_name) DO NOTHING
    `, [hint.category, hint.tool_name, hint.description, hint.when_to_use, hint.difficulty]);
  }
  
  const count = await pool.query('SELECT COUNT(*) FROM mentor_tool_hints');
  console.log(`✅ 工具提示初始化完成，共 ${count.rows[0].count} 条记录`);
  
  await pool.end();
}

init().catch(console.error);
```

**执行**:
```bash
node scripts/init-tool-hints.js
```

### 2.2 验证数据

```bash
node -e "
const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function verify() {
  const result = await pool.query('SELECT COUNT(*) FROM mentor_tool_hints');
  console.log('mentor_tool_hints记录数:', result.rows[0].count);
  
  if (parseInt(result.rows[0].count) >= 50) {
    console.log('✅ 验收通过：≥50条记录');
  } else {
    console.log('❌ 验收失败：<50条记录');
  }
  
  await pool.end();
}

verify().catch(console.error);
"
```

### 验收标准

- [ ] mentor_tool_hints表有≥50条记录
- [ ] 记录包含category、tool_name、description、when_to_use、difficulty字段
- [ ] 工具覆盖设计、前端、后端、测试等多个类别

---

## Phase 3: 前端集成（P1 - 建议完成）

### 预计时间：4小时
### 负责人：前端团队

### 3.1 企业端集成

**文件**: `company-miniapp/src/pages/task-detail/index.tsx`

```typescript
import TaskMatching from '@/components/TaskMatching';

// 在任务详情页添加匹配组件
<View className="task-detail-page">
  {/* 现有内容 */}
  
  {/* 新增：任务匹配组件 */}
  {task.status === 'published' && (
    <TaskMatching taskId={task.id} />
  )}
</View>
```

### 3.2 学生端集成

**步骤1**: 配置路由

**文件**: `miniapp/src/app.config.ts`

```typescript
export default {
  pages: [
    'pages/index/index',
    'pages/tasks/index',
    'pages/tasks/detail',
    'pages/tasks/recommended',  // 新增
    // ...
  ],
}
```

**步骤2**: 添加入口

**文件**: `miniapp/src/pages/tasks/index.tsx`

```typescript
// 在任务列表页添加"推荐任务"入口
<View className="task-tabs">
  <View className="tab" onClick={() => Taro.navigateTo({ url: '/pages/tasks/recommended' })}>
    🎯 为你推荐
  </View>
  {/* 其他tab */}
</View>
```

### 3.3 添加导师对话入口

**文件**: `miniapp/src/pages/tasks/detail.tsx`

```typescript
// 在任务详情页添加"问导师"按钮
<View className="task-actions">
  {/* 现有按钮 */}
  
  {/* 新增：问导师按钮 */}
  {order && order.status === 'in_progress' && (
    <Button 
      className="ask-mentor-btn"
      onClick={() => openMentorDialog(order.id)}
    >
      💬 问导师
    </Button>
  )}
</View>

// 导师对话抽屉
<MentorDialog 
  visible={mentorDialogVisible}
  orderId={currentOrderId}
  onClose={() => setMentorDialogVisible(false)}
/>
```

### 验收标准

- [ ] 企业端任务详情页显示TaskMatching组件
- [ ] 学生端可以访问/pages/tasks/recommended路由
- [ ] 学生端任务详情页显示"问导师"按钮
- [ ] 点击"问导师"打开对话抽屉
- [ ] 对话抽屉支持发送消息和接收流式回复

---

## Phase 4: 端到端测试（P1 - 建议完成）

### 预计时间：4小时
### 负责人：测试团队

### 4.1 创建测试用户

**创建SQL脚本**: `backend/scripts/create-test-users.sql`

```sql
-- 视觉型学生（创作驱动≥65）
INSERT INTO users (id, username, email, role, opc_openness, opc_creativity, current_level)
VALUES 
  ('test-visual-student-001', 'visual_student', 'visual@test.com', 'student', 75, 80, 0);

-- 逻辑型学生（创作驱动≤45）
INSERT INTO users (id, username, email, role, opc_openness, opc_creativity, current_level)
VALUES 
  ('test-logical-student-001', 'logical_student', 'logical@test.com', 'student', 40, 35, 0);

-- 测试企业
INSERT INTO users (id, username, email, role)
VALUES 
  ('test-company-001', 'test_company', 'company@test.com', 'company');

-- 测试任务
INSERT INTO tasks (id, title, description, company_id, level_required, budget_min, budget_max)
VALUES 
  ('test-task-001', '品牌视觉设计', '为新品牌设计Logo和VI系统', 'test-company-001', 0, 500, 1000);
```

### 4.2 测试场景清单

#### T-01：任务开始引导

**测试步骤**:
1. 视觉型学生接单test-task-001
2. 等待30秒
3. 检查mentor_sessions是否有新记录
4. 检查ai_call_logs是否有AI-06记录
5. 对比视觉型和逻辑型学生收到的引导内容

**验收标准**:
- [ ] 两个学生都收到引导消息
- [ ] 引导内容风格明显不同
- [ ] ai_call_logs有2条AI-06记录

#### T-02：学生主动求助

**测试步骤**:
1. 学生发送"我卡住了"
2. 观察WebSocket是否收到mentor_stream事件
3. 测量首字延迟
4. 检查回复内容是否包含三步引导法

**验收标准**:
- [ ] 收到流式回复
- [ ] 首字延迟<2秒
- [ ] 回复包含：定位卡点→给方向线索→邀请对话

#### T-03：交付物打回

**测试步骤**:
1. 学生提交交付物
2. 企业打回，填写反馈："整体感觉可以更好"
3. 检查学生是否收到翻译后的引导

**验收标准**:
- [ ] 学生收到导师消息
- [ ] 消息包含四部分：肯定+定位+方向+邀请
- [ ] 模糊反馈被翻译成具体方向

#### T-04：无操作轻推

**测试步骤**:
1. 手动修改订单的last_activity_at为3小时前
2. 等待30分钟（定时任务周期）
3. 检查是否收到轻推消息

**验收标准**:
- [ ] 收到第1次轻推（轻松语气）
- [ ] 修改为7小时前，收到第2次轻推（关心语气）
- [ ] 修改为15小时前，收到第3次轻推（具体建议）
- [ ] 不再收到第4次轻推

#### T-05：里程碑见证

**测试步骤**:
1. 学生完成订单
2. 检查是否收到见证消息
3. 验证消息是否引用历史数据

**验收标准**:
- [ ] 收到见证消息
- [ ] 消息包含对比（入驻时vs现在）
- [ ] 消息包含具体细节（本次做了什么）
- [ ] mentor_growth_observations有新记录

#### T-06：风险预警

**测试步骤**:
1. Lv.0学生接Lv.2任务
2. 等待15分钟
3. 检查是否收到预警

**验收标准**:
- [ ] 收到预警消息
- [ ] 消息提到难度差距
- [ ] 消息给出拆解建议
- [ ] mentor_alerts有新记录

#### T-07：提交前自查

**测试步骤**:
1. 学生打开提交页，等待5分钟
2. 或点击"提交前帮我看看"按钮
3. 测量响应时间

**验收标准**:
- [ ] 收到自查清单
- [ ] 响应时间<3秒
- [ ] 清单包含3个检查项
- [ ] ai_call_logs显示同步调用（非队列）

### 4.3 长期记忆测试

**测试步骤**:
1. 让测试学生完成3个订单
2. 在第4个订单中触发T-02求助
3. 检查回复是否引用历史

**验收标准**:
- [ ] mentor_student_profile_cache有该学生记录
- [ ] profile_summary包含历史卡点
- [ ] 导师回复提到过往经历

### 4.4 风格自适应测试

**测试步骤**:
1. 视觉型和逻辑型学生接同一个任务
2. 对比T-01引导内容
3. 对比T-02求助回复

**验收标准**:
- [ ] 两人的guidance_style不同
- [ ] 视觉型收到画面感类比
- [ ] 逻辑型收到结构化步骤

---

## Phase 5: 性能优化（P2 - 可选）

### 预计时间：2小时

### 5.1 响应时间优化

**监控指标**:
- T-02流式首字延迟：目标<2秒
- T-07同步响应：目标<3秒
- AI-06平均响应时间：目标<5秒

**优化方法**:
```sql
-- 添加索引
CREATE INDEX IF NOT EXISTS idx_mentor_sessions_order 
  ON mentor_sessions(order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mentor_messages_session 
  ON mentor_messages(session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_call_logs_engine 
  ON ai_call_logs(engine_name, created_at DESC);
```

### 5.2 上下文压缩测试

**测试步骤**:
1. 创建一个对话超过20轮的订单
2. 发送第21条消息
3. 检查input_tokens

**验收标准**:
- [ ] input_tokens控制在1000-2000范围
- [ ] 对话仍然连贯
- [ ] context_snapshot有压缩摘要

---

## Phase 6: 监控和日志（P2 - 可选）

### 预计时间：2小时

### 6.1 配置监控

**创建监控脚本**: `backend/scripts/monitor-ai-calls.js`

```javascript
// 监控AI-06调用情况
setInterval(async () => {
  const stats = await pool.query(`
    SELECT 
      COUNT(*) as total_calls,
      AVG(latency_ms) as avg_latency,
      SUM(CASE WHEN is_success THEN 1 ELSE 0 END) as success_count,
      AVG(input_tokens) as avg_input_tokens,
      AVG(output_tokens) as avg_output_tokens
    FROM ai_call_logs
    WHERE engine_name = 'AI-06'
      AND created_at > NOW() - INTERVAL '1 hour'
  `);
  
  console.log('AI-06 过去1小时统计:', stats.rows[0]);
}, 60000); // 每分钟
```

### 6.2 配置告警

**告警规则**:
- AI-06成功率<90% → 发送告警
- 平均响应时间>10秒 → 发送告警
- Redis连接失败 → 发送告警

---

## 验收检查清单

### Phase 1: 依赖修复
- [ ] npm install成功
- [ ] Redis运行正常
- [ ] 服务启动无错误
- [ ] 日志中无依赖错误

### Phase 2: 数据初始化
- [ ] mentor_tool_hints ≥50条
- [ ] 数据格式正确

### Phase 3: 前端集成
- [ ] 企业端匹配组件显示
- [ ] 学生端推荐页面可访问
- [ ] 导师对话功能可用

### Phase 4: 端到端测试
- [ ] T-01至T-07场景全部通过
- [ ] AI调用记录>0
- [ ] 长期记忆验证通过
- [ ] 风格自适应验证通过

### Phase 5: 性能优化
- [ ] T-02首字<2秒
- [ ] T-07响应<3秒
- [ ] 上下文压缩生效

### Phase 6: 监控配置
- [ ] 监控脚本运行
- [ ] 告警规则配置

---

## 时间表

| Phase | 预计时间 | 优先级 | 开始日期 | 完成日期 |
|---|---|---|---|---|
| Phase 1: 依赖修复 | 2小时 | P0 | 立即 | Day 1 |
| Phase 2: 数据初始化 | 1小时 | P0 | Day 1 | Day 1 |
| Phase 3: 前端集成 | 4小时 | P1 | Day 2 | Day 2 |
| Phase 4: 端到端测试 | 4小时 | P1 | Day 3 | Day 3 |
| Phase 5: 性能优化 | 2小时 | P2 | Day 4 | Day 4 |
| Phase 6: 监控配置 | 2小时 | P2 | Day 4 | Day 4 |

**总计**: 15小时，预计4个工作日完成

---

## 风险和缓解

### 风险1: npm权限问题无法解决
**影响**: 无法安装bull和socket.io
**缓解**: 
- 使用nvm切换到用户级Node.js
- 或使用Docker容器运行

### 风险2: 前端集成遇到兼容性问题
**影响**: UI组件无法正常显示
**缓解**:
- 提前测试Taro版本兼容性
- 准备降级方案

### 风险3: 测试发现功能缺陷
**影响**: 需要额外时间修复
**缓解**:
- 预留20%缓冲时间
- 优先修复P0级别问题

---

## 成功标准

### 最低标准（P0完成）
- ✅ 服务启动无错误
- ✅ 依赖全部安装
- ✅ 数据初始化完成

### 建议标准（P0+P1完成）
- ✅ 前端UI集成完成
- ✅ T-01至T-07场景测试通过
- ✅ AI调用记录>10条
- ✅ 长期记忆和风格自适应验证通过

### 理想标准（P0+P1+P2完成）
- ✅ 性能指标达标
- ✅ 监控和告警配置完成
- ✅ 所有验收清单项通过

---

## 联系人

- **项目负责人**: [待填写]
- **后端开发**: [待填写]
- **前端开发**: [待填写]
- **测试工程师**: [待填写]
- **运维工程师**: [待填写]

---

**文档版本**: v1.0  
**最后更新**: 2026-05-27  
**下次审查**: 完成Phase 1后
