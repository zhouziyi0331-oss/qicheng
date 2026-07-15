import { Pool } from 'pg';
/**
 * 定时任务调度器
 * 管理所有定时任务的启动和停止
 */
export declare class CronScheduler {
    private pool;
    private tasks;
    constructor(pool: Pool);
    /**
     * 启动所有定时任务
     */
    start(): void;
    /**
     * 停止所有定时任务
     */
    stop(): void;
    /**
     * 启动48小时自动确认任务
     */
    private startAutoAcceptanceJob;
    /**
     * 启动7天自动确认任务
     */
    private startAutoConfirmationJob;
    /**
     * 启动任务过期处理任务
     */
    private startTaskExpirationJob;
    /**
     * 启动申请超时取消任务
     */
    private startApplicationTimeoutJob;
    /**
     * 手动触发7天自动确认任务（用于测试）
     */
    triggerAutoConfirmation(): Promise<void>;
    /**
     * Phase R5.3: 启动每周报告生成任务
     */
    private startWeeklyReportJob;
    /**
     * Phase R5.3: 启动每月报告生成任务
     */
    private startMonthlyReportJob;
}
//# sourceMappingURL=scheduler.d.ts.map