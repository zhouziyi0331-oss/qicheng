import mongoose, { Document } from 'mongoose';
export interface IDecompositionReport extends Document {
    projectId: string;
    userId: string;
    status: 'generating' | 'pending_review' | 'completed' | 'failed';
    isUnlocked: boolean;
    unlockedAt?: Date;
    paymentAmount?: number;
    abilityBreakdown: {
        abilities: Array<{
            name: string;
            description: string;
            evidence: string[];
            marketValue: string;
        }>;
    };
    problemValue: {
        painPoint: string;
        rootCause: string;
        impact: string;
        metrics: Array<{
            label: string;
            before: string;
            after: string;
        }>;
    };
    targetCustomers: {
        types: Array<{
            type: string;
            description: string;
            painPoints: string[];
            applicability: 'high' | 'medium' | 'low';
            priceRange: string;
        }>;
    };
    acquisitionChannels: {
        channels: Array<{
            name: string;
            difficulty: 'easy' | 'medium' | 'hard';
            timeToResult: string;
            tactics: string[];
            expectedConversion: string;
        }>;
    };
    growthPath: {
        foundation: {
            phase: string;
            duration: string;
            goals: string[];
            expectedValue: string;
        };
        advanced: {
            phase: string;
            duration: string;
            goals: string[];
            expectedValue: string;
        };
        breakthrough: {
            phase: string;
            duration: string;
            goals: string[];
            expectedValue: string;
        };
    };
    generationMetadata: {
        aiModel: string;
        promptVersion: string;
        tokensUsed: number;
        generatedAt: Date;
        reviewedBy?: string;
        reviewedAt?: Date;
        qualityScore?: number;
    };
    createdAt: Date;
    updatedAt: Date;
}
export declare const DecompositionReport: mongoose.Model<IDecompositionReport, {}, {}, {}, mongoose.Document<unknown, {}, IDecompositionReport, {}, {}> & IDecompositionReport & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=DecompositionReport.d.ts.map