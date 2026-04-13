import { Request, Response } from 'express';
/**
 * 保存/更新生命问题
 * POST /api/life-question/save
 */
export declare const saveLifeQuestion: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 获取生命问题
 * GET /api/life-question/:userId
 */
export declare const getLifeQuestion: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 添加反思记录
 * POST /api/life-question/reflection
 */
export declare const addReflection: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=lifeQuestionController.d.ts.map