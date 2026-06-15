/**
 * AI导师项目复盘定时任务
 *
 * 功能：
 * 1. 每5分钟扫描一次已完成的订单
 * 2. 对60秒前完成且未发送复盘的订单触发复盘
 */

import cron from 'node-cron';
import { pool } from '../config/database';
import mentorRetrospectiveService from '../services/mentorRetrospectiveService';
import logger from '../utils/logger';

class MentorRetrospectiveJob {
  private job: cron.ScheduledTask | null = null;

  /**
   * 启动定时任务
   */
  start(): void {
    // 每5分钟执行一次：*/5 * * * *
    this.job = cron.schedule('*/5 * * * *', async () => {
      try {
        logger.info('[MentorRetrospectiveJob] 开始扫描待复盘订单');
        const startTime = Date.now();

        await this.scanAndTriggerRetrospectives();

        const duration = Date.now() - startTime;
        logger.info(`[MentorRetrospectiveJob] 扫描完成，耗时 ${duration}ms`);
      } catch (error: any) {
        logger.error('[MentorRetrospectiveJob] 扫描失败:', error);
      }
    });

    logger.info('[MentorRetrospectiveJob] 定时任务已启动，每5分钟执行一次');
  }

  /**
   * 停止定时任务
   */
  stop(): void {
    if (this.job) {
      this.job.stop();
      logger.info('[MentorRetrospectiveJob] 定时任务已停止');
    }
  }

  /**
   * 扫描并触发复盘
   */
  private async scanAndTriggerRetrospectives(): Promise<void> {
    try {
      // 查找60秒前完成的订单，且未发送复盘
      const orders = await db.query(`
        SELECT o.id, o.student_id, p.title as project_title
        FROM orders o
        JOIN projects p ON o.project_id = p.id
        LEFT JOIN mentor_retrospectives mr ON o.id = mr.order_id
        WHERE o.status = 'completed'
          AND o.completed_at < NOW() - INTERVAL '60 seconds'
          AND o.completed_at > NOW() - INTERVAL '10 minutes'
          AND mr.id IS NULL
        ORDER BY o.completed_at ASC
        LIMIT 50
      `);

      if (orders.rows.length === 0) {
        logger.info('[MentorRetrospectiveJob] 没有待复盘订单');
        return;
      }

      logger.info(`[MentorRetrospectiveJob] 找到 ${orders.rows.length} 个待复盘订单`);

      let successCount = 0;
      let failCount = 0;

      for (const order of orders.rows) {
        try {
          await mentorRetrospectiveService.triggerRetrospective(
            order.student_id,
            order.id
          );
          successCount++;
          logger.info(`[MentorRetrospectiveJob] 复盘已触发: ${order.id} - ${order.project_title}`);
        } catch (error: any) {
          failCount++;
          logger.error(`[MentorRetrospectiveJob] 触发失败: ${order.id}`, error);
        }
      }

      logger.info(`[MentorRetrospectiveJob] 触发完成: 成功${successCount}个，失败${failCount}个`);
    } catch (error: any) {
      logger.error('[MentorRetrospectiveJob] 扫描失败:', error);
      throw error;
    }
  }

  /**
   * 手动触发一次扫描（用于测试）
   */
  async triggerManually(): Promise<void> {
    try {
      logger.info('[MentorRetrospectiveJob] 手动触发复盘扫描');
      await this.scanAndTriggerRetrospectives();
      logger.info('[MentorRetrospectiveJob] 手动扫描完成');
    } catch (error: any) {
      logger.error('[MentorRetrospectiveJob] 手动扫描失败:', error);
      throw error;
    }
  }
}

export default new MentorRetrospectiveJob();
