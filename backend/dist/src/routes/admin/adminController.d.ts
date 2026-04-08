import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
export declare function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function getDashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function getUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function banUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function unbanUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function getTasks(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function reviewTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function getWithdrawals(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function processWithdrawal(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function getLogs(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=adminController.d.ts.map