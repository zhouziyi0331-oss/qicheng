import mongoose from 'mongoose';
/**
 * 能力雷达图服务
 */
export declare class AbilityRadarService {
    /**
     * 项目完成后生成新的雷达图快照
     */
    generateAfterProjectCompletion(userId: string, projectId: string): Promise<mongoose.Document<unknown, {}, import("../models/AbilityRadar").IAbilityRadar, {}, {}> & import("../models/AbilityRadar").IAbilityRadar & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * AI分析项目对能力的影响
     */
    private analyzeProjectImpact;
    /**
     * 计算能力等级
     */
    private calculateLevel;
    /**
     * 获取用户的雷达图历史
     */
    getUserRadarHistory(userId: string): Promise<(mongoose.Document<unknown, {}, import("../models/AbilityRadar").IAbilityRadar, {}, {}> & import("../models/AbilityRadar").IAbilityRadar & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    /**
     * 获取最新雷达图
     */
    getLatestRadar(userId: string): Promise<(mongoose.Document<unknown, {}, import("../models/AbilityRadar").IAbilityRadar, {}, {}> & import("../models/AbilityRadar").IAbilityRadar & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    /**
     * 对比两个雷达图
     */
    compareRadars(userId: string, snapshot1: number, snapshot2: number): Promise<{
        before: mongoose.Document<unknown, {}, import("../models/AbilityRadar").IAbilityRadar, {}, {}> & import("../models/AbilityRadar").IAbilityRadar & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        };
        after: mongoose.Document<unknown, {}, import("../models/AbilityRadar").IAbilityRadar, {}, {}> & import("../models/AbilityRadar").IAbilityRadar & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        };
        comparison: {
            dimension: string;
            before: number;
            after: number;
            change: number;
        }[];
    }>;
}
export declare const abilityRadarService: AbilityRadarService;
//# sourceMappingURL=abilityRadar.service.d.ts.map