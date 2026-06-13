"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chatScopeMonitoringService_1 = __importDefault(require("../../services/chatScopeMonitoringService"));
const auth_1 = require("../../middleware/auth");
const router = express_1.default.Router();
/**
 * POST /api/chat-monitoring/monitor
 * 监测消息（实时）
 */
router.post('/monitor', auth_1.authenticate, async (req, res) => {
    try {
        const senderId = req.user.id;
        const senderRole = req.user.role;
        const { taskId, messageContent, taskContext } = req.body;
        if (!taskId || !messageContent) {
            return res.status(400).json({
                success: false,
                message: '缺少必填字段: taskId, messageContent',
            });
        }
        const alert = await chatScopeMonitoringService_1.default.monitorMessage({
            taskId,
            senderId,
            senderRole,
            messageContent,
            taskContext,
        });
        res.json({
            success: true,
            data: {
                has_alert: !!alert,
                alert,
            },
        });
    }
    catch (error) {
        logger.error('监测消息失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '监测消息失败',
        });
    }
});
/**
 * GET /api/chat-monitoring/tasks/:taskId/alerts
 * 获取任务的警报列表
 */
router.get('/tasks/:taskId/alerts', auth_1.authenticate, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { status } = req.query;
        const userId = req.user.id;
        const userRole = req.user.role;
        // 权限检查：企业、学生或管理员
        const taskCheck = await req.app.locals.pool.query(`SELECT company_id, student_id FROM tasks WHERE id = $1`, [taskId]);
        if (taskCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '任务不存在',
            });
        }
        const task = taskCheck.rows[0];
        const hasAccess = userRole === 'admin' ||
            task.company_id === userId ||
            task.student_id === userId;
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: '无权查看警报',
            });
        }
        const alerts = await chatScopeMonitoringService_1.default.getTaskAlerts(taskId, status);
        res.json({
            success: true,
            data: {
                alerts,
                total: alerts.length,
            },
        });
    }
    catch (error) {
        logger.error('获取警报失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取警报失败',
        });
    }
});
/**
 * POST /api/chat-monitoring/alerts/:alertId/acknowledge
 * 用户确认警报
 */
router.post('/alerts/:alertId/acknowledge', auth_1.authenticate, async (req, res) => {
    try {
        const { alertId } = req.params;
        const userId = req.user.id;
        const { action } = req.body;
        if (!action || !['accepted', 'ignored', 'reported'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'action必须是: accepted, ignored, 或 reported',
            });
        }
        // 验证警报归属（可选，取决于业务需求）
        const alertCheck = await req.app.locals.pool.query(`SELECT csa.*, t.company_id, t.student_id
       FROM chat_scope_alerts csa
       JOIN tasks t ON csa.task_id = t.id
       WHERE csa.id = $1`, [alertId]);
        if (alertCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '警报不存在',
            });
        }
        const alert = alertCheck.rows[0];
        const hasAccess = alert.company_id === userId || alert.student_id === userId;
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: '无权操作该警报',
            });
        }
        await chatScopeMonitoringService_1.default.acknowledgeAlert(alertId, userId, action);
        res.json({
            success: true,
            message: '警报已确认',
        });
    }
    catch (error) {
        logger.error('确认警报失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '确认警报失败',
        });
    }
});
/**
 * GET /api/chat-monitoring/tasks/:taskId/stats
 * 获取任务的监测统计
 */
router.get('/tasks/:taskId/stats', auth_1.authenticate, async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;
        // 权限检查
        const taskCheck = await req.app.locals.pool.query(`SELECT company_id, student_id FROM tasks WHERE id = $1`, [taskId]);
        if (taskCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '任务不存在',
            });
        }
        const task = taskCheck.rows[0];
        const hasAccess = userRole === 'admin' ||
            task.company_id === userId ||
            task.student_id === userId;
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: '无权查看统计',
            });
        }
        const stats = await chatScopeMonitoringService_1.default.getMonitoringStats(taskId);
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        logger.error('获取监测统计失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取统计失败',
        });
    }
});
/**
 * GET /api/chat-monitoring/rules
 * 获取监测规则
 */
router.get('/rules', auth_1.authenticate, async (req, res) => {
    try {
        const rules = await chatScopeMonitoringService_1.default.getMonitoringRules();
        res.json({
            success: true,
            data: {
                rules,
                total: rules.length,
            },
        });
    }
    catch (error) {
        logger.error('获取监测规则失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取规则失败',
        });
    }
});
exports.default = router;
//# sourceMappingURL=index.js.map