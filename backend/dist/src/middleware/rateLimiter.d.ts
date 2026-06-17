/**
 * 全局API限流：每IP每秒最多100次请求
 */
export declare const globalLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * 登录接口限流：每IP每分钟最多5次
 */
export declare const loginLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * 短信发送限流：每IP每小时最多10次
 */
export declare const smsLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * AI调用限流：每用户每小时最多50次
 * 需要在认证后使用，基于userId限流
 */
export declare const aiCallLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * 注册接口限流：每IP每小时最多3次
 */
export declare const registerLimiter: import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rateLimiter.d.ts.map