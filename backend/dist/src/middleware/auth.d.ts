import { Request, Response, NextFunction } from 'express';
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