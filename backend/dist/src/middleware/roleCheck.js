"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAnyRole = exports.requireRole = void 0;
/**
 * 角色检查中间件
 * 确保用户具有指定的角色
 */
const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '未登录',
            });
        }
        if (req.user.role !== role) {
            return res.status(403).json({
                success: false,
                message: '权限不足',
            });
        }
        next();
    };
};
exports.requireRole = requireRole;
/**
 * 多角色检查中间件
 * 允许多个角色访问
 */
const requireAnyRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '未登录',
            });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: '权限不足',
            });
        }
        next();
    };
};
exports.requireAnyRole = requireAnyRole;
//# sourceMappingURL=roleCheck.js.map