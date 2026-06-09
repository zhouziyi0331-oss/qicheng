"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const aiTaskQueue_1 = require("../services/aiTaskQueue");
const websocketService_1 = __importDefault(require("../services/websocketService"));
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
/**
 * 获取AI任务队列统计
 * GET /api/v1/admin/queue-stats
 */
router.get('/queue-stats', auth_1.authenticate, async (req, res) => {
    try {
        const user = req.user;
        // 只允许管理员访问
        if (user.role !== 'admin') {
            return res.status(403).json({ error: '无权访问' });
        }
        const stats = await (0, aiTaskQueue_1.getQueueStats)();
        res.json({
            success: true,
            stats
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get queue stats:', error);
        res.status(500).json({ error: '获取队列统计失败' });
    }
});
/**
 * 获取WebSocket连接统计
 * GET /api/v1/admin/websocket-stats
 */
router.get('/websocket-stats', auth_1.authenticate, async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== 'admin') {
            return res.status(403).json({ error: '无权访问' });
        }
        const stats = {
            onlineUserCount: websocketService_1.default.getOnlineUserCount(),
            onlineUsers: websocketService_1.default.getOnlineUsers()
        };
        res.json({
            success: true,
            stats
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get WebSocket stats:', error);
        res.status(500).json({ error: '获取WebSocket统计失败' });
    }
});
/**
 * 测试WebSocket推送
 * POST /api/v1/admin/test-websocket
 */
router.post('/test-websocket', auth_1.authenticate, async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== 'admin') {
            return res.status(403).json({ error: '无权访问' });
        }
        const { userId, event, data } = req.body;
        if (!userId || !event) {
            return res.status(400).json({ error: '缺少必要参数' });
        }
        websocketService_1.default.pushToUser(userId, event, data || {});
        res.json({
            success: true,
            message: `已推送消息给用户 ${userId}`
        });
    }
    catch (error) {
        logger_1.default.error('Failed to test WebSocket:', error);
        res.status(500).json({ error: '测试WebSocket失败' });
    }
});
exports.default = router;
//# sourceMappingURL=adminMonitorRoutes.js.map