import mongoose, { Document } from 'mongoose';
/**
 * 提现记录
 */
export interface IWithdrawal extends Document {
    userId: mongoose.Types.ObjectId;
    amount: number;
    fee: number;
    actualAmount: number;
    withdrawalMethod: 'wechat' | 'alipay' | 'bank_card';
    withdrawalAccount: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    reviewedBy?: string;
    reviewedAt?: Date;
    reviewNote?: string;
    completedAt?: Date;
    transactionId?: string;
    failureReason?: string;
    createdAt: Date;
}
export declare const Withdrawal: mongoose.Model<IWithdrawal, {}, {}, {}, mongoose.Document<unknown, {}, IWithdrawal, {}, {}> & IWithdrawal & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Withdrawal.d.ts.map