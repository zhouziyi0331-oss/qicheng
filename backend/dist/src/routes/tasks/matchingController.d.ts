import { Request, Response } from 'express';
/**
 * 匹配控制器
 * 处理任务-学生匹配相关的API请求
 */
/**
 * 企业发布任务后，触发AI匹配
 * POST /api/v1/tasks/:taskId/trigger-matching
 */
export declare function triggerMatching(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 企业查看匹配的学生列表
 * GET /api/v1/tasks/:taskId/matched-students
 */
export declare function getMatchedStudents(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 企业选择学生推送任务
 * POST /api/v1/tasks/:taskId/push-to-students
 * Body: { studentIds: [id1, id2, id3, id4, id5] }
 */
export declare function pushToStudents(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 学生查看推荐任务
 * GET /api/v1/students/recommended-tasks
 */
export declare function getRecommendedTasks(req: Request, res: Response): Promise<void>;
/**
 * 学生查看任务翻译
 * GET /api/v1/tasks/:taskId/translation
 */
export declare function getTaskTranslation(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 学生接受推荐任务
 * POST /api/v1/tasks/:taskId/accept-recommendation
 */
export declare function acceptRecommendation(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 获取任务的匹配统计
 * GET /api/v1/tasks/:taskId/matching-stats
 */
export declare function getMatchingStats(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 手动触发重新匹配（更新匹配结果）
 * POST /api/v1/tasks/:taskId/rematch
 */
export declare function rematchTask(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=matchingController.d.ts.map