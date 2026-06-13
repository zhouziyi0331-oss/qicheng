// AI导师系统 - Cron定时任务

import cron from 'node-cron';
import logger from '../utils/logger';
import { checkIdleStudents } from '../routes/mentor/controller';

// 每小时检查一次长时间无操作的学生
export function startMentorNudgeCron() {
  if (process.env.NODE_ENV === 'test') {
    logger.info('[Mentor Cron] Skipped in test environment');
    return;
  }

  // 每小时的第5分钟执行（避开整点高峰）
  cron.schedule('5 * * * *', async () => {
    logger.info('[Mentor Cron] Checking idle students...');
    try {
      await checkIdleStudents();
      logger.info('[Mentor Cron] Idle check completed');
    } catch (error: unknown) {
      logger.error('[Mentor Cron] Error:', error);
    }
  });

  logger.info('[Mentor Cron] Started - runs every hour at :05');
}
