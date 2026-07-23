import mongoose from 'mongoose';
/**
 * 支付服务
 * 处理支付创建、验证、查询等核心逻辑
 */
export declare class PaymentService {
    /**
     * 创建支付订单
     */
    createPayment(data: {
        userId: string;
        itemType: 'decomposition_report' | 'graduation_report' | 'practice_unlock' | 'other';
        itemId: string;
        itemTitle: string;
        amount: number;
        paymentMethod: 'wechat' | 'alipay' | 'mock' | 'admin_grant';
        remark?: string;
    }): Promise<mongoose.Document<unknown, {}, import("../models/Payment").IPayment, {}, {}> & import("../models/Payment").IPayment & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * 模拟支付成功（开发/测试环境）
     */
    mockPaymentSuccess(orderId: string): Promise<mongoose.Document<unknown, {}, import("../models/Payment").IPayment, {}, {}> & import("../models/Payment").IPayment & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * 验证用户是否已支付某项内容
     */
    verifyPayment(userId: string, itemType: string, itemId: string): Promise<boolean>;
    /**
     * 获取用户的支付记录
     */
    getUserPayments(userId: string, options?: {
        status?: string;
        itemType?: string;
        limit?: number;
        skip?: number;
    }): Promise<(mongoose.Document<unknown, {}, import("../models/Payment").IPayment, {}, {}> & import("../models/Payment").IPayment & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    /**
     * 根据订单号查询支付
     */
    getPaymentByOrderId(orderId: string): Promise<(mongoose.Document<unknown, {}, import("../models/Payment").IPayment, {}, {}> & import("../models/Payment").IPayment & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    /**
     * 管理员创建支付记录（赠送）
     */
    adminGrantPayment(data: {
        userId: string;
        itemType: string;
        itemId: string;
        itemTitle: string;
        remark?: string;
    }): Promise<mongoose.Document<unknown, {}, import("../models/Payment").IPayment, {}, {}> & import("../models/Payment").IPayment & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * 获取支付统计
     */
    getPaymentStats(options?: {
        userId?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<any>;
    /**
     * 生成订单号
     */
    private generateOrderId;
}
export declare const paymentService: PaymentService;
//# sourceMappingURL=payment.service.d.ts.map