/**
 * Bull队列配置
 * 用于异步处理耗时任务，提升API响应速度
 */

import Bull from 'bull';

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
export const matchingQueue = new Bull('matching', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,  // 保留最近100个成功任务
    removeOnFail: false,    // 失败任务不删除，便于调试
  },
});

/**
 * 通知队列 - 处理各种通知推送
 */
export const notificationQueue = new Bull('notification', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 5,  // 通知任务重试次数更多
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
export const aiQueue = new Bull('ai-processing', {
  redis: redisConfig,
  limiter: {
    max: 10,        // 同时最多10个AI任务
    duration: 60000,  // 每分钟
  },
  defaultJobOptions: {
    attempts: 2,
    timeout: 30000,  // AI任务超时30秒
    removeOnComplete: true,
  },
});

/**
 * 数据同步队列 - 处理缓存失效、数据聚合等
 */
export const syncQueue = new Bull('data-sync', {
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
matchingQueue.on('completed', (job, result) => {
  logger.info(`✅ [Matching] Job ${job.id} completed:`, {
    type: job.name,
    result: typeof result === 'object' ? JSON.stringify(result).slice(0, 100) : result
  });
});

matchingQueue.on('failed', (job, err) => {
  logger.error(`❌ [Matching] Job ${job?.id} failed:`, err.message);
});

matchingQueue.on('stalled', (job) => {
  logger.warn(`⚠️  [Matching] Job ${job.id} stalled`);
});

// 通知队列事件
notificationQueue.on('completed', (job) => {
  logger.info(`✅ [Notification] Job ${job.id} completed`);
});

notificationQueue.on('failed', (job, err) => {
  logger.error(`❌ [Notification] Job ${job?.id} failed:`, err.message);
});

// AI队列事件
aiQueue.on('completed', (job, result) => {
  logger.info(`✅ [AI] Job ${job.id} completed in ${Date.now() - job.timestamp}ms`);
});

aiQueue.on('failed', (job, err) => {
  logger.error(`❌ [AI] Job ${job?.id} failed:`, err.message);
});

// ============================================================================
// 健康检查
// ============================================================================

export async function getQueuesHealth() {
  const [matchingCounts, notificationCounts, aiCounts, syncCounts] = await Promise.all([
    matchingQueue.getJobCounts(),
    notificationQueue.getJobCounts(),
    aiQueue.getJobCounts(),
    syncQueue.getJobCounts(),
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

export async function closeQueues() {
  logger.info('Closing all queues...');
  await Promise.all([
    matchingQueue.close(),
    notificationQueue.close(),
    aiQueue.close(),
    syncQueue.close(),
  ]);
  logger.info('✅ All queues closed');
}

// 进程退出时关闭队列
process.on('SIGTERM', closeQueues);
process.on('SIGINT', closeQueues);

export default {
  matchingQueue,
  notificationQueue,
  aiQueue,
  syncQueue,
  getQueuesHealth,
  closeQueues,
};
