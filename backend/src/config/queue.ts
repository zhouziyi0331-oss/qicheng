/**
 * Bull队列配置
 * 用于异步处理耗时任务，提升API响应速度
 */

import Bull from 'bull';
import logger from '../utils/logger';

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

/**
 * Phase R5.3: 报告生成队列 - 自动触发报告生成
 */
export const reportQueue = new Bull('report-generation', {
  redis: redisConfig,
  limiter: {
    max: 5,         // 同时最多5个报告生成任务
    duration: 60000, // 每分钟
  },
  defaultJobOptions: {
    attempts: 3,      // 失败后重试3次
    backoff: {
      type: 'exponential',
      delay: 5000,    // 从5秒开始指数退避
    },
    timeout: 60000,   // 报告生成超时60秒
    removeOnComplete: 100,  // 保留最近100个成功任务
    removeOnFail: false,    // 失败任务保留用于调试
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

// Phase R5.3: 报告队列事件
reportQueue.on('completed', (job, result) => {
  logger.info(`✅ [Report] Job ${job.id} completed:`, {
    studentId: job.data.studentId,
    trigger: job.data.trigger,
    duration: Date.now() - job.timestamp
  });
});

reportQueue.on('failed', (job, err) => {
  logger.error(`❌ [Report] Job ${job?.id} failed:`, {
    studentId: job?.data?.studentId,
    trigger: job?.data?.trigger,
    error: err.message
  });
});

reportQueue.on('stalled', (job) => {
  logger.warn(`⚠️  [Report] Job ${job.id} stalled`);
});

// ============================================================================
// 健康检查
// ============================================================================

export async function getQueuesHealth() {
  const [matchingCounts, notificationCounts, aiCounts, syncCounts, reportCounts] = await Promise.all([
    matchingQueue.getJobCounts(),
    notificationQueue.getJobCounts(),
    aiQueue.getJobCounts(),
    syncQueue.getJobCounts(),
    reportQueue.getJobCounts(),
  ]);

  return {
    matching: matchingCounts,
    notification: notificationCounts,
    ai: aiCounts,
    sync: syncCounts,
    report: reportCounts,
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
    reportQueue.close(),
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
  reportQueue,
  getQueuesHealth,
  closeQueues,
};
