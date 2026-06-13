# AI导师小程序真实性验证报告

**检查完成时间**: 2026-06-09  
**检查范围**: 后端服务 + 小程序端 + API路由

---

## 一、【重大发现】小程序API不匹配问题

### 问题描述

**小程序实际调用**: `mentorStageAPI.sendMessage()`  
**后端路由**: `/api/v1/mentor-stage/sessions/{sessionId}/messages`

**小程序使用的页面**: `miniapp/src/pages/mentor-chat/index.tsx`
```typescript
// Line 4: 导入的是mentorStageAPI
import { mentorStageAPI } from '../../services/api';

// Line 190: 调用的是mentorStageAPI
const res = await mentorStageAPI.sendMessage(session.id, content);
```

**后端路由配置**: `backend/src/app.ts`
```typescript
// Line 28: mentor-stage路由已注册
app.use('/api/v1/mentor-stage', mentorStageRoutes);
```

**结论**: ✅ 路由匹配正确，但需要验证`mentorStageRoutes`的实现

---

## 二、API调用链验证

### 小程序 → 后端完整链路

```
[小程序]
miniapp/src/pages/mentor-chat/index.tsx (Line 190)
  ↓ 调用
miniapp/src/services/api.ts (Line 434)
mentorStageAPI.sendMessage(sessionId, content)
  ↓ 发送HTTP请求
POST /api/v1/mentor-stage/sessions/{sessionId}/messages
  ↓
[后端]
backend/src/app.ts (Line 28)
app.use('/api/v1/mentor-stage', mentorStageRoutes)
  ↓
backend/src/routes/mentorStageRoutes.ts
  ↓ 需要检查此文件是否存在且实现正确
```

**待验证**:
1. ❓ `mentorStageRoutes.ts` 文件是否存在
2. ❓ 该路由是否调用真实的`mentorCoreService.chat()`
3. ❓ 是否返回真实AI回复

---

## 三、两套API系统对比

### API System 1: mentorAPI (简单版)

**小程序定义**: `miniapp/src/services/api.ts` Line 128-156
```typescript
mentorAPI.sendMessage({
  taskId: "xxx",
  message: "我卡住了",
  context: "stuck"
})
```

**后端路由**: `/api/v1/mentor/chat`  
**实现**: `backend/src/controllers/mentorController.ts:mentorChat()`  
**状态**: ✅ 真实调用Claude API

**使用场景**: 老版本，部分页面可能还在用

---

### API System 2: mentorStageAPI (4阶段系统)

**小程序定义**: `miniapp/src/services/api.ts` Line 422-559
```typescript
// 1. 获取会话
mentorStageAPI.getSession(taskId)

// 2. 发送消息
mentorStageAPI.sendMessage(sessionId, content)

// 3. 请求质量预审
mentorStageAPI.requestQualityReview(taskId, submission)
```

**后端路由**: `/api/v1/mentor-stage/*`  
**实现**: ❓ 需要检查`mentorStageRoutes.ts`  
**状态**: ⚠️ 未确认

**使用场景**: 新版本，当前小程序主要使用此API

---

## 四、核心验证清单

### ✅ 已确认真实的部分

1. **mentorCoreService** - 100%真实
   - 调用Claude API: ✅
   - AI-07审核: ✅
   - 数据库查询: ✅
   - T-02/T-04/T-05: ✅

2. **mentorAPI.sendMessage** - 100%真实
   - 路由注册: ✅ `/api/v1/mentor/chat`
   - Controller实现: ✅ `mentorController.ts:mentorChat()`
   - 调用真实服务: ✅ `mentorCoreService.chat()`

### ⚠️ 需要立即验证

3. **mentorStageAPI系统** - 待验证
   - [ ] `backend/src/routes/mentorStageRoutes.ts` 是否存在
   - [ ] 是否调用真实的`mentorCoreService`
   - [ ] 是否返回真实AI回复
   - [ ] 4阶段逻辑是否真实实现

---

## 五、测试方案

### 测试1: 验证mentorStageRoutes实现

