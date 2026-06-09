import express from 'express';
import {
  getAccount,
  initAccount,
  depositFunds,
  releaseFunds,
  requestWithdrawal,
  getWithdrawalHistory,
  getTransactions,
} from '../controllers/escrowController';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleCheck';

const router = express.Router();

/**
 * 托管账户相关
 */

// 获取账户信息
router.get('/account', authenticate, getAccount);

// 初始化账户
router.post('/account/init', authenticate, initAccount);

// 获取交易流水
router.get('/transactions', authenticate, getTransactions);

/**
 * 资金相关
 */

// 充值
router.post('/deposit', authenticate, requireRole('company'), depositFunds);

// 释放资金
router.post('/release', authenticate, releaseFunds);

/**
 * 提现相关
 */

// 创建提现申请
router.post('/withdrawal', authenticate, requireRole('student'), requestWithdrawal);

// 获取提现记录
router.get('/withdrawal/history', authenticate, requireRole('student'), getWithdrawalHistory);

export default router;
