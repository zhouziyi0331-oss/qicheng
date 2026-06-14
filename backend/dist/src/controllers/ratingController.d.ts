/**
 * 评价系统控制器
 *
 * 处理评价相关的HTTP请求
 */
import { Request, Response } from 'express';
/**
 * 创建评价
 * POST /api/v1/ratings
 */
export declare function createRating(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 更新评价
 * PUT /api/v1/ratings/:id
 */
export declare function updateRating(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 回复评价
 * POST /api/v1/ratings/:id/respond
 */
export declare function respondToRating(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 获取任务的评价
 * GET /api/v1/ratings/task/:taskId
 */
export declare function getTaskRatings(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 获取用户收到的评价
 * GET /api/v1/ratings/user/:userId
 */
export declare function getUserRatings(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 获取用户评价统计
 * GET /api/v1/ratings/user/:userId/stats
 */
export declare function getUserRatingStats(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 获取可用标签
 * GET /api/v1/ratings/tags
 */
export declare function getAvailableTags(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 标记评价有用/无用
 * POST /api/v1/ratings/:id/helpful
 */
export declare function markHelpful(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 举报评价
 * POST /api/v1/ratings/:id/report
 */
export declare function reportRating(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 删除评价（管理员）
 * DELETE /api/v1/ratings/:id
 */
export declare function deleteRating(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=ratingController.d.ts.map