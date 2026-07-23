"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authLimiter = exports.aiLimiter = exports.apiLimiter = exports.rateLimiter = void 0;
const store = {};
const rateLimiter = (options) => {
    return (req, res, next) => {
        const key = req.userId || req.ip || 'anonymous';
        const now = Date.now();
        if (!store[key] || now > store[key].resetTime) {
            // 新的时间窗口
            store[key] = {
                count: 1,
                resetTime: now + options.windowMs
            };
            return next();
        }
        store[key].count++;
        if (store[key].count > options.maxRequests) {
            return res.status(429).json({
                error: options.message || '请求过于频繁，请稍后再试',
                retryAfter: Math.ceil((store[key].resetTime - now) / 1000)
            });
        }
        next();
    };
};
exports.rateLimiter = rateLimiter;
// 预设的限流器
exports.apiLimiter = (0, exports.rateLimiter)({
    windowMs: 15 * 60 * 1000, // 15分钟
    maxRequests: 100,
    message: '请求过于频繁，请15分钟后再试'
});
exports.aiLimiter = (0, exports.rateLimiter)({
    windowMs: 60 * 60 * 1000, // 1小时
    maxRequests: 10,
    message: 'AI生成次数已达上限，请1小时后再试'
});
exports.authLimiter = (0, exports.rateLimiter)({
    windowMs: 15 * 60 * 1000, // 15分钟
    maxRequests: 5,
    message: '登录尝试次数过多，请15分钟后再试'
});
//# sourceMappingURL=rateLimiter.middleware.js.map