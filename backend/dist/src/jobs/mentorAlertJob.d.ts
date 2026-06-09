/**
 * AI导师预警定时任务
 *
 * 功能：
 * 1. 每15分钟扫描一次风险条件
 * 2. 触发主动预警消息
 * 3. 记录扫描日志
 */
declare class MentorAlertJob {
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
     * 手动触发一次扫描（用于测试）
     */
    triggerManually(): Promise<void>;
}
declare const _default: MentorAlertJob;
export default _default;
//# sourceMappingURL=mentorAlertJob.d.ts.map