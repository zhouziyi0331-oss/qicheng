import mongoose, { Document } from 'mongoose';
/**
 * 能力雷达图
 * 多维度追踪用户能力成长
 * 每完成一次项目或测评，都会生成新的雷达图快照
 */
export interface IAbilityRadar extends Document {
    userId: mongoose.Types.ObjectId;
    snapshotNumber: number;
    triggerType: 'assessment' | 'project_completed' | 'manual';
    triggerRefId?: mongoose.Types.ObjectId;
    dimensions: {
        name: string;
        description: string;
        score: number;
        level: string;
        growth: number;
        tags: string[];
    }[];
    overallScore: number;
    rank: string;
    createdAt: Date;
}
export declare const AbilityRadar: mongoose.Model<IAbilityRadar, {}, {}, {}, mongoose.Document<unknown, {}, IAbilityRadar, {}, {}> & IAbilityRadar & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=AbilityRadar.d.ts.map