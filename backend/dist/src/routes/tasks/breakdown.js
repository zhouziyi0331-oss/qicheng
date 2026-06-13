"use strict";
/**
 * 任务拆解API路由 - E-01功能
 * 提供AI需求拆解相关的API端点
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const taskBreakdownService_1 = __importDefault(require("../../services/taskBreakdownService"));
const logger_1 = __importDefault(require("../../utils/logger"));
const router = (0, express_1.Router)();
/**
 * POST /api/tasks/ai-breakdown
 * AI拆解任务需求（不需要taskId，用于任务发布前）
 */
router.post('/ai-breakdown', auth_1.authenticate, (0, auth_1.requireRole)('company'), async (req, res) => {
    try {
        const { rawDescription, additionalContext } = req.body;
        if (!rawDescription || rawDescription.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'rawDescription is required',
            });
        }
        if (rawDescription.length < 20) {
            return res.status(400).json({
                success: false,
                error: 'Description too short, please provide more details (at least 20 characters)',
            });
        }
        const result = await taskBreakdownService_1.default.breakdownTask(rawDescription, {
            userId: req.user?.userId,
            additionalContext,
        });
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        logger_1.default.error('Error in AI breakdown:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to breakdown task',
        });
    }
});
/**
 * POST /api/tasks/:taskId/breakdown
 * 为已存在的任务生成拆解
 */
router.post('/:taskId/breakdown', auth_1.authenticate, (0, auth_1.requireRole)('company'), async (req, res) => {
    try {
        const { taskId } = req.params;
        const { rawDescription, additionalContext } = req.body;
        if (!rawDescription) {
            return res.status(400).json({
                success: false,
                error: 'rawDescription is required',
            });
        }
        // 拆解任务
        const result = await taskBreakdownService_1.default.breakdownTask(rawDescription, {
            userId: req.user?.userId,
            additionalContext,
        });
        // 保存结果
        const historyId = await taskBreakdownService_1.default.saveBreakdownResult(taskId, rawDescription, result, { userId: req.user?.userId, additionalContext });
        res.json({
            success: true,
            data: {
                ...result,
                historyId,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Error creating task breakdown:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create breakdown',
        });
    }
});
/**
 * GET /api/tasks/:taskId/breakdown
 * 获取任务的拆解结果
 */
router.get('/:taskId/breakdown', auth_1.authenticate, async (req, res) => {
    try {
        const { taskId } = req.params;
        const result = await taskBreakdownService_1.default.getBreakdownResult(taskId);
        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'Breakdown not found',
            });
        }
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        logger_1.default.error('Error getting breakdown:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get breakdown',
        });
    }
});
/**
 * GET /api/tasks/:taskId/breakdown/history
 * 获取任务的拆解历史
 */
router.get('/:taskId/breakdown/history', auth_1.authenticate, (0, auth_1.requireRole)('company'), async (req, res) => {
    try {
        const { taskId } = req.params;
        const { limit = 10 } = req.query;
        const history = await taskBreakdownService_1.default.getBreakdownHistory(taskId, Number(limit));
        res.json({
            success: true,
            data: {
                history,
                total: history.length,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Error getting breakdown history:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get history',
        });
    }
});
/**
 * POST /api/tasks/breakdown/:historyId/accept
 * 用户接受拆解结果
 */
router.post('/breakdown/:historyId/accept', auth_1.authenticate, (0, auth_1.requireRole)('company'), async (req, res) => {
    try {
        const { historyId } = req.params;
        const { feedback } = req.body;
        await taskBreakdownService_1.default.acceptBreakdown(historyId, feedback);
        res.json({
            success: true,
            message: 'Breakdown accepted',
        });
    }
    catch (error) {
        logger_1.default.error('Error accepting breakdown:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to accept breakdown',
        });
    }
});
/**
 * PUT /api/tasks/breakdown/:historyId
 * 用户修改拆解结果
 */
router.put('/breakdown/:historyId', auth_1.authenticate, (0, auth_1.requireRole)('company'), async (req, res) => {
    try {
        const { historyId } = req.params;
        const { modifiedResult } = req.body;
        if (!modifiedResult) {
            return res.status(400).json({
                success: false,
                error: 'modifiedResult is required',
            });
        }
        await taskBreakdownService_1.default.modifyBreakdown(historyId, modifiedResult);
        res.json({
            success: true,
            message: 'Breakdown modified',
        });
    }
    catch (error) {
        logger_1.default.error('Error modifying breakdown:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to modify breakdown',
        });
    }
});
/**
 * GET /api/tasks/breakdown/stats
 * 获取拆解统计（管理员）
 */
router.get('/breakdown/stats', auth_1.authenticate, (0, auth_1.requireRole)('admin'), async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const stats = await taskBreakdownService_1.default.getBreakdownStats(Number(days));
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        logger_1.default.error('Error getting breakdown stats:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get stats',
        });
    }
});
exports.default = router;
//# sourceMappingURL=breakdown.js.map