import { Pool } from 'pg';
/**
 * 申请超时取消任务
 * 学生申请接单后，企业24小时内未确认，系统自动取消申请
 * 保护学生权益，避免申请被长时间占用
 */
export declare class ApplicationTimeoutJob {
    private pool;
    constructor(pool: Pool);
    /**
     * 执行申请超时取消
     */
    execute(): Promise<void>;
    /**
     * 获取Cron调度表达式
     * 每2小时执行一次
     */
    static getCronSchedule(): string;
}
//# sourceMappingURL=applicationTimeoutJob.d.ts.map