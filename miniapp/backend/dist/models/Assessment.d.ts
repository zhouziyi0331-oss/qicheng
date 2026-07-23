import mongoose, { Document } from 'mongoose';
/**
 * OC测评记录
 * 每个用户可以进行多次测评，记录能力成长
 */
export interface IAssessment extends Document {
    userId: mongoose.Types.ObjectId;
    assessmentNumber: number;
    answers: {
        questionId: string;
        answer: string | number | string[];
    }[];
    result: {
        identityTags: string[];
        abilityScores: {
            dimension: string;
            score: number;
            level: string;
        }[];
        personalityType: string;
        strengthAreas: string[];
        improvementAreas: string[];
    };
    createdAt: Date;
    completedAt?: Date;
}
export declare const Assessment: mongoose.Model<IAssessment, {}, {}, {}, mongoose.Document<unknown, {}, IAssessment, {}, {}> & IAssessment & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Assessment.d.ts.map