import { pool, QueryResult } from '../utils/db';
import logger from '../utils/logger';

export interface WithdrawalRequest {
  id: number;
  userId: number;
  amount: number;
  withdrawalMethod: 'wechat' | 'alipay';
  accountName: string;
  accountNumber: string;
  status: string;
  createdAt: Date;
}

class WithdrawalService {
  /**
   * 创建提现申请
   */
  async createWithdrawal(
    userId: number,
    amount: number,
    withdrawalMethod: 'wechat' | 'alipay',
    accountName: string,
    accountNumber: string
  ): Promise<WithdrawalRequest> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 检查最低提现金额（10元 = 1000分）
      if (amount < 1000) {
        throw new Error('提现金额不能低于10元');
      }

      // 检查可用余额
      const accountResult = await client.query(
        `SELECT available_balance FROM escrow_accounts
         WHERE user_id = $1 AND user_type = 'student'`,
        [userId]
      );

      if (accountResult.rows.length === 0) {
        throw new Error('账户不存在');
      }

      const availableBalance = accountResult.rows[0].available_balance;
      if (availableBalance < amount) {
        throw new Error(`可用余额不足，当前可提现：${(availableBalance / 100).toFixed(2)}元`);
      }

      // 创建提现申请
      const withdrawalResult = await client.query(
        `INSERT INTO withdrawal_requests
         (user_id, amount, withdrawal_method, account_name, account_number, status)
         VALUES ($1, $2, $3, $4, $5, 'pending')
         RETURNING *`,
        [userId, amount, withdrawalMethod, accountName, accountNumber]
      );

      // 冻结可用余额
      await client.query(
        `UPDATE escrow_accounts
         SET available_balance = available_balance - $1,
             frozen_balance = frozen_balance + $1
         WHERE user_id = $2 AND user_type = 'student'`,
        [amount, userId]
      );

      // 记录交易流水
      await client.query(
        `INSERT INTO transaction_logs
         (user_id, user_type, transaction_type, amount, balance_before, balance_after,
          withdrawal_id, description)
         VALUES ($1, 'student', 'withdrawal', $2, $3, $4, $5, $6)`,
        [
          userId,
          amount,
          availableBalance,
          availableBalance - amount,
          withdrawalResult.rows[0].id,
          `提现申请 ${withdrawalMethod === 'wechat' ? '微信' : '支付宝'}`,
        ]
      );

      await client.query('COMMIT');

      const row = withdrawalResult.rows[0];
      logger.info(`Withdrawal request created: ${row.id}, user: ${userId}, amount: ${amount}`);

