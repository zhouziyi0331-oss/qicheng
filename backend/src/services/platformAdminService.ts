/**
 * 平台管理增强服务
 *
 * 提供提现审核、评价管理、用户认证、任务审核等核心管理功能
 */

import { pool } from '../utils/db';
import logger from '../utils/logger';

// =====================================================
// 类型定义
// =====================================================

export interface WithdrawalReview {
  id: string;
  withdrawal_id: string;
  reviewer_id: string;
  review_action: string;
  review_reason?: string;
  risk_level?: string;
  risk_factors?: any;
  reviewed_at: Date;
}

export interface UserVerification {
  id: string;
  user_id: string;
  verification_type: string;
  submitted_data: any;
  status: string;
  review_note?: string;
}

export interface TaskReview {
  id: string;
  task_id: string;
  reviewer_id: string;
  review_type: string;
  status: string;
  issues?: any;
  review_note?: string;
}

export interface RiskAlert {
  id: string;
  alert_type: string;
  severity: string;
  entity_type: string;
  entity_id: string;
  alert_reason: string;
  status: string;
}

export interface PlatformMetrics {
  metric_date: Date;
  total_users: number;
  new_users: number;
  active_users: number;
  total_tasks: number;
  completed_tasks: number;
  total_gmv: number;
  platform_revenue: number;
  avg_rating: number;
}

// =====================================================
// 平台管理增强服务类
// =====================================================

class PlatformAdminService {
  /**
   * 提现审核 - 批准
   */
  async approveWithdrawal(
    withdrawalId: string,
    reviewerId: string,
    reason?: string
  ): Promise<any> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 更新提现状态
      await client.query(
        `UPDATE withdrawal_requests SET status = 'approved', reviewed_by = $1, reviewed_at = NOW(), review_note = $2 WHERE id = $3`,
        [reviewerId, reason, withdrawalId]
      );

      // 记录审核
      const reviewResult = await client.query(
        `INSERT INTO admin_withdrawal_reviews (withdrawal_id, reviewer_id, review_action, review_reason, risk_level)
         VALUES ($1, $2, 'approved', $3, 'low') RETURNING *`,
        [withdrawalId, reviewerId, reason]
      );

      await client.query('COMMIT');
      logger.info('Withdrawal approved', { withdrawalId, reviewerId });
      return reviewResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 提现审核 - 拒绝
   */
  async rejectWithdrawal(
    withdrawalId: string,
    reviewerId: string,
    reason: string,
    riskLevel: string = 'medium'
  ): Promise<any> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 更新提现状态
      await client.query(
        `UPDATE withdrawal_requests SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW(), reject_reason = $2 WHERE id = $3`,
        [reviewerId, reason, withdrawalId]
      );

      // 解冻资金
      const withdrawal = await client.query(
        `SELECT account_id, amount FROM withdrawal_requests WHERE id = $1`,
        [withdrawalId]
      );

      if (withdrawal.rows.length > 0) {
        await client.query(
          `SELECT unfreeze_funds($1, $2, $3)`,
          [withdrawal.rows[0].account_id, withdrawal.rows[0].amount, `提现被拒绝：${reason}`]
        );
      }

      // 记录审核
      const reviewResult = await client.query(
        `INSERT INTO admin_withdrawal_reviews (withdrawal_id, reviewer_id, review_action, review_reason, risk_level)
         VALUES ($1, $2, 'rejected', $3, $4) RETURNING *`,
        [withdrawalId, reviewerId, reason, riskLevel]
      );

      await client.query('COMMIT');
      logger.info('Withdrawal rejected', { withdrawalId, reviewerId, reason });
      return reviewResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取待审核提现列表
   */
  async getPendingWithdrawals(limit: number = 20, offset: number = 0): Promise<any> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT
          wr.*,
          u.username,
          u.email,
          ea.balance,
          ea.available_balance
         FROM withdrawal_requests wr
         JOIN users u ON wr.user_id = u.id
         JOIN escrow_accounts ea ON wr.account_id = ea.id
         WHERE wr.status = 'pending'
         ORDER BY wr.created_at ASC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      const countResult = await client.query(
        `SELECT COUNT(*) FROM withdrawal_requests WHERE status = 'pending'`
      );

