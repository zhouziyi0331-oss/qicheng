"use strict";
/**
 * 平台管理增强控制器
 *
 * 处理提现审核、用户认证、任务审核、风险预警等管理功能的HTTP请求
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPendingWithdrawals = getPendingWithdrawals;
exports.approveWithdrawal = approveWithdrawal;
exports.rejectWithdrawal = rejectWithdrawal;
exports.getPendingVerifications = getPendingVerifications;
exports.approveVerification = approveVerification;
exports.rejectVerification = rejectVerification;
exports.reviewTask = reviewTask;
exports.hideRating = hideRating;
exports.createRiskAlert = createRiskAlert;
exports.getRiskAlerts = getRiskAlerts;
exports.getPlatformMetrics = getPlatformMetrics;
exports.calculateDailyMetrics = calculateDailyMetrics;
exports.getSystemConfig = getSystemConfig;
exports.updateSystemConfig = updateSystemConfig;
exports.getPendingReviews = getPendingReviews;
const platformAdminService_1 = require("../services/platformAdminService");
const logger_1 = __importDefault(require("../utils/logger"));
// =====================================================
// 提现审核
// =====================================================
/**
 * 获取待审核提现列表
 * GET /api/v1/admin/platform/withdrawals/pending
 */
async function getPendingWithdrawals(req, res) {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;
        const result = await platformAdminService_1.platformAdminService.getPendingWithdrawals(limit, offset);
        return res.json({
            success: true,
            data: result.withdrawals,
            total: result.total,
            limit,
            offset,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get pending withdrawals', { error });
        return res.status(500).json({
            error: 'Failed to get pending withdrawals',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * 批准提现
 * POST /api/v1/admin/platform/withdrawals/:id/approve
 */
async function approveWithdrawal(req, res) {
    try {
        const adminId = req.user?.userId;
        const { id } = req.params;
        const { reason } = req.body;
        if (!adminId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const result = await platformAdminService_1.platformAdminService.approveWithdrawal(id, adminId, reason);
        return res.json({
            success: true,
            data: result,
            message: 'Withdrawal approved successfully',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to approve withdrawal', { error });
        return res.status(500).json({
            error: 'Failed to approve withdrawal',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * 拒绝提现
 * POST /api/v1/admin/platform/withdrawals/:id/reject
 */
async function rejectWithdrawal(req, res) {
    try {
        const adminId = req.user?.userId;
        const { id } = req.params;
        const { reason, risk_level } = req.body;
        if (!adminId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!reason) {
            return res.status(400).json({ error: 'Reason is required' });
        }
        const result = await platformAdminService_1.platformAdminService.rejectWithdrawal(id, adminId, reason, risk_level);
        return res.json({
            success: true,
            data: result,
            message: 'Withdrawal rejected successfully',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to reject withdrawal', { error });
        return res.status(500).json({
            error: 'Failed to reject withdrawal',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
// =====================================================
// 用户认证审核
// =====================================================
/**
 * 获取待审核用户认证列表
 * GET /api/v1/admin/platform/verifications/pending
 */
async function getPendingVerifications(req, res) {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;
        const result = await platformAdminService_1.platformAdminService.getPendingVerifications(limit, offset);
        return res.json({
            success: true,
            data: result.verifications,
            total: result.total,
            limit,
            offset,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get pending verifications', { error });
        return res.status(500).json({
            error: 'Failed to get pending verifications',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * 批准用户认证
 * POST /api/v1/admin/platform/verifications/:id/approve
 */
async function approveVerification(req, res) {
    try {
        const adminId = req.user?.userId;
        const { id } = req.params;
        const { note } = req.body;
        if (!adminId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const result = await platformAdminService_1.platformAdminService.approveUserVerification(id, adminId, note);
        return res.json({
            success: true,
            data: result,
            message: 'User verification approved successfully',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to approve verification', { error });
        return res.status(500).json({
            error: 'Failed to approve verification',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * 拒绝用户认证
 * POST /api/v1/admin/platform/verifications/:id/reject
 */
async function rejectVerification(req, res) {
    try {
        const adminId = req.user?.userId;
        const { id } = req.params;
        const { reason } = req.body;
        if (!adminId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!reason) {
            return res.status(400).json({ error: 'Reason is required' });
        }
        const result = await platformAdminService_1.platformAdminService.rejectUserVerification(id, adminId, reason);
        return res.json({
            success: true,
            data: result,
            message: 'User verification rejected successfully',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to reject verification', { error });
        return res.status(500).json({
            error: 'Failed to reject verification',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
// =====================================================
// 任务审核
// =====================================================
/**
 * 审核任务
 * POST /api/v1/admin/platform/tasks/:id/review
 */
async function reviewTask(req, res) {
    try {
        const adminId = req.user?.userId;
        const { id } = req.params;
        const { review_type, status, issues, note } = req.body;
        if (!adminId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!review_type || !status) {
            return res.status(400).json({ error: 'review_type and status are required' });
        }
        const result = await platformAdminService_1.platformAdminService.reviewTask(id, adminId, review_type, status, issues, note);
        return res.json({
            success: true,
            data: result,
            message: `Task ${status} successfully`,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to review task', { error });
        return res.status(500).json({
            error: 'Failed to review task',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
// =====================================================
// 评价管理
// =====================================================
/**
 * 隐藏评价
 * POST /api/v1/admin/platform/ratings/:id/hide
 */
async function hideRating(req, res) {
    try {
        const adminId = req.user?.userId;
        const { id } = req.params;
        const { reason } = req.body;
        if (!adminId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!reason) {
            return res.status(400).json({ error: 'Reason is required' });
        }
        const result = await platformAdminService_1.platformAdminService.hideRating(id, adminId, reason);
        return res.json({
            success: true,
            data: result,
            message: 'Rating hidden successfully',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to hide rating', { error });
        return res.status(500).json({
            error: 'Failed to hide rating',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
// =====================================================
// 风险预警
// =====================================================
/**
 * 创建风险预警
 * POST /api/v1/admin/platform/risk-alerts
 */
async function createRiskAlert(req, res) {
    try {
        const { alert_type, severity, entity_type, entity_id, reason, data } = req.body;
        if (!alert_type || !severity || !entity_type || !entity_id || !reason) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const result = await platformAdminService_1.platformAdminService.createRiskAlert(alert_type, severity, entity_type, entity_id, reason, data);
        return res.json({
            success: true,
            data: result,
            message: 'Risk alert created successfully',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to create risk alert', { error });
        return res.status(500).json({
            error: 'Failed to create risk alert',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * 获取风险预警列表
 * GET /api/v1/admin/platform/risk-alerts
 */
async function getRiskAlerts(req, res) {
    try {
        const status = req.query.status;
        const severity = req.query.severity;
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        const result = await platformAdminService_1.platformAdminService.getRiskAlerts(status, severity, limit, offset);
        return res.json({
            success: true,
            data: result.alerts,
            total: result.total,
            limit,
            offset,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get risk alerts', { error });
        return res.status(500).json({
            error: 'Failed to get risk alerts',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
// =====================================================
// 平台指标
// =====================================================
/**
 * 获取平台指标
 * GET /api/v1/admin/platform/metrics
 */
async function getPlatformMetrics(req, res) {
    try {
        const startDate = new Date(req.query.start_date);
        const endDate = new Date(req.query.end_date);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }
        const metrics = await platformAdminService_1.platformAdminService.getPlatformMetrics(startDate, endDate);
        return res.json({
            success: true,
            data: metrics,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get platform metrics', { error });
        return res.status(500).json({
            error: 'Failed to get platform metrics',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * 计算每日指标
 * POST /api/v1/admin/platform/metrics/calculate
 */
async function calculateDailyMetrics(req, res) {
    try {
        const { date } = req.body;
        if (!date) {
            return res.status(400).json({ error: 'Date is required' });
        }
        const targetDate = new Date(date);
        if (isNaN(targetDate.getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }
        await platformAdminService_1.platformAdminService.calculateDailyMetrics(targetDate);
        return res.json({
            success: true,
            message: 'Daily metrics calculated successfully',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to calculate daily metrics', { error });
        return res.status(500).json({
            error: 'Failed to calculate daily metrics',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
// =====================================================
// 系统配置
// =====================================================
/**
 * 获取系统配置
 * GET /api/v1/admin/platform/config/:key
 */
async function getSystemConfig(req, res) {
    try {
        const { key } = req.params;
        const config = await platformAdminService_1.platformAdminService.getSystemConfig(key);
        if (!config) {
            return res.status(404).json({ error: 'Config not found' });
        }
        return res.json({
            success: true,
            data: config,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get system config', { error });
        return res.status(500).json({
            error: 'Failed to get system config',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * 更新系统配置
 * PUT /api/v1/admin/platform/config/:key
 */
async function updateSystemConfig(req, res) {
    try {
        const adminId = req.user?.userId;
        const { key } = req.params;
        const { value } = req.body;
        if (!adminId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!value) {
            return res.status(400).json({ error: 'Value is required' });
        }
        const result = await platformAdminService_1.platformAdminService.updateSystemConfig(key, value, adminId);
        return res.json({
            success: true,
            data: result,
            message: 'System config updated successfully',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to update system config', { error });
        return res.status(500).json({
            error: 'Failed to update system config',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
// =====================================================
// 待审核项目汇总
// =====================================================
/**
 * 获取所有待审核项目
 * GET /api/v1/admin/platform/pending-reviews
 */
async function getPendingReviews(req, res) {
    try {
        const reviews = await platformAdminService_1.platformAdminService.getPendingReviews();
        return res.json({
            success: true,
            data: reviews,
            total: reviews.length,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get pending reviews', { error });
        return res.status(500).json({
            error: 'Failed to get pending reviews',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
//# sourceMappingURL=platformAdminController.js.map