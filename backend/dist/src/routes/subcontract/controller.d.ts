import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
export declare function createSubcontract(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function getMySubcontracts(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function completeSubcontract(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=controller.d.ts.map