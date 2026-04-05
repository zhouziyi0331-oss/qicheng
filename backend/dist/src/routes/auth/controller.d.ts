import { Request, Response, NextFunction } from 'express';
export declare function sendVerificationCode(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function register(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function login(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function logout(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=controller.d.ts.map