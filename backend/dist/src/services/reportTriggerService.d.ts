/**
 * Phase R5.3: 报告自动触发服务
 * 在关键时刻自动生成学生能力报告
 */
export declare enum ReportTrigger {
    LEVEL_UPGRADE = "level_upgrade",// 学生升级
    TASK_MILESTONE = "task_milestone",// 完成重要任务（第5、10、20...个任务）
    PERIODIC_WEEKLY = "periodic_weekly",// 每周定期
    PERIODIC_MONTHLY = "periodic_monthly",// 每月定期
    MANUAL_REQUEST = "manual_request",// 手动生成
    PURCHASE_REQUEST = "purchase_request"
}
declare class ReportTriggerService {
    /**
     * 学生升级时触发报告生成
     */
    onLevelUpgrade(studentId: string, oldLevel: number, newLevel: number): Promise<void>;
    /**
     * 任务完成时触发报告生成（里程碑任务）
     */
    onTaskCompleted(studentId: string, taskId: string): Promise<void>;
    /**
     * 企业购买报告时触发生成
     */
    onReportPurchase(studentId: string, companyId: string): Promise<void>;
    /**
     * 手动触发报告生成
     */
    onManualRequest(studentId: string, reportType?: 'comprehensive' | 'summary' | 'growth'): Promise<void>;
    /**
     * 将报告生成任务加入队列
     */
    private enqueueReportGeneration;
    /**
     * 判断升级时是否应该生成报告（频率限制）
     */
    private shouldGenerateOnLevelUp;
    /**
     * 判断任务里程碑时是否应该生成报告（频率限制）
     */
    private shouldGenerateOnTaskMilestone;
    /**
     * 获取学生完成的任务总数
     */
    private getCompletedTaskCount;
    /**
     * 判断是否是里程碑任务
     */
    private isMilestoneTask;
    /**
     * 定期报告生成 - 每周
     */
    generateWeeklyReports(): Promise<void>;
    /**
     * 定期报告生成 - 每月
     */
    generateMonthlyReports(): Promise<void>;
    /**
     * 获取报告生成统计
     */
    getGenerationStats(studentId?: string): Promise<any>;
}
export declare const reportTriggerService: ReportTriggerService;
export default reportTriggerService;
//# sourceMappingURL=reportTriggerService.d.ts.map