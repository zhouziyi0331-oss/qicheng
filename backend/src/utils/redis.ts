import Redis from 'ioredis';
import { config } from '../../config';
import logger from './logger';

const redis = new Redis(config.redis.url, {
  lazyConnect: true,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error('Redis error', { error: err.message }));

export default redis;

// ============================================================
// 验证码管理
// ============================================================

/**
 * Store SMS verification code (TTL = 60 seconds).
 */
export async function storeSmsCode(phone: string, code: string): Promise<void> {
  await redis.setex(`sms:${phone}`, 60, code);
}

/**
 * Verify SMS code. Deletes it after successful verification.
 */
export async function verifySmsCode(phone: string, code: string): Promise<boolean> {
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
export async function acquireLock(key: string, ttlSeconds = 30): Promise<boolean> {
  const result = await redis.set(`lock:${key}`, '1', 'EX', ttlSeconds, 'NX');
  return result === 'OK';
}

export async function releaseLock(key: string): Promise<void> {
  await redis.del(`lock:${key}`);
}

// ============================================================
// 幂等性检查 (支付)
// ============================================================

/**
 * Check if a payment_id has been processed.
 * Returns true if it's a duplicate (already processed).
 */
export async function isPaymentDuplicate(paymentId: string): Promise<boolean> {
  const key = `payment:idem:${paymentId}`;
  const result = await redis.set(key, '1', 'EX', 86400, 'NX'); // 24h
  return result !== 'OK'; // OK = first time, null = duplicate
}
