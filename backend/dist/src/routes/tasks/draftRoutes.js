"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const draftController_1 = require("./draftController");
const amendmentController_1 = require("./amendmentController");
const router = (0, express_1.Router)();
// 草稿箱路由
router.post('/drafts/publish', auth_1.authenticate, draftController_1.saveTaskDraft); // 保存任务发布草稿
router.get('/drafts/publish', auth_1.authenticate, draftController_1.getTaskDraft); // 获取任务发布草稿
router.post('/drafts/submit', auth_1.authenticate, draftController_1.saveSubmitDraft); // 保存任务提交草稿
router.get('/drafts/submit/:taskId', auth_1.authenticate, draftController_1.getSubmitDraft); // 获取任务提交草稿
router.delete('/drafts/:draftId', auth_1.authenticate, draftController_1.deleteDraft); // 删除草稿
// 任务追加需求路由
router.post('/amendments', auth_1.authenticate, amendmentController_1.createAmendment); // 创建追加需求（企业端）
router.post('/amendments/:amendmentId/respond', auth_1.authenticate, amendmentController_1.respondToAmendment); // 响应追加需求（学生端）
router.get('/amendments/pending', auth_1.authenticate, amendmentController_1.getMyPendingAmendments); // 获取我的待处理追加需求（学生端）
router.get('/:taskId/amendments', auth_1.authenticate, amendmentController_1.getTaskAmendments); // 获取任务的追加需求列表
exports.default = router;
//# sourceMappingURL=draftRoutes.js.map