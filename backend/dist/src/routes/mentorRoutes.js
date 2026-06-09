"use strict";
/**
 * AI导师相关API路由
 *
 * 功能：
 * 1. 预警管理（获取未读预警、标记已读）
 * 2. 长期记忆管理（获取学生画像、记录成长观察）
 * 3. 导师对话（获取对话历史、发送消息）
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mentorAlertService_1 = __importDefault(require("../services/mentorAlertService"));
const mentorMemoryService_1 = __importDefault(require("../services/mentorMemoryService"));
const mentorCoreService_1 = __importDefault(require("../services/mentorCoreService"));
const auth_1 = require("../middleware/auth");
const logger_1 = __importDefault(require("../utils/logger"));
const router = express_1.default.Router();
// ============================================
// 预警相关路由
// ============================================
/**
 * GET /api/v1/mentor/alerts
 * 获取学生的未读预警列表
 */
router.get('/alerts', auth_1.authenticate, async (req, res) => {
    try {
        const studentId = req.user.id;
        const alerts = await mentorAlertService_1.default.getUnreadAlerts(studentId);
        res.json({
            success: true,
            data: {
                alerts,
                count: alerts.length
            }
        });
    }
    catch (error) {
        logger_1.default.error('[MentorAPI] 获取预警列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取预警列表失败'
        });
    }
});
/**
 * POST /api/v1/mentor/alerts/:alertId/view
 * 标记预警为已读
 */
router.post('/alerts/:alertId/view', auth_1.authenticate, async (req, res) => {
    try {
        const { alertId } = req.params;
        const studentId = req.user.id;
        await mentorAlertService_1.default.markAlertAsViewed(alertId, studentId);
        res.json({
            success: true,
            message: '预警已标记为已读'
        });
    }
    catch (error) {
        logger_1.default.error('[MentorAPI] 标记预警已读失败:', error);
        res.status(500).json({
            success: false,
            message: '标记预警已读失败'
        });
    }
});
/**
 * POST /api/v1/mentor/alerts/:alertId/respond
 * 标记预警为已响应
 */
router.post('/alerts/:alertId/respond', auth_1.authenticate, async (req, res) => {
    try {
        const { alertId } = req.params;
        const studentId = req.user.id;
        await mentorAlertService_1.default.markAlertAsResponded(alertId, studentId);
        res.json({
            success: true,
            message: '预警已标记为已响应'
        });
    }
    catch (error) {
        logger_1.default.error('[MentorAPI] 标记预警已响应失败:', error);
        res.status(500).json({
            success: false,
            message: '标记预警已响应失败'
        });
    }
});
/**
 * GET /api/v1/mentor/alerts/stats
 * 获取预警统计数据（管理员）
 */
router.get('/alerts/stats', auth_1.authenticate, async (req, res) => {
    try {
        // 检查是否是管理员
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: '无权限访问'
            });
        }
        const days = parseInt(req.query.days) || 7;
        const stats = await mentorAlertService_1.default.getAlertStats(days);
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        logger_1.default.error('[MentorAPI] 获取预警统计失败:', error);
        res.status(500).json({
            success: false,
            message: '获取预警统计失败'
        });
    }
});
// ============================================
// 长期记忆相关路由
// ============================================
/**
 * GET /api/v1/mentor/profile
 * 获取学生的长期画像
 */
router.get('/profile', auth_1.authenticate, async (req, res) => {
    try {
        const studentId = req.user.id;
        const profile = await mentorMemoryService_1.default.getStudentProfile(studentId);
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: '画像不存在，请先完成至少一个订单'
            });
        }
        res.json({
            success: true,
            data: profile
        });
    }
    catch (error) {
        logger_1.default.error('[MentorAPI] 获取学生画像失败:', error);
        res.status(500).json({
            success: false,
            message: '获取学生画像失败'
        });
    }
});
/**
 * POST /api/v1/mentor/profile/refresh
 * 手动刷新学生画像
 */
router.post('/profile/refresh', auth_1.authenticate, async (req, res) => {
    try {
        const studentId = req.user.id;
        // 异步更新画像
        mentorMemoryService_1.default.updateStudentProfile(studentId, 'manual_refresh')
            .catch(error => {
            logger_1.default.error('[MentorAPI] 异步更新画像失败:', error);
        });
        res.json({
            success: true,
            message: '画像刷新已启动，请稍后查看'
        });
    }
    catch (error) {
        logger_1.default.error('[MentorAPI] 刷新学生画像失败:', error);
        res.status(500).json({
            success: false,
            message: '刷新学生画像失败'
        });
    }
});
/**
 * POST /api/v1/mentor/observations
 * 记录成长观察（内部API，供其他服务调用）
 */
router.post('/observations', auth_1.authenticate, async (req, res) => {
    try {
        const { studentId, orderId, observationType, content, category, isSignificant, tags } = req.body;
        // 验证必填字段
        if (!studentId || !orderId || !observationType || !content) {
            return res.status(400).json({
                success: false,
                message: '缺少必填字段'
            });
        }
        await mentorMemoryService_1.default.recordGrowthObservation(studentId, orderId, observationType, content, category, isSignificant || false, tags || []);
        res.json({
            success: true,
            message: '成长观察已记录'
        });
    }
    catch (error) {
        logger_1.default.error('[MentorAPI] 记录成长观察失败:', error);
        res.status(500).json({
            success: false,
            message: '记录成长观察失败'
        });
    }
});
// ============================================
// 导师对话相关路由
// ============================================
/**
 * GET /api/v1/mentor/sessions/:orderId
 * 获取某订单的导师对话历史
 */
