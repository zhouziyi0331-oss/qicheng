"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const config_1 = require("../../config");
/**
 * ✅ P0安全: 敏感字段列表
 */
const SENSITIVE_KEYS = [
    'password', 'pwd', 'passwd',
    'secret', 'key', 'token',
    'phone', 'mobile', 'tel',
    'openid', 'unionid', 'session_key',
    'access_token', 'refresh_token',
    'credit_card', 'card_number', 'cvv',
    'ssn', 'id_card', 'passport',
    'api_key', 'private_key',
];
/**
 * ✅ P0安全: 递归脱敏函数
 */
function sanitize(obj) {
    if (obj === null || obj === undefined)
        return obj;
    if (typeof obj !== 'object')
        return obj;
    // 处理数组
    if (Array.isArray(obj)) {
        return obj.map(item => sanitize(item));
    }
    // 处理对象
    const sanitized = {};
    for (const key of Object.keys(obj)) {
        const lowerKey = key.toLowerCase();
        const isSensitive = SENSITIVE_KEYS.some(k => lowerKey.includes(k));
        if (isSensitive) {
            sanitized[key] = '***REDACTED***';
        }
        else if (typeof obj[key] === 'object') {
            sanitized[key] = sanitize(obj[key]);
        }
        else {
            sanitized[key] = obj[key];
        }
    }
    return sanitized;
}
const logger = winston_1.default.createLogger({
    level: config_1.config.env === 'production' ? 'info' : 'debug',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), 
    // ✅ P0安全: 添加脱敏格式化
    winston_1.default.format((info) => {
        // 脱敏所有字段
        const sanitized = sanitize(info);
        return sanitized;
    })(), winston_1.default.format.json()),
    defaultMeta: { service: 'qicheng-backend' },
    transports: [
        new winston_1.default.transports.Console({
            format: config_1.config.env !== 'production'
                ? winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
                : winston_1.default.format.json(),
        }),
    ],
});
exports.default = logger;
//# sourceMappingURL=logger.js.map