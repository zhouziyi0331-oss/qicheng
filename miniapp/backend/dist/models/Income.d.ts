import mongoose, { Document } from 'mongoose';
/**
 * 收入记录
 * 记录用户每一笔收入
 */
export interface IIncome extends Document {
    userId: mongoose.Types.ObjectId;
    source: 'real_project' | 'referral' | 'bonus' | 'other';
    sourceRefId?: mongoose.Types.ObjectId;
    amount: number;
    description: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    confirmedAt?: Date;
    createdAt: Date;
}
export declare const Income: mongoose.Model<IIncome, {}, {}, {}, mongoose.Document<unknown, {}, IIncome, {}, {}> & IIncome & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Income.d.ts.map