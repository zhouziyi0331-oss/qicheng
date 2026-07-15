/**
 * Phase R5.3: 定期报告生成任务
 * 每周和每月自动生成报告
 */
import { Pool } from 'pg';
/**
 * 每周报告生成任务
 * 每周一早上8点执行
 */
export declare class WeeklyReportJob {
    private pool;
    constructor(pool: Pool);
    /**
     * 获取Cron表达式
     * 每周一 8:00 AM
     */
    static getCronSchedule(): string;
    /**
     * 执行任务
     */
    execute(): Promise<void>;
}
/**
 * 每月报告生成任务
 * 每月1号早上8点执行
 */
export declare class MonthlyReportJob {
    private pool;
    constructor(pool: Pool);
    /**
     * 获取Cron表达式
     * 每月1号 8:00 AM
     */
    static getCronSchedule(): string;
    /**
     * 执行任务
     */
    execute(): Promise<void>;
}
//# sourceMappingURL=reportGenerationJobs.d.ts.map