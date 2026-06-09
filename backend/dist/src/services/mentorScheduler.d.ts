/**
 * AI导师定时任务调度器
 */
declare class MentorScheduler {
    private tasks;
    /**
     * 启动所有定时任务
     */
    start(): void;
    /**
     * 停止所有定时任务
     */
    stop(): void;
    /**
     * 主动跟进任务
     * 每小时执行一次，检查需要跟进的学生
     */
    private scheduleFollowUps;
    /**
     * 清理过期记忆
     * 每天凌晨3点执行
     */
    private scheduleMemoryCleanup;
    /**
     * 学习模式分析
     * 每6小时执行一次
     */
    private scheduleLearningPatternAnalysis;
    /**
     * 手动触发主动跟进（用于测试）
     */
    triggerFollowUps(): Promise<any>;
    /**
     * 获取任务状态
     */
    getStatus(): {
        running: boolean;
        tasks: Array<{
            name: string;
            schedule: string;
        }>;
    };
}
export declare const mentorScheduler: MentorScheduler;
export {};
//# sourceMappingURL=mentorScheduler.d.ts.map