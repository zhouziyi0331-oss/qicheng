# AI导师系统 - 路由修复方案

**问题**: `backend/src/routes/mentor/index.ts` 中多个不同场景的端点共用同一个handler

---

## 当前问题

```typescript
// 所有这些路由都指向同一个handleStuckMessage
router.post('/:taskId/stuck', authenticate, handleStuckMessage);
router.post('/:taskId/rejection-guidance', authenticate, handleStuckMessage);
router.post('/:taskId/milestone', authenticate, handleStuckMessage);
router.post('/observe', authenticate, handleStuckMessage);
router.post('/detect-stuck', authenticate, handleStuckMessage);
router.post('/welcome-message', authenticate, handleStuckMessage);
```

**影响**: 无法区分不同的业务场景

---

## 解决方案

### 方案A: 这些是兼容旧版的空路由，可以删除

**检查**: 查看小程序是否使用这些端点

```bash
cd /Users/alwan/code/qicheng/miniapp/src
grep -r "/:taskId/stuck" .
grep -r "/rejection-guidance" .
grep -r "/milestone" .
```

**如果小程序未使用**: 直接删除这些路由

---

### 方案B: 保留但标记为废弃

```typescript
// backend/src/routes/mentor/index.ts

// ============================================================
// 以下是兼容旧版的废弃路由，新代码请使用 mentorStageAPI
// ============================================================

// @deprecated 请使用 mentorStageAPI.sendMessage 代替
router.post('/:taskId/stuck', authenticate, (req, res) => {
  res.status(410).json({
    success: false,
    message: '此API已废弃，请使用 /api/v1/mentor-stage/sessions/:sessionId/messages'
  });
});

// @deprecated 请使用 mentorStageAPI
router.post('/:taskId/rejection-guidance', authenticate, (req, res) => {
  res.status(410).json({
    success: false,
    message: '此API已废弃，请使用 mentorStageAPI'
  });
});

// @deprecated 请使用 mentorStageAPI
router.post('/:taskId/milestone', authenticate, (req, res) => {
  res.status(410).json({
    success: false,
    message: '此API已废弃，请使用 mentorStageAPI'
  });
});
```

---

### 方案C: 实现正确的业务逻辑 (推荐)

```typescript
// backend/src/routes/mentor/index.ts

import * as mentorController from '../controllers/mentorController';

// 学生报告卡点
router.post('/:taskId/stuck', authenticate, mentorController.reportStuck);

// 拒绝任务后的引导
router.post('/:taskId/rejection-guidance', authenticate, mentorController.getRejectionGuidance);

// 庆祝里程碑
router.post('/:taskId/milestone', authenticate, mentorController.celebrateMilestone);

// 记录导师观察
router.post('/observe', authenticate, mentorController.recordObservation);
```

然后在 `mentorController.ts` 中实现这些方法：

```typescript
// backend/src/controllers/mentorController.ts

export const reportStuck = async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const { stuckPoint } = req.body;
  const studentId = req.user?.userId;
  
  // 调用真实的mentorCoreService
  const result = await mentorCoreService.chat(
    studentId,
    `我卡住了：${stuckPoint}`,
    taskId
  );
  
  res.json({ success: true, response: result.response });
};

export const getRejectionGuidance = async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const { rejectionReason } = req.body;
  const studentId = req.user?.userId;
  
  const result = await mentorCoreService.chat(
    studentId,
    `我的提交被打回了，原因是：${rejectionReason}`,
    taskId
  );
  
  res.json({ success: true, response: result.response });
};

export const celebrateMilestone = async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const { milestone } = req.body;
  const studentId = req.user?.userId;
  
  const result = await mentorCoreService.chat(
    studentId,
    `我完成了一个里程碑：${milestone}`,
    taskId
  );
  
  res.json({ success: true, response: result.response });
};
```

---

## 推荐执行步骤

1. **检查小程序使用情况** - 确认哪些API真的在用
2. **如果未使用** - 删除这些路由
3. **如果在使用** - 实现方案C，调用真实的mentorCoreService
4. **更新文档** - 说明API的用途和区别

---

## 当前状态

- ✅ 核心功能100%真实 (mentorCoreService, mentorStageService)
- ⚠️ 兼容路由混乱但不影响核心功能
- ✅ 小程序使用的mentorStageAPI完全正常

**结论**: 这是历史遗留问题，不影响当前功能，可以选择性修复。
