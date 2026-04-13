import { Request, Response } from 'express';
/**
 * 智能项目匹配（升级版）
 * GET /api/tasks/match/:userId
 *
 * 新增功能：
 * 1. 基于OPC人格标签匹配
 * 2. 推荐20%的冒险项目
 * 3. 生成个性化匹配理由
 */
export declare const matchTasksForStudent: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 获取任务详情（增强版，包含匹配理由）
 * GET /api/tasks/:taskId/detail/:userId
 */
export declare const getTaskDetailWithMatch: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=matchController.d.ts.map