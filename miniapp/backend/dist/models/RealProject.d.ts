import mongoose, { Document } from 'mongoose';
/**
 * 真实项目（接单项目）
 * 区别于"实践项目"，这是用户从平台接的真实项目
 */
export interface IRealProject extends Document {
    userId?: mongoose.Types.ObjectId;
    projectNumber?: number;
    title: string;
    description: string;
    company: string;
    category: string;
    difficulty: 'easy' | 'medium' | 'hard' | 'expert';
    requiredAbilities: string[];
    estimatedDays: number;
    budget: number;
    actualEarnings: number;
    platformCommission: number;
    netIncome: number;
    status: 'available' | 'applied' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
    appliedAt?: Date;
    acceptedAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    deliverables: {
        type: string;
        url: string;
        description: string;
    }[];
    clientRating?: {
        score: number;
        comment: string;
        tags: string[];
    };
    abilitiesGained: string[];
    abilitiesImproved: string[];
    createdAt: Date;
}
export declare const RealProject: mongoose.Model<IRealProject, {}, {}, {}, mongoose.Document<unknown, {}, IRealProject, {}, {}> & IRealProject & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=RealProject.d.ts.map