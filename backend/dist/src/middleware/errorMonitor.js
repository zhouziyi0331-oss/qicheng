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
 * 强制发送告警 - 必须配置Webhook
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
    if (errorRate > 100) {
        sendAlert('high_error_rate', `过去1小时有${errorRate}个错误`);
    }
    errorStats = {
        count: 0,
        lastReset: Date.now(),
        errors: [],
    };
}, 60 * 60 * 1000);
/**
 * 发送告警通知 - 强制发送，必须配置Webhook
 */
async function sendAlert(type, message) {
    logger_1.default.error(`🚨 [ALERT] ${type}: ${message}`);
    const webhookUrl = process.env.ALERT_WEBHOOK_URL;
    // 强制要求配置Webhook
    if (!webhookUrl || webhookUrl === 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx') {
        logger_1.default.error('❌ 未配置ALERT_WEBHOOK_URL，告警无法发送！请在.env中配置企业微信/钉钉Webhook');
        throw new Error('告警系统未配置，请配置ALERT_WEBHOOK_URL');
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
        throw new Error('告警发送失败: ' + error.message);
    }
}
/**
 * 全局错误处理中间件
 */
function errorMonitor(err, req, res, _next) {
    errorStats.count++;
    errorStats.errors.push({
        timestamp: Date.now(),
        message: err.message || 'Unknown error',
        path: req.path,
        statusCode: err.statusCode || 500,
    });
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
    const recentErrors = errorStats.errors.filter(e => Date.now() - e.timestamp < 5 * 60 * 1000);
    const critical500Errors = recentErrors.filter(e => e.statusCode >= 500);
    if (critical500Errors.length > 50) {
        sendAlert('critical_error_rate', `5分钟内有${critical500Errors.length}个500错误！`).catch(e => {
            logger_1.default.error('发送紧急告警失败:', e);
        });
    }
    if (err.statusCode === 500 || err.code === 'ECONNREFUSED') {
        const errorMessage = `严重错误: ${err.message} (${req.method} ${req.path})`;
        sendAlert('critical_error', errorMessage).catch(e => {
            logger_1.default.error('发送严重错误告警失败:', e);
        });
    }
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        error: err.message || 'Internal Server Error',
        code: err.code || 'INTERNAL_ERROR',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
}
/**
 * 获取错误统计
 */
function getErrorStats() {
    const now = Date.now();
    const uptimeHours = (now - errorStats.lastReset) / (60 * 60 * 1000);
    return {
        totalErrors: errorStats.count,
        errorRate: Math.round(errorStats.count / uptimeHours),
        recentErrors: errorStats.errors.slice(-10),
        lastReset: new Date(errorStats.lastReset).toISOString(),
        uptimeHours: Math.round(uptimeHours * 100) / 100,
    };
}
//# sourceMappingURL=errorMonitor.js.map