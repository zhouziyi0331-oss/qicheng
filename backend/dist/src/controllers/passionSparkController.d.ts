import { Request, Response } from 'express';
/**
 * 捕捉热情火花
 * POST /api/passion-spark/capture
 */
export declare const capturePassionSpark: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 获取学生的热情火花列表
 * GET /api/passion-spark/:studentId
 */
export declare const getPassionSparks: (req: Request, res: Response) => Promise<void>;
/**
 * 标记想要继续探索
 * POST /api/passion-spark/mark-explore
 */
export declare const markWantExplore: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 获取想要探索的火花
 * GET /api/passion-spark/:studentId/want-explore
 */
export declare const getWantExploreSparks: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=passionSparkController.d.ts.map