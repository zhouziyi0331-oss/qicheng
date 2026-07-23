import mongoose, { Document } from 'mongoose';
/**
 * OPC测试题库
 * 36道工作场景测试题
 */
export interface IOPCQuestion extends Document {
    questionId: number;
    questionText: string;
    dimension: 'visual' | 'systematic' | 'creative' | 'logical' | 'stable' | 'exploratory' | 'execution' | 'communication' | 'learning';
    options: {
        label: string;
        value: string;
        score: number;
    }[];
    createdAt: Date;
}
export declare const OPCQuestion: mongoose.Model<IOPCQuestion, {}, {}, {}, mongoose.Document<unknown, {}, IOPCQuestion, {}, {}> & IOPCQuestion & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=OPCQuestion.d.ts.map