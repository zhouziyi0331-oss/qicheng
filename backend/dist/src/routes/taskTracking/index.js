"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taskTrackingService_1 = __importDefault(require("../../services/taskTrackingService"));
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
/**
 * E-23: 任务进度仪表盘
 */
// 获取任务进度仪表盘
router.get('/tasks/:taskId/progress-dashboard', auth_1.authenticateToken, async (req, res) => {
    try {
        const { taskId } = req.params;
        const dashboard = await taskTrackingService_1.default.getProgressDashboard(taskId);
        res.json({
            success: true,
            data: dashboard,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '获取进度仪表盘失败',
        });
    }
});
// 创建进度快照
router.post('/tasks/:taskId/snapshot', auth_1.authenticateToken, async (req, res) => {
    try {
        const { taskId } = req.params;
        await taskTrackingService_1.default.createProgressSnapshot(taskId);
        res.json({
            success: true,
            message: '进度快照创建成功',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '创建进度快照失败',
        });
    }
});
/**
 * E-24: 里程碑确认机制
 */
// 创建里程碑
router.post('/tasks/:taskId/milestones', auth_1.authenticateToken, async (req, res) => {
    try {
        const { taskId } = req.params;
        const milestone = await taskTrackingService_1.default.createMilestone({
            task_id: taskId,
            ...req.body,
        });
        res.json({
            success: true,
            data: milestone,
            message: '里程碑创建成功',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '创建里程碑失败',
        });
    }
});
// 学生提交里程碑
router.post('/milestones/:milestoneId/submit', auth_1.authenticateToken, async (req, res) => {
    try {
        const { milestoneId } = req.params;
        const { submission, files } = req.body;
        if (!submission) {
            return res.status(400).json({
                success: false,
                message: '请提供提交内容',
            });
        }
        const milestone = await taskTrackingService_1.default.submitMilestone(milestoneId, submission, files);
        res.json({
            success: true,
            data: milestone,
            message: '里程碑提交成功',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '提交里程碑失败',
        });
    }
});
// 企业确认里程碑
router.post('/milestones/:milestoneId/confirm', auth_1.authenticateToken, async (req, res) => {
    try {
        const { milestoneId } = req.params;
        const { approved, feedback, rejected_reason } = req.body;
        if (approved === undefined) {
            return res.status(400).json({
                success: false,
                message: '请指定是否通过',
            });
        }
        const milestone = await taskTrackingService_1.default.confirmMilestone(milestoneId, approved, feedback, rejected_reason);
        res.json({
            success: true,
            data: milestone,
            message: approved ? '里程碑已通过' : '里程碑已驳回',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '确认里程碑失败',
        });
    }
});
// 获取任务里程碑列表
router.get('/tasks/:taskId/milestones', auth_1.authenticateToken, async (req, res) => {
    try {
        const { taskId } = req.params;
        const milestones = await taskTrackingService_1.default.getMilestones(taskId);
        res.json({
            success: true,
            data: milestones,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '获取里程碑列表失败',
        });
    }
});
/**
 * E-25: 交付提前通知
 */
// 创建通知
router.post('/delivery-notifications', auth_1.authenticateToken, async (req, res) => {
    try {
        const notification = await taskTrackingService_1.default.createDeliveryNotification(req.body);
        res.json({
            success: true,
            data: notification,
            message: '通知创建成功',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '创建通知失败',
        });
    }
});
// 获取用户的通知列表
router.get('/delivery-notifications', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { unread_only } = req.query;
        const notifications = await taskTrackingService_1.default.getNotifications(userId, unread_only === 'true');
        res.json({
            success: true,
            data: notifications,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '获取通知列表失败',
        });
    }
});
// 标记通知为已读
router.post('/delivery-notifications/:notificationId/read', auth_1.authenticateToken, async (req, res) => {
    try {
        const { notificationId } = req.params;
        await taskTrackingService_1.default.markNotificationAsRead(notificationId);
        res.json({
            success: true,
            message: '通知已标记为已读',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '标记通知失败',
        });
    }
});
/**
 * E-26: 沟通记录归档
 */
