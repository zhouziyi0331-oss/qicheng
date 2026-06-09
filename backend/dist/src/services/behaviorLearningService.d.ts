/**
 * 学生行为学习服务
 * 记录学生行为，动态学习偏好，影响推荐结果
 */
interface BehaviorLog {
    studentId: string;
    taskId: string;
    actionType: 'viewed' | 'accepted' | 'rejected' | 'completed' | 'failed';
    taskType?: string;
    taskTrack?: string;
    taskLevel?: number;
    taskBudget?: number;
    taskTags?: string[];
    matchScore?: number;
    rankInRecommendation?: number;
}
interface PreferenceProfile {
    studentId: string;
    preferredTaskTypes: Record<string, {
        acceptanceRate: number;
        avgCompletionQuality: number;
        count: number;
    }>;
    preferredBudgetRange: {
        min: number;
        max: number;
        avgAccepted: number;
    };
    preferredDifficultyRange: {
        minLevel: number;
        maxLevel: number;
        comfortZone: number;
    };
    rejectionPatterns: Record<string, number>;
    totalViewed: number;
    totalAccepted: number;
    totalRejected: number;
    totalCompleted: number;
    acceptanceRate: number;
    completionRate: number;
}
declare class BehaviorLearningService {
    /**
     * 记录学生行为
     */
    logBehavior(log: BehaviorLog): Promise<void>;
    /**
     * 分析行为并更新偏好画像
     */
    private analyzeAndUpdatePreference;
    /**
     * 分析拒绝原因
     */
    private analyzeRejectionReason;
    /**
     * 获取学生偏好画像
     */
    getPreferenceProfile(studentId: string): Promise<PreferenceProfile | null>;
    /**
     * 计算基于行为的偏好加权
     * 用于调整匹配分数
     */
    calculatePreferenceBoost(studentId: string, taskType: string, taskBudget: number, taskLevel: number): Promise<number>;
    /**
     * 记录任务查看行为
     */
    logTaskView(studentId: string, taskId: string, matchScore?: number, rank?: number): Promise<void>;
    /**
     * 记录任务接受行为
     */
    logTaskAccept(studentId: string, taskId: string): Promise<void>;
    /**
     * 记录任务拒绝行为
     */
    logTaskReject(studentId: string, taskId: string): Promise<void>;
    /**
     * 记录任务完成行为
     */
    logTaskComplete(studentId: string, taskId: string): Promise<void>;
}
declare const _default: BehaviorLearningService;
export default _default;
//# sourceMappingURL=behaviorLearningService.d.ts.map