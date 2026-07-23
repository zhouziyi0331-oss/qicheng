import mongoose, { Document } from 'mongoose';
/**
 * OPC测评结果
 * 存储用户的测评答案和生成的人格标签
 */
export interface IOPCResult extends Document {
    userId: mongoose.Types.ObjectId;
    answers: {
        questionId: number;
        answer: string;
        score: number;
    }[];
    result: {
        personalityTag: string;
        dimensionScores: {
            dimension: string;
            score: number;
        }[];
        strengths: string[];
        suggestions: string[];
    };
    completedAt: Date;
}
export declare const OPCResult: mongoose.Model<IOPCResult, {}, {}, {}, mongoose.Document<unknown, {}, IOPCResult, {}, {}> & IOPCResult & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=OPCResult.d.ts.map