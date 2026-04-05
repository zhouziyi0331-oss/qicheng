"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBalance = getBalance;
exports.getHistory = getHistory;
exports.requestWithdrawal = requestWithdrawal;
exports.wechatNotify = wechatNotify;
exports.alipayNotify = alipayNotify;
const db_1 = require("../../utils/db");
const errorHandler_1 = require("../../middleware/errorHandler");
const config_1 = require("../../../config");
const logger_1 = __importDefault(require("../../utils/logger"));
// GET /payments/balance
async function getBalance(req, res, next) {
    try {
        const userId = req.user.userId;
        const balance = await (0, db_1.queryOne)('SELECT balance, total_earned, total_withdrawn FROM student_balances WHERE user_id = $1', [userId]);
        res.json({ success: true, data: balance });
    }
    catch (err) {
        next(err);
    }
}
// GET /payments/history
async function getHistory(req, res, next) {
    try {
        const userId = req.user.userId;
        const payments = await (0, db_1.query)(`SELECT p.id, p.net_amount, p.status, p.is_first_task, p.settled_at,
              p.created_at, t.title as task_title
       FROM payments p
       LEFT JOIN tasks t ON t.id = p.task_id
       WHERE p.student_id = $1 AND p.deleted_at IS NULL
       ORDER BY p.created_at DESC LIMIT 50`, [userId]);
        res.json({ success: true, data: payments });
    }
    catch (err) {
        next(err);
    }
}
// POST /payments/withdraw — 申请提现
async function requestWithdrawal(req, res, next) {
    try {
        const userId = req.user.userId;
        const { amount, method, accountInfo } = req.body;
        const withdrawAmount = parseFloat(amount);
        if (isNaN(withdrawAmount) || withdrawAmount < config_1.config.platform.minWithdrawalAmount) {
            throw new errorHandler_1.AppError(400, `最低提现金额 ¥${config_1.config.platform.minWithdrawalAmount}`, 'AMOUNT_TOO_LOW');
        }
        if (!['wechat', 'alipay'].includes(method)) {
            throw new errorHandler_1.AppError(400, '提现方式仅支持微信和支付宝', 'INVALID_METHOD');
        }
        const balance = await (0, db_1.queryOne)('SELECT balance FROM student_balances WHERE user_id = $1', [userId]);
        if (!balance || balance.balance < withdrawAmount) {
            throw new errorHandler_1.AppError(400, '余额不足', 'INSUFFICIENT_BALANCE');
        }
        await (0, db_1.withTransaction)(async (client) => {
            // 乐观锁扣减余额
            await (0, db_1.updateBalanceOptimistic)(client, userId, -withdrawAmount);
            // 创建提现记录
            const autoProcessed = withdrawAmount <= config_1.config.platform.autoWithdrawalLimit;
            await client.query(`INSERT INTO withdrawals (user_id, amount, method, account_info, status, auto_processed)
         VALUES ($1,$2,$3,$4,$5,$6)`, [userId, withdrawAmount, method, accountInfo, 'pending', autoProcessed]);
            // 更新 total_withdrawn
            await client.query(`UPDATE student_balances
         SET total_withdrawn = total_withdrawn + $1
         WHERE user_id = $2`, [withdrawAmount, userId]);
        });
        const isAuto = withdrawAmount <= config_1.config.platform.autoWithdrawalLimit;
        res.json({
            success: true,
            message: isAuto
                ? '提现申请已提交，T+1工作日到账'
                : '提现申请已提交，需财务审核，T+3工作日到账',
            data: { amount: withdrawAmount, autoProcessed: isAuto },
        });
    }
    catch (err) {
        next(err);
    }
}
// ============================================================
// 支付回调 (微信/支付宝)
// 幂等性: 使用 payment_id 防止重复处理
// ============================================================
async function wechatNotify(req, res, _next) {
    try {
        // TODO: 验证微信签名
        const { out_trade_no: paymentId, trade_state: state } = req.body;
        if (state !== 'SUCCESS') {
            res.send('<xml><return_code>SUCCESS</return_code></xml>');
            return;
        }
        await processPaymentSuccess(paymentId);
        res.send('<xml><return_code>SUCCESS</return_code></xml>');
    }
    catch (err) {
        logger_1.default.error('WeChat notify error', { error: err.message });
        res.status(500).send('<xml><return_code>FAIL</return_code></xml>');
    }
}
async function alipayNotify(req, res, _next) {
    try {
        // TODO: 验证支付宝签名
        const { out_trade_no: paymentId, trade_status: state } = req.body;
        if (!['TRADE_SUCCESS', 'TRADE_FINISHED'].includes(state)) {
            res.send('success');
            return;
        }
        await processPaymentSuccess(paymentId);
        res.send('success');
    }
    catch (err) {
        logger_1.default.error('Alipay notify error', { error: err.message });
        res.send('fail');
    }
}
// ============================================================
// 内部: 处理支付成功 (幂等)
// ============================================================
async function processPaymentSuccess(paymentId) {
    const payment = await (0, db_1.queryOne)(`SELECT id, student_id, status, net_amount, is_first_task
     FROM payments WHERE payment_id = $1`, [paymentId]);
    if (!payment) {
        logger_1.default.warn('Payment not found for notify', { paymentId });
        return;
    }
    if (payment.status !== 'pending') {
        // 幂等: 已处理，忽略
        logger_1.default.info('Duplicate payment notify ignored', { paymentId, status: payment.status });
        return;
    }
    await (0, db_1.withTransaction)(async (client) => {
        await client.query(`UPDATE payments SET status = 'escrowed' WHERE payment_id = $1`, [paymentId]);
        // 首单: 立即加入余额 (24h到账由 cron job 发通知)
        if (payment.is_first_task) {
            await (0, db_1.updateBalanceOptimistic)(client, payment.student_id, payment.net_amount);
            await client.query(`UPDATE payments SET status = 'settled', settled_at = NOW() WHERE payment_id = $1`, [paymentId]);
        }
    });
    logger_1.default.info('Payment processed', { paymentId, studentId: payment.student_id });
}
//# sourceMappingURL=controller.js.map