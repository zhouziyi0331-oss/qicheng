"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const financeController_1 = require("./financeController");
const router = (0, express_1.Router)();
// 财务概览
router.get('/overview', financeController_1.getFinanceOverview);
// 交易流水
router.get('/transactions', financeController_1.getTransactionList);
// 提现申请列表
router.get('/withdrawals', financeController_1.getWithdrawalList);
// 审核提现申请
router.post('/withdrawals/:id/approve', financeController_1.approveWithdrawal);
// 收入统计
router.get('/revenue-stats', financeController_1.getRevenueStats);
// 平台抽成配置
router.get('/commission-config', financeController_1.getCommissionConfig);
router.put('/commission-config', financeController_1.updateCommissionConfig);
exports.default = router;
//# sourceMappingURL=financeRoutes.js.map