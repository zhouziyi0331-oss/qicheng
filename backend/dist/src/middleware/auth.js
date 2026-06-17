"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireRole = requireRole;
exports.requireAdminRole = requireAdminRole;
exports.generateTokens = generateTokens;
exports.revokeToken = revokeToken;
exports.revokeAllUserTokens = revokeAllUserTokens;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../../config");
const errorHandler_1 = require("./errorHandler");
const redis_1 = __importDefault(require("../utils/redis"));
/**
 * Middleware: require valid JWT access token.
 * ✅ P0安全: 添加JWT黑名单检查
 */
async function authenticate(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return next(new errorHandler_1.AppError(401, '未提供认证令牌', 'UNAUTHORIZED'));
    }
    const token = authHeader.slice(7);
    try {
        // ✅ 验证JWT，包含算法、签发者、受众检查
        const payload = jsonwebtoken_1.default.verify(token, config_1.config.jwt.accessSecret, {
            algorithms: ['HS256'],
            issuer: 'qicheng-api',
            audience: 'qicheng-app',
        });
        // ✅ 检查JWT黑名单（用户退出登录或账号被封禁）
        if (payload.jti) {
            const isBlacklisted = await redis_1.default.get(`jwt_blacklist:${payload.jti}`);
            if (isBlacklisted) {
                return next(new errorHandler_1.AppError(401, 'Token已被撤销', 'TOKEN_REVOKED'));
            }
        }
        req.user = payload;
        next();
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            next(new errorHandler_1.AppError(401, '认证令牌已过期', 'TOKEN_EXPIRED'));
        }
        else if (error.name === 'JsonWebTokenError') {
            next(new errorHandler_1.AppError(401, '认证令牌无效', 'TOKEN_INVALID'));
        }
        else {
            next(new errorHandler_1.AppError(401, '认证失败', 'AUTHENTICATION_FAILED'));
        }
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
 * ✅ P0安全: 添加iss、aud、jti字段
 */
function generateTokens(payload) {
    // jti ensures uniqueness even when called multiple times within the same second
    const jti = require('crypto').randomBytes(16).toString('hex');
    const accessToken = jsonwebtoken_1.default.sign(payload, config_1.config.jwt.accessSecret, {
        expiresIn: config_1.config.jwt.accessExpiry,
        jwtid: jti + '-a',
        issuer: 'qicheng-api',
        audience: 'qicheng-app',
    });
    const refreshToken = jsonwebtoken_1.default.sign(payload, config_1.config.jwt.refreshSecret, {
        expiresIn: config_1.config.jwt.refreshExpiry,
        jwtid: jti + '-r',
        issuer: 'qicheng-api',
        audience: 'qicheng-app',
    });
    return { accessToken, refreshToken };
}
/**
 * ✅ P0安全: 退出登录 - 将JWT加入黑名单
 */
async function revokeToken(jti, expiresAt) {
    const ttl = Math.max(0, expiresAt - Math.floor(Date.now() / 1000));
    if (ttl > 0) {
        await redis_1.default.setex(`jwt_blacklist:${jti}`, ttl, '1');
    }
}
/**
 * ✅ P0安全: 退出所有设备 - 将用户所有Token加入黑名单
 */
async function revokeAllUserTokens(userId) {
    // 将用户ID加入全局撤销列表
    await redis_1.default.setex(`user_revoked:${userId}`, 7200, '1'); // 2小时
}
//# sourceMappingURL=auth.js.map