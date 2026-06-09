/**
 * AI导师项目复盘定时任务
 *
 * 功能：
 * 1. 每5分钟扫描一次已完成的订单
 * 2. 对60秒前完成且未发送复盘的订单触发复盘
 */
declare class MentorRetrospectiveJob {
    private job;
    /**
     * 启动定时任务
     */
    start(): void;
    /**
     * 停止定时任务
     */
    stop(): void;
    /**
     * 扫描并触发复盘
     */
    private scanAndTriggerRetrospectives;
    /**
     * 手动触发一次扫描（用于测试）
     */
    triggerManually(): Promise<void>;
}
declare const _default: MentorRetrospectiveJob;
export default _default;
//# sourceMappingURL=mentorRetrospectiveJob.d.ts.map