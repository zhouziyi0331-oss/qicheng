import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
export declare function startChallenge(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function submitChallenge(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function getChallengeHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=controller.d.ts.map