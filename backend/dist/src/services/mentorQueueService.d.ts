/**
 * 导师触发队列服务
 * 使用Redis实现延迟任务队列，替代setTimeout
 *
 * 优势：
 * 1. 持久化：服务器重启不会丢失任务
 * 2. 可靠性：任务执行失败可以重试
 * 3. 可观测：可以查看队列状态
 */
interface MentorJob {
    taskId: string;
    studentId: string;
    stage: 'requirement_understanding' | 'execution_guidance' | 'quality_review' | 'communication_bridge' | 'growth_summary';
    scheduledAt: number;
    retryCount?: number;
}
declare class MentorQueueService {
    private isProcessing;
    private processingInterval;
    /**
     * 启动队列处理器
     */
    start(): Promise<void>;
    /**
     * 停止队列处理器
     */
    stop(): Promise<void>;
    /**
     * 添加延迟任务到队列
     * @param job 任务信息
     * @param delayMs 延迟时间（毫秒）
     */
    scheduleJob(job: Omit<MentorJob, 'scheduledAt' | 'retryCount'>, delayMs: number): Promise<void>;
    /**
     * 处理到期的任务
     */
    private processJobs;
    /**
     * 执行具体的导师触发任务
     */
    private executeJob;
    /**
     * 处理任务失败
     */
    private handleJobFailure;
    /**
     * 获取队列状态
     */
    getQueueStatus(): Promise<{
        pendingCount: number;
        processingCount: number;
        upcomingJobs: MentorJob[];
    }>;
    /**
     * 清空队列（仅用于测试）
     */
    clearQueue(): Promise<void>;
}
declare const _default: MentorQueueService;
export default _default;
//# sourceMappingURL=mentorQueueService.d.ts.map