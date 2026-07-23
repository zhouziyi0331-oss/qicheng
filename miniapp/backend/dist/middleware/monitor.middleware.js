"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statisticsCollector = exports.getStats = exports.performanceMonitor = void 0;
const logger_1 = require("../utils/logger");
/**
 * 性能监控中间件
 * 记录每个请求的响应时间
 */
const performanceMonitor = (req, res, next) => {
    const startTime = Date.now();
    // 监听响应完成
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const { method, path, statusCode } = { method: req.method, path: req.path, statusCode: res.statusCode };
        // 记录慢请求（超过1秒）
        if (duration > 1000) {
            logger_1.log.warn('慢请求警告', {
                method,
                path,
                duration: `${duration}ms`,
                statusCode,
                userId: req.userId
            });
        }
        // 记录错误请求
        if (statusCode >= 400) {
            logger_1.log.error('请求错误', {
                method,
                path,
                duration: `${duration}ms`,
                statusCode,
                userId: req.userId,
                userAgent: req.headers['user-agent']
            });
        }
        // 正常请求只在debug模式记录
        if (statusCode < 400 && process.env.LOG_LEVEL === 'debug') {
            logger_1.log.debug('请求完成', {
                method,
                path,
                duration: `${duration}ms`,
                statusCode
            });
        }
    });
    next();
};
exports.performanceMonitor = performanceMonitor;
const stats = {};
const getStats = () => {
    return stats;
};
exports.getStats = getStats;
/**
 * 统计中间件
 */
const statisticsCollector = (req, res, next) => {
    const startTime = Date.now();
    const path = req.path;
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const isSuccess = res.statusCode < 400;
        if (!stats[path]) {
            stats[path] = {
                total: 0,
                success: 0,
                error: 0,
                avgDuration: 0
            };
        }
        stats[path].total++;
        if (isSuccess) {
            stats[path].success++;
        }
        else {
            stats[path].error++;
        }
        // 更新平均响应时间
        stats[path].avgDuration =
            (stats[path].avgDuration * (stats[path].total - 1) + duration) / stats[path].total;
    });
    next();
};
exports.statisticsCollector = statisticsCollector;
//# sourceMappingURL=monitor.middleware.js.map