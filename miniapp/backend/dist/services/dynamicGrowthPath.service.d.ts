import mongoose from 'mongoose';
/**
 * 动态成长路径服务
 * 根据用户能力、项目历史，AI动态生成个性化成长建议
 */
export declare class DynamicGrowthPathService {
    /**
     * 生成/更新成长路径
     * 在以下情况触发：
     * 1. 完成测评后
     * 2. 完成项目后
     * 3. 用户手动请求
     */
    generateGrowthPath(userId: string): Promise<mongoose.Document<unknown, {}, import("../models/DynamicGrowthPath").IDynamicGrowthPath, {}, {}> & import("../models/DynamicGrowthPath").IDynamicGrowthPath & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * 收集用户数据
     */
    private collectUserData;
    /**
     * AI生成成长路径
     */
    private generateAIGrowthPath;
    /**
     * 获取最新成长路径
     */
    getLatestGrowthPath(userId: string): Promise<(mongoose.Document<unknown, {}, import("../models/DynamicGrowthPath").IDynamicGrowthPath, {}, {}> & import("../models/DynamicGrowthPath").IDynamicGrowthPath & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    /**
     * 获取成长路径历史
     */
    getGrowthPathHistory(userId: string): Promise<(mongoose.Document<unknown, {}, import("../models/DynamicGrowthPath").IDynamicGrowthPath, {}, {}> & import("../models/DynamicGrowthPath").IDynamicGrowthPath & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    /**
     * 更新里程碑状态
     */
    updateMilestone(userId: string, milestoneTitle: string, completed: boolean): Promise<mongoose.Document<unknown, {}, import("../models/DynamicGrowthPath").IDynamicGrowthPath, {}, {}> & import("../models/DynamicGrowthPath").IDynamicGrowthPath & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }>;
}
export declare const dynamicGrowthPathService: DynamicGrowthPathService;
//# sourceMappingURL=dynamicGrowthPath.service.d.ts.map