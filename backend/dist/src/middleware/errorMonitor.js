"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMonitor = errorMonitor;
exports.getErrorStats = getErrorStats;
const logger_1 = __importDefault(require("../utils/logger"));
const axios_1 = __importDefault(require("axios"));
/**
 * 异常监控和告警中间件 - 真实实现
 * 功能：
 * 1. 捕获所有未处理的错误
 * 2. 记录详细错误日志
 * 3. 监控错误率
 * 4. 真实发送告警通知（企业微信/钉钉）
 */
// 错误统计
let errorStats = {
    count: 0,
    lastReset: Date.now(),
    errors: [],
};
// 每小时重置错误统计
setInterval(() => {
    const errorRate = errorStats.count;
    // 如果错误率过高，发送告警
    if (errorRate > 100) {
        sendAlert('high_error_rate', `过去1小时有${errorRate}个错误`);
    }
    // 重置统计
    errorStats = {
        count: 0,
        lastReset: Date.now(),
        errors: [],
    };
}, 60 * 60 * 1000); // 1小时
/**
 * 发送告警通知 - 真实发送到企业微信/钉钉
 */
async function sendAlert(type, message) {
    logger_1.default.error(`🚨 [ALERT] ${type}: ${message}`);
    const webhookUrl = process.env.ALERT_WEBHOOK_URL;
    // 如果没有配置Webhook，只记录日志
    if (!webhookUrl || webhookUrl === 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx') {
        logger_1.default.warn('未配置ALERT_WEBHOOK_URL，告警仅记录到日志');
        return;
    }
    try {
        // 真实发送到企业微信
        if (webhookUrl.includes('qyapi.weixin.qq.com')) {
            await axios_1.default.post(webhookUrl, {
                msgtype: 'text',
                text: {
                    content: `🚨 启程项目告警\n\n类型: ${type}\n消息: ${message}\n时间: ${new Date().toLocaleString('zh-CN')}`,
                },
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 5000,
            });
            logger_1.default.info('✅ 告警已发送到企业微信');
        }
        // 真实发送到钉钉
        else if (webhookUrl.includes('oapi.dingtalk.com')) {
            await axios_1.default.post(webhookUrl, {
                msgtype: 'text',
                text: {
                    content: `🚨 启程项目告警\n\n类型: ${type}\n消息: ${message}\n时间: ${new Date().toLocaleString('zh-CN')}`,
                },
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 5000,
            });
            logger_1.default.info('✅ 告警已发送到钉钉');
        }
        // 通用Webhook
        else {
            await axios_1.default.post(webhookUrl, {
                type,
                message,
                timestamp: new Date().toISOString(),
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 5000,
            });
            logger_1.default.info('✅ 告警已发送到Webhook');
        }
    }
    catch (error) {
        logger_1.default.error('❌ 发送告警失败:', error);
    }
}
/**
 * 全局错误处理中间件 - 真实记录和告警
 */
function errorMonitor(err, req, res, _next) {
    // 记录错误统计
    errorStats.count++;
    errorStats.errors.push({
        timestamp: Date.now(),
        message: err.message || 'Unknown error',
        path: req.path,
        statusCode: err.statusCode || 500,
    });
    // 记录详细日志
    logger_1.default.error('API Error:', {
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.body,
        user: req.user?.userId,
        ip: req.ip,
        error: {
            message: err.message,
            stack: err.stack,
            statusCode: err.statusCode,
            code: err.code,
        },
    });
    // 检查是否需要立即告警
    const recentErrors = errorStats.errors.filter(e => Date.now() - e.timestamp < 5 * 60 * 1000 // 5分钟内
    );
    // 5分钟内超过50个500错误，立即告警
    const critical500Errors = recentErrors.filter(e => e.statusCode >= 500);
    if (critical500Errors.length > 50) {
        sendAlert('critical_error_rate', `5分钟内有${critical500Errors.length}个500错误！`);
    }
    // 检查是否有严重错误需要立即告警
    if (err.statusCode === 500 || err.code === 'ECONNREFUSED') {
        const errorMessage = `严重错误: ${err.message} (${req.method} ${req.path})`;
        sendAlert('critical_error', errorMessage);
    }
    // 返回错误响应
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        error: err.message || 'Internal Server Error',
        code: err.code || 'INTERNAL_ERROR',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
}
/**
 * 获取错误统计 - 真实统计数据
 */
function getErrorStats() {
    const now = Date.now();
    const uptimeHours = (now - errorStats.lastReset) / (60 * 60 * 1000);
    return {
        totalErrors: errorStats.count,
        errorRate: Math.round(errorStats.count / uptimeHours),
        recentErrors: errorStats.errors.slice(-10), // 最近10个错误
        lastReset: new Date(errorStats.lastReset).toISOString(),
        uptimeHours: Math.round(uptimeHours * 100) / 100,
    };
}
//# sourceMappingURL=errorMonitor.js.map