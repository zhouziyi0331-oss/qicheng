import mongoose, { Document } from 'mongoose';
/**
 * 深度对比报告
 * 对比用户在不同时间点的能力变化
 * 规则：
 * - 第1次：测评 vs 第1次项目
 * - 第2次：第2次项目 vs 第1次项目
 * - 第N次：第N次项目 vs 第(N-1)次项目
 */
export interface IComparisonReport extends Document {
    userId: mongoose.Types.ObjectId;
    comparisonNumber: number;
    beforeSnapshot: {
        type: 'assessment' | 'project';
        refId: mongoose.Types.ObjectId;
        date: Date;
        abilityRadarId: mongoose.Types.ObjectId;
        overallScore: number;
    };
    afterSnapshot: {
        type: 'assessment' | 'project';
        refId: mongoose.Types.ObjectId;
        date: Date;
        abilityRadarId: mongoose.Types.ObjectId;
        overallScore: number;
    };
    analysis: {
        dimensionChanges: {
            dimension: string;
            beforeScore: number;
            afterScore: number;
            change: number;
            changePercent: string;
            evaluation: string;
        }[];
        newAbilities: string[];
        improvedAbilities: string[];
        stableAbilities: string[];
        overallGrowth: number;
        summary: string;
        recommendations: string[];
    };
    createdAt: Date;
}
export declare const ComparisonReport: mongoose.Model<IComparisonReport, {}, {}, {}, mongoose.Document<unknown, {}, IComparisonReport, {}, {}> & IComparisonReport & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=ComparisonReport.d.ts.map