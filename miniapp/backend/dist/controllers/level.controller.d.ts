import { Request, Response } from 'express';
/**
 * 等级控制器
 */
/**
 * GET /api/level/info
 * 获取用户等级信息
 */
export declare const getLevelInfo: (req: Request, res: Response) => Promise<void>;
/**
 * GET /api/level/all
 * 获取所有等级配置
 */
export declare const getAllLevels: (req: Request, res: Response) => Promise<void>;
/**
 * GET /api/level/leaderboard
 * 获取等级榜单
 */
export declare const getLeaderboard: (req: Request, res: Response) => Promise<void>;
/**
 * POST /api/level/test-add-exp
 * 测试：手动增加经验值（仅开发环境）
 */
export declare const testAddExp: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=level.controller.d.ts.map