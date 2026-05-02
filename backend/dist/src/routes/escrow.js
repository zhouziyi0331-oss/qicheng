"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const escrowController_1 = require("../controllers/escrowController");
const auth_1 = require("../middleware/auth");
const roleCheck_1 = require("../middleware/roleCheck");
const router = express_1.default.Router();
/**
 * 托管账户相关
 */
// 获取账户信息
router.get('/account', auth_1.authenticate, escrowController_1.getAccount);
// 获取交易流水
router.get('/transactions', auth_1.authenticate, escrowController_1.getTransactionLogs);
/**
 * 报价和支付相关
 */
// 企业创建报价
router.post('/quote', auth_1.authenticate, (0, roleCheck_1.requireRole)('company'), escrowController_1.createQuote);
// 学生接受报价
router.post('/quote/accept', auth_1.authenticate, (0, roleCheck_1.requireRole)('student'), escrowController_1.acceptQuote);
// 企业支付并进入托管
router.post('/pay', auth_1.authenticate, (0, roleCheck_1.requireRole)('company'), escrowController_1.payAndEscrow);
// 任务完成，进入待结算
router.post('/settle', auth_1.authenticate, escrowController_1.completeTaskAndSettle);
// 释放待结算资金
router.post('/release', auth_1.authenticate, escrowController_1.releaseSettlement);
/**
 * 提现相关
 */
// 创建提现申请
router.post('/withdrawal', auth_1.authenticate, (0, roleCheck_1.requireRole)('student'), escrowController_1.createWithdrawal);
// 获取用户提现记录
router.get('/withdrawal/list', auth_1.authenticate, (0, roleCheck_1.requireRole)('student'), escrowController_1.getUserWithdrawals);
// 获取提现统计
router.get('/withdrawal/stats', auth_1.authenticate, (0, roleCheck_1.requireRole)('student'), escrowController_1.getWithdrawalStats);
// 审核提现申请（管理员）
router.post('/withdrawal/review', auth_1.authenticate, (0, roleCheck_1.requireRole)('admin'), escrowController_1.reviewWithdrawal);
// 获取待审核提现列表（管理员）
router.get('/withdrawal/pending', auth_1.authenticate, (0, roleCheck_1.requireRole)('admin'), escrowController_1.getPendingWithdrawals);
exports.default = router;
//# sourceMappingURL=escrow.js.map