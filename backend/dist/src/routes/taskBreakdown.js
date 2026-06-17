"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taskBreakdownService_1 = __importDefault(require("../services/taskBreakdownService"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * POST /api/v1/tasks/:taskId/breakdown
 * 获取任务拆解建议
 */
router.post('/:taskId/breakdown', auth_1.authenticate, async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const studentId = req.user?.userId;
        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }
        const result = await taskBreakdownService_1.default.breakdownTask(taskId, studentId);
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/v1/tasks/:taskId/breakdown/:breakdownId
 * 获取已保存的任务拆解
 */
router.get('/:taskId/breakdown/:breakdownId', auth_1.authenticate, async (req, res, next) => {
    try {
        const { breakdownId } = req.params;
        // TODO: Implement getBreakdown method in taskBreakdownService
        res.json({
            success: true,
            data: { breakdownId, message: 'Not yet implemented' },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=taskBreakdown.js.map