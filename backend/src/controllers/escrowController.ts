/**
 * 支付托管和提现控制器（新版）
 *
 * 基于063_escrow_withdrawal_system.sql的完整实现
 */

import { Request, Response } from 'express';
import { escrowServiceNew } from '../services/escrowServiceNew';
import logger from '../utils/logger';


// =====================================================
// 账户管理
// =====================================================

/**
 * 获取托管账户信息
 * GET /api/v1/escrow/account
 */
export async function getAccount(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const account = await escrowServiceNew.getAccount(userId);

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    return res.json({
      success: true,
      data: account,
    });
  } catch (error: any) {
    logger.error('Failed to get escrow account', { error });
    return res.status(500).json({
      error: 'Failed to get escrow account',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * 获取或创建托管账户
 * POST /api/v1/escrow/account/init
 */
export async function initAccount(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userType = userRole === 'company' ? 'company' : 'student';
    const account = await escrowServiceNew.getOrCreateAccount(userId, userType);

    return res.json({
      success: true,
      data: account,
      message: 'Account initialized successfully',
    });
  } catch (error: any) {
    logger.error('Failed to initialize escrow account', { error });
    return res.status(500).json({
      error: 'Failed to initialize escrow account',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// =====================================================
// 资金托管
// =====================================================

/**
 * 托管资金（企业支付任务款项）
 * POST /api/v1/escrow/deposit
 */
export async function depositFunds(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const { task_id, payee_id, amount } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (userRole !== 'company' && userRole !== 'admin' && userRole !== 'platform') {
      return res.status(403).json({ error: 'Only companies can deposit funds' });
    }

    if (!task_id || !payee_id || !amount) {
      return res.status(400).json({ error: 'Missing required fields: task_id, payee_id, amount' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const transaction = await escrowServiceNew.depositFunds(task_id, userId, payee_id, amount);

    return res.json({
      success: true,
      data: transaction,
      message: 'Funds deposited successfully',
    });
  } catch (error: any) {
    logger.error('Failed to deposit funds', { error });
    return res.status(500).json({
      error: 'Failed to deposit funds',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * 释放资金（任务完成后支付给学生）
 * POST /api/v1/escrow/release
 */
export async function releaseFunds(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const { task_id } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (userRole !== 'company' && userRole !== 'admin' && userRole !== 'platform') {
      return res.status(403).json({ error: 'Only companies can release funds' });
    }

    if (!task_id) {
      return res.status(400).json({ error: 'Missing required field: task_id' });
    }

    const result = await escrowServiceNew.releaseFunds(task_id);

    return res.json({
      success: true,
      data: result,
      message: 'Funds released successfully',
    });
  } catch (error: any) {
    logger.error('Failed to release funds', { error });
    return res.status(500).json({
      error: 'Failed to release funds',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// =====================================================
// 提现管理
// =====================================================

/**
 * 申请提现
 * POST /api/v1/escrow/withdrawal/request
 */
export async function requestWithdrawal(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const { amount, withdrawal_method, withdrawal_account, account_name } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!amount || !withdrawal_method || !withdrawal_account || !account_name) {
      return res.status(400).json({
        error: 'Missing required fields: amount, withdrawal_method, withdrawal_account, account_name',
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const validMethods = ['alipay', 'wechat', 'bank_transfer'];
    if (!validMethods.includes(withdrawal_method)) {
      return res.status(400).json({
        error: 'Invalid withdrawal method. Must be: alipay, wechat, or bank_transfer',
      });
    }

    const withdrawalRequest = await escrowServiceNew.requestWithdrawal(
      userId,
      amount,
      withdrawal_method,
      withdrawal_account,
      account_name
    );

    return res.json({
      success: true,
      data: withdrawalRequest,
      message: 'Withdrawal request submitted successfully',
    });
  } catch (error: any) {
    logger.error('Failed to request withdrawal', { error });
    return res.status(500).json({
      error: 'Failed to request withdrawal',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * 获取提现记录
 * GET /api/v1/escrow/withdrawal/history
 */
export async function getWithdrawalHistory(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await escrowServiceNew.getWithdrawals(userId, limit, offset);

    return res.json({
      success: true,
      data: result.withdrawals,
      total: result.total,
      limit,
      offset,
    });
  } catch (error: any) {
    logger.error('Failed to get withdrawal history', { error });
    return res.status(500).json({
      error: 'Failed to get withdrawal history',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// =====================================================
// 交易记录
// =====================================================

/**
 * 获取账户流水
 * GET /api/v1/escrow/transactions
 */
export async function getTransactions(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await escrowServiceNew.getTransactions(userId, limit, offset);

    return res.json({
      success: true,
      data: result.transactions,
      total: result.total,
      limit,
      offset,
    });
  } catch (error: any) {
    logger.error('Failed to get transactions', { error });
    return res.status(500).json({
      error: 'Failed to get transactions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
