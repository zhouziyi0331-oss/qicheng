/**
 * 全局测试环境初始化
 * 确保测试数据库连接可用，清理上次测试数据
 */
import { Pool } from 'pg';
import Redis from 'ioredis';

// Test phone numbers used across all test files
const TEST_PHONES = ['13900000001', '13900000002', '13900000003', '13900000004'];

export default async function globalSetup() {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/qicheng';
  process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
  process.env.JWT_ACCESS_SECRET = 'test-access-secret-min-32-characters!!';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-min-32-characters!!';
  process.env.AI_SERVICE_URL = 'http://localhost:8001';

  // Clear SMS rate-limit and verification code keys from previous runs
  const redisClient = new Redis(process.env.REDIS_URL!);
  const keysToDelete = TEST_PHONES.flatMap(phone => [
    `sms:rate:${phone}`,
    `sms:code:${phone}`,
  ]);
  await redisClient.del(...keysToDelete);
  await redisClient.quit();

  // 清理测试手机号注册的用户，避免数据残留影响测试
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    // Delete in dependency order (FK constraints)
    await pool.query(`
      DELETE FROM growth_timeline WHERE user_id IN (SELECT id FROM users WHERE phone LIKE '1390000%');
      DELETE FROM onboarding_status WHERE user_id IN (SELECT id FROM users WHERE phone LIKE '1390000%');
      DELETE FROM student_balances WHERE user_id IN (SELECT id FROM users WHERE phone LIKE '1390000%');
      DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE phone LIKE '1390000%');
      DELETE FROM student_profiles WHERE user_id IN (SELECT id FROM users WHERE phone LIKE '1390000%');
      DELETE FROM company_profiles WHERE user_id IN (SELECT id FROM users WHERE phone LIKE '1390000%');
      DELETE FROM users WHERE phone LIKE '1390000%';
    `);
  } finally {
    await pool.end();
  }
}
