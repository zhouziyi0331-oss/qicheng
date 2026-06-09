/**
 * AI任务队列Worker进程
 * 专门处理AI相关的异步任务
 */

import './services/aiTaskQueue';
import logger from './utils/logger';
import { config } from '../config';

logger.info('🤖 AI Task Worker started', {
  env: config.env,
  redis: config.redis.url
});

// 优雅关闭
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down worker...');

  const aiTaskQueue = require('./services/aiTaskQueue').default;
  await aiTaskQueue.close();

  logger.info('Worker shut down gracefully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down worker...');

  const aiTaskQueue = require('./services/aiTaskQueue').default;
  await aiTaskQueue.close();

  logger.info('Worker shut down gracefully');
  process.exit(0);
});

// 未捕获的异常
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception in worker:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection in worker:', { reason, promise });
  process.exit(1);
});

// 保持进程运行
logger.info('Worker is ready to process AI tasks');
