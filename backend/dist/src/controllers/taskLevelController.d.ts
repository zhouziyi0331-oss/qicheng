import { Request, Response } from 'express';
/**
 * 企业发布任务（增强版，包含赛道和等级）
 */
export declare const publishTask: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 企业确认发布任务（从草稿到已发布）
 */
export declare const confirmPublishTask: (req: Request, res: Response) => Promise<void>;
/**
 * 获取任务的匹配学生列表（Top 3）
 */
export declare const getMatchedStudents: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 学生获取推荐任务列表
 */
export declare const getRecommendedTasks: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 学生接受任务
 */
export declare const acceptTask: (req: Request, res: Response) => Promise<void>;
/**
 * 获取任务详情（包含匹配信息）
 */
export declare const getTaskDetail: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 企业获取任务列表
 */
export declare const getCompanyTasks: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=taskLevelController.d.ts.map