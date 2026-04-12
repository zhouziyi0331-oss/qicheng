import { Pool } from 'pg';
import { logger } from '../utils/logger';

/**
 * 7天自动确认定时任务
 * 每天凌晨2点执行，检查所有支付尾款超过7天但未最终确认的任务
 * 自动确认任务完成，释放尾款给学生
 */
export class AutoConfirmationJob {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * 执行自动确认任务
   */
  async execute(): Promise<void> {
    const client = await this.pool.connect();

    try {
      logger.info('开始执行7天自动确认任务');

      // 查找所有需要自动确认的任务
      // 条件：状态为completed，尾款已支付，距离尾款支付时间超过7天，且未最终确认
      const query = `
        SELECT
          t.id as task_id,
          t.title,
          t.company_id,
          t.student_id,
          t.budget_gross as price,
          p.paid_at as final_payment_at
        FROM tasks t
        INNER JOIN payments p ON t.id = p.task_id
        WHERE t.status = 'completed'
          AND p.payment_type = 'final'
          AND p.status = 'completed'
          AND p.paid_at < NOW() - INTERVAL '7 days'
          AND NOT EXISTS (
            SELECT 1 FROM auto_confirmations ac
            WHERE ac.task_id = t.id
          )
      `;

      const result = await client.query(query);
      const tasksToConfirm = result.rows;

      logger.info(`找到${tasksToConfirm.length}个需要自动确认的任务`);

      if (tasksToConfirm.length === 0) {
        return;
      }

      // 开始事务
      await client.query('BEGIN');

      for (const task of tasksToConfirm) {
        try {
          await this.confirmTask(client, task);
          logger.info(`任务 ${task.task_id} 自动确认成功`);
        } catch (err) {
          logger.error(`任务 ${task.task_id} 自动确认失败:`, err);
          // 继续处理其他任务
        }
      }

      // 提交事务
      await client.query('COMMIT');

      logger.info(`7天自动确认任务执行完成，成功确认${tasksToConfirm.length}个任务`);

    } catch (err) {
      await client.query('ROLLBACK');
      logger.error('7天自动确认任务执行失败:', err);
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * 确认单个任务
   */
  private async confirmTask(client: any, task: any): Promise<void> {
    const { task_id, title, company_id, student_id, price, final_payment_at } = task;

    // 1. 更新任务状态为已完成
    await client.query(
      `UPDATE tasks
       SET status = 'confirmed',
           confirmed_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [task_id]
    );

    // 2. 记录自动确认
    await client.query(
      `INSERT INTO auto_confirmations (
        task_id,
        confirmed_at,
        reason,
        created_at
      ) VALUES ($1, NOW(), $2, NOW())`,
      [task_id, '7天自动确认']
    );

    // 3. 更新学生收入（85%的价格）
    const studentIncome = price * 0.85;
    await client.query(
      `UPDATE users
       SET balance = balance + $1,
           updated_at = NOW()
       WHERE id = $2`,
      [studentIncome, student_id]
    );

    // 4. 更新平台收入（15%的价格）
    const platformIncome = price * 0.15;
    await client.query(
      `INSERT INTO platform_income (
        task_id,
        amount,
        income_type,
        created_at
      ) VALUES ($1, $2, 'commission', NOW())`,
      [task_id, platformIncome]
    );

    // 5. 创建通知给企业
    await client.query(
      `INSERT INTO notifications (
        user_id,
        type,
        title,
        content,
        related_task_id,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        company_id,
        'task_auto_confirmed',
        '任务已自动确认',
        `您的任务《${title}》已超过7天确认期，系统已自动确认完成。`,
        task_id
      ]
    );

    // 6. 创建通知给学生
    await client.query(
      `INSERT INTO notifications (
        user_id,
        type,
        title,
        content,
        related_task_id,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        student_id,
        'payment_received',
        '收到任务报酬',
        `恭喜！任务《${title}》已自动确认完成，报酬¥${studentIncome.toFixed(2)}已到账。`,
        task_id
      ]
    );

    // 7. 检查是否需要交换微信（连续合作2次）
    const collaborationResult = await client.query(
      `SELECT COUNT(*) as count
       FROM tasks
       WHERE company_id = $1
         AND student_id = $2
         AND status = 'confirmed'`,
      [company_id, student_id]
    );

    const collaborationCount = parseInt(collaborationResult.rows[0].count);

    if (collaborationCount >= 2) {
      // 检查是否已经交换过微信
      const exchangeResult = await client.query(
        `SELECT id FROM wechat_exchanges
         WHERE company_id = $1 AND student_id = $2`,
        [company_id, student_id]
      );

      if (exchangeResult.rows.length === 0) {
        // 记录微信交换
        await client.query(
          `INSERT INTO wechat_exchanges (
            company_id,
            student_id,
            exchanged_at,
            reason,
            created_at
          ) VALUES ($1, $2, NOW(), $3, NOW())`,
          [company_id, student_id, '连续合作2次自动交换']
        );

        // 通知双方
        await client.query(
          `INSERT INTO notifications (
            user_id,
            type,
            title,
            content,
            created_at
          ) VALUES
            ($1, 'wechat_exchange', '可以交换微信了', '您与该学生已合作2次，现在可以交换微信直接沟通了！', NOW()),
            ($2, 'wechat_exchange', '可以交换微信了', '您与该企业已合作2次，现在可以交换微信直接沟通了！', NOW())`,
          [company_id, student_id]
        );
      }
    }
  }

  /**
   * 获取定时任务配置
   * Cron表达式: 0 2 * * * (每天凌晨2点执行)
   */
  static getCronSchedule(): string {
    return '0 2 * * *';
  }
}
