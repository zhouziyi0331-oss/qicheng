import { Request, Response } from 'express';
/**
 * 获取项目库列表
 */
export declare function getTaskList(req: Request, res: Response): Promise<void>;
/**
 * 获取项目详情
 */
export declare function getTaskDetail(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 获取待审核项目列表
 */
export declare function getPendingReviewTasks(req: Request, res: Response): Promise<void>;
/**
 * 审核项目
 */
export declare function reviewTask(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 上下架项目
 */
export declare function toggleTaskStatus(req: Request, res: Response): Promise<void>;
/**
 * 获取项目分类标签统计
 */
export declare function getTaskCategories(req: Request, res: Response): Promise<void>;
/**
 * 更新项目信息
 */
export declare function updateTask(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=taskController.d.ts.map