      return {
        withdrawals: result.rows,
        total: parseInt(countResult.rows[0].count),
      };
    } finally {
      client.release();
    }
  }

  /**
   * 用户认证审核 - 批准
   */
  async approveUserVerification(
    verificationId: string,
    reviewerId: string,
    note?: string
  ): Promise<any> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `UPDATE admin_user_verifications
         SET status = 'approved', reviewer_id = $1, review_note = $2, reviewed_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [reviewerId, note, verificationId]
      );

      if (result.rows.length > 0) {
        const verification = result.rows[0];
        // 更新用户认证状态
        await client.query(
          `UPDATE users SET is_verified = true WHERE id = $1`,
          [verification.user_id]
        );

        // 如果是托管账户认证，更新托管账户
        if (verification.verification_type === 'bank_account') {
          await client.query(
            `UPDATE escrow_accounts SET is_verified = true WHERE user_id = $1`,
            [verification.user_id]
          );
        }
      }

      await client.query('COMMIT');
      logger.info('User verification approved', { verificationId, reviewerId });
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 用户认证审核 - 拒绝
   */
  async rejectUserVerification(
    verificationId: string,
    reviewerId: string,
    reason: string
  ): Promise<any> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE admin_user_verifications
         SET status = 'rejected', reviewer_id = $1, review_note = $2, reviewed_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [reviewerId, reason, verificationId]
      );

      logger.info('User verification rejected', { verificationId, reviewerId });
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * 获取待审核用户认证列表
   */
  async getPendingVerifications(limit: number = 20, offset: number = 0): Promise<any> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT
          uv.*,
          u.username,
          u.email,
          u.role
         FROM admin_user_verifications uv
         JOIN users u ON uv.user_id = u.id
         WHERE uv.status = 'pending'
         ORDER BY uv.created_at ASC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      const countResult = await client.query(
        `SELECT COUNT(*) FROM admin_user_verifications WHERE status = 'pending'`
      );

      return {
        verifications: result.rows,
        total: parseInt(countResult.rows[0].count),
      };
    } finally {
      client.release();
    }
  }

  /**
   * 任务审核
   */
  async reviewTask(
    taskId: string,
    reviewerId: string,
    reviewType: string,
    status: 'approved' | 'rejected' | 'flagged',
    issues?: any,
    note?: string
  ): Promise<any> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 记录审核
      const reviewResult = await client.query(
        `INSERT INTO admin_task_reviews (task_id, reviewer_id, review_type, status, issues, review_note)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [taskId, reviewerId, reviewType, status, JSON.stringify(issues), note]
      );

      // 更新任务状态
      if (status === 'approved') {
        await client.query(
          `UPDATE tasks SET status = 'open' WHERE id = $1`,
          [taskId]
        );
      } else if (status === 'rejected') {
        await client.query(
          `UPDATE tasks SET status = 'rejected' WHERE id = $1`,
          [taskId]
        );
      }

      await client.query('COMMIT');
      logger.info('Task reviewed', { taskId, reviewerId, status });
      return reviewResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 评价管理 - 隐藏评价
   */
  async hideRating(ratingId: string, reviewerId: string, reason: string): Promise<any> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 更新评价状态
      await client.query(
        `UPDATE ratings SET is_hidden = true WHERE id = $1`,
        [ratingId]
      );

      // 记录审核
      const result = await client.query(
        `INSERT INTO admin_rating_reviews (rating_id, reviewer_id, action, reason)
         VALUES ($1, $2, 'hidden', $3) RETURNING *`,
        [ratingId, reviewerId, reason]
      );

      await client.query('COMMIT');
      logger.info('Rating hidden', { ratingId, reviewerId });
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 创建风险预警
   */
  async createRiskAlert(
    alertType: string,
    severity: string,
    entityType: string,
    entityId: string,
    reason: string,
    data?: any
  ): Promise<any> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO risk_alerts (alert_type, severity, entity_type, entity_id, alert_reason, alert_data)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [alertType, severity, entityType, entityId, reason, JSON.stringify(data)]
      );

      logger.warn('Risk alert created', { alertType, severity, entityType, entityId });
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * 获取风险预警列表
   */
  async getRiskAlerts(
    status?: string,
    severity?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any> {
    const client = await pool.connect();
    try {
      let query = `SELECT * FROM risk_alerts WHERE 1=1`;
      const params: any[] = [];
      let paramIndex = 1;

      if (status) {
        query += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (severity) {
        query += ` AND severity = $${paramIndex}`;
        params.push(severity);
        paramIndex++;
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await client.query(query, params);

      return {
        alerts: result.rows,
        total: result.rows.length,
      };
    } finally {
      client.release();
    }
  }

  /**
   * 获取平台指标
   */
  async getPlatformMetrics(startDate: Date, endDate: Date): Promise<PlatformMetrics[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM platform_metrics
         WHERE metric_date BETWEEN $1 AND $2
         ORDER BY metric_date DESC`,
        [startDate, endDate]
      );

      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * 计算每日指标
   */
  async calculateDailyMetrics(date: Date): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(`SELECT calculate_daily_metrics($1)`, [date]);
      logger.info('Daily metrics calculated', { date });
    } finally {
      client.release();
    }
  }

  /**
   * 获取系统配置
   */
  async getSystemConfig(configKey: string): Promise<any> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM system_configs WHERE config_key = $1 AND is_active = true`,
        [configKey]
      );

      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  /**
   * 更新系统配置
   */
  async updateSystemConfig(
    configKey: string,
    configValue: any,
    updatedBy: string
  ): Promise<any> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE system_configs
         SET config_value = $1, updated_by = $2, updated_at = NOW()
         WHERE config_key = $3
         RETURNING *`,
        [JSON.stringify(configValue), updatedBy, configKey]
      );

      logger.info('System config updated', { configKey, updatedBy });
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * 获取待审核项目汇总
   */
  async getPendingReviews(): Promise<any> {
    const client = await pool.connect();
    try {
      const result = await client.query(`SELECT * FROM admin_pending_reviews ORDER BY created_at ASC`);

      return result.rows;
    } finally {
      client.release();
    }
  }
}

export const platformAdminService = new PlatformAdminService();
