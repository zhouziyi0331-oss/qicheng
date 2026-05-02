import { Request, Response } from 'express';
/**
 * 获取导师列表
 */
export declare function getMentorList(req: Request, res: Response): Promise<void>;
/**
 * 获取导师详情
 */
export declare function getMentorDetail(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 更新导师状态
 */
export declare function updateMentorStatus(req: Request, res: Response): Promise<void>;
/**
 * 获取咨询会话列表
 */
export declare function getMentorSessions(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=mentorController.d.ts.map