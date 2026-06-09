/**
 * 任务分级和智能匹配控制器
 *
 * 处理任务等级、学生等级、智能匹配相关的HTTP请求
 */
import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}
/**
 * 获取所有任务等级定义
 * GET /api/v1/task-levels
 */
export declare function getTaskLevels(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 计算任务等级
 * POST /api/v1/task-levels/calculate/:taskId
 */
export declare function calculateTaskLevel(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 获取学生等级信息
 * GET /api/v1/student-levels/:studentId
 */
export declare function getStudentLevel(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 更新学生等级（手动触发）
 * POST /api/v1/student-levels/:studentId/update
 */
export declare function updateStudentLevel(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 为任务匹配学生
 * POST /api/v1/matching/task/:taskId/match
 */
export declare function matchTaskWithStudents(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 获取任务的匹配学生列表
 * GET /api/v1/matching/task/:taskId/matches
 */
export declare function getTaskMatches(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 获取学生的推荐任务
 * GET /api/v1/matching/student/:studentId/recommendations
 */
export declare function getStudentRecommendations(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 通知匹配的学生
 * POST /api/v1/matching/task/:taskId/notify
 */
export declare function notifyMatchedStudents(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=taskLevelMatchingController.d.ts.map