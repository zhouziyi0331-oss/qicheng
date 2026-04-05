"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeSmsCode = storeSmsCode;
exports.verifySmsCode = verifySmsCode;
exports.acquireLock = acquireLock;
exports.releaseLock = releaseLock;
exports.isPaymentDuplicate = isPaymentDuplicate;
const ioredis_1 = __importDefault(require("ioredis"));
const config_1 = require("../../config");
const logger_1 = __importDefault(require("./logger"));
const redis = new ioredis_1.default(config_1.config.redis.url, {
    lazyConnect: true,
    retryStrategy: (times) => Math.min(times * 50, 2000),
});
redis.on('connect', () => logger_1.default.info('Redis connected'));
redis.on('error', (err) => logger_1.default.error('Redis error', { error: err.message }));
exports.default = redis;
// ============================================================
// 验证码管理
// ============================================================
/**
 * Store SMS verification code (TTL = 60 seconds).
 */
async function storeSmsCode(phone, code) {
    await redis.setex(`sms:${phone}`, 60, code);
}
/**
 * Verify SMS code. Deletes it after successful verification.
 */
async function verifySmsCode(phone, code) {
    const stored = await redis.get(`sms:${phone}`);
    if (stored === code) {
        await redis.del(`sms:${phone}`);
        return true;
    }
    return false;
}
// ============================================================
// 分布式锁
// ============================================================
/**
 * Acquire a distributed lock. Returns true if acquired.
 */
async function acquireLock(key, ttlSeconds = 30) {
    const result = await redis.set(`lock:${key}`, '1', 'EX', ttlSeconds, 'NX');
    return result === 'OK';
}
async function releaseLock(key) {
    await redis.del(`lock:${key}`);
}
// ============================================================
// 幂等性检查 (支付)
// ============================================================
/**
 * Check if a payment_id has been processed.
 * Returns true if it's a duplicate (already processed).
 */
async function isPaymentDuplicate(paymentId) {
    const key = `payment:idem:${paymentId}`;
    const result = await redis.set(key, '1', 'EX', 86400, 'NX'); // 24h
    return result !== 'OK'; // OK = first time, null = duplicate
}
//# sourceMappingURL=redis.js.map