/**
 * 定时任务管理器
 */
export declare class ScheduledTasks {
    private intervals;
    /**
     * 启动所有定时任务
     */
    start(): void;
    /**
     * 清理超过1小时仍未完成的生成任务
     */
    private cleanupStaleReports;
    /**
     * 生成每日统计报表
     */
    private generateDailyStats;
    /**
     * 停止所有定时任务
     */
    stop(): void;
}
export declare const scheduledTasks: ScheduledTasks;
//# sourceMappingURL=scheduledTasks.d.ts.map