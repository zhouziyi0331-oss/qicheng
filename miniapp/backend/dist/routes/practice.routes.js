"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const practice_controller_1 = require("../controllers/practice.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimiter_middleware_1 = require("../middleware/rateLimiter.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const router = (0, express_1.Router)();
// 所有路由都需要认证
router.use(auth_middleware_1.authMiddleware);
// 实践项目列表
router.get('/projects', validation_middleware_1.validatePagination, (req, res) => practice_controller_1.practiceController.getProjects(req, res));
// 项目详细报告
router.get('/projects/:id/report', (0, validation_middleware_1.validateObjectId)('id'), (req, res) => practice_controller_1.practiceController.getReport(req, res));
// 统计数据
router.get('/stats', (req, res) => practice_controller_1.practiceController.getStats(req, res));
// 更新项目进度
router.put('/projects/:id/progress', (req, res) => practice_controller_1.practiceController.updateProgress(req, res));
// AI拆解报告 - 生成（限流：1小时10次）
router.post('/decomposition/generate', rateLimiter_middleware_1.aiLimiter, (0, validation_middleware_1.validateBody)(['projectId']), (req, res) => practice_controller_1.practiceController.generateDecomposition(req, res));
// AI拆解报告 - 查询状态
router.get('/decomposition/:reportId/status', (req, res) => practice_controller_1.practiceController.getDecompositionStatus(req, res));
// AI拆解报告 - 解锁（付费）
router.post('/decomposition/:reportId/unlock', (req, res) => practice_controller_1.practiceController.unlockDecomposition(req, res));
// AI拆解报告 - 获取完整内容
router.get('/decomposition/:reportId', (req, res) => practice_controller_1.practiceController.getDecomposition(req, res));
exports.default = router;
//# sourceMappingURL=practice.routes.js.map