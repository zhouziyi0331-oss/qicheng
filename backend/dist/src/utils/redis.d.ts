import Redis from 'ioredis';
declare const redis: Redis;
export default redis;
/**
 * Store SMS verification code (TTL = 60 seconds).
 */
export declare function storeSmsCode(phone: string, code: string): Promise<void>;
/**
 * Verify SMS code. Deletes it after successful verification.
 */
export declare function verifySmsCode(phone: string, code: string): Promise<boolean>;
/**
 * Acquire a distributed lock. Returns true if acquired.
 */
export declare function acquireLock(key: string, ttlSeconds?: number): Promise<boolean>;
export declare function releaseLock(key: string): Promise<void>;
/**
 * Check if a payment_id has been processed.
 * Returns true if it's a duplicate (already processed).
 */
export declare function isPaymentDuplicate(paymentId: string): Promise<boolean>;
//# sourceMappingURL=redis.d.ts.map