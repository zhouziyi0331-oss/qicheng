"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityHeaders = securityHeaders;
exports.removeServerHeaders = removeServerHeaders;
/**
 * 安全响应头中间件
 * 添加各种安全相关的HTTP响应头
 */
function securityHeaders(_req, res, next) {
    // 禁止浏览器MIME类型嗅探
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // 防止点击劫持
    res.setHeader('X-Frame-Options', 'DENY');
    // 启用XSS过滤（虽然现代浏览器已弃用，但保留兼容性）
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // 限制Referrer信息泄露
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // 权限策略：禁用不需要的浏览器功能
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    // 如果是HTTPS，添加HSTS（HTTP严格传输安全）
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    next();
}
/**
 * 移除敏感响应头
 * 隐藏服务器技术栈信息
 */
function removeServerHeaders(_req, res, next) {
    // 移除X-Powered-By头（Express默认会添加）
    res.removeHeader('X-Powered-By');
    next();
}
//# sourceMappingURL=securityHeaders.js.map