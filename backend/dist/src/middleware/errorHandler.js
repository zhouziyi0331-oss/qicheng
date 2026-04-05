"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
const logger_1 = __importDefault(require("../utils/logger"));
class AppError extends Error {
    constructor(statusCode, message, code) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.code = code;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
function errorHandler(err, req, res, _next) {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            code: err.code || 'ERROR',
            message: err.message,
        });
        return;
    }
    // Unexpected errors
    logger_1.default.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });
    res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        message: '服务器内部错误，请稍后重试',
    });
}
function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: `路由 ${req.method} ${req.path} 不存在`,
    });
}
//# sourceMappingURL=errorHandler.js.map