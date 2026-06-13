import jwt from 'jsonwebtoken';
import { config } from '../../config';

export interface JwtPayload {
  id: string;  // 统一使用id而不是userId
  role: 'student' | 'company' | 'admin';
  adminRole?: 'super' | 'ops' | 'cs';
  accountType?: 'student' | 'enterprise';
  selectedTrack?: 'content' | 'dev';
  phone?: string;
  email?: string;
}

/**
 * Generate a single JWT token (for backward compatibility)
 */
export function generateToken(payload: JwtPayload): string {
  const jti = require('crypto').randomBytes(16).toString('hex');
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry as `${number}${'s'|'m'|'h'|'d'}`,
    jwtid: jti,
  });
}

/**
 * Generate access + refresh token pair
 */
export function generateTokens(payload: JwtPayload): { accessToken: string; refreshToken: string } {
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

/**
 * Verify a JWT token
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
}

/**
 * Verify a refresh token
 */
export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
}
