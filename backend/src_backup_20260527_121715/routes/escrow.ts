import express from 'express';
import {
  getAccount,
  createQuote,
  acceptQuote,
  payAndEscrow,
  completeTaskAndSettle,
  releaseSettlement,
  getTransactionLogs,
  createWithdrawal,
  getUserWithdrawals,
  getWithdrawalStats,
  reviewWithdrawal,
  getPendingWithdrawals,
} from '../controllers/escrowController';
import { authenticate } from '../middleware/auth';
import { requireRole, requireAnyRole } from '../middleware/roleCheck';

const router = express.Router();

/**
 * 托管账户相关
 */

// 获取账户信息
router.get('/account', authenticate, getAccount);

// 获取交易流水
router.get('/transactions', authenticate, getTransactionLogs);

/**
 * 报价和支付相关
 */

// 企业创建报价
router.post('/quote', authenticate, requireRole('company'), createQuote);

// 学生接受报价
router.post('/quote/accept', authenticate, requireRole('student'), acceptQuote);

// 企业支付并进入托管
router.post('/pay', authenticate, requireRole('company'), payAndEscrow);

// 任务完成，进入待结算
router.post('/settle', authenticate, completeTaskAndSettle);

// 释放待结算资金
router.post('/release', authenticate, releaseSettlement);

/**
 * 提现相关
 */

// 创建提现申请
router.post('/withdrawal', authenticate, requireRole('student'), createWithdrawal);

// 获取用户提现记录
router.get('/withdrawal/list', authenticate, requireRole('student'), getUserWithdrawals);

// 获取提现统计
router.get('/withdrawal/stats', authenticate, requireRole('student'), getWithdrawalStats);

// 审核提现申请（管理员）
router.post('/withdrawal/review', authenticate, requireRole('admin'), reviewWithdrawal);

// 获取待审核提现列表（管理员）
router.get('/withdrawal/pending', authenticate, requireRole('admin'), getPendingWithdrawals);

export default router;
