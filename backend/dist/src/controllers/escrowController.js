"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccount = getAccount;
exports.createQuote = createQuote;
exports.acceptQuote = acceptQuote;
exports.payAndEscrow = payAndEscrow;
exports.completeTaskAndSettle = completeTaskAndSettle;
exports.releaseSettlement = releaseSettlement;
exports.getTransactionLogs = getTransactionLogs;
exports.createWithdrawal = createWithdrawal;
exports.getUserWithdrawals = getUserWithdrawals;
exports.getWithdrawalStats = getWithdrawalStats;
exports.reviewWithdrawal = reviewWithdrawal;
exports.getPendingWithdrawals = getPendingWithdrawals;
const escrowService_1 = require("../services/escrowService");
const withdrawalService_1 = require("../services/withdrawalService");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * 获取用户托管账户信息
 */
async function getAccount(req, res, next) {
    try {
        const userId = req.user?.userId;
        const userType = req.user?.role;
        if (!userId || !userType) {
            return next(new errorHandler_1.AppError(401, '用户未登录', 'UNAUTHORIZED'));
        }
        const account = await escrowService_1.escrowService.getAccount(parseInt(userId), userType);
        if (!account) {
            return res.status(404).json({
                success: false,
                message: '账户不存在',
            });
        }
        res.json({
            success: true,
            data: {
                totalBalance: account.totalBalance / 100, // 转换为元
                frozenBalance: account.frozenBalance / 100,
                availableBalance: account.availableBalance / 100,
                pendingSettlement: account.pendingSettlement / 100,
                totalIncome: account.totalIncome / 100,
                totalWithdrawal: account.totalWithdrawal / 100,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Get account error:', error);
        next(error);
    }
}
/**
 * 创建任务报价（企业）
 */
async function createQuote(req, res, next) {
    try {
        const companyId = req.user?.userId;
        const { taskId, studentId, quotedAmount } = req.body;
        if (!companyId) {
            return next(new errorHandler_1.AppError(401, '用户未登录', 'UNAUTHORIZED'));
        }
        if (!taskId || !studentId || !quotedAmount) {
            return next(new errorHandler_1.AppError(400, '缺少必要参数', 'INVALID_PARAMS'));
        }
        // 报价金额转换为分
        const amountInCents = Math.floor(quotedAmount * 100);
        const quote = await escrowService_1.escrowService.createQuote(taskId, studentId, parseInt(companyId), amountInCents);
        res.json({
            success: true,
            message: '报价创建成功',
            data: {
                quoteId: quote.id,
                quotedAmount: quote.quotedAmount / 100,
                platformFee: quote.platformFee / 100,
                studentNetIncome: quote.studentNetIncome / 100,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Create quote error:', error);
        next(error);
    }
}
/**
 * 学生接受报价
 */
async function acceptQuote(req, res, next) {
    try {
        const studentId = req.user?.userId;
        const { quoteId } = req.body;
        if (!studentId) {
            return next(new errorHandler_1.AppError(401, '用户未登录', 'UNAUTHORIZED'));
        }
        if (!quoteId) {
            return next(new errorHandler_1.AppError(400, '缺少报价ID', 'INVALID_PARAMS'));
        }
        await escrowService_1.escrowService.acceptQuote(quoteId, parseInt(studentId));
        res.json({
            success: true,
            message: '报价已接受，等待企业支付',
        });
    }
    catch (error) {
        logger_1.default.error('Accept quote error:', error);
        next(error);
    }
}
/**
 * 企业支付并进入托管
 */
async function payAndEscrow(req, res, next) {
    try {
        const companyId = req.user?.userId;
        const { quoteId, paymentMethod } = req.body;
        if (!companyId) {
            return next(new errorHandler_1.AppError(401, '用户未登录', 'UNAUTHORIZED'));
        }
        if (!quoteId || !paymentMethod) {
            return next(new errorHandler_1.AppError(400, '缺少必要参数', 'INVALID_PARAMS'));
        }
        await escrowService_1.escrowService.payAndEscrow(quoteId, parseInt(companyId), paymentMethod);
        res.json({
            success: true,
            message: '支付成功，资金已进入托管',
        });
    }
    catch (error) {
        logger_1.default.error('Pay and escrow error:', error);
        next(error);
    }
}
/**
 * 任务完成，进入待结算
 */
async function completeTaskAndSettle(req, res, next) {
    try {
        const { taskId, quoteId } = req.body;
        if (!taskId || !quoteId) {
            return next(new errorHandler_1.AppError(400, '缺少必要参数', 'INVALID_PARAMS'));
        }
        await escrowService_1.escrowService.completeTaskAndSettle(taskId, quoteId);
        res.json({
            success: true,
            message: '任务已完成，资金进入待结算（7天后可提现）',
        });
    }
    catch (error) {
        logger_1.default.error('Complete task and settle error:', error);
        next(error);
    }
}
/**
 * 释放待结算资金
 */
async function releaseSettlement(req, res, next) {
    try {
        const { taskId, quoteId } = req.body;
        if (!taskId || !quoteId) {
            return next(new errorHandler_1.AppError(400, '缺少必要参数', 'INVALID_PARAMS'));
        }
        await escrowService_1.escrowService.releaseSettlement(taskId, quoteId);
        res.json({
            success: true,
            message: '资金已释放，可提现',
        });
    }
    catch (error) {
        logger_1.default.error('Release settlement error:', error);
        next(error);
    }
}
/**
 * 获取交易流水
 */
async function getTransactionLogs(req, res, next) {
    try {
        const userId = req.user?.userId;
        const userType = req.user?.role;
        const { limit = 50, offset = 0 } = req.query;
        if (!userId || !userType) {
            return next(new errorHandler_1.AppError(401, '用户未登录', 'UNAUTHORIZED'));
        }
        const logs = await escrowService_1.escrowService.getTransactionLogs(parseInt(userId), userType, parseInt(limit), parseInt(offset));
        // 转换金额为元
        const formattedLogs = logs.map((log) => ({
            ...log,
            amount: log.amount / 100,
            balance_before: log.balance_before / 100,
            balance_after: log.balance_after / 100,
        }));
        res.json({
            success: true,
            data: formattedLogs,
        });
    }
    catch (error) {
        logger_1.default.error('Get transaction logs error:', error);
        next(error);
    }
}
/**
 * 创建提现申请
 */
async function createWithdrawal(req, res, next) {
    try {
        const userId = req.user?.userId;
        const { amount, withdrawalMethod, accountName, accountNumber } = req.body;
        if (!userId) {
            return next(new errorHandler_1.AppError(401, '用户未登录', 'UNAUTHORIZED'));
        }
        if (!amount || !withdrawalMethod || !accountName || !accountNumber) {
            return next(new errorHandler_1.AppError(400, '缺少必要参数', 'INVALID_PARAMS'));
        }
        // 转换为分
        const amountInCents = Math.floor(amount * 100);
        const withdrawal = await withdrawalService_1.withdrawalService.createWithdrawal(parseInt(userId), amountInCents, withdrawalMethod, accountName, accountNumber);
        res.json({
            success: true,
            message: '提现申请已提交，等待审核',
            data: {
                withdrawalId: withdrawal.id,
                amount: withdrawal.amount / 100,
                status: withdrawal.status,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Create withdrawal error:', error);
        next(error);
    }
}
/**
 * 获取用户提现记录
 */
async function getUserWithdrawals(req, res, next) {
    try {
        const userId = req.user?.userId;
        const { limit = 50, offset = 0 } = req.query;
        if (!userId) {
            return next(new errorHandler_1.AppError(401, '用户未登录', 'UNAUTHORIZED'));
        }
        const withdrawals = await withdrawalService_1.withdrawalService.getUserWithdrawals(parseInt(userId), parseInt(limit), parseInt(offset));
        // 转换金额为元
        const formattedWithdrawals = withdrawals.map((w) => ({
            ...w,
            amount: w.amount / 100,
        }));
        res.json({
            success: true,
            data: formattedWithdrawals,
        });
    }
    catch (error) {
        logger_1.default.error('Get user withdrawals error:', error);
        next(error);
    }
}
/**
 * 获取提现统计
 */
async function getWithdrawalStats(req, res, next) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return next(new errorHandler_1.AppError(401, '用户未登录', 'UNAUTHORIZED'));
        }
        const stats = await withdrawalService_1.withdrawalService.getWithdrawalStats(parseInt(userId));
        res.json({
            success: true,
            data: {
                completedCount: parseInt(stats.completed_count),
                pendingCount: parseInt(stats.pending_count),
                rejectedCount: parseInt(stats.rejected_count),
                totalWithdrawn: parseInt(stats.total_withdrawn) / 100,
                pendingAmount: parseInt(stats.pending_amount) / 100,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Get withdrawal stats error:', error);
        next(error);
    }
}
/**
 * 审核提现申请（管理员）
 */
async function reviewWithdrawal(req, res, next) {
    try {
        const reviewerId = req.user?.userId;
        const { withdrawalId, approved, rejectReason } = req.body;
        if (!reviewerId) {
            return next(new errorHandler_1.AppError(401, '用户未登录', 'UNAUTHORIZED'));
        }
        if (!withdrawalId || approved === undefined) {
            return next(new errorHandler_1.AppError(400, '缺少必要参数', 'INVALID_PARAMS'));
        }
        await withdrawalService_1.withdrawalService.reviewWithdrawal(withdrawalId, parseInt(reviewerId), approved, rejectReason);
        res.json({
            success: true,
            message: approved ? '提现申请已批准' : '提现申请已拒绝',
        });
    }
    catch (error) {
        logger_1.default.error('Review withdrawal error:', error);
        next(error);
    }
}
/**
 * 获取待审核提现列表（管理员）
 */
async function getPendingWithdrawals(req, res, next) {
    try {
        const { limit = 50, offset = 0 } = req.query;
        const withdrawals = await withdrawalService_1.withdrawalService.getPendingWithdrawals(parseInt(limit), parseInt(offset));
        // 转换金额为元
        const formattedWithdrawals = withdrawals.map((w) => ({
            ...w,
            amount: w.amount / 100,
        }));
        res.json({
            success: true,
            data: formattedWithdrawals,
        });
    }
    catch (error) {
        logger_1.default.error('Get pending withdrawals error:', error);
        next(error);
    }
}
//# sourceMappingURL=escrowController.js.map