/**
 * AI导师预警定时任务
 *
 * 功能：
 * 1. 每15分钟扫描一次风险条件
 * 2. 触发主动预警消息
 * 3. 记录扫描日志
 */

import cron from 'node-cron';
import mentorAlertService from '../services/mentorAlertService';
import logger from '../utils/logger';

class MentorAlertJob {
  private job: cron.ScheduledTask | null = null;

  /**
   * 启动定时任务
   */
  start(): void {
    // 每15分钟执行一次：*/15 * * * *
    this.job = cron.schedule('*/15 * * * *', async () => {
      try {
        logger.info('[MentorAlertJob] 开始执行预警扫描');
        const startTime = Date.now();

        await mentorAlertService.scanAndTriggerAlerts();

        const duration = Date.now() - startTime;
        logger.info(`[MentorAlertJob] 预警扫描完成，耗时 ${duration}ms`);
      } catch (error) {
        logger.error('[MentorAlertJob] 预警扫描失败:', error);
      }
    });

    logger.info('[MentorAlertJob] 定时任务已启动，每15分钟执行一次');
  }

  /**
   * 停止定时任务
   */
  stop(): void {
    if (this.job) {
      this.job.stop();
      logger.info('[MentorAlertJob] 定时任务已停止');
    }
  }

  /**
   * 手动触发一次扫描（用于测试）
   */
  async triggerManually(): Promise<void> {
    try {
      logger.info('[MentorAlertJob] 手动触发预警扫描');
      await mentorAlertService.scanAndTriggerAlerts();
      logger.info('[MentorAlertJob] 手动扫描完成');
    } catch (error) {
      logger.error('[MentorAlertJob] 手动扫描失败:', error);
      throw error;
    }
  }
}

export default new MentorAlertJob();
