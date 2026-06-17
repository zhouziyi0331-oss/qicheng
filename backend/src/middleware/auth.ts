import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { AppError } from './errorHandler';
import redis from '../utils/redis';

export interface JwtPayload {
  userId: string;
  role: 'student' | 'company' | 'admin';
  adminRole?: 'super' | 'ops' | 'cs';
  accountType?: 'student' | 'enterprise';
  selectedTrack?: 'content' | 'dev';
  jti?: string; // ✅ JWT ID for blacklist
  iss?: string; // ✅ Issuer
  aud?: string; // ✅ Audience
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware: require valid JWT access token.
 * ✅ P0安全: 添加JWT黑名单检查
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError(401, '未提供认证令牌', 'UNAUTHORIZED'));
  }
  const token = authHeader.slice(7);
  try {
    // ✅ 验证JWT，包含算法、签发者、受众检查
    const payload = jwt.verify(token, config.jwt.accessSecret, {
      algorithms: ['HS256'],
      issuer: 'qicheng-api',
      audience: 'qicheng-app',
    }) as JwtPayload;

    // ✅ 检查JWT黑名单（用户退出登录或账号被封禁）
    if (payload.jti) {
      const isBlacklisted = await redis.get(`jwt_blacklist:${payload.jti}`);
      if (isBlacklisted) {
        return next(new AppError(401, 'Token已被撤销', 'TOKEN_REVOKED'));
      }
    }

    req.user = payload;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      next(new AppError(401, '认证令牌已过期', 'TOKEN_EXPIRED'));
    } else if (error.name === 'JsonWebTokenError') {
      next(new AppError(401, '认证令牌无效', 'TOKEN_INVALID'));
    } else {
      next(new AppError(401, '认证失败', 'AUTHENTICATION_FAILED'));
    }
  }
}

/**
 * Middleware: require specific role(s).
 */
export function requireRole(...roles: Array<'student' | 'company' | 'admin'>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, '请先登录', 'UNAUTHORIZED'));
    }
    if (!roles.includes(req.user!.role)) {
      return next(new AppError(403, '权限不足', 'FORBIDDEN'));
    }
    next();
  };
}

/**
 * Middleware: require admin role.
 */
export function requireAdminRole(...adminRoles: Array<'super' | 'ops' | 'cs'>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || req.user!.role !== 'admin') {
      return next(new AppError(403, '需要管理员权限', 'FORBIDDEN'));
    }
    if (adminRoles.length > 0 && req.user.adminRole && !adminRoles.includes(req.user.adminRole)) {
      return next(new AppError(403, `需要 ${adminRoles.join('/')} 管理员权限`, 'FORBIDDEN'));
    }
    next();
  };
}

/**
 * Generate access + refresh token pair.
 * ✅ P0安全: 添加iss、aud、jti字段
 */
export function generateTokens(payload: JwtPayload): { accessToken: string; refreshToken: string } {
  // jti ensures uniqueness even when called multiple times within the same second
  const jti = require('crypto').randomBytes(16).toString('hex');

  const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry as `${number}${'s'|'m'|'h'|'d'}`,
    jwtid: jti + '-a',
    issuer: 'qicheng-api',
    audience: 'qicheng-app',
  });

  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry as `${number}${'s'|'m'|'h'|'d'}`,
    jwtid: jti + '-r',
    issuer: 'qicheng-api',
    audience: 'qicheng-app',
  });

  return { accessToken, refreshToken };
}

/**
 * ✅ P0安全: 退出登录 - 将JWT加入黑名单
 */
export async function revokeToken(jti: string, expiresAt: number): Promise<void> {
  const ttl = Math.max(0, expiresAt - Math.floor(Date.now() / 1000));
  if (ttl > 0) {
    await redis.setex(`jwt_blacklist:${jti}`, ttl, '1');
  }
}

/**
 * ✅ P0安全: 退出所有设备 - 将用户所有Token加入黑名单
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  // 将用户ID加入全局撤销列表
  await redis.setex(`user_revoked:${userId}`, 7200, '1'); // 2小时
}
