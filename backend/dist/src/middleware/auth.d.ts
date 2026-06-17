import { Request, Response, NextFunction } from 'express';
export interface JwtPayload {
    userId: string;
    role: 'student' | 'company' | 'admin';
    adminRole?: 'super' | 'ops' | 'cs';
    accountType?: 'student' | 'enterprise';
    selectedTrack?: 'content' | 'dev';
    jti?: string;
    iss?: string;
    aud?: string;
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
export declare function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void>;
/**
 * Middleware: require specific role(s).
 */
export declare function requireRole(...roles: Array<'student' | 'company' | 'admin'>): (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Middleware: require admin role.
 */
export declare function requireAdminRole(...adminRoles: Array<'super' | 'ops' | 'cs'>): (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Generate access + refresh token pair.
 * ✅ P0安全: 添加iss、aud、jti字段
 */
export declare function generateTokens(payload: JwtPayload): {
    accessToken: string;
    refreshToken: string;
};
/**
 * ✅ P0安全: 退出登录 - 将JWT加入黑名单
 */
export declare function revokeToken(jti: string, expiresAt: number): Promise<void>;
/**
 * ✅ P0安全: 退出所有设备 - 将用户所有Token加入黑名单
 */
export declare function revokeAllUserTokens(userId: string): Promise<void>;
//# sourceMappingURL=auth.d.ts.map