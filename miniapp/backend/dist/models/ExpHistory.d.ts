import mongoose, { Document } from 'mongoose';
/**
 * 经验值历史记录
 * 记录用户每次获得经验值的详细信息
 */
export interface IExpHistory extends Document {
    userId: mongoose.Types.ObjectId;
    exp: number;
    reason: string;
    metadata?: any;
    createdAt: Date;
}
export declare const ExpHistory: mongoose.Model<IExpHistory, {}, {}, {}, mongoose.Document<unknown, {}, IExpHistory, {}, {}> & IExpHistory & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=ExpHistory.d.ts.map