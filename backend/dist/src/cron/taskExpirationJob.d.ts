import { Pool } from 'pg';
/**
 * 任务过期处理定时任务
 *
 * 处理两种情况：
 * 1. 截止时间已过但学生未提交 → 自动取消，退款给企业
 * 2. 发布7天无人接单 → 自动下架，通知企业调整
 */
export declare class TaskExpirationJob {
    private pool;
    constructor(pool: Pool);
    /**
     * 执行任务过期处理
     */
    execute(): Promise<void>;
    /**
     * 处理截止时间已过的任务
     */
    private handleExpiredDeadlineTasks;
    /**
     * 处理7天无人接单的任务
     */
    private handleUnstaffedTasks;
    /**
     * 获取Cron调度表达式
     * 每30分钟执行一次
     */
    static getCronSchedule(): string;
}
//# sourceMappingURL=taskExpirationJob.d.ts.map