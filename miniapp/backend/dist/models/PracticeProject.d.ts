import mongoose, { Document } from 'mongoose';
export interface IPracticeProject extends Document {
    userId: string;
    title: string;
    company: string;
    track: 'content' | 'dev';
    status: 'ongoing' | 'completed';
    tags: string[];
    budget: number;
    startDate: Date;
    endDate?: Date;
    expectedEndDate?: Date;
    progress: number;
    description: string;
    deliverables: string[];
    companyFeedback?: string;
    processData?: {
        iterations: number;
        revisionCount: number;
        communicationCount: number;
        toolsUsed: string[];
    };
    scores?: {
        execution: number;
        problemSolving: number;
        replicability: number;
    };
    createdAt: Date;
    updatedAt: Date;
}
export declare const PracticeProject: mongoose.Model<IPracticeProject, {}, {}, {}, mongoose.Document<unknown, {}, IPracticeProject, {}, {}> & IPracticeProject & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=PracticeProject.d.ts.map