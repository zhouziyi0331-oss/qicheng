import { Pool } from 'pg';
/**
 * 48小时自动确认交付任务
 * 企业在学生提交交付物后48小时内未确认，系统自动确认交付
 * 保护学生权益，避免企业恶意拖延确认
 */
export declare class AutoAcceptanceJob {
    private pool;
    constructor(pool: Pool);
    /**
     * 执行自动确认任务
     */
    execute(): Promise<void>;
    /**
     * 获取Cron调度表达式
     * 每小时执行一次
     */
    static getCronSchedule(): string;
}
//# sourceMappingURL=autoAcceptanceJob.d.ts.map