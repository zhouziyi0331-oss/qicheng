import { Request, Response, NextFunction } from 'express';
/**
 * 组队控制器
 */
export declare function createTeam(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getTeamInfo(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function applyToJoinTeam(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function reviewApplication(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function assignModule(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function generateInviteLink(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function joinByInviteCode(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function leaveTeam(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function disbandTeam(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getMyTeams(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=teamController.d.ts.map