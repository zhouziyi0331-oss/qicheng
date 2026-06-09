import { Request, Response } from 'express';
/**
 * 工作条件匹配控制器
 * 基于OPC测试结果的工作条件画像进行智能匹配
 */
/**
 * 学生完成OPC测试后，生成工作条件画像
 * POST /api/v1/work-condition/student/:studentId/generate-profile
 */
export declare function generateStudentProfile(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 获取学生的工作条件画像
 * GET /api/v1/work-condition/student/:studentId/profile
 */
export declare function getStudentProfile(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 企业发布任务后，生成需求条件画像
 * POST /api/v1/work-condition/task/:taskId/generate-requirement
 */
export declare function generateTaskRequirement(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 获取任务的需求条件画像
 * GET /api/v1/work-condition/task/:taskId/requirement
 */
export declare function getTaskRequirement(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 触发工作条件匹配
 * POST /api/v1/work-condition/task/:taskId/match
 */
export declare function triggerWorkConditionMatching(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 企业查看工作条件匹配结果
 * GET /api/v1/work-condition/task/:taskId/matches
 */
export declare function getWorkConditionMatches(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 学生查看推荐任务（基于工作条件匹配）
 * GET /api/v1/work-condition/student/recommended-tasks
 */
export declare function getRecommendedTasksForStudent(req: Request, res: Response): Promise<void>;
/**
 * 查看具体任务的匹配详情（学生视角）
 * GET /api/v1/work-condition/task/:taskId/match-detail
 */
export declare function getMatchDetail(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=workConditionMatchingController.d.ts.map