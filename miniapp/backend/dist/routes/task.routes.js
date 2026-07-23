"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const backgroundTask_controller_1 = require("../controllers/backgroundTask.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// 获取用户任务列表
router.get('/', auth_middleware_1.authMiddleware, (req, res) => backgroundTask_controller_1.backgroundTaskController.getUserTasks(req, res));
// 获取任务统计
router.get('/stats', auth_middleware_1.authMiddleware, (req, res) => backgroundTask_controller_1.backgroundTaskController.getTaskStats(req, res));
// 获取任务详情
router.get('/:taskId', auth_middleware_1.authMiddleware, (req, res) => backgroundTask_controller_1.backgroundTaskController.getTaskDetail(req, res));
// 重试失败的任务
router.post('/:taskId/retry', auth_middleware_1.authMiddleware, (req, res) => backgroundTask_controller_1.backgroundTaskController.retryTask(req, res));
exports.default = router;
//# sourceMappingURL=task.routes.js.map