import mongoose, { Document } from 'mongoose';
/**
 * 支付记录模型
 * 记录所有支付交易，包括真实支付和模拟支付
 */
export interface IPayment extends Document {
    userId: mongoose.Types.ObjectId;
    orderId: string;
    outTradeNo?: string;
    itemType: 'decomposition_report' | 'graduation_report' | 'practice_unlock' | 'other';
    itemId: string;
    itemTitle: string;
    amount: number;
    currency: string;
    status: 'pending' | 'success' | 'failed' | 'refunded' | 'cancelled';
    paymentMethod: 'wechat' | 'alipay' | 'mock' | 'admin_grant';
    createdAt: Date;
    paidAt?: Date;
    expiredAt?: Date;
    remark?: string;
    metadata?: any;
}
export declare const Payment: mongoose.Model<IPayment, {}, {}, {}, mongoose.Document<unknown, {}, IPayment, {}, {}> & IPayment & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Payment.d.ts.map