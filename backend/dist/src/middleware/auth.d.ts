import { Request, Response, NextFunction } from 'express';
export interface JwtPayload {
    id?: string;
    userId?: string;
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
export declare function authenticate(req: Request, _res: Response, next: NextFunction): void;
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
 */
export declare function generateTokens(payload: JwtPayload): {
    accessToken: string;
    refreshToken: string;
};
//# sourceMappingURL=auth.d.ts.map