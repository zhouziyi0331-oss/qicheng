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
// 初始化账户
router.post('/account/init', auth_1.authenticate, escrowController_1.initAccount);
// 获取交易流水
router.get('/transactions', auth_1.authenticate, escrowController_1.getTransactions);
/**
 * 资金相关
 */
// 充值
router.post('/deposit', auth_1.authenticate, (0, roleCheck_1.requireRole)('company'), escrowController_1.depositFunds);
// 释放资金
router.post('/release', auth_1.authenticate, escrowController_1.releaseFunds);
/**
 * 提现相关
 */
// 创建提现申请
router.post('/withdrawal', auth_1.authenticate, (0, roleCheck_1.requireRole)('student'), escrowController_1.requestWithdrawal);
// 获取提现记录
router.get('/withdrawal/history', auth_1.authenticate, (0, roleCheck_1.requireRole)('student'), escrowController_1.getWithdrawalHistory);
exports.default = router;
//# sourceMappingURL=escrow.js.map