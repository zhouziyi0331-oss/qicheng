import { Request, Response } from 'express';
/**
 * 获取用户等级信息
 * GET /api/level/:userId
 */
export declare const getUserLevel: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 检查升级条件
 * GET /api/level/check-upgrade/:userId
 */
export declare const checkUpgradeConditions: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 执行升级
 * POST /api/level/upgrade
 */
export declare const upgradeLevel: (req: Request, res: Response) => Promise<void>;
/**
 * 申请跳级挑战
 * POST /api/level/challenge
 */
export declare const applyStretchChallenge: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 完成跳级挑战
 * POST /api/level/challenge/complete
 */
export declare const completeStretchChallenge: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=levelController.d.ts.map