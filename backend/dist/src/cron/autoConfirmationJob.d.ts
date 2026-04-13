import { Pool } from 'pg';
/**
 * 7天自动确认定时任务
 * 每天凌晨2点执行，检查所有支付尾款超过7天但未最终确认的任务
 * 自动确认任务完成，释放尾款给学生
 */
export declare class AutoConfirmationJob {
    private pool;
    constructor(pool: Pool);
    /**
     * 执行自动确认任务
     */
    execute(): Promise<void>;
    /**
     * 确认单个任务
     */
    private confirmTask;
    /**
     * 获取定时任务配置
     * Cron表达式: 0 2 * * * (每天凌晨2点执行)
     */
    static getCronSchedule(): string;
}
//# sourceMappingURL=autoConfirmationJob.d.ts.map