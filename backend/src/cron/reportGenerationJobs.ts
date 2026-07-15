/**
 * Phase R5.3: 定期报告生成任务
 * 每周和每月自动生成报告
 */

import { Pool } from 'pg';
import logger from '../utils/logger';
import reportTriggerService from '../services/reportTriggerService';

/**
 * 每周报告生成任务
 * 每周一早上8点执行
 */
export class WeeklyReportJob {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * 获取Cron表达式
   * 每周一 8:00 AM
   */
  static getCronSchedule(): string {
    return '0 8 * * 1';  // 每周一早上8点
  }

  /**
   * 执行任务
   */
  async execute(): Promise<void> {
    const startTime = Date.now();

    try {
      logger.info('[每周报告] 开始执行每周报告生成任务');

      // 调用报告触发服务
      await reportTriggerService.generateWeeklyReports();

      const duration = Date.now() - startTime;
      logger.info(`[每周报告] 任务执行完成，耗时: ${duration}ms`);

    } catch (error: any) {
      logger.error('[每周报告] 任务执行失败:', error);
      throw error;
    }
  }
}

/**
 * 每月报告生成任务
 * 每月1号早上8点执行
 */
export class MonthlyReportJob {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * 获取Cron表达式
   * 每月1号 8:00 AM
   */
  static getCronSchedule(): string {
    return '0 8 1 * *';  // 每月1号早上8点
  }

  /**
   * 执行任务
   */
  async execute(): Promise<void> {
    const startTime = Date.now();

    try {
      logger.info('[每月报告] 开始执行每月报告生成任务');

      // 调用报告触发服务
      await reportTriggerService.generateMonthlyReports();

      const duration = Date.now() - startTime;
      logger.info(`[每月报告] 任务执行完成，耗时: ${duration}ms`);

    } catch (error: any) {
      logger.error('[每月报告] 任务执行失败:', error);
      throw error;
    }
  }
}
