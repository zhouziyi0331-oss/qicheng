import { Router } from 'express';
import {
  getFinanceOverview,
  getTransactionList,
  getWithdrawalList,
  approveWithdrawal,
  getRevenueStats,
  getCommissionConfig,
  updateCommissionConfig
} from './financeController';

const router = Router();

// 财务概览
router.get('/overview', getFinanceOverview);

// 交易流水
router.get('/transactions', getTransactionList);

// 提现申请列表
router.get('/withdrawals', getWithdrawalList);

// 审核提现申请
router.post('/withdrawals/:id/approve', approveWithdrawal);

// 收入统计
router.get('/revenue-stats', getRevenueStats);

// 平台抽成配置
router.get('/commission-config', getCommissionConfig);
router.put('/commission-config', updateCommissionConfig);

export default router;
