import mongoose from 'mongoose';
/**
 * 真实项目服务
 * 管理用户的真实接单项目
 */
export declare class RealProjectService {
    /**
     * 获取可接单的项目列表
     */
    getAvailableProjects(filters?: {
        category?: string;
        difficulty?: string;
        minBudget?: number;
        maxBudget?: number;
        requiredAbilities?: string[];
    }): Promise<(mongoose.Document<unknown, {}, import("../models/RealProject").IRealProject, {}, {}> & import("../models/RealProject").IRealProject & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    /**
     * 用户申请项目
     */
    applyForProject(userId: string, projectId: string): Promise<mongoose.Document<unknown, {}, import("../models/RealProject").IRealProject, {}, {}> & import("../models/RealProject").IRealProject & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * 接受项目（开始工作）
     */
    acceptProject(userId: string, projectId: string): Promise<mongoose.Document<unknown, {}, import("../models/RealProject").IRealProject, {}, {}> & import("../models/RealProject").IRealProject & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * 完成项目
     */
    completeProject(userId: string, projectId: string, deliverables: {
        type: string;
        url: string;
        description: string;
    }[]): Promise<mongoose.Document<unknown, {}, import("../models/RealProject").IRealProject, {}, {}> & import("../models/RealProject").IRealProject & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * 客户评价项目
     */
    rateProject(projectId: string, rating: {
        score: number;
        comment: string;
        tags: string[];
    }): Promise<mongoose.Document<unknown, {}, import("../models/RealProject").IRealProject, {}, {}> & import("../models/RealProject").IRealProject & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * 项目完成后的触发任务
     */
    private triggerPostCompletionTasks;
    /**
     * 获取用户的项目列表
     */
    getUserProjects(userId: string, status?: string): Promise<(mongoose.Document<unknown, {}, import("../models/RealProject").IRealProject, {}, {}> & import("../models/RealProject").IRealProject & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    /**
     * 获取用户的项目统计
     */
    getUserProjectStats(userId: string): Promise<{
        totalApplied: number;
        inProgress: number;
        completed: number;
        totalEarnings: any;
        avgRating: number;
    }>;
    /**
     * 获取项目详情
     */
    getProjectDetail(projectId: string): Promise<mongoose.Document<unknown, {}, import("../models/RealProject").IRealProject, {}, {}> & import("../models/RealProject").IRealProject & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * 项目完成时增加经验值
     */
    private addExpForCompletion;
}
export declare const realProjectService: RealProjectService;
//# sourceMappingURL=realProject.service.d.ts.map