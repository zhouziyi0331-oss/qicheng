import { Request, Response, NextFunction } from 'express';
export declare const rateLimiter: (options: {
    windowMs: number;
    maxRequests: number;
    message?: string;
}) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const apiLimiter: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const aiLimiter: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const authLimiter: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
//# sourceMappingURL=rateLimiter.middleware.d.ts.map