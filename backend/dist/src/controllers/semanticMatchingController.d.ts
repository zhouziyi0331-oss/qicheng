import { Request, Response } from 'express';
/**
 * 语义匹配控制器
 * 连接AI匹配引擎到API端点
 */
/**
 * 触发任务匹配
 * POST /api/v1/tasks/:taskId/trigger-matching
 */
export declare const triggerMatching: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 获取任务的匹配学生列表
 * GET /api/v1/tasks/:taskId/matched-students
 */
export declare const getMatchedStudents: (req: Request, res: Response) => Promise<void>;
/**
 * 推送任务给选中的学生
 * POST /api/v1/tasks/:taskId/push-to-students
 */
export declare const pushToStudents: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 学生查看推荐任务
 * GET /api/v1/students/recommended-tasks
 */
export declare const getRecommendedTasks: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=semanticMatchingController.d.ts.map