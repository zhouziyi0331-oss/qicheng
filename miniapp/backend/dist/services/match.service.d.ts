import mongoose from 'mongoose';
/**
 * 项目匹配服务
 * 基于OPC人格标签的智能匹配
 */
export declare class MatchService {
    /**
     * 智能项目匹配
     * 返回推荐项目列表，包含匹配理由和冒险标记
     */
    matchProjects(userId: string, limit?: number): Promise<{
        project: mongoose.Document<unknown, {}, import("../models/RealProject").IRealProject, {}, {}> & import("../models/RealProject").IRealProject & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        };
        score: number;
        isStretch: boolean;
        reason: string;
    }[]>;
    /**
     * 计算项目匹配分数
     */
    private calculateMatchScore;
    /**
     * 将难度字符串映射到数字
     */
    private getDifficultyScore;
    /**
     * 获取项目适合的人格标签
     */
    private getProjectSuitablePersonalities;
    /**
     * 获取相关联的人格标签
     */
    private getRelatedPersonalities;
    /**
     * 计算能力标签匹配度
     */
    private calculateAbilityMatch;
    /**
     * 判断是否为冒险项目
     * 冒险项目：比用户当前等级高1-2个难度级别
     */
    private isStretchProject;
    /**
     * 生成匹配理由
     * 基于OPC人格标签生成个性化文案
     */
    private generateMatchReason;
    /**
     * 获取项目详情（包含匹配理由）
     */
    getProjectWithMatchReason(userId: string, projectId: string): Promise<{
        project: mongoose.Document<unknown, {}, import("../models/RealProject").IRealProject, {}, {}> & import("../models/RealProject").IRealProject & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        };
        matchInfo: {
            score: number;
            isStretch: boolean;
            reason: string;
        };
    }>;
}
export declare const matchService: MatchService;
//# sourceMappingURL=match.service.d.ts.map