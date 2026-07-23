import { Request, Response } from 'express';
/**
 * 后台任务控制器
 */
export declare class BackgroundTaskController {
    /**
     * GET /api/tasks
     * 获取用户的后台任务列表
     */
    getUserTasks(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/tasks/:taskId
     * 获取任务详情
     */
    getTaskDetail(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/tasks/:taskId/retry
     * 重试失败的任务
     */
    retryTask(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/tasks/stats
     * 获取任务统计
     */
    getTaskStats(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
export declare const backgroundTaskController: BackgroundTaskController;
//# sourceMappingURL=backgroundTask.controller.d.ts.map