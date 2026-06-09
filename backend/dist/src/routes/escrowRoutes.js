"use strict";
/**
 * 支付托管和提现路由
 *
 * 定义托管账户、资金托管、提现申请相关的API路由
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const escrowController = __importStar(require("../controllers/escrowController"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// =====================================================
// 所有路由都需要认证
// =====================================================
router.use(auth_1.authenticate);
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
exports.default = router;
//# sourceMappingURL=escrowRoutes.js.map