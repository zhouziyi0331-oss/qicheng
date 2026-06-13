import { Pool } from 'pg';
import logger from '../utils/logger';

/**
 * 申请超时取消任务
 * 学生申请接单后，企业24小时内未确认，系统自动取消申请
 * 保护学生权益，避免申请被长时间占用
 */
export class ApplicationTimeoutJob {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * 执行申请超时取消
   */
  async execute(): Promise<void> {
    const client = await this.pool.connect();

    try {
      logger.info('开始执行申请超时取消任务');

      // 查找所有超过24小时未确认的申请
      const query = `
        SELECT
          o.id as order_id,
          o.task_id,
          o.student_id,
          t.company_id,
          t.title as task_title,
          o.created_at as applied_at,
          NOW() - o.created_at as elapsed_time
        FROM orders o
        INNER JOIN tasks t ON o.task_id = t.id
        WHERE o.status = 'pending'
          AND o.created_at < NOW() - INTERVAL '24 hours'
        ORDER BY o.created_at ASC
      `;

      const result = await client.query(query);
      const timeoutApplications = result.rows;

      logger.info(`找到${timeoutApplications.length}个超时未确认的申请`);

      if (timeoutApplications.length === 0) {
        return;
      }

      // 逐个处理
      for (const application of timeoutApplications) {
        try {
          await client.query('BEGIN');

          // 1. 删除申请记录（或标记为取消）
          await client.query(
            `DELETE FROM orders WHERE id = $1`,
            [application.order_id]
          );

          // 2. 记录超时取消
          await client.query(
            `INSERT INTO application_timeouts (order_id, task_id, student_id, company_id, reason, executed_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [
              application.order_id,
              application.task_id,
              application.student_id,
              application.company_id,
              '企业24小时内未确认申请，系统自动取消'
            ]
          );

          // 3. 通知学生
          await client.query(
            `INSERT INTO notifications (user_id, type, title, content, created_at)
             VALUES ($1, $2, $3, $4, NOW())`,
            [
              application.student_id,
              'application_timeout',
              '申请已自动取消',
              `您对任务「${application.task_title}」的申请超过24小时未确认，系统已自动取消。您可以申请其他任务。`
            ]
          );

          // 4. 通知企业（提醒及时处理）
          await client.query(
            `INSERT INTO notifications (user_id, type, title, content, created_at)
             VALUES ($1, $2, $3, $4, NOW())`,
            [
              application.company_id,
              'application_timeout',
              '学生申请已超时取消',
              `任务「${application.task_title}」有学生申请超过24小时未处理，系统已自动取消。请及时确认接单申请。`
            ]
          );

          await client.query('COMMIT');

          logger.info(`✅ 取消超时申请: ${application.order_id}, 任务: ${application.task_title}`);

        } catch (error: any) {
          await client.query('ROLLBACK');
          logger.error(`❌ 取消超时申请 ${application.order_id} 失败:`, error);
        }
      }

      logger.info(`申请超时取消任务完成，处理了${timeoutApplications.length}个申请`);

    } catch (error: any) {
      logger.error('执行申请超时取消任务失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取Cron调度表达式
   * 每2小时执行一次
   */
  static getCronSchedule(): string {
    return '0 */2 * * *'; // 每2小时执行
  }
}
