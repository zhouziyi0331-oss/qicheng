"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelWithdrawal = exports.getWithdrawalRecords = exports.requestWithdrawal = exports.getIncomeStats = exports.getIncomeRecords = exports.getBalance = void 0;
const financial_service_1 = require("../services/financial.service");
const logger_1 = require("../utils/logger");
/**
 * 财务控制器
 * 处理收入、提现相关
 */
/**
 * GET /api/financial/balance
 * 获取用户余额
 */
const getBalance = async (req, res) => {
    try {
        const userId = req.userId;
        const balance = await financial_service_1.financialService.getUserBalance(userId);
        res.json({
            success: true,
            data: balance
        });
    }
    catch (error) {
        logger_1.log.error('获取余额失败', { error: error.message });
        res.status(500).json({ error: '获取余额失败' });
    }
};
exports.getBalance = getBalance;
/**
 * GET /api/financial/income
 * 获取收入记录
 */
const getIncomeRecords = async (req, res) => {
    try {
        const userId = req.userId;
        const { status, source, page, limit } = req.query;
        const options = {};
        if (status)
            options.status = status;
        if (source)
            options.source = source;
        if (page)
            options.page = parseInt(page);
        if (limit)
            options.limit = parseInt(limit);
        const result = await financial_service_1.financialService.getIncomeRecords(userId, options);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.log.error('获取收入记录失败', { error: error.message });
        res.status(500).json({ error: '获取收入记录失败' });
    }
};
exports.getIncomeRecords = getIncomeRecords;
/**
 * GET /api/financial/income/stats
 * 获取收入统计
 */
const getIncomeStats = async (req, res) => {
    try {
        const userId = req.userId;
        const stats = await financial_service_1.financialService.getIncomeStats(userId);
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        logger_1.log.error('获取收入统计失败', { error: error.message });
        res.status(500).json({ error: '获取收入统计失败' });
    }
};
exports.getIncomeStats = getIncomeStats;
/**
 * POST /api/financial/withdrawal/request
 * 申请提现
 */
const requestWithdrawal = async (req, res) => {
    try {
        const userId = req.userId;
        const { amount, withdrawalMethod, withdrawalAccount } = req.body;
        if (!amount || !withdrawalMethod || !withdrawalAccount) {
            return res.status(400).json({ error: '请填写完整提现信息' });
        }
        const withdrawal = await financial_service_1.financialService.requestWithdrawal(userId, {
            amount: parseFloat(amount),
            withdrawalMethod,
            withdrawalAccount
        });
        res.json({
            success: true,
            data: withdrawal,
            message: '提现申请已提交，预计1-3个工作日到账'
        });
    }
    catch (error) {
        logger_1.log.error('申请提现失败', { error: error.message });
        res.status(400).json({ error: error.message || '申请提现失败' });
    }
};
exports.requestWithdrawal = requestWithdrawal;
/**
 * GET /api/financial/withdrawal
 * 获取提现记录
 */
const getWithdrawalRecords = async (req, res) => {
    try {
        const userId = req.userId;
        const { status, page, limit } = req.query;
        const options = {};
        if (status)
            options.status = status;
        if (page)
            options.page = parseInt(page);
        if (limit)
            options.limit = parseInt(limit);
        const result = await financial_service_1.financialService.getWithdrawalRecords(userId, options);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.log.error('获取提现记录失败', { error: error.message });
        res.status(500).json({ error: '获取提现记录失败' });
    }
};
exports.getWithdrawalRecords = getWithdrawalRecords;
/**
 * POST /api/financial/withdrawal/:id/cancel
 * 取消提现
 */
const cancelWithdrawal = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const withdrawal = await financial_service_1.financialService.cancelWithdrawal(userId, id);
        res.json({
            success: true,
            data: withdrawal,
            message: '提现已取消'
        });
    }
    catch (error) {
        logger_1.log.error('取消提现失败', { error: error.message });
        res.status(400).json({ error: error.message || '取消提现失败' });
    }
};
exports.cancelWithdrawal = cancelWithdrawal;
//# sourceMappingURL=financial.controller.js.map