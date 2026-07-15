/**
 * 跳级系统服务层
 */
declare class SkipLevelService {
    /**
     * 检查跳级资格
     */
    checkEligibility(studentId: number): Promise<{
        eligible: boolean;
        currentLevel: any;
        currentLevelName: any;
        reason: string;
        canSkipTo: never[];
        cooldownLevels?: undefined;
    } | {
        eligible: boolean;
        currentLevel: any;
        currentLevelName: any;
        reason: string;
        canSkipTo: never[];
        cooldownLevels: number;
    } | {
        eligible: boolean;
        currentLevel: any;
        currentLevelName: any;
        canSkipTo: number[];
        cooldownLevels: number;
        reason?: undefined;
    }>;
    /**
     * 申请跳级
     */
    applySkipLevel(studentId: number, targetLevel: number): Promise<{
        taskId: string;
        deadline: string;
    }>;
    /**
     * 获取任务详情
     */
    getTask(taskId: string, studentId: number): Promise<{
        id: any;
        fromLevel: any;
        toLevel: any;
        name: any;
        description: any;
        requirements: any;
        deadline: number;
        trackName: any;
        passScore: any;
    }>;
    /**
     * 领取任务（开始计时）
     */
    receiveTask(taskId: string, studentId: number): Promise<{
        success: boolean;
    }>;
    /**
     * 获取任务进度
     */
    getProgress(taskId: string, studentId: number): Promise<{
        taskId: string;
        fromLevel: any;
        toLevel: any;
        trackName: any;
        daysLeft: number;
        totalProgress: number;
        completedTasks: any;
        totalTasks: any;
        subTasks: any;
    }>;
    /**
     * 更新子任务进度
     */
    updateSubTaskProgress(taskId: string, subTaskId: number, progress: number, studentId: number): Promise<{
        success: boolean;
    }>;
    /**
     * 提交作品
     */
    submitWork(taskId: string, workData: {
        type: string;
        content: string[];
    }, studentId: number): Promise<{
        success: boolean;
    }>;
    /**
     * 申请评分
     */
    requestScore(taskId: string, studentId: number): Promise<{
        success: boolean;
    }>;
    /**
     * 获取评分结果
     */
    getScore(taskId: string, studentId: number): Promise<{
        totalScore: any;
        passed: boolean;
        passLine: number;
        breakdown: any;
        mentorName: any;
        mentorRole: any;
        mentorComment: any;
    }>;
    /**
     * 获取奖励
     */
    getRewards(taskId: string, studentId: number): Promise<{
        xp: number;
        bonus: number;
        badge: string;
    }>;
    /**
     * 领取奖励
     */
    claimRewards(taskId: string, studentId: number): Promise<{
        success: boolean;
    }>;
    /**
     * 获取改进建议
     */
    getImprovementGuide(taskId: string, studentId: number): Promise<{
        weakItems: {
            name: any;
            score: any;
            gap: number;
            tip: string;
            color: any;
        }[];
        suggestions: {
            icon: string;
            iconBg: string;
            name: string;
            desc: string;
            tag: string;
            tagColor: string;
        }[];
    }>;
}
declare const _default: SkipLevelService;
export default _default;
//# sourceMappingURL=skipLevelService.d.ts.map