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
     * 启动7天自动确认任务
     */
    private startAutoConfirmationJob;
    /**
     * 手动触发7天自动确认任务（用于测试）
     */
    triggerAutoConfirmation(): Promise<void>;
}
//# sourceMappingURL=scheduler.d.ts.map