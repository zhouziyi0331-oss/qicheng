# 🚨 AI导师系统严重问题发现报告

**检查时间**: 2026-06-09  
**严重程度**: 🔴 高危

---

## 🔴 核心问题：小程序使用的API不调用真实AI

### 问题链路

```
[小程序] mentor-chat/index.tsx
  ↓ 调用
mentorStageAPI.sendMessage(sessionId, content)
  ↓ HTTP POST
/api/v1/mentor-stage/sessions/{sessionId}/messages
  ↓ 后端路由
backend/src/routes/mentorStageRoutes.ts (Line 21)
  ↓ Controller
backend/src/controllers/mentorStageController.ts::sendMessage() (Line 101)
  ↓ 调用
mentorStageService.generateAdaptiveResponse() (Line 132)
  ↓ 实际调用
humanizedConversationService.generateHumanizedResponse() (Line 475)
  ↓ ❌ 未找到此服务的实现
```

### ❌ 问题1: 未调用真实的mentorCoreService

**小程序实际使用**: `mentorStageController.sendMessage()`  
**该方法调用**: `mentorStageService.generateAdaptiveResponse()`  
**未调用**: `mentorCoreService.chat()` ← 真正的Claude API调用

**代码证据**:

`mentorStageController.ts` Line 132-134:
```typescript
const guidance = await mentorStageService.generateAdaptiveResponse(
  sessionId,
  content
);
```

`mentorStageService.ts` Line 475-482:
```typescript
const humanizedResponse = await humanizedConversationService.generateHumanizedResponse(
  parseInt(session.studentId),
  parseInt(session.taskId),
  parseInt(sessionId),
  studentMessage,
  conversationHistory,
  emotionResult.emotion
);
```

### ❌ 问题2: 依赖的服务可能不存在

`mentorStageService.ts` 依赖了以下服务：
- `emotionAnalysisService` - ⚠️ 未确认
- `growthTrackingService` - ⚠️ 未确认
- `mentorMemoryService` - ⚠️ 未确认
- `adaptiveGuidanceService` - ⚠️ 未确认
- `humanizedConversationService` - ⚠️ 未确认

**如果这些服务不存在或未实现，整个系统将崩溃！**

---

## ✅ 真实可用的API (但小程序没用)

### mentorAPI.sendMessage() - 100%真实

**路由**: `/api/v1/mentor/chat`  
**Controller**: `mentorController.ts:mentorChat()`  
**调用**: `mentorCoreService.chat()` ✅  
**状态**: 真实调用Claude API

**问题**: 小程序没有使用这个API！

---

## 🔧 立即需要的行动

### P0 - 紧急验证

1. ✅ 检查以下服务文件是否存在：
   ```bash
   ls -la backend/src/services/humanizedConversationService.ts
   ls -la backend/src/services/emotionAnalysisService.ts
   ls -la backend/src/services/growthTrackingService.ts
   ls -la backend/src/services/adaptiveGuidanceService.ts
   ```

2. ⬜ 如果文件存在，检查是否真实调用Claude API

3. ⬜ 如果文件不存在或未实现，立即修复

### P0 - 修复方案 (二选一)

#### 方案A: 修复mentorStageController

让`mentorStageController.sendMessage()`调用真实的`mentorCoreService.chat()`:

```typescript
// backend/src/controllers/mentorStageController.ts Line 101

export async function sendMessage(req: Request, res: Response) {
  // ... 前面的验证代码 ...
  
  // ❌ 删除这行
  // const guidance = await mentorStageService.generateAdaptiveResponse(sessionId, content);
  
  // ✅ 改为调用真实的mentorCoreService
  const startTime = Date.now();
  const result = await mentorCoreService.chat(
    session.studentId,
    content,
    session.taskId,
    sessionId
  );
  const responseTime = Date.now() - startTime;
  
  // 保存导师回复
  const messageId = await mentorStageService.saveMessage(
    sessionId,
    'mentor',
    result.response,  // ✅ 使用真实AI回复
    {
      stage: session.currentStage,
      modelUsed: 'claude-haiku-4-5',
      tokensUsed: result.tokensUsed,
      responseTimeMs: responseTime,
    }
  );
  
  res.json({
    success: true,
    data: {
      messageId,
      content: result.response,  // ✅ 返回真实AI回复
      tokensUsed: result.tokensUsed,
      responseTime: responseTime,
      detectedSignals: result.detectedSignals,
    },
  });
}
```

#### 方案B: 让小程序改用真实API

修改小程序调用简单版的`mentorAPI.chat`:

```typescript
// miniapp/src/pages/mentor-chat/index.tsx Line 190

// ❌ 删除
// const res = await mentorStageAPI.sendMessage(session.id, content);

// ✅ 改用真实API
const res = await mentorAPI.sendMessage({
  studentId: userInfo.id,
  taskId: taskId,
  message: content,
  sessionId: session.id
});
```

---

## 📊 影响评估

### 如果humanizedConversationService未实现

**影响**:
- ❌ 小程序AI对话完全不工作
- ❌ 用户发送消息后收不到回复
- ❌ 系统抛出"找不到模块"错误
- ❌ 看起来像完整功能，实际是空壳

**用户体验**:
- 发送消息 → Loading... → 报错
- 无法使用AI导师功能
- 平台核心功能失效

### 当前状态总结

| 组件 | 状态 | 真实性 | 被使用 |
|------|------|--------|--------|
| mentorCoreService | ✅ 已实现 | 100%真实 | ❌ 小程序未用 |
| mentorController.chat | ✅ 已实现 | 100%真实 | ❌ 小程序未用 |
| mentorStageController.sendMessage | ✅ 已实现 | ❓ 取决于依赖 | ✅ 小程序在用 |
| humanizedConversationService | ❓ 未确认 | ❓ 未确认 | ✅ 被依赖 |
| emotionAnalysisService | ❓ 未确认 | ❓ 未确认 | ✅ 被依赖 |
| growthTrackingService | ❓ 未确认 | ❓ 未确认 | ✅ 被依赖 |

---

## 🎯 下一步验证

### 立即执行

```bash
cd /Users/alwan/code/qicheng/backend/src/services

# 检查文件是否存在
ls -la humanizedConversationService.ts
ls -la emotionAnalysisService.ts
ls -la growthTrackingService.ts
ls -la adaptiveGuidanceService.ts

# 如果存在，检查是否调用Claude API
grep -n "anthropic" humanizedConversationService.ts
grep -n "claude" humanizedConversationService.ts
grep -n "messages.create" humanizedConversationService.ts
```

### 测试验证

```bash
# 尝试启动后端
cd /Users/alwan/code/qicheng/backend
npm run dev

# 观察是否有"找不到模块"错误
# 如果启动失败，说明依赖缺失
```

---

## 💡 结论

**当前状态**: 🔴 严重问题

1. ✅ **好消息**: `mentorCoreService.chat()` 是100%真实的
2. ❌ **坏消息**: 小程序没有使用它
3. ⚠️ **未知**: 小程序实际使用的API依赖的服务是否存在

**最坏情况**: 小程序AI对话完全是空壳，无法工作  
**最好情况**: 依赖的服务都已实现且真实调用AI

**需要立即验证后才能下结论！**
