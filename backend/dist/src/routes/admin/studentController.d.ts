import { Request, Response } from 'express';
/**
 * 获取学生列表
 */
export declare function getStudentList(req: Request, res: Response): Promise<void>;
/**
 * 获取学生详情
 */
export declare function getStudentDetail(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 获取学生能力画像
 */
export declare function getStudentAbility(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 获取学生成长轨迹
 */
export declare function getStudentGrowth(req: Request, res: Response): Promise<void>;
/**
 * 更新学生状态
 */
export declare function updateStudentStatus(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=studentController.d.ts.map