import { Request, Response } from 'express';
import logger from '../../utils/logger';
import { query } from '../../utils/db';

/**
 * 获取财务概览
 */
export async function getFinanceOverview(req: Request, res: Response) {
  try {
    // 总收入（所有账户的累计收入）
    const totalRevenue = await query<any>(
      `SELECT COALESCE(SUM(total_earned), 0) as total
       FROM escrow_accounts`
    );

    // 待结算金额（所有账户的待结算余额）
    const pendingSettlement = await query<any>(
      `SELECT COALESCE(SUM(pending_balance), 0) as total
       FROM escrow_accounts`
    );

    // 可提现余额（所有账户的可提现余额）
    const availableBalance = await query<any>(
      `SELECT COALESCE(SUM(available_balance), 0) as total
       FROM escrow_accounts`
    );

    // 已提现金额
    const totalWithdrawn = await query<any>(
      `SELECT COALESCE(SUM(total_withdrawn), 0) as total
       FROM escrow_accounts`
    );

    // 本月收入
    const monthlyRevenue = await query<any>(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM income_records
       WHERE status = 'settled'
       AND DATE_TRUNC('month', settled_at) = DATE_TRUNC('month', CURRENT_DATE)`
    );

    res.json({
      totalRevenue: parseFloat(totalRevenue[0].total) / 100, // 转换为元
      pendingSettlement: parseFloat(pendingSettlement[0].total) / 100,
      availableBalance: parseFloat(availableBalance[0].total) / 100,
      totalWithdrawn: parseFloat(totalWithdrawn[0].total) / 100,
      monthlyRevenue: parseFloat(monthlyRevenue[0].total)
    });
  } catch (error) {
    logger.error('获取财务概览失败:', error);
    res.status(500).json({ message: '获取财务概览失败' });
  }
}

/**
 * 获取交易流水
 */
export async function getTransactionList(req: Request, res: Response) {
  try {
    const { page = 1, pageSize = 20, status, type, startDate, endDate } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`ir.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (type) {
      conditions.push(`ir.type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    if (startDate) {
      conditions.push(`ir.created_at >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      conditions.push(`ir.created_at <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query<any>(
      `SELECT COUNT(*) as total
       FROM income_records ir
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult[0].total);

    params.push(Number(pageSize), offset);
    const transactions = await query<any>(
      `SELECT
        ir.id,
        ir.user_id,
        ir.task_id,
        ir.amount,
        ir.type,
        ir.status,
        ir.description,
        ir.created_at,
        ir.settled_at,
        u.nickname as user_name,
        t.title as task_title
       FROM income_records ir
       LEFT JOIN users u ON ir.user_id = u.id
       LEFT JOIN tasks t ON ir.task_id = t.id
       ${whereClause}
       ORDER BY ir.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    res.json({
      list: transactions,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error) {
    logger.error('获取交易流水失败:', error);
    res.status(500).json({ message: '获取交易流水失败' });
  }
}

/**
 * 获取提现申请列表
 */
export async function getWithdrawalList(req: Request, res: Response) {
  try {
    const { page = 1, pageSize = 20, status } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`w.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query<any>(
      `SELECT COUNT(*) as total
       FROM withdrawal_requests w
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult[0].total);

    params.push(Number(pageSize), offset);
    const withdrawals = await query<any>(
      `SELECT
        w.id,
        w.user_id,
        w.amount,
        w.status,
        w.withdrawal_method,
        w.withdrawal_account,
        w.created_at,
        w.reviewed_at,
        w.reject_reason,
        u.nickname as user_name,
        u.phone
       FROM withdrawal_requests w
       LEFT JOIN users u ON w.user_id = u.id
       ${whereClause}
       ORDER BY w.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    res.json({
      list: withdrawals,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error) {
    logger.error('获取提现申请列表失败:', error);
    res.status(500).json({ message: '获取提现申请列表失败' });
  }
}

/**
 * 审核提现申请
 */
export async function approveWithdrawal(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { approved, rejectReason } = req.body;

    // 获取提现申请详情
    const withdrawalRequest = await query<any>(
      `SELECT user_id, amount, status
       FROM withdrawal_requests
       WHERE id = $1`,
      [id]
    );

    if (withdrawalRequest.length === 0) {
      return res.status(404).json({ message: '提现申请不存在' });
    }

    const { user_id, amount, status } = withdrawalRequest[0];

    // 检查状态是否为待审核
    if (status !== 'pending') {
      return res.status(400).json({ message: '该提现申请已处理' });
    }

    if (approved) {
      // 开始事务
      await query('BEGIN');

      try {
        // 1. 更新提现申请状态
        await query(
          `UPDATE withdrawal_requests
           SET status = 'approved',
               reviewed_at = NOW()
           WHERE id = $1`,
          [id]
        );

        // 2. 更新用户托管账户余额
        await query(
          `UPDATE escrow_accounts
           SET available_balance = available_balance - $1,
               total_withdrawn = total_withdrawn + $1,
               updated_at = NOW()
           WHERE user_id = $2`,
          [amount, user_id]
        );

        // 3. 记录操作日志
        const adminId = (req as any).user.userId;
        await query(
          `INSERT INTO admin_operation_logs (admin_id, operation_type, target_type, target_id, details)
           VALUES ($1, 'approve_withdrawal', 'withdrawal', $2, $3)`,
          [adminId, id, JSON.stringify({ amount, userId: user_id })]
        );

        // 提交事务
        await query('COMMIT');

        res.json({ message: '提现申请已批准，余额已更新' });
      } catch (error) {
        // 回滚事务
        await query('ROLLBACK');
        throw error;
      }
    } else {
      // 拒绝提现
      await query(
        `UPDATE withdrawal_requests
         SET status = 'rejected',
             reject_reason = $2,
             reviewed_at = NOW()
         WHERE id = $1`,
        [id, rejectReason]
      );

      // 记录操作日志
      const adminId = (req as any).user.userId;
      await query(
        `INSERT INTO admin_operation_logs (admin_id, operation_type, target_type, target_id, details)
         VALUES ($1, 'reject_withdrawal', 'withdrawal', $2, $3)`,
        [adminId, id, JSON.stringify({ reason: rejectReason })]
      );

      res.json({ message: '提现申请已拒绝' });
    }
  } catch (error) {
    logger.error('审核提现申请失败:', error);
    res.status(500).json({ message: '审核提现申请失败' });
  }
}

/**
 * 获取收入统计
 */
export async function getRevenueStats(req: Request, res: Response) {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    const conditions: string[] = ['ir.status = $1'];
    const params: any[] = ['settled'];
    let paramIndex = 2;

    if (startDate) {
      conditions.push(`ir.settled_at >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      conditions.push(`ir.settled_at <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    let dateFormat: string;
    switch (groupBy) {
      case 'month':
        dateFormat = 'YYYY-MM';
        break;
      case 'week':
        dateFormat = 'IYYY-IW';
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
    }

    const stats = await query<any>(
      `SELECT
        TO_CHAR(ir.settled_at, '${dateFormat}') as date,
        COUNT(*) as transaction_count,
        SUM(ir.amount) as total_amount
       FROM income_records ir
       ${whereClause}
       GROUP BY TO_CHAR(ir.settled_at, '${dateFormat}')
       ORDER BY date DESC`,
      params
    );

    res.json(stats);
  } catch (error) {
    logger.error('获取收入统计失败:', error);
    res.status(500).json({ message: '获取收入统计失败' });
  }
}

/**
 * 获取平台抽成配置
 */
export async function getCommissionConfig(req: Request, res: Response) {
  try {
    const config = await query<any>(
      `SELECT key, value, description
       FROM system_configs
       WHERE key LIKE 'commission_%'`
    );

    res.json(config);
  } catch (error) {
    logger.error('获取平台抽成配置失败:', error);
    res.status(500).json({ message: '获取平台抽成配置失败' });
  }
}

/**
 * 更新平台抽成配置
 */
export async function updateCommissionConfig(req: Request, res: Response) {
  try {
    const { key, value } = req.body;

    await query(
      `UPDATE system_configs
       SET value = $2,
           updated_at = NOW()
       WHERE key = $1`,
      [key, value]
    );

    res.json({ message: '平台抽成配置更新成功' });
  } catch (error) {
    logger.error('更新平台抽成配置失败:', error);
    res.status(500).json({ message: '更新平台抽成配置失败' });
  }
}
