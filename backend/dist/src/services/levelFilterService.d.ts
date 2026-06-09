/**
 * 等级过滤服务
 * 根据学生等级和赛道过滤任务
 */
interface StudentLevelInfo {
    studentId: string;
    currentLevel: number;
    track: string;
    allowedDifficulties: number[];
    platformFeeRate: number;
    unlockedFeatures: string[];
}
interface FilteredTasksResult {
    tasks: any[];
    totalCount: number;
    studentLevel: number;
    allowedDifficulties: number[];
}
declare class LevelFilterService {
    /**
     * 获取学生等级信息
     */
    getStudentLevelInfo(studentId: string): Promise<StudentLevelInfo | null>;
    /**
     * 根据学生等级过滤任务列表
     */
    filterTasksByLevel(studentId: string, options?: {
        includeChallengeTasks?: boolean;
        limit?: number;
        offset?: number;
        sortBy?: 'match_score' | 'created_at' | 'difficulty';
        sortOrder?: 'ASC' | 'DESC';
    }): Promise<FilteredTasksResult>;
    /**
     * 检查学生是否可以接某个任务
     */
    canAcceptTask(studentId: string, taskId: string): Promise<{
        canAccept: boolean;
        reason?: string;
    }>;
    /**
     * 获取学生的升级进度
     */
    getUpgradeProgress(studentId: string): Promise<{
        currentLevel: number;
        nextLevel: number;
        progress: {
            completedOrders: number;
            requiredOrders: number;
            avgRating: number;
            requiredRating: number;
        };
        canUpgrade: boolean;
        nextLevelFeatures: string[];
    } | null>;
    /**
     * 自动升级学生等级（订单完成后调用）
     */
    autoUpgradeIfEligible(studentId: string): Promise<{
        upgraded: boolean;
        newLevel?: number;
        oldLevel?: number;
    }>;
    /**
     * 获取所有等级配置（用于前端展示）
     */
    getAllLevelConfigs(track: string): Promise<any[]>;
}
declare const _default: LevelFilterService;
export default _default;
//# sourceMappingURL=levelFilterService.d.ts.map