import mongoose from 'mongoose';
/**
 * OC测评服务
 * 生成个性化的能力测评报告
 */
export declare class AssessmentService {
    /**
     * 生成测评结果（AI分析）
     */
    generateAssessmentResult(userId: string, answers: {
        questionId: string;
        answer: any;
    }[]): Promise<{
        assessmentId: mongoose.Types.ObjectId;
        assessmentNumber: number;
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
    }>;
    /**
     * 构建AI提示词
     */
    private buildAssessmentPrompt;
    /**
     * 生成能力雷达图快照
     */
    private generateAbilityRadarSnapshot;
    /**
     * 获取用户的测评历史
     */
    getUserAssessments(userId: string): Promise<(mongoose.Document<unknown, {}, import("../models/Assessment").IAssessment, {}, {}> & import("../models/Assessment").IAssessment & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    /**
     * 获取最新测评
     */
    getLatestAssessment(userId: string): Promise<(mongoose.Document<unknown, {}, import("../models/Assessment").IAssessment, {}, {}> & import("../models/Assessment").IAssessment & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
}
export declare const assessmentService: AssessmentService;
//# sourceMappingURL=assessment.service.d.ts.map