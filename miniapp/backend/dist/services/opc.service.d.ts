import mongoose from 'mongoose';
/**
 * OPC测评服务
 * 实现36题测评、7种人格标签生成、项目匹配
 */
export declare class OPCService {
    /**
     * 获取所有测试题
     */
    getQuestions(): Promise<(mongoose.Document<unknown, {}, import("../models/OPCQuestion").IOPCQuestion, {}, {}> & import("../models/OPCQuestion").IOPCQuestion & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    /**
     * 计算各维度分数
     */
    private calculateDimensionScores;
    /**
     * 获取题目所属维度（简化版）
     * 实际应该从数据库查询
     */
    private getQuestionDimension;
    /**
     * 生成人格标签（7种）
     * 基于维度分数的算法
     */
    private calculatePersonalityTag;
    /**
     * 生成优势和建议
     */
    private generateStrengthsAndSuggestions;
    /**
     * 提交OPC测评
     */
    submitAssessment(userId: string, answers: {
        questionId: number;
        answer: string;
        score: number;
    }[]): Promise<{
        opcResultId: mongoose.Types.ObjectId;
        personalityTag: string;
        dimensionScores: {
            dimension: string;
            score: number;
        }[];
        strengths: string[];
        suggestions: string[];
    }>;
    /**
     * 获取分数等级
     */
    private getScoreLevel;
    /**
     * 获取维度描述
     */
    private getDimensionDescription;
    /**
     * 获取综合等级
     */
    private getOverallRank;
    /**
     * 获取用户最新的OPC测评结果
     */
    getLatestResult(userId: string): Promise<(mongoose.Document<unknown, {}, import("../models/OPCResult").IOPCResult, {}, {}> & import("../models/OPCResult").IOPCResult & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    /**
     * 获取用户所有OPC测评历史
     */
    getUserResults(userId: string): Promise<(mongoose.Document<unknown, {}, import("../models/OPCResult").IOPCResult, {}, {}> & import("../models/OPCResult").IOPCResult & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    /**
     * OPC测评完成时增加经验值
     */
    private addExpForOPC;
}
export declare const opcService: OPCService;
//# sourceMappingURL=opc.service.d.ts.map