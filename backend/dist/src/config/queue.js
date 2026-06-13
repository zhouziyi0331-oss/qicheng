"use strict";
/**
 * Bull队列配置
 * 用于异步处理耗时任务，提升API响应速度
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncQueue = exports.aiQueue = exports.notificationQueue = exports.matchingQueue = void 0;
exports.getQueuesHealth = getQueuesHealth;
exports.closeQueues = closeQueues;
const bull_1 = __importDefault(require("bull"));
const logger_1 = __importDefault(require("../utils/logger"));
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
};
// ============================================================================
// 队列定义
// ============================================================================
/**
 * 匹配队列 - 处理学生-任务匹配相关的异步任务
 */
exports.matchingQueue = new bull_1.default('matching', {
    redis: redisConfig,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: 100, // 保留最近100个成功任务
        removeOnFail: false, // 失败任务不删除，便于调试
    },
});
/**
 * 通知队列 - 处理各种通知推送
 */
exports.notificationQueue = new bull_1.default('notification', {
    redis: redisConfig,
    defaultJobOptions: {
        attempts: 5, // 通知任务重试次数更多
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
    },
});
/**
 * AI处理队列 - 限流的AI任务队列
 */
exports.aiQueue = new bull_1.default('ai-processing', {
    redis: redisConfig,
    limiter: {
        max: 10, // 同时最多10个AI任务
        duration: 60000, // 每分钟
    },
    defaultJobOptions: {
        attempts: 2,
        timeout: 30000, // AI任务超时30秒
        removeOnComplete: true,
    },
});
/**
 * 数据同步队列 - 处理缓存失效、数据聚合等
 */
exports.syncQueue = new bull_1.default('data-sync', {
    redis: redisConfig,
    defaultJobOptions: {
        attempts: 3,
        removeOnComplete: true,
    },
});
// ============================================================================
// 队列事件监听
// ============================================================================
// 匹配队列事件
exports.matchingQueue.on('completed', (job, result) => {
    logger_1.default.info(`✅ [Matching] Job ${job.id} completed:`, {
        type: job.name,
        result: typeof result === 'object' ? JSON.stringify(result).slice(0, 100) : result
    });
});
exports.matchingQueue.on('failed', (job, err) => {
    logger_1.default.error(`❌ [Matching] Job ${job?.id} failed:`, err.message);
});
exports.matchingQueue.on('stalled', (job) => {
    logger_1.default.warn(`⚠️  [Matching] Job ${job.id} stalled`);
});
// 通知队列事件
exports.notificationQueue.on('completed', (job) => {
    logger_1.default.info(`✅ [Notification] Job ${job.id} completed`);
});
exports.notificationQueue.on('failed', (job, err) => {
    logger_1.default.error(`❌ [Notification] Job ${job?.id} failed:`, err.message);
});
// AI队列事件
exports.aiQueue.on('completed', (job, result) => {
    logger_1.default.info(`✅ [AI] Job ${job.id} completed in ${Date.now() - job.timestamp}ms`);
});
exports.aiQueue.on('failed', (job, err) => {
    logger_1.default.error(`❌ [AI] Job ${job?.id} failed:`, err.message);
});
// ============================================================================
// 健康检查
// ============================================================================
async function getQueuesHealth() {
    const [matchingCounts, notificationCounts, aiCounts, syncCounts] = await Promise.all([
        exports.matchingQueue.getJobCounts(),
        exports.notificationQueue.getJobCounts(),
        exports.aiQueue.getJobCounts(),
        exports.syncQueue.getJobCounts(),
    ]);
    return {
        matching: matchingCounts,
        notification: notificationCounts,
        ai: aiCounts,
        sync: syncCounts,
        timestamp: new Date().toISOString(),
    };
}
// ============================================================================
// 优雅关闭
// ============================================================================
async function closeQueues() {
    logger_1.default.info('Closing all queues...');
    await Promise.all([
        exports.matchingQueue.close(),
        exports.notificationQueue.close(),
        exports.aiQueue.close(),
        exports.syncQueue.close(),
    ]);
    logger_1.default.info('✅ All queues closed');
}
// 进程退出时关闭队列
process.on('SIGTERM', closeQueues);
process.on('SIGINT', closeQueues);
exports.default = {
    matchingQueue: exports.matchingQueue,
    notificationQueue: exports.notificationQueue,
    aiQueue: exports.aiQueue,
    syncQueue: exports.syncQueue,
    getQueuesHealth,
    closeQueues,
};
//# sourceMappingURL=queue.js.map