import cron from 'node-cron';
import pool from '../config/database';
import { mentorAutoTriggerService } from './mentorAutoTriggerService';
import logger from '../utils/logger';

/**
 * AI导师自动触发定时任务服务
 *
 * 功能：
 * 1. 每30秒检查一次待触发的记录
 * 2. 执行到期的触发任务
 * 3. 更新触发状态
 */
class MentorTriggerCronService {
  private cronJob: cron.ScheduledTask | null = null;
  private isProcessing = false;

  /**
   * 启动定时任务
   */
  start() {
    if (this.cronJob) {
      logger.warn('Mentor trigger cron job already running');
      return;
    }

    // 每30秒执行一次
    this.cronJob = cron.schedule('*/30 * * * * *', async () => {
      await this.processPendingTriggers();
    });

    logger.info('Mentor trigger cron job started (every 30 seconds)');
  }

  /**
   * 停止定时任务
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info('Mentor trigger cron job stopped');
    }
  }

  /**
   * 处理待触发的记录
   */
  private async processPendingTriggers() {
    // 防止并发执行
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      // 查询所有到期的待触发记录
      const result = await pool.query(
        `SELECT id, order_id, trigger_type
         FROM mentor_trigger_logs
         WHERE status = 'pending'
           AND scheduled_at <= NOW()
         ORDER BY scheduled_at ASC
         LIMIT 10`
      );

      const triggers = result.rows;

      if (triggers.length === 0) {
        return;
      }

      logger.info(`Processing ${triggers.length} pending mentor triggers`);

      // 逐个处理触发任务
      for (const trigger of triggers) {
        await this.executeTrigger(trigger);
      }
    } catch (error: any) {
      logger.error('Error processing pending triggers:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 执行单个触发任务
   */
  private async executeTrigger(trigger: {
    id: string;
    order_id: string;
    trigger_type: string;
  }) {
    const { id, order_id, trigger_type } = trigger;

    try {
      logger.info(`Executing ${trigger_type} for order ${order_id}`);

      let messageId: string | null = null;

      // 根据触发类型调用对应的服务方法
      switch (trigger_type) {
        case 'T-01':
          messageId = await mentorAutoTriggerService.triggerT01(order_id);
          break;
        case 'T-03':
          messageId = await mentorAutoTriggerService.triggerT03(order_id);
          break;
        case 'T-05':
          messageId = await mentorAutoTriggerService.triggerT05(order_id);
          break;
        default:
          throw new Error(`Unknown trigger type: ${trigger_type}`);
      }

      // 更新触发记录为成功
      await pool.query(
        `UPDATE mentor_trigger_logs
         SET status = 'triggered',
             triggered_at = NOW(),
             message_id = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [messageId, id]
      );

      logger.info(`Successfully executed ${trigger_type} for order ${order_id}, message_id: ${messageId}`);
    } catch (error: any) {
      logger.error(`Failed to execute ${trigger_type} for order ${order_id}:`, error);

      // 更新触发记录为失败
      await pool.query(
        `UPDATE mentor_trigger_logs
         SET status = 'failed',
             error_message = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [error.message || 'Unknown error', id]
      );
    }
  }

  /**
   * 手动触发处理（用于测试或立即执行）
   */
  async processNow() {
    logger.info('Manual trigger processing requested');
    await this.processPendingTriggers();
  }

  /**
   * 获取待处理的触发任务数量
   */
  async getPendingCount(): Promise<number> {
    const result = await pool.query(
      `SELECT COUNT(*) as count
       FROM mentor_trigger_logs
       WHERE status = 'pending'
         AND scheduled_at <= NOW()`
    );
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * 获取触发统计信息
   */
  async getStats() {
    const result = await pool.query(
      `SELECT
         trigger_type,
         status,
         COUNT(*) as count
       FROM mentor_trigger_logs
       WHERE created_at >= NOW() - INTERVAL '24 hours'
       GROUP BY trigger_type, status
       ORDER BY trigger_type, status`
    );

    return result.rows;
  }
}

export const mentorTriggerCronService = new MentorTriggerCronService();
