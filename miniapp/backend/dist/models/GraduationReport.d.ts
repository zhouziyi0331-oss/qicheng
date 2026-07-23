import mongoose, { Document } from 'mongoose';
/**
 * 毕业报告
 * 用户完成整个学习历程后的综合报告
 * 每个人的报告都是独一无二的
 */
export interface IGraduationReport extends Document {
    userId: mongoose.Types.ObjectId;
    generatedAt: Date;
    journeySummary: {
        startDate: Date;
        endDate: Date;
        totalDays: number;
        firstAssessmentDate: Date;
        lastAssessmentDate: Date;
        assessmentCount: number;
    };
    projectAchievements: {
        practiceProjects: number;
        realProjects: number;
        totalProjects: number;
        projectCategories: string[];
        clientSatisfaction: number;
    };
    abilityGrowth: {
        initialLevel: string;
        finalLevel: string;
        levelUpCount: number;
        dimensionGrowth: {
            dimension: string;
            initialScore: number;
            finalScore: number;
            growth: number;
            growthPercent: string;
        }[];
        allAbilityTags: string[];
        totalAbilityCount: number;
        mostImprovedDimension: {
            dimension: string;
            growth: number;
        };
    };
    financialSummary: {
        totalEarnings: number;
        totalWithdrawals: number;
        currentBalance: number;
        averageProjectEarnings: number;
        highestProjectEarnings: number;
    };
    aiEvaluation: {
        overallAssessment: string;
        strengthsAnalysis: string;
        achievementsHighlight: string[];
        growthStory: string;
        futureRecommendations: string[];
        careerPathSuggestions: string[];
    };
    visualData: {
        abilityRadarComparison: {
            initial: any;
            final: any;
        };
        growthCurve: {
            date: Date;
            overallScore: number;
        }[];
        projectTimeline: {
            date: Date;
            projectTitle: string;
            projectType: 'practice' | 'real';
            earnings: number;
        }[];
    };
    certificate: {
        certificateId: string;
        issuedAt: Date;
        level: string;
        specialization: string[];
    };
    status: 'generating' | 'completed' | 'failed';
    isUnlocked: boolean;
    unlockedAt?: Date;
}
export declare const GraduationReport: mongoose.Model<IGraduationReport, {}, {}, {}, mongoose.Document<unknown, {}, IGraduationReport, {}, {}> & IGraduationReport & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=GraduationReport.d.ts.map