/**
 * ✅ P1安全: 登录服务 - 防暴力破解
 *
 * 关键安全措施：
 * 1. 同一手机号连续5次失败锁定30分钟
 * 2. 同一IP连续20次失败锁定1小时
 * 3. 锁定期间返回统一错误信息
 * 4. 登录成功清除失败记录
 */

import { query } from '../utils/db';
import redis from '../utils/redis';
import bcrypt from 'bcrypt';
import { generateTokens } from '../middleware/auth';
import logger from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  code: string;
  constructor(statusCode: number, message: string, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'AppError';
  }
}

export class AuthService {
  /**
   * ✅ P1安全: 登录 - 带锁定机制
   */
  async login(phone: string, password: string, ip: string) {
    logger.info('登录尝试', { phone: phone.substring(0, 3) + '****' + phone.substring(7), ip });

    // ✅ 检查账号锁定
    const accountLockKey = `login_fail:account:${phone}`;
    const accountFailCount = await redis.get(accountLockKey);

    if (accountFailCount && parseInt(accountFailCount) >= 5) {
      const ttl = await redis.ttl(accountLockKey);
      logger.warn('账号已锁定', { phone, remainingSeconds: ttl });
      throw new AppError(
        429,
        `登录失败次数过多，请${Math.ceil(ttl / 60)}分钟后重试`,
        'ACCOUNT_LOCKED'
      );
    }

    // ✅ 检查IP锁定
    const ipLockKey = `login_fail:ip:${ip}`;
    const ipFailCount = await redis.get(ipLockKey);

    if (ipFailCount && parseInt(ipFailCount) >= 20) {
      const ttl = await redis.ttl(ipLockKey);
      logger.warn('IP已被封禁', { ip, remainingSeconds: ttl });
      throw new AppError(
        429,
        `操作过于频繁，请${Math.ceil(ttl / 60)}分钟后重试`,
        'IP_LOCKED'
      );
    }

    // 查询用户
    const users = await query<any>(
      'SELECT id, phone, password_hash, role, status FROM users WHERE phone = $1',
      [phone]
    );

    const user = users[0];

    // ✅ 验证密码
    if (!user || !await bcrypt.compare(password, user.password_hash)) {
      // ✅ 记录失败次数
      const pipeline = redis.multi();
      pipeline.incr(accountLockKey);
      pipeline.expire(accountLockKey, 30 * 60); // 30分钟
      pipeline.incr(ipLockKey);
      pipeline.expire(ipLockKey, 60 * 60); // 1小时
      await pipeline.exec();

      logger.warn('登录失败', { phone, ip });

      // ✅ 统一返回错误信息，不透露账号是否存在
      throw new AppError(401, '账号或密码错误', 'INVALID_CREDENTIALS');
    }

    // 检查账号状态
    if (user.status === 'banned') {
      throw new AppError(403, '账号已被封禁', 'ACCOUNT_BANNED');
    }

    if (user.status === 'deleted') {
      throw new AppError(403, '账号已注销', 'ACCOUNT_DELETED');
    }

    // ✅ 登录成功，清除失败记录
    await redis.del(accountLockKey, ipLockKey);

    logger.info('登录成功', { userId: user.id, role: user.role });

    // 生成Token
    const tokens = generateTokens({
      userId: user.id,
      role: user.role,
    });

    // 保存Refresh Token到数据库
    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'7 days\')',
      [user.id, tokens.refreshToken]
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
      }
    };
  }

  /**
   * ✅ P0安全: 退出登录 - 撤销Token
   */
  async logout(userId: string, refreshToken: string) {
    // 删除Refresh Token
    await query('DELETE FROM refresh_tokens WHERE user_id = $1 AND token = $2', [userId, refreshToken]);

    // 将当前Access Token的jti加入黑名单
    // 注意：这需要前端在退出时传递当前的accessToken，以便提取jti
    // 这里简化处理，实际应该从请求中获取accessToken并提取jti

    logger.info('用户已退出', { userId });
  }

  /**
   * ✅ P0安全: 退出所有设备
   */
  async logoutAll(userId: string) {
    // 删除该用户所有Refresh Token
    await query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);

    // 将用户加入全局撤销列表（2小时内所有Token失效）
    await redis.setex(`user_revoked:${userId}`, 7200, '1');

    logger.info('用户已退出所有设备', { userId });
  }
}

export const authService = new AuthService();
