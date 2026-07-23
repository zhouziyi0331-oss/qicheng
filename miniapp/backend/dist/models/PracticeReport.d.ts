import mongoose, { Document } from 'mongoose';
export interface IPracticeReport extends Document {
    projectId: string;
    userId: string;
    whatDid: {
        description: string;
        items: string[];
    };
    problemSolved: {
        coreIssue: string;
        rootCause: string;
        improvement: {
            label: string;
            before: number;
            after: number;
        };
    };
    replicability: {
        description: string;
        industries: Array<{
            name: string;
            icon: string;
            level: 'high' | 'medium';
        }>;
    };
    learned: {
        highlight: string;
        items: string[];
    };
    rewards: {
        exp: number;
        income: number;
        cases: number;
    };
    createdAt: Date;
    updatedAt: Date;
}
export declare const PracticeReport: mongoose.Model<IPracticeReport, {}, {}, {}, mongoose.Document<unknown, {}, IPracticeReport, {}, {}> & IPracticeReport & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=PracticeReport.d.ts.map