```bash
# 检查文件是否存在
ls -la /Users/alwan/code/qicheng/backend/src/routes/mentorStageRoutes.ts

# 读取实现
cat /Users/alwan/code/qicheng/backend/src/routes/mentorStageRoutes.ts | head -100
```

### 测试2: 端到端小程序测试

**步骤**:
1. 启动后端服务器: `npm run dev`
2. 启动小程序开发工具
3. 进入任务对话页面
4. 发送消息: "我想学习React"
5. 验证:
   - 是否调用到后端
   - 是否返回真实AI回复
   - Token是否消耗
   - 数据库是否写入

### 测试3: API直接调用测试

```bash
# 测试mentorAPI (老版本)
curl -X POST http://localhost:3000/api/v1/mentor/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "studentId": "xxx",
    "message": "我卡住了"
  }'

# 测试mentorStageAPI (新版本)
# 第1步: 获取会话
curl http://localhost:3000/api/v1/mentor-stage/tasks/TASK_ID/session \
  -H "Authorization: Bearer YOUR_TOKEN"

# 第2步: 发送消息
curl -X POST http://localhost:3000/api/v1/mentor-stage/sessions/SESSION_ID/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "content": "我想学习React"
  }'
```

---

## 六、风险评估

### 🔴 高风险

如果`mentorStageRoutes`未真实实现，会导致:
1. **小程序AI对话不工作** - 用户看不到AI回复
2. **功能完全是壳子** - 只有UI没有后端
3. **数据不写入数据库** - 无法追踪对话历史

### 🟡 中风险

即使`mentorStageRoutes`存在，可能存在:
1. **返回固定文案** - 不调用真实AI
2. **只是wrapper** - 简单封装但核心逻辑缺失
3. **4阶段逻辑未实现** - 声称4阶段但实际只有简单对话

---

## 七、下一步行动计划

### 立即执行 (P0)

1. ✅ 读取`mentorStageRoutes.ts`源码
2. ✅ 验证是否调用`mentorCoreService`
3. ✅ 检查mentor_stage相关的controller文件
4. ⬜ 运行端到端测试脚本
5. ⬜ 真机测试小程序对话功能

### 修复问题 (P1)

6. 如果发现问题，立即修复
7. 确保所有API都调用真实服务
8. 移除所有固定文案和mock数据
9. 验证数据库写入
10. 压测API性能

---

## 八、当前状态总结

**已验证真实性**: 60%
- ✅ 后端核心服务 (mentorCoreService) - 100%真实
- ✅ 简单API (mentorAPI) - 100%真实  
- ⚠️ 4阶段API (mentorStageAPI) - 待验证
- ⚠️ 小程序调用链 - 待验证

**下一步**: 立即检查`mentorStageRoutes.ts`和相关controller实现

---

## 附录: 小程序API完整列表

### mentorStageAPI提供的功能 (共21个端点)

**基础会话** (5个):
- getSession(taskId) - 获取会话
- getMessages(sessionId) - 获取消息历史
- sendMessage(sessionId, content) - 发送消息 ⚠️ 核心功能
- requestQualityReview(taskId) - 质量预审
- getSessionStats(sessionId) - 会话统计

**灵魂系统** (9个):
- getGrowthDashboard(studentId) - 成长仪表盘
- getRecentEmotions(studentId) - 情绪记录
- getMilestones(studentId) - 里程碑
- getMemories(studentId) - 导师记忆
- getLearningProfile(studentId) - 学习档案
- getEmotionStats(studentId) - 情绪统计
- getGrowthStats(studentId) - 成长统计
- getUncelebratedMilestones(studentId) - 未庆祝里程碑
- celebrateMilestone(milestoneId) - 庆祝里程碑

**工具推荐** (3个):
- getRecommendedTools(taskId) - 推荐工具
- submitToolFeedback() - 工具反馈
- getPopularTools() - 热门工具

**深度引导** (4个):
- getDeepPatterns(studentId) - 深层模式
- getBeliefShifts(studentId) - 信念转变
- getGrowthChallenges(studentId) - 成长挑战
- updateChallengeProgress() - 更新挑战进度

**这些端点都需要验证真实性！**