router.get('/sessions/:orderId', auth_1.authenticate, async (req, res) => {
    try {
        const { orderId } = req.params;
        const studentId = req.user.id;
        // 验证订单归属
        const orderCheck = await mentorCoreService_1.default.verifyOrderOwnership(orderId, studentId);
        if (!orderCheck) {
            return res.status(403).json({
                success: false,
                message: '无权限访问此订单的对话'
            });
        }
        const sessions = await mentorCoreService_1.default.getSessionHistory(orderId);
        res.json({
            success: true,
            data: {
                sessions,
                count: sessions.length
            }
        });
    }
    catch (error) {
        logger_1.default.error('[MentorAPI] 获取对话历史失败:', error);
        res.status(500).json({
            success: false,
            message: '获取对话历史失败'
        });
    }
});
/**
 * POST /api/v1/mentor/message
 * 学生主动发送消息给导师
 */
router.post('/message', auth_1.authenticate, async (req, res) => {
    try {
        const { orderId, message } = req.body;
        const studentId = req.user.id;
        // 验证必填字段
        if (!orderId || !message) {
            return res.status(400).json({
                success: false,
                message: '缺少必填字段'
            });
        }
        // 验证订单归属
        const orderCheck = await mentorCoreService_1.default.verifyOrderOwnership(orderId, studentId);
        if (!orderCheck) {
            return res.status(403).json({
                success: false,
                message: '无权限访问此订单'
            });
        }
        // 创建会话记录
        const sessionId = await mentorCoreService_1.default.createStudentMessage(studentId, orderId, message);
        // 异步调用AI-06生成回复（通过WebSocket流式推送）
        mentorCoreService_1.default.handleStudentMessage(studentId, orderId, message, sessionId)
            .catch(error => {
            logger_1.default.error('[MentorAPI] AI回复生成失败:', error);
        });
        res.status(202).json({
            success: true,
            message: '消息已接收，AI导师正在思考...',
            data: {
                sessionId
            }
        });
    }
    catch (error) {
        logger_1.default.error('[MentorAPI] 发送消息失败:', error);
        res.status(500).json({
            success: false,
            message: '发送消息失败'
        });
    }
});
/**
 * POST /api/v1/mentor/pre-submit-check
 * 提交前自查（T-07场景）
 */
router.post('/pre-submit-check', auth_1.authenticate, async (req, res) => {
    try {
        const { orderId, submissionPreview } = req.body;
        const studentId = req.user.id;
        // 验证必填字段
        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: '缺少订单ID'
            });
        }
        // 验证订单归属
        const orderCheck = await mentorCoreService_1.default.verifyOrderOwnership(orderId, studentId);
        if (!orderCheck) {
            return res.status(403).json({
                success: false,
                message: '无权限访问此订单'
            });
        }
        // 同步调用AI-06生成自查清单（不走队列，3秒超时）
        const checklist = await mentorCoreService_1.default.generatePreSubmitChecklist(studentId, orderId, submissionPreview);
        res.json({
            success: true,
            data: {
                checklist
            }
        });
    }
    catch (error) {
        logger_1.default.error('[MentorAPI] 生成自查清单失败:', error);
        res.status(500).json({
            success: false,
            message: '生成自查清单失败'
        });
    }
});
// ============================================
// 管理员路由
// ============================================
/**
 * POST /api/v1/mentor/admin/trigger-alert-scan
 * 手动触发预警扫描（管理员）
 */
router.post('/admin/trigger-alert-scan', auth_1.authenticate, async (req, res) => {
    try {
        // 检查是否是管理员
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: '无权限访问'
            });
        }
        const mentorAlertJob = require('../jobs/mentorAlertJob').default;
        await mentorAlertJob.triggerManually();
        res.json({
            success: true,
            message: '预警扫描已完成'
        });
    }
    catch (error) {
        logger_1.default.error('[MentorAPI] 手动触发预警扫描失败:', error);
        res.status(500).json({
            success: false,
            message: '手动触发预警扫描失败'
        });
    }
});
/**
 * POST /api/v1/mentor/admin/batch-init-profiles
 * 批量初始化学生画像（管理员）
 */
router.post('/admin/batch-init-profiles', auth_1.authenticate, async (req, res) => {
    try {
        // 检查是否是管理员
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: '无权限访问'
            });
        }
        const { studentIds } = req.body;
        // 异步执行批量初始化
        mentorMemoryService_1.default.batchInitializeProfiles(studentIds)
            .catch(error => {
            logger_1.default.error('[MentorAPI] 批量初始化画像失败:', error);
        });
        res.json({
            success: true,
            message: '批量初始化已启动，请查看日志'
        });
    }
    catch (error) {
        logger_1.default.error('[MentorAPI] 批量初始化画像失败:', error);
        res.status(500).json({
            success: false,
            message: '批量初始化画像失败'
        });
    }
});
exports.default = router;
//# sourceMappingURL=mentorRoutes.js.map