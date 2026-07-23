import mongoose, { Document } from 'mongoose';
/**
 * 动态成长路径
 * 根据用户能力、项目历史，AI动态生成个性化成长建议
 * 每次测评、完成项目后都会重新生成
 */
export interface IDynamicGrowthPath extends Document {
    userId: mongoose.Types.ObjectId;
    versionNumber: number;
    generatedAt: Date;
    currentState: {
        overallLevel: string;
        strongestAbilities: string[];
        weakestAbilities: string[];
        completedProjects: number;
        totalEarnings: number;
    };
    phases: {
        phaseNumber: number;
        phaseName: string;
        goal: string;
        duration: string;
        actions: {
            actionType: 'learn_skill' | 'do_project' | 'find_mentor' | 'join_community' | 'other';
            title: string;
            description: string;
            priority: 'high' | 'medium' | 'low';
            estimatedTime: string;
            expectedOutcome: string;
        }[];
        recommendedProjects: {
            category: string;
            difficulty: string;
            reason: string;
        }[];
        abilityGoals: {
            ability: string;
            currentScore: number;
            targetScore: number;
            improvementPath: string;
        }[];
    }[];
    milestones: {
        title: string;
        description: string;
        targetDate?: Date;
        completed: boolean;
        completedAt?: Date;
    }[];
    predictions: {
        expectedLevel: string;
        expectedTimeframe: string;
        expectedEarnings: number;
        confidenceLevel: string;
    };
}
export declare const DynamicGrowthPath: mongoose.Model<IDynamicGrowthPath, {}, {}, {}, mongoose.Document<unknown, {}, IDynamicGrowthPath, {}, {}> & IDynamicGrowthPath & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=DynamicGrowthPath.d.ts.map