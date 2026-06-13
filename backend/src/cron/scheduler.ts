import cron from 'node-cron';
import { Pool } from 'pg';
import { AutoConfirmationJob } from './autoConfirmationJob';
import { AutoAcceptanceJob } from './autoAcceptanceJob';
import { TaskExpirationJob } from './taskExpirationJob';
import { ApplicationTimeoutJob } from './applicationTimeoutJob';
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

    // 启动48小时自动确认任务
    this.startAutoAcceptanceJob();

    // 启动任务过期处理任务
    this.startTaskExpirationJob();

    // 启动申请超时取消任务
    this.startApplicationTimeoutJob();

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
   * 启动48小时自动确认任务
   */
  private startAutoAcceptanceJob(): void {
    const job = new AutoAcceptanceJob(this.pool);
    const schedule = AutoAcceptanceJob.getCronSchedule();

    const task = cron.schedule(schedule, async () => {
      try {
        await job.execute();
      } catch (error: any) {
        logger.error('48小时自动确认任务执行失败:', error);
      }
    });

    this.tasks.push(task);
    logger.info(`已启动48小时自动确认任务，调度时间: ${schedule}`);
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
   * 启动任务过期处理任务
   */
  private startTaskExpirationJob(): void {
    const job = new TaskExpirationJob(this.pool);
    const schedule = TaskExpirationJob.getCronSchedule();

    const task = cron.schedule(schedule, async () => {
      try {
        await job.execute();
      } catch (error: any) {
        logger.error('任务过期处理执行失败:', error);
      }
    });

    this.tasks.push(task);
    logger.info(`已启动任务过期处理任务，调度时间: ${schedule}`);
  }

  /**
   * 启动申请超时取消任务
   */
  private startApplicationTimeoutJob(): void {
    const job = new ApplicationTimeoutJob(this.pool);
    const schedule = ApplicationTimeoutJob.getCronSchedule();

    const task = cron.schedule(schedule, async () => {
      try {
        await job.execute();
      } catch (error: any) {
        logger.error('申请超时取消任务执行失败:', error);
      }
    });

    this.tasks.push(task);
    logger.info(`已启动申请超时取消任务，调度时间: ${schedule}`);
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
