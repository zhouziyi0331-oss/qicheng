"use strict";
/**
 * 支付托管和提现控制器（新版）
 *
 * 基于063_escrow_withdrawal_system.sql的完整实现
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccount = getAccount;
exports.initAccount = initAccount;
exports.depositFunds = depositFunds;
exports.releaseFunds = releaseFunds;
exports.requestWithdrawal = requestWithdrawal;
exports.getWithdrawalHistory = getWithdrawalHistory;
exports.getTransactions = getTransactions;
const escrowServiceNew_1 = require("../services/escrowServiceNew");
const logger_1 = __importDefault(require("../utils/logger"));
// =====================================================
// 账户管理
// =====================================================
/**
 * 获取托管账户信息
 * GET /api/v1/escrow/account
 */
async function getAccount(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const account = await escrowServiceNew_1.escrowServiceNew.getAccount(userId);
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }
        return res.json({
            success: true,
            data: account,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get escrow account', { error });
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
async function initAccount(req, res) {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        if (!userId || !userRole) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const userType = userRole === 'company' ? 'company' : 'student';
        const account = await escrowServiceNew_1.escrowServiceNew.getOrCreateAccount(userId, userType);
        return res.json({
            success: true,
            data: account,
            message: 'Account initialized successfully',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to initialize escrow account', { error });
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
async function depositFunds(req, res) {
    try {
        const userId = req.user?.id;
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
        const transaction = await escrowServiceNew_1.escrowServiceNew.depositFunds(task_id, userId, payee_id, amount);
        return res.json({
            success: true,
            data: transaction,
            message: 'Funds deposited successfully',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to deposit funds', { error });
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
async function releaseFunds(req, res) {
    try {
        const userId = req.user?.id;
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
        const result = await escrowServiceNew_1.escrowServiceNew.releaseFunds(task_id);
        return res.json({
            success: true,
            data: result,
            message: 'Funds released successfully',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to release funds', { error });
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
async function requestWithdrawal(req, res) {
    try {
        const userId = req.user?.id;
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
        const withdrawalRequest = await escrowServiceNew_1.escrowServiceNew.requestWithdrawal(userId, amount, withdrawal_method, withdrawal_account, account_name);
        return res.json({
            success: true,
            data: withdrawalRequest,
            message: 'Withdrawal request submitted successfully',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to request withdrawal', { error });
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
async function getWithdrawalHistory(req, res) {
    try {
        const userId = req.user?.id;
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const result = await escrowServiceNew_1.escrowServiceNew.getWithdrawals(userId, limit, offset);
        return res.json({
            success: true,
            data: result.withdrawals,
            total: result.total,
            limit,
            offset,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get withdrawal history', { error });
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
async function getTransactions(req, res) {
    try {
        const userId = req.user?.id;
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const result = await escrowServiceNew_1.escrowServiceNew.getTransactions(userId, limit, offset);
        return res.json({
            success: true,
            data: result.transactions,
            total: result.total,
            limit,
            offset,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get transactions', { error });
        return res.status(500).json({
            error: 'Failed to get transactions',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
//# sourceMappingURL=escrowController.js.map