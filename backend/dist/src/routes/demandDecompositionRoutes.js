"use strict";
/**
 * Phase 3.4: 需求自动拆解推送路由
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const demandDecompositionService_1 = __importDefault(require("../services/demandDecompositionService"));
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
/**
 * 企业提交大需求，自动拆解
 * POST /api/v1/demand-decomposition/decompose
 */
router.post('/decompose', auth_1.authenticate, (0, auth_1.requireRole)('company'), async (req, res, next) => {
    try {
        const companyId = req.user.userId;
        const { taskId, taskTitle, taskDescription, totalBudget } = req.body;
        if (!taskId || !taskTitle || !taskDescription) {
            return res.status(400).json({
                success: false,
                message: '任务ID、标题和描述为必填项'
            });
        }
        logger_1.default.info('[DemandDecomposition] 开始AI拆解', {
            companyId,
            taskId
        });
        const result = await demandDecompositionService_1.default.decomposeTaskWithAI({
            taskId,
            companyId,
            taskTitle,
            taskDescription,
            totalBudget: totalBudget || 0
        });
        res.json({
            success: true,
            data: result,
            message: `成功拆解为${result.totalSubtasks}个子任务`
        });
    }
    catch (error) {
        logger_1.default.error('[DemandDecomposition] 拆解失败:', error);
        next(error);
    }
});
/**
 * 推送子任务给匹配的学生
 * POST /api/v1/demand-decomposition/subtasks/:subtaskId/push
 */
router.post('/subtasks/:subtaskId/push', auth_1.authenticate, (0, auth_1.requireRole)('company'), async (req, res, next) => {
    try {
        const { subtaskId } = req.params;
        const { maxPushCount } = req.body;
        logger_1.default.info('[DemandDecomposition] 推送子任务', {
            companyId: req.user.userId,
            subtaskId
        });
        const pushResults = await demandDecompositionService_1.default.pushSubtaskToStudents({
            subtaskId,
            maxPushCount: maxPushCount || 5
        });
        res.json({
            success: true,
            data: pushResults,
            message: `已推送给${pushResults.length}位学生`
        });
    }
    catch (error) {
        logger_1.default.error('[DemandDecomposition] 推送失败:', error);
        next(error);
    }
});
/**
 * 学生查看收到的子任务推送
 * GET /api/v1/demand-decomposition/my-pushes
 */
router.get('/my-pushes', auth_1.authenticate, (0, auth_1.requireRole)('student'), async (req, res, next) => {
    try {
        const studentId = req.user.userId;
        const { responseStatus, limit } = req.query;
        logger_1.default.info('[DemandDecomposition] 学生查看推送', { studentId });
        const pushes = await demandDecompositionService_1.default.getStudentSubtaskPushes({
            studentId,
            responseStatus: responseStatus,
            limit: limit ? parseInt(limit) : undefined
        });
        res.json({
            success: true,
            data: pushes
        });
    }
    catch (error) {
        logger_1.default.error('[DemandDecomposition] 查看推送失败:', error);
        next(error);
    }
});
/**
 * 学生响应子任务推送（接受/拒绝）
 * POST /api/v1/demand-decomposition/subtasks/:subtaskId/respond
 */
router.post('/subtasks/:subtaskId/respond', auth_1.authenticate, (0, auth_1.requireRole)('student'), async (req, res, next) => {
    try {
        const { subtaskId } = req.params;
        const studentId = req.user.userId;
        const { response, rejectionReason } = req.body;
        if (!response || !['accepted', 'rejected'].includes(response)) {
            return res.status(400).json({
                success: false,
                message: '请提供有效的响应（accepted或rejected）'
            });
        }
        logger_1.default.info('[DemandDecomposition] 学生响应子任务', {
            studentId,
            subtaskId,
            response
        });
        const success = await demandDecompositionService_1.default.respondToSubtask({
            subtaskId,
            studentId,
            response,
            rejectionReason
        });
        res.json({
            success,
            message: response === 'accepted' ? '已接受任务' : '已拒绝任务'
        });
    }
    catch (error) {
        logger_1.default.error('[DemandDecomposition] 响应失败:', error);
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=demandDecompositionRoutes.js.map