// 创建归档
router.post('/tasks/:taskId/archive-communication', auth_1.authenticateToken, async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user.userId;
        const { start_date, end_date } = req.body;
        if (!start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: '请提供开始和结束日期',
            });
        }
        const archive = await taskTrackingService_1.default.archiveCommunication(taskId, new Date(start_date), new Date(end_date), userId);
        res.json({
            success: true,
            data: archive,
            message: '沟通记录归档成功',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '归档沟通记录失败',
        });
    }
});
// 获取任务的归档记录
router.get('/tasks/:taskId/archives', auth_1.authenticateToken, async (req, res) => {
    try {
        const { taskId } = req.params;
        const archives = await taskTrackingService_1.default.getArchives(taskId);
        res.json({
            success: true,
            data: archives,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '获取归档记录失败',
        });
    }
});
/**
 * E-27: 任务延期预警
 */
// 创建延期预警
router.post('/delay-warnings', auth_1.authenticateToken, async (req, res) => {
    try {
        const warning = await taskTrackingService_1.default.createDelayWarning(req.body);
        res.json({
            success: true,
            data: warning,
            message: '预警创建成功',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '创建预警失败',
        });
    }
});
// 解决预警
router.post('/delay-warnings/:warningId/resolve', auth_1.authenticateToken, async (req, res) => {
    try {
        const { warningId } = req.params;
        const { resolution_note } = req.body;
        const warning = await taskTrackingService_1.default.resolveWarning(warningId, resolution_note);
        res.json({
            success: true,
            data: warning,
            message: '预警已解决',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '解决预警失败',
        });
    }
});
// 获取任务的预警列表
router.get('/tasks/:taskId/warnings', auth_1.authenticateToken, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { include_resolved } = req.query;
        const warnings = await taskTrackingService_1.default.getWarnings(taskId, include_resolved === 'true');
        res.json({
            success: true,
            data: warnings,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '获取预警列表失败',
        });
    }
});
/**
 * E-28: 紧急介入按钮
 */
// 创建紧急介入请求
router.post('/emergency-interventions', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const intervention = await taskTrackingService_1.default.createEmergencyIntervention({
            initiated_by: userId,
            initiator_role: userRole,
            ...req.body,
        });
        res.json({
            success: true,
            data: intervention,
            message: '紧急介入请求已提交',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '创建紧急介入请求失败',
        });
    }
});
// 管理员响应介入请求
router.post('/emergency-interventions/:interventionId/respond', auth_1.authenticateToken, async (req, res) => {
    try {
        const adminId = req.user.userId;
        const { interventionId } = req.params;
        const { response } = req.body;
        if (!response) {
            return res.status(400).json({
                success: false,
                message: '请提供响应内容',
            });
        }
        const intervention = await taskTrackingService_1.default.respondToIntervention(interventionId, adminId, response);
        res.json({
            success: true,
            data: intervention,
            message: '已响应介入请求',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '响应介入请求失败',
        });
    }
});
// 解决介入请求
router.post('/emergency-interventions/:interventionId/resolve', auth_1.authenticateToken, async (req, res) => {
    try {
        const { interventionId } = req.params;
        const { resolution, resolution_actions } = req.body;
        if (!resolution) {
            return res.status(400).json({
                success: false,
                message: '请提供解决方案',
            });
        }
        const intervention = await taskTrackingService_1.default.resolveIntervention(interventionId, resolution, resolution_actions);
        res.json({
            success: true,
            data: intervention,
            message: '介入请求已解决',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '解决介入请求失败',
        });
    }
});
// 获取介入请求列表
router.get('/emergency-interventions', auth_1.authenticateToken, async (req, res) => {
    try {
        const { task_id, status, admin_id } = req.query;
        const interventions = await taskTrackingService_1.default.getInterventions({
            task_id: task_id,
            status: status,
            admin_id: admin_id,
        });
        res.json({
            success: true,
            data: interventions,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '获取介入请求列表失败',
        });
    }
});
exports.default = router;
//# sourceMappingURL=index.js.map