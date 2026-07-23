"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const monitor_middleware_1 = require("../middleware/monitor.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const realProject_admin_controller_1 = require("../controllers/admin/realProject.admin.controller");
const payment_admin_controller_1 = require("../controllers/admin/payment.admin.controller");
const financial_admin_controller_1 = require("../controllers/admin/financial.admin.controller");
const router = (0, express_1.Router)();
/**
 * 财务管理路由（需要管理员权限）
 */
router.post('/financial/recalculate/:userId', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdmin, financial_admin_controller_1.adminFinancialController.recalculateBalance.bind(financial_admin_controller_1.adminFinancialController));
router.post('/financial/recalculate-all', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdmin, financial_admin_controller_1.adminFinancialController.recalculateAllBalances.bind(financial_admin_controller_1.adminFinancialController));
/**
 * 支付管理路由（需要管理员权限）
 */
router.post('/payments/grant', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdmin, payment_admin_controller_1.adminPaymentController.grantPayment.bind(payment_admin_controller_1.adminPaymentController));
router.get('/payments/stats', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdmin, payment_admin_controller_1.adminPaymentController.getPaymentStats.bind(payment_admin_controller_1.adminPaymentController));
router.get('/payments/:orderId', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdmin, payment_admin_controller_1.adminPaymentController.getPaymentDetail.bind(payment_admin_controller_1.adminPaymentController));
router.get('/payments', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdmin, payment_admin_controller_1.adminPaymentController.getAllPayments.bind(payment_admin_controller_1.adminPaymentController));
/**
 * 真实项目管理路由（需要管理员权限）
 */
router.get('/real-projects/stats', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdmin, realProject_admin_controller_1.adminRealProjectController.getProjectStats.bind(realProject_admin_controller_1.adminRealProjectController));
router.get('/real-projects/pending-rating', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdmin, realProject_admin_controller_1.adminRealProjectController.getPendingRatingProjects.bind(realProject_admin_controller_1.adminRealProjectController));
router.post('/real-projects/batch', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdmin, realProject_admin_controller_1.adminRealProjectController.createProjectsBatch.bind(realProject_admin_controller_1.adminRealProjectController));
router.post('/real-projects', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdmin, realProject_admin_controller_1.adminRealProjectController.createProject.bind(realProject_admin_controller_1.adminRealProjectController));
router.get('/real-projects', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdmin, realProject_admin_controller_1.adminRealProjectController.getAllProjects.bind(realProject_admin_controller_1.adminRealProjectController));
router.put('/real-projects/:projectId', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdmin, realProject_admin_controller_1.adminRealProjectController.updateProject.bind(realProject_admin_controller_1.adminRealProjectController));
router.delete('/real-projects/:projectId', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdmin, realProject_admin_controller_1.adminRealProjectController.deleteProject.bind(realProject_admin_controller_1.adminRealProjectController));
router.post('/real-projects/:projectId/publish', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdmin, realProject_admin_controller_1.adminRealProjectController.publishProject.bind(realProject_admin_controller_1.adminRealProjectController));
router.post('/real-projects/:projectId/unpublish', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdmin, realProject_admin_controller_1.adminRealProjectController.unpublishProject.bind(realProject_admin_controller_1.adminRealProjectController));
router.post('/real-projects/:projectId/rating', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdmin, realProject_admin_controller_1.adminRealProjectController.addClientRating.bind(realProject_admin_controller_1.adminRealProjectController));
/**
 * 系统监控路由
 */
router.get('/stats', (req, res) => {
    const stats = (0, monitor_middleware_1.getStats)();
    // 计算总体统计
    let totalRequests = 0;
    let totalSuccess = 0;
    let totalError = 0;
    let totalAvgDuration = 0;
    Object.values(stats).forEach(stat => {
        totalRequests += stat.total;
        totalSuccess += stat.success;
        totalError += stat.error;
        totalAvgDuration += stat.avgDuration;
    });
    const avgDuration = totalRequests > 0 ? totalAvgDuration / Object.keys(stats).length : 0;
    res.json({
        overall: {
            totalRequests,
            successRate: totalRequests > 0 ? ((totalSuccess / totalRequests) * 100).toFixed(2) + '%' : '0%',
            errorRate: totalRequests > 0 ? ((totalError / totalRequests) * 100).toFixed(2) + '%' : '0%',
            avgDuration: avgDuration.toFixed(2) + 'ms'
        },
        byEndpoint: stats,
        timestamp: new Date().toISOString()
    });
});
/**
 * GET /api/admin/health-check
 * 详细的健康检查
 */
router.get('/health-check', async (req, res) => {
    const mongoose = require('mongoose');
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        mongodb: {
            status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            host: process.env.MONGODB_URI?.split('@')[1]?.split('/')[0] || 'unknown'
        },
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
            rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB'
        },
        env: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    };
    res.json(health);
});
/**
 * POST /api/admin/clear-stats
 * 清除统计数据
 */
router.post('/clear-stats', (req, res) => {
    const stats = (0, monitor_middleware_1.getStats)();
    Object.keys(stats).forEach(key => delete stats[key]);
    res.json({
        success: true,
        message: '统计数据已清除'
    });
});
exports.default = router;
//# sourceMappingURL=admin.routes.js.map