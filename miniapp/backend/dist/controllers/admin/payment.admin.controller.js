"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminPaymentController = exports.AdminPaymentController = void 0;
const payment_service_1 = require("../../services/payment.service");
/**
 * 管理员支付管理控制器
 */
class AdminPaymentController {
    /**
     * POST /api/admin/payments/grant
     * 管理员赠送支付权限（免费解锁内容）
     */
    async grantPayment(req, res) {
        try {
            const { userId, itemType, itemId, itemTitle, remark } = req.body;
            if (!userId || !itemType || !itemId || !itemTitle) {
                return res.status(400).json({ error: '缺少必要参数' });
            }
            // 验证itemType
            const validItemTypes = ['decomposition_report', 'graduation_report', 'practice_unlock', 'other'];
            if (!validItemTypes.includes(itemType)) {
                return res.status(400).json({ error: '无效的项目类型' });
            }
            // 检查是否已存在支付记录
            const hasPaid = await payment_service_1.paymentService.verifyPayment(userId, itemType, itemId);
            if (hasPaid) {
                return res.status(400).json({ error: '该用户已拥有此内容的访问权限' });
            }
            const payment = await payment_service_1.paymentService.adminGrantPayment({
                userId,
                itemType,
                itemId,
                itemTitle,
                remark
            });
            res.json({
                success: true,
                message: '赠送成功',
                payment: {
                    orderId: payment.orderId,
                    userId: payment.userId,
                    itemType: payment.itemType,
                    itemId: payment.itemId,
                    itemTitle: payment.itemTitle,
                    status: payment.status,
                    paymentMethod: payment.paymentMethod,
                    createdAt: payment.createdAt,
                    paidAt: payment.paidAt,
                    remark: payment.remark
                }
            });
        }
        catch (error) {
            console.error('管理员赠送支付失败:', error);
            res.status(500).json({ error: error.message || '赠送失败' });
        }
    }
    /**
     * GET /api/admin/payments
     * 获取所有支付记录
     */
    async getAllPayments(req, res) {
        try {
            const { userId, status, itemType, limit = '50', skip = '0' } = req.query;
            const filter = {};
            if (userId)
                filter.userId = userId;
            if (status)
                filter.status = status;
            if (itemType)
                filter.itemType = itemType;
            const payments = await payment_service_1.paymentService.getUserPayments(userId || '', {
                status: status,
                itemType: itemType,
                limit: parseInt(limit),
                skip: parseInt(skip)
            });
            res.json({
                success: true,
                payments: payments.map(p => ({
                    _id: p._id,
                    orderId: p.orderId,
                    userId: p.userId,
                    itemType: p.itemType,
                    itemId: p.itemId,
                    itemTitle: p.itemTitle,
                    amount: p.amount,
                    status: p.status,
                    paymentMethod: p.paymentMethod,
                    createdAt: p.createdAt,
                    paidAt: p.paidAt,
                    remark: p.remark
                }))
            });
        }
        catch (error) {
            console.error('获取支付记录失败:', error);
            res.status(500).json({ error: error.message || '获取支付记录失败' });
        }
    }
    /**
     * GET /api/admin/payments/stats
     * 获取支付统计
     */
    async getPaymentStats(req, res) {
        try {
            const { userId, startDate, endDate } = req.query;
            const options = {};
            if (userId)
                options.userId = userId;
            if (startDate)
                options.startDate = new Date(startDate);
            if (endDate)
                options.endDate = new Date(endDate);
            const stats = await payment_service_1.paymentService.getPaymentStats(options);
            res.json({
                success: true,
                stats: {
                    totalCount: stats.totalCount || 0,
                    totalAmount: stats.totalAmount || 0,
                    avgAmount: stats.avgAmount || 0
                }
            });
        }
        catch (error) {
            console.error('获取支付统计失败:', error);
            res.status(500).json({ error: error.message || '获取支付统计失败' });
        }
    }
    /**
     * GET /api/admin/payments/:orderId
     * 获取支付详情
     */
    async getPaymentDetail(req, res) {
        try {
            const { orderId } = req.params;
            const payment = await payment_service_1.paymentService.getPaymentByOrderId(orderId);
            if (!payment) {
                return res.status(404).json({ error: '订单不存在' });
            }
            res.json({
                success: true,
                payment: {
                    _id: payment._id,
                    orderId: payment.orderId,
                    outTradeNo: payment.outTradeNo,
                    userId: payment.userId,
                    itemType: payment.itemType,
                    itemId: payment.itemId,
                    itemTitle: payment.itemTitle,
                    amount: payment.amount,
                    currency: payment.currency,
                    status: payment.status,
                    paymentMethod: payment.paymentMethod,
                    createdAt: payment.createdAt,
                    paidAt: payment.paidAt,
                    expiredAt: payment.expiredAt,
                    remark: payment.remark,
                    metadata: payment.metadata
                }
            });
        }
        catch (error) {
            console.error('获取支付详情失败:', error);
            res.status(500).json({ error: error.message || '获取支付详情失败' });
        }
    }
}
exports.AdminPaymentController = AdminPaymentController;
exports.adminPaymentController = new AdminPaymentController();
//# sourceMappingURL=payment.admin.controller.js.map