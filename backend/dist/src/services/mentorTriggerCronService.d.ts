/**
 * AI导师自动触发定时任务服务
 *
 * 功能：
 * 1. 每30秒检查一次待触发的记录
 * 2. 执行到期的触发任务
 * 3. 更新触发状态
 */
declare class MentorTriggerCronService {
    private cronJob;
    private isProcessing;
    /**
     * 启动定时任务
     */
    start(): void;
    /**
     * 停止定时任务
     */
    stop(): void;
    /**
     * 处理待触发的记录
     */
    private processPendingTriggers;
    /**
     * 执行单个触发任务
     */
    private executeTrigger;
    /**
     * 手动触发处理（用于测试或立即执行）
     */
    processNow(): Promise<void>;
    /**
     * 获取待处理的触发任务数量
     */
    getPendingCount(): Promise<number>;
    /**
     * 获取触发统计信息
     */
    getStats(): Promise<any[]>;
}
export declare const mentorTriggerCronService: MentorTriggerCronService;
export {};
//# sourceMappingURL=mentorTriggerCronService.d.ts.map