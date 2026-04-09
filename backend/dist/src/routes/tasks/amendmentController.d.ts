import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
/**
 * 任务追加需求控制器
 * 企业可在任务进行中追加需求、延长时间或增加预算
 */
export declare const createAmendment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const respondToAmendment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getTaskAmendments: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getMyPendingAmendments: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=amendmentController.d.ts.map