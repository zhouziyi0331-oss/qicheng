"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireRole = requireRole;
exports.requireAdminRole = requireAdminRole;
exports.generateTokens = generateTokens;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../../config");
const errorHandler_1 = require("./errorHandler");
/**
 * Middleware: require valid JWT access token.
 */
function authenticate(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return next(new errorHandler_1.AppError(401, '未提供认证令牌', 'UNAUTHORIZED'));
    }
    const token = authHeader.slice(7);
    try {
        const payload = jsonwebtoken_1.default.verify(token, config_1.config.jwt.accessSecret);
        req.user = payload;
        next();
    }
    catch {
        next(new errorHandler_1.AppError(401, '认证令牌无效或已过期', 'TOKEN_INVALID'));
    }
}
/**
 * Middleware: require specific role(s).
 */
function requireRole(...roles) {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new errorHandler_1.AppError(401, '请先登录', 'UNAUTHORIZED'));
        }
        if (!roles.includes(req.user.role)) {
            return next(new errorHandler_1.AppError(403, '权限不足', 'FORBIDDEN'));
        }
        next();
    };
}
/**
 * Middleware: require admin role.
 */
function requireAdminRole(...adminRoles) {
    return (req, _res, next) => {
        if (!req.user || req.user.role !== 'admin') {
            return next(new errorHandler_1.AppError(403, '需要管理员权限', 'FORBIDDEN'));
        }
        if (adminRoles.length > 0 && req.user.adminRole && !adminRoles.includes(req.user.adminRole)) {
            return next(new errorHandler_1.AppError(403, `需要 ${adminRoles.join('/')} 管理员权限`, 'FORBIDDEN'));
        }
        next();
    };
}
/**
 * Generate access + refresh token pair.
 */
function generateTokens(payload) {
    const accessToken = jsonwebtoken_1.default.sign(payload, config_1.config.jwt.accessSecret, {
        expiresIn: config_1.config.jwt.accessExpiry,
    });
    const refreshToken = jsonwebtoken_1.default.sign(payload, config_1.config.jwt.refreshSecret, {
        expiresIn: config_1.config.jwt.refreshExpiry,
    });
    return { accessToken, refreshToken };
}
//# sourceMappingURL=auth.js.map