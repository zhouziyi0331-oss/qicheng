/**
 * 支付托管和提现路由
 *
 * 定义托管账户、资金托管、提现申请相关的API路由
 */

import express from 'express';
import * as escrowController from '../controllers/escrowController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// =====================================================
// 所有路由都需要认证
// =====================================================
router.use(authenticate);

// =====================================================
// 账户管理路由
// =====================================================

/**
 * 获取托管账户信息
 * GET /api/v1/escrow/account
 */
router.get('/account', escrowController.getAccount);

/**
 * 获取或创建托管账户
 * POST /api/v1/escrow/account/init
 */
router.post('/account/init', escrowController.initAccount);

// =====================================================
// 资金托管路由
// =====================================================

/**
 * 托管资金（企业支付任务款项）
 * POST /api/v1/escrow/deposit
 * Body: { task_id, payee_id, amount }
 */
router.post('/deposit', escrowController.depositFunds);

/**
 * 释放资金（任务完成后支付给学生）
 * POST /api/v1/escrow/release
 * Body: { task_id }
 */
router.post('/release', escrowController.releaseFunds);

// =====================================================
// 提现管理路由
// =====================================================

/**
 * 申请提现
 * POST /api/v1/escrow/withdrawal/request
 * Body: { amount, withdrawal_method, withdrawal_account, account_name }
 */
router.post('/withdrawal/request', escrowController.requestWithdrawal);

/**
 * 获取提现记录
 * GET /api/v1/escrow/withdrawal/history
 * Query: ?limit=20&offset=0
 */
router.get('/withdrawal/history', escrowController.getWithdrawalHistory);

// =====================================================
// 交易记录路由
// =====================================================

/**
 * 获取账户流水
 * GET /api/v1/escrow/transactions
 * Query: ?limit=20&offset=0
 */
router.get('/transactions', escrowController.getTransactions);

export default router;
