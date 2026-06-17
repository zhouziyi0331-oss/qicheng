"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerLimiter = exports.aiCallLimiter = exports.smsLimiter = exports.loginLimiter = exports.globalLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
/**
 * 全局API限流：每IP每秒最多100次请求
 */
exports.globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1000, // 1秒
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json({
            error: '请求过于频繁，请稍后再试',
            code: 'RATE_LIMIT_EXCEEDED'
        });
    },
});
/**
 * 登录接口限流：每IP每分钟最多5次
 */
exports.loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1分钟
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json({
            error: '登录尝试次数过多，请1分钟后再试',
            code: 'LOGIN_RATE_LIMIT'
        });
    },
});
/**
 * 短信发送限流：每IP每小时最多10次
 */
exports.smsLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1小时
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json({
            error: '短信发送过于频繁，请稍后再试',
            code: 'SMS_RATE_LIMIT'
        });
    },
});
/**
 * AI调用限流：每用户每小时最多50次
 * 需要在认证后使用，基于userId限流
 */
exports.aiCallLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1小时
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // 使用userId作为key
        return req.user?.userId || req.ip;
    },
    handler: (_req, res) => {
        res.status(429).json({
            error: 'AI调用次数已达上限，请1小时后再试',
            code: 'AI_RATE_LIMIT'
        });
    },
});
/**
 * 注册接口限流：每IP每小时最多3次
 */
exports.registerLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1小时
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json({
            error: '注册请求过于频繁，请1小时后再试',
            code: 'REGISTER_RATE_LIMIT'
        });
    },
});
//# sourceMappingURL=rateLimiter.js.map