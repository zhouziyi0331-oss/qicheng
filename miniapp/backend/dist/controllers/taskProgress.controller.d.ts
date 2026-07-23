import { Request, Response } from 'express';
/**
 * 任务进度控制器
 */
export declare class TaskProgressController {
    /**
     * 为项目生成任务拆解
     * POST /api/task-progress/generate
     */
    generateTaskDecomposition(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 获取项目的任务进度
     * GET /api/task-progress/:projectId
     */
    getTaskProgress(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 获取用户所有任务进度列表
     * GET /api/task-progress/my/list
     */
    getMyTaskProgressList(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 更新任务状态
     * PUT /api/task-progress/:progressId/task/:taskNumber
     */
    updateTaskStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 记录任务挑战
     * POST /api/task-progress/:progressId/task/:taskNumber/challenge
     */
    addChallenge(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 添加任务反思
     * POST /api/task-progress/:progressId/task/:taskNumber/reflection
     */
    addReflection(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 生成项目完成总结
     * POST /api/task-progress/:progressId/summary
     */
    generateProjectSummary(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
export declare const taskProgressController: TaskProgressController;
//# sourceMappingURL=taskProgress.controller.d.ts.map