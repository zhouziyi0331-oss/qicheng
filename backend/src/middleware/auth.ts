import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { AppError } from './errorHandler';

export interface JwtPayload {
  id: string;  // 统一使用id
  role: 'student' | 'company' | 'admin';
  adminRole?: 'super' | 'ops' | 'cs';
  accountType?: 'student' | 'enterprise';
  selectedTrack?: 'content' | 'dev';
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
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError(401, '未提供认证令牌', 'UNAUTHORIZED'));
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    next(new AppError(401, '认证令牌无效或已过期', 'TOKEN_INVALID'));
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
 */
export function generateTokens(payload: JwtPayload): { accessToken: string; refreshToken: string } {
  // jti ensures uniqueness even when called multiple times within the same second
  const jti = require('crypto').randomBytes(16).toString('hex');
  const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry as `${number}${'s'|'m'|'h'|'d'}`,
    jwtid: jti + '-a',
  });
  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry as `${number}${'s'|'m'|'h'|'d'}`,
    jwtid: jti + '-r',
  });
  return { accessToken, refreshToken };
}
