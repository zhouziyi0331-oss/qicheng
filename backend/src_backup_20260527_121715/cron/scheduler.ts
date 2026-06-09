import cron from 'node-cron';
import { Pool } from 'pg';
import { AutoConfirmationJob } from './autoConfirmationJob';
import logger from '../utils/logger';

/**
 * 定时任务调度器
 * 管理所有定时任务的启动和停止
 */
export class CronScheduler {
  private pool: Pool;
  private tasks: cron.ScheduledTask[] = [];

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * 启动所有定时任务
   */
  start(): void {
    logger.info('启动定时任务调度器');

    // 启动7天自动确认任务
    this.startAutoConfirmationJob();

    logger.info(`已启动${this.tasks.length}个定时任务`);
  }

  /**
   * 停止所有定时任务
   */
  stop(): void {
    logger.info('停止定时任务调度器');

    this.tasks.forEach(task => {
      task.stop();
    });

    this.tasks = [];
    logger.info('所有定时任务已停止');
  }

  /**
   * 启动7天自动确认任务
   */
  private startAutoConfirmationJob(): void {
    const job = new AutoConfirmationJob(this.pool);
    const schedule = AutoConfirmationJob.getCronSchedule();

    logger.info(`注册7天自动确认任务，执行时间: ${schedule}`);

    const task = cron.schedule(schedule, async () => {
      try {
        logger.info('开始执行7天自动确认任务');
        await job.execute();
        logger.info('7天自动确认任务执行完成');
      } catch (err) {
        logger.error('7天自动确认任务执行失败:', err);
      }
    }, {
      timezone: 'Asia/Shanghai'
    });

    this.tasks.push(task);

    // 开发环境下，可以立即执行一次用于测试
    if (process.env.NODE_ENV === 'development') {
      logger.info('开发环境：立即执行一次7天自动确认任务（测试）');
      job.execute().catch(err => {
        logger.error('测试执行失败:', err);
      });
    }
  }

  /**
   * 手动触发7天自动确认任务（用于测试）
   */
  async triggerAutoConfirmation(): Promise<void> {
    logger.info('手动触发7天自动确认任务');
    const job = new AutoConfirmationJob(this.pool);
    await job.execute();
  }
}
