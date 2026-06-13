import { Pool } from 'pg';
import logger from '../utils/logger';

/**
 * 任务过期处理定时任务
 *
 * 处理两种情况：
 * 1. 截止时间已过但学生未提交 → 自动取消，退款给企业
 * 2. 发布7天无人接单 → 自动下架，通知企业调整
 */
export class TaskExpirationJob {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * 执行任务过期处理
   */
  async execute(): Promise<void> {
    const client = await this.pool.connect();

    try {
      logger.info('开始执行任务过期处理');

      // 处理场景1：截止时间已过但未提交的任务
      await this.handleExpiredDeadlineTasks(client);

      // 处理场景2：7天无人接单的任务
      await this.handleUnstaffedTasks(client);

      logger.info('任务过期处理完成');

    } catch (error: any) {
      logger.error('执行任务过期处理失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 处理截止时间已过的任务
   */
  private async handleExpiredDeadlineTasks(client: any): Promise<void> {
    // 查找已过截止时间但未完成的任务
    const query = `
      SELECT
        t.id as task_id,
        t.title,
        t.company_id,
        t.accepted_student_id as student_id,
        t.deadline,
        t.status,
        o.id as order_id
      FROM tasks t
      LEFT JOIN orders o ON t.id = o.task_id AND o.status IN ('accepted', 'in_progress')
      WHERE t.status IN ('accepted', 'in_progress')
        AND t.deadline < NOW()
        AND t.deadline IS NOT NULL
      ORDER BY t.deadline ASC
    `;

    const result = await client.query(query);
    const expiredTasks = result.rows;

    logger.info(`找到${expiredTasks.length}个已过期的任务`);

    for (const task of expiredTasks) {
      try {
        await client.query('BEGIN');

        // 1. 更新任务状态为cancelled
        await client.query(
          `UPDATE tasks SET status = 'cancelled', cancelled_at = NOW(),
           cancellation_reason = '截止时间已过，学生未提交'
           WHERE id = $1`,
          [task.task_id]
        );

        // 2. 更新订单状态为cancelled
        if (task.order_id) {
          await client.query(
            `UPDATE orders SET status = 'cancelled', cancelled_at = NOW() WHERE id = $1`,
            [task.order_id]
          );
        }

        // 3. 记录过期原因
        await client.query(
          `INSERT INTO task_expirations (task_id, student_id, company_id, expiration_type, reason, executed_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            task.task_id,
            task.student_id,
            task.company_id,
            'deadline_exceeded',
            `任务截止时间${task.deadline}已过，学生未提交，自动取消`
          ]
        );

        // 4. 通知学生
        if (task.student_id) {
          await client.query(
            `INSERT INTO notifications (user_id, type, title, content, created_at)
             VALUES ($1, $2, $3, $4, NOW())`,
            [
              task.student_id,
              'task_expired',
              '任务已过期',
              `任务「${task.title}」已超过截止时间，系统已自动取消。请注意按时完成任务。`
            ]
          );
        }

        // 5. 通知企业
        await client.query(
          `INSERT INTO notifications (user_id, type, title, content, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [
            task.company_id,
            'task_expired',
            '任务已自动取消',
            `任务「${task.title}」已超过截止时间未提交，系统已自动取消。您可以重新发布任务。`
          ]
        );

        await client.query('COMMIT');

        logger.info(`✅ 处理过期任务: ${task.task_id}, ${task.title}`);

      } catch (error: any) {
        await client.query('ROLLBACK');
        logger.error(`❌ 处理过期任务 ${task.task_id} 失败:`, error);
      }
    }
  }

  /**
   * 处理7天无人接单的任务
   */
  private async handleUnstaffedTasks(client: any): Promise<void> {
    // 查找发布超过7天但无人接单的任务
    const query = `
      SELECT
        id as task_id,
        title,
        company_id,
        created_at,
        NOW() - created_at as elapsed_time
      FROM tasks
      WHERE status = 'pending'
        AND created_at < NOW() - INTERVAL '7 days'
        AND slots_taken = 0
      ORDER BY created_at ASC
    `;

    const result = await client.query(query);
    const unstaffedTasks = result.rows;

    logger.info(`找到${unstaffedTasks.length}个7天无人接单的任务`);

    for (const task of unstaffedTasks) {
      try {
        await client.query('BEGIN');

        // 1. 更新任务状态为下架
        await client.query(
          `UPDATE tasks SET status = 'inactive',
           cancellation_reason = '发布7天无人接单，自动下架'
           WHERE id = $1`,
          [task.task_id]
        );

        // 2. 记录下架原因
        await client.query(
          `INSERT INTO task_expirations (task_id, company_id, expiration_type, reason, executed_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [
            task.task_id,
            task.company_id,
            'no_applicants',
            `发布超过7天无人接单，自动下架`
          ]
        );

        // 3. 通知企业并提供建议
        await client.query(
          `INSERT INTO notifications (user_id, type, title, content, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [
            task.company_id,
            'task_unstaffed',
            '任务已自动下架',
            `任务「${task.title}」发布7天无人接单，已自动下架。建议：1) 调整预算 2) 降低难度要求 3) 优化任务描述。您可以修改后重新发布。`
          ]
        );

        await client.query('COMMIT');

        logger.info(`✅ 下架无人接单任务: ${task.task_id}, ${task.title}`);

      } catch (error: any) {
        await client.query('ROLLBACK');
        logger.error(`❌ 处理无人接单任务 ${task.task_id} 失败:`, error);
      }
    }
  }

  /**
   * 获取Cron调度表达式
   * 每30分钟执行一次
   */
  static getCronSchedule(): string {
    return '*/30 * * * *'; // 每30分钟执行
  }
}
