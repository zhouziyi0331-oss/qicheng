/**
 * Bull队列配置
 * 用于异步处理耗时任务，提升API响应速度
 */
import Bull from 'bull';
/**
 * 匹配队列 - 处理学生-任务匹配相关的异步任务
 */
export declare const matchingQueue: Bull.Queue<any>;
/**
 * 通知队列 - 处理各种通知推送
 */
export declare const notificationQueue: Bull.Queue<any>;
/**
 * AI处理队列 - 限流的AI任务队列
 */
export declare const aiQueue: Bull.Queue<any>;
/**
 * 数据同步队列 - 处理缓存失效、数据聚合等
 */
export declare const syncQueue: Bull.Queue<any>;
export declare function getQueuesHealth(): Promise<{
    matching: Bull.JobCounts;
    notification: Bull.JobCounts;
    ai: Bull.JobCounts;
    sync: Bull.JobCounts;
    timestamp: string;
}>;
export declare function closeQueues(): Promise<void>;
declare const _default: {
    matchingQueue: Bull.Queue<any>;
    notificationQueue: Bull.Queue<any>;
    aiQueue: Bull.Queue<any>;
    syncQueue: Bull.Queue<any>;
    getQueuesHealth: typeof getQueuesHealth;
    closeQueues: typeof closeQueues;
};
export default _default;
//# sourceMappingURL=queue.d.ts.map