"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
// 日志格式
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.json());
// 创建日志实例
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        // 错误日志 - 写入文件
        new winston_1.default.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // 所有日志 - 写入文件
        new winston_1.default.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880,
            maxFiles: 5
        })
    ]
});
// 开发环境：同时输出到控制台
if (process.env.NODE_ENV !== 'production') {
    exports.logger.add(new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
    }));
}
// 便捷方法
exports.log = {
    info: (message, meta) => exports.logger.info(message, meta),
    error: (message, meta) => exports.logger.error(message, meta),
    warn: (message, meta) => exports.logger.warn(message, meta),
    debug: (message, meta) => exports.logger.debug(message, meta)
};
//# sourceMappingURL=logger.js.map