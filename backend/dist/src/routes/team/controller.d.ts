import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
export declare function createTeam(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function inviteMember(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function getTeamDetail(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function startTeamTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function completeTeamTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function getMyTeams(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=controller.d.ts.map