/**
 * 支付托管和提现服务（新版）
 *
 * 基于063_escrow_withdrawal_system.sql的完整实现
 */

import { pool, QueryResult } from '../utils/db';
import logger from '../utils/logger';

// =====================================================
// 类型定义
// =====================================================

export interface EscrowAccount {
  id: string;
  user_id: string;
  user_type: string;
  balance: number;
  frozen_balance: number;
  available_balance: number;
  total_income: number;
  total_withdrawal: number;
  status: string;
  is_verified: boolean;
}

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  fee: number;
  actual_amount: number;
  withdrawal_method: string;
  withdrawal_account: string;
  account_name: string;
  status: string;
}

// =====================================================
// 托管服务类（新版）
// =====================================================

class EscrowServiceNew {
  /**
   * 获取或创建托管账户
   */
  async getOrCreateAccount(userId: string, userType: string): Promise<EscrowAccount> {
    const client = await pool.connect();
    try {
      let result = await client.query(`SELECT * FROM escrow_accounts WHERE user_id = $1`, [userId]);
      if (result.rows.length > 0) return result.rows[0];

      const accountId = await client.query(`SELECT create_escrow_account($1, $2) as id`, [userId, userType]);
      result = await client.query(`SELECT * FROM escrow_accounts WHERE id = $1`, [accountId.rows[0].id]);

      logger.info('Escrow account created', { userId });
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * 托管资金
   */
  async depositFunds(taskId: string, payerId: string, payeeId: string, amount: number): Promise<any> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const platformFee = amount * 0.05;
      const actualAmount = amount - platformFee;

      const transactionResult = await client.query(
        `INSERT INTO escrow_transactions (task_id, payer_id, payee_id, amount, platform_fee, actual_amount, transaction_type, status, description)
         VALUES ($1, $2, $3, $4, $5, $6, 'deposit', 'completed', '任务托管') RETURNING *`,
        [taskId, payerId, payeeId, amount, platformFee, actualAmount]
      );

      const payerAccount = await this.getOrCreateAccount(payerId, 'company');
      await client.query(`SELECT freeze_funds($1, $2, $3)`, [payerAccount.id, amount, `任务托管：${taskId}`]);
      await client.query(`UPDATE tasks SET escrow_status = 'deposited', escrow_amount = $1 WHERE id = $2`, [amount, taskId]);

      await client.query('COMMIT');
      logger.info('Funds deposited', { taskId, amount });
      return transactionResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 释放资金
   */
  async releaseFunds(taskId: string): Promise<any> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const taskResult = await client.query(`SELECT * FROM tasks WHERE id = $1`, [taskId]);
      if (taskResult.rows.length === 0) throw new Error('Task not found');

      const task = taskResult.rows[0];
      const payerAccount = await this.getOrCreateAccount(task.company_id, 'company');
      const payeeAccount = await this.getOrCreateAccount(task.accepted_student_id, 'student');

      await client.query(`SELECT transfer_funds($1, $2, $3, $4)`,
        [payerAccount.id, payeeAccount.id, task.escrow_amount, `任务完成：${taskId}`]);

      await client.query(`UPDATE tasks SET escrow_status = 'released' WHERE id = $1`, [taskId]);
      await client.query('COMMIT');

      logger.info('Funds released', { taskId });
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 申请提现
   */
  async requestWithdrawal(userId: string, amount: number, method: string, account: string, name: string): Promise<WithdrawalRequest> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const accountData = await client.query(`SELECT * FROM escrow_accounts WHERE user_id = $1`, [userId]);
      if (accountData.rows.length === 0) throw new Error('Account not found');
      if (accountData.rows[0].available_balance < amount) throw new Error('Insufficient balance');

      const fee = amount * 0.01;
      const actualAmount = amount - fee;

      const result = await client.query(
        `INSERT INTO withdrawal_requests (user_id, account_id, amount, fee, actual_amount, withdrawal_method, withdrawal_account, account_name, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending') RETURNING *`,
        [userId, accountData.rows[0].id, amount, fee, actualAmount, method, account, name]
      );

      await client.query(`SELECT freeze_funds($1, $2, $3)`, [accountData.rows[0].id, amount, `提现申请`]);
      await client.query('COMMIT');

      logger.info('Withdrawal requested', { userId, amount });
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取账户信息
   */
  async getAccount(userId: string): Promise<EscrowAccount | null> {
    const client = await pool.connect();
    try {
      const result = await client.query(`SELECT * FROM escrow_accounts WHERE user_id = $1`, [userId]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  /**
   * 获取账户流水
   */
  async getTransactions(userId: string, limit = 20, offset = 0): Promise<any> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM account_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );
      return { transactions: result.rows, total: result.rows.length };
    } finally {
      client.release();
    }
  }

  /**
   * 获取提现记录
   */
  async getWithdrawals(userId: string, limit = 20, offset = 0): Promise<any> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM withdrawal_requests WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );
      return { withdrawals: result.rows, total: result.rows.length };
    } finally {
      client.release();
    }
  }
}

export const escrowServiceNew = new EscrowServiceNew();

// 保持旧的escrowService导出以兼容现有代码
export { escrowServiceNew as escrowService };