      return {
        id: row.id,
        userId: row.user_id,
        amount: row.amount,
        withdrawalMethod: row.withdrawal_method,
        accountName: row.account_name,
        accountNumber: row.account_number,
        status: row.status,
        createdAt: row.created_at,
      };
    } catch (error: unknown) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 审核提现申请（管理员）
   */
  async reviewWithdrawal(
    withdrawalId: number,
    reviewerId: number,
    approved: boolean,
    rejectReason?: string
  ): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 获取提现申请
      const withdrawalResult = await client.query(
        'SELECT * FROM withdrawal_requests WHERE id = $1 AND status = $2',
        [withdrawalId, 'pending']
      );

      if (withdrawalResult.rows.length === 0) {
        throw new Error('提现申请不存在或已处理');
      }

      const withdrawal = withdrawalResult.rows[0];

      if (approved) {
        // 批准提现
        await client.query(
          `UPDATE withdrawal_requests
           SET status = 'approved',
               reviewed_by = $1,
               reviewed_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [reviewerId, withdrawalId]
        );

        logger.info(`Withdrawal ${withdrawalId} approved by ${reviewerId}`);
      } else {
        // 拒绝提现，退回冻结金额
        await client.query(
          `UPDATE withdrawal_requests
           SET status = 'rejected',
               reviewed_by = $1,
               reviewed_at = CURRENT_TIMESTAMP,
               reject_reason = $2
           WHERE id = $3`,
          [reviewerId, rejectReason, withdrawalId]
        );

        // 解冻金额
        await client.query(
          `UPDATE escrow_accounts
           SET available_balance = available_balance + $1,
               frozen_balance = frozen_balance - $1
           WHERE user_id = $2 AND user_type = 'student'`,
          [withdrawal.amount, withdrawal.user_id]
        );

        logger.info(`Withdrawal ${withdrawalId} rejected by ${reviewerId}`);
      }

      await client.query('COMMIT');
    } catch (error: unknown) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 完成提现（第三方支付成功后调用）
   */
  async completeWithdrawal(withdrawalId: number, paymentOrderId: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 获取提现申请
      const withdrawalResult = await client.query(
        'SELECT * FROM withdrawal_requests WHERE id = $1 AND status = $2',
        [withdrawalId, 'approved']
      );

      if (withdrawalResult.rows.length === 0) {
        throw new Error('提现申请不存在或状态不正确');
      }

      const withdrawal = withdrawalResult.rows[0];

      // 更新提现状态
      await client.query(
        `UPDATE withdrawal_requests
         SET status = 'completed',
             payment_order_id = $1,
             payment_completed_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [paymentOrderId, withdrawalId]
      );

      // 扣除冻结余额，增加累计提现
      await client.query(
        `UPDATE escrow_accounts
         SET frozen_balance = frozen_balance - $1,
             total_balance = total_balance - $1,
             total_withdrawal = total_withdrawal + $1
         WHERE user_id = $2 AND user_type = 'student'`,
        [withdrawal.amount, withdrawal.user_id]
      );

      await client.query('COMMIT');
      logger.info(`Withdrawal ${withdrawalId} completed, payment order: ${paymentOrderId}`);
    } catch (error: unknown) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 提现失败（第三方支付失败后调用）
   */
  async failWithdrawal(withdrawalId: number, reason: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 获取提现申请
      const withdrawalResult = await client.query(
        'SELECT * FROM withdrawal_requests WHERE id = $1',
        [withdrawalId]
      );

      if (withdrawalResult.rows.length === 0) {
        throw new Error('提现申请不存在');
      }

      const withdrawal = withdrawalResult.rows[0];

      // 更新提现状态
      await client.query(
        `UPDATE withdrawal_requests
         SET status = 'failed',
             reject_reason = $1
         WHERE id = $2`,
        [reason, withdrawalId]
      );

      // 解冻金额
      await client.query(
        `UPDATE escrow_accounts
         SET available_balance = available_balance + $1,
             frozen_balance = frozen_balance - $1
         WHERE user_id = $2 AND user_type = 'student'`,
        [withdrawal.amount, withdrawal.user_id]
      );

      await client.query('COMMIT');
      logger.info(`Withdrawal ${withdrawalId} failed: ${reason}`);
    } catch (error: unknown) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取用户提现记录
   */
  async getUserWithdrawals(
    userId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    const result = await pool.query(
      `SELECT id, amount, withdrawal_method, status,
              created_at, reviewed_at, payment_completed_at, reject_reason
       FROM withdrawal_requests
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows;
  }

  /**
   * 获取待审核提现列表（管理员）
   */
  async getPendingWithdrawals(limit: number = 50, offset: number = 0): Promise<any[]> {
    const result = await pool.query(
      `SELECT w.*, u.username, u.phone
       FROM withdrawal_requests w
       JOIN users u ON w.user_id = u.id
       WHERE w.status = 'pending'
       ORDER BY w.created_at ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows;
  }

  /**
   * 获取提现统计
   */
  async getWithdrawalStats(userId: number): Promise<any> {
    const result = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
         COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
         COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
         COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as total_withdrawn,
         COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as pending_amount
       FROM withdrawal_requests
       WHERE user_id = $1`,
      [userId]
    );

    return result.rows[0];
  }
}

export const withdrawalService = new WithdrawalService();
