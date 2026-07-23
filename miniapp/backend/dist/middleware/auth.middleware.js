"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.optionalAuthMiddleware = exports.authenticateToken = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    try {
        // 从header获取token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: '未提供认证token' });
        }
        const token = authHeader.substring(7);
        const jwtSecret = process.env.JWT_SECRET || 'default-secret-key';
        // 验证token
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        // 将用户信息附加到request
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({ error: 'Token已过期' });
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(401).json({ error: '无效的Token' });
        }
        return res.status(500).json({ error: '认证失败' });
    }
};
exports.authMiddleware = authMiddleware;
// 别名导出，保持向后兼容
exports.authenticateToken = exports.authMiddleware;
// 可选的认证中间件（token可选）
const optionalAuthMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const jwtSecret = process.env.JWT_SECRET || 'default-secret-key';
            const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
            req.userId = decoded.userId;
            req.userRole = decoded.role;
        }
        next();
    }
    catch (error) {
        // 忽略错误，继续处理请求
        next();
    }
};
exports.optionalAuthMiddleware = optionalAuthMiddleware;
// 管理员权限中间件（必须先经过authMiddleware）
const requireAdmin = (req, res, next) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: '未授权' });
        }
        if (req.userRole !== 'admin') {
            return res.status(403).json({ error: '权限不足，需要管理员权限' });
        }
        next();
    }
    catch (error) {
        return res.status(500).json({ error: '权限验证失败' });
    }
};
exports.requireAdmin = requireAdmin;
//# sourceMappingURL=auth.middleware.js.map