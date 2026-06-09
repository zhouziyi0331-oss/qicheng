// AI导师系统 - Cron定时任务

import cron from 'node-cron';
import { checkIdleStudents } from '../routes/mentor/controller';

// 每小时检查一次长时间无操作的学生
export function startMentorNudgeCron() {
  if (process.env.NODE_ENV === 'test') {
    console.log('[Mentor Cron] Skipped in test environment');
    return;
  }

  // 每小时的第5分钟执行（避开整点高峰）
  cron.schedule('5 * * * *', async () => {
    console.log('[Mentor Cron] Checking idle students...');
    try {
      await checkIdleStudents();
      console.log('[Mentor Cron] Idle check completed');
    } catch (error) {
      console.error('[Mentor Cron] Error:', error);
    }
  });

  console.log('[Mentor Cron] Started - runs every hour at :05');
}
