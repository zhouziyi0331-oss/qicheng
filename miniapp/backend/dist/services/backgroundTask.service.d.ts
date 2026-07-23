/**
 * 后台任务服务
 * 管理异步任务的创建、执行、重试和状态追踪
 */
export declare class BackgroundTaskService {
    /**
     * 创建后台任务
     */
    createTask(data: {
        userId: string;
        taskType: 'ability_radar' | 'comparison_report' | 'growth_path' | 'graduation_report' | 'achievement_check';
        taskName: string;
        relatedId?: string;
        metadata?: any;
        maxAttempts?: number;
    }): Promise<import("mongoose").Document<unknown, {}, import("../models/BackgroundTask").IBackgroundTask, {}, {}> & import("../models/BackgroundTask").IBackgroundTask & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * 执行后台任务
     */
    executeTask(taskId: string): Promise<void>;
    /**
     * 获取用户的任务列表
     */
    getUserTasks(userId: string, options?: {
        status?: string;
        taskType?: string;
        limit?: number;
        skip?: number;
    }): Promise<(import("mongoose").Document<unknown, {}, import("../models/BackgroundTask").IBackgroundTask, {}, {}> & import("../models/BackgroundTask").IBackgroundTask & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    /**
     * 获取任务详情
     */
    getTaskById(taskId: string): Promise<(import("mongoose").Document<unknown, {}, import("../models/BackgroundTask").IBackgroundTask, {}, {}> & import("../models/BackgroundTask").IBackgroundTask & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    /**
     * 重试失败的任务
     */
    retryTask(taskId: string): Promise<import("mongoose").Document<unknown, {}, import("../models/BackgroundTask").IBackgroundTask, {}, {}> & import("../models/BackgroundTask").IBackgroundTask & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * 获取任务统计
     */
    getTaskStats(userId?: string): Promise<{
        pending: number;
        processing: number;
        completed: number;
        failed: number;
    }>;
    /**
     * 清理旧任务（保留最近7天）
     */
    cleanupOldTasks(): Promise<number>;
}
export declare const backgroundTaskService: BackgroundTaskService;
//# sourceMappingURL=backgroundTask.service.d.ts.map