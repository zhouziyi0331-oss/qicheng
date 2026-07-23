"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = exports.PaymentService = void 0;
const Payment_1 = require("../models/Payment");
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * 支付服务
 * 处理支付创建、验证、查询等核心逻辑
 */
class PaymentService {
    /**
     * 创建支付订单
     */
    async createPayment(data) {
        const orderId = this.generateOrderId(data.itemType);
        const payment = await Payment_1.Payment.create({
            userId: new mongoose_1.default.Types.ObjectId(data.userId),
            orderId,
            itemType: data.itemType,
            itemId: data.itemId,
            itemTitle: data.itemTitle,
            amount: data.amount,
            currency: 'CNY',
            status: 'pending',
            paymentMethod: data.paymentMethod,
            expiredAt: new Date(Date.now() + 30 * 60 * 1000), // 30分钟后过期
            remark: data.remark
        });
        return payment;
    }
    /**
     * 模拟支付成功（开发/测试环境）
     */
    async mockPaymentSuccess(orderId) {
        const payment = await Payment_1.Payment.findOne({ orderId });
        if (!payment) {
            throw new Error('订单不存在');
        }
        if (payment.status === 'success') {
            throw new Error('订单已支付');
        }
        payment.status = 'success';
        payment.paidAt = new Date();
        payment.outTradeNo = `MOCK_${Date.now()}`;
        await payment.save();
        return payment;
    }
    /**
     * 验证用户是否已支付某项内容
     */
    async verifyPayment(userId, itemType, itemId) {
        const payment = await Payment_1.Payment.findOne({
            userId: new mongoose_1.default.Types.ObjectId(userId),
            itemType,
            itemId,
            status: 'success'
        });
        return !!payment;
    }
    /**
     * 获取用户的支付记录
     */
    async getUserPayments(userId, options) {
        const filter = { userId: new mongoose_1.default.Types.ObjectId(userId) };
        if (options?.status)
            filter.status = options.status;
        if (options?.itemType)
            filter.itemType = options.itemType;
        const payments = await Payment_1.Payment.find(filter)
            .sort({ createdAt: -1 })
            .limit(options?.limit || 20)
            .skip(options?.skip || 0);
        return payments;
    }
    /**
     * 根据订单号查询支付
     */
    async getPaymentByOrderId(orderId) {
        return await Payment_1.Payment.findOne({ orderId });
    }
    /**
     * 管理员创建支付记录（赠送）
     */
    async adminGrantPayment(data) {
        const orderId = this.generateOrderId(data.itemType);
        const payment = await Payment_1.Payment.create({
            userId: new mongoose_1.default.Types.ObjectId(data.userId),
            orderId,
            itemType: data.itemType,
            itemId: data.itemId,
            itemTitle: data.itemTitle,
            amount: 0, // 赠送金额为0
            currency: 'CNY',
            status: 'success',
            paymentMethod: 'admin_grant',
            paidAt: new Date(),
            remark: data.remark || '管理员赠送'
        });
        return payment;
    }
    /**
     * 获取支付统计
     */
    async getPaymentStats(options) {
        const filter = { status: 'success' };
        if (options?.userId) {
            filter.userId = new mongoose_1.default.Types.ObjectId(options.userId);
        }
        if (options?.startDate || options?.endDate) {
            filter.paidAt = {};
            if (options.startDate)
                filter.paidAt.$gte = options.startDate;
            if (options.endDate)
                filter.paidAt.$lte = options.endDate;
        }
        const [stats] = await Payment_1.Payment.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalCount: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                    avgAmount: { $avg: '$amount' }
                }
            }
        ]);
        return stats || { totalCount: 0, totalAmount: 0, avgAmount: 0 };
    }
    /**
     * 生成订单号
     */
    generateOrderId(itemType) {
        const prefix = {
            'decomposition_report': 'DECOMP',
            'graduation_report': 'GRAD',
            'practice_unlock': 'PRACTICE',
            'other': 'OTHER'
        }[itemType] || 'PAY';
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}_${timestamp}_${random}`;
    }
}
exports.PaymentService = PaymentService;
exports.paymentService = new PaymentService();
//# sourceMappingURL=payment.service.js.map