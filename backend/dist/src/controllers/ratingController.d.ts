/**
 * 评价系统控制器
 *
 * 处理评价相关的HTTP请求
 */
import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}
/**
 * 创建评价
 * POST /api/v1/ratings
 */
export declare function createRating(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 更新评价
 * PUT /api/v1/ratings/:id
 */
export declare function updateRating(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 回复评价
 * POST /api/v1/ratings/:id/respond
 */
export declare function respondToRating(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 获取任务的评价
 * GET /api/v1/ratings/task/:taskId
 */
export declare function getTaskRatings(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 获取用户收到的评价
 * GET /api/v1/ratings/user/:userId
 */
export declare function getUserRatings(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 获取用户评价统计
 * GET /api/v1/ratings/user/:userId/stats
 */
export declare function getUserRatingStats(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 获取可用标签
 * GET /api/v1/ratings/tags
 */
export declare function getAvailableTags(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 标记评价有用/无用
 * POST /api/v1/ratings/:id/helpful
 */
export declare function markHelpful(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 举报评价
 * POST /api/v1/ratings/:id/report
 */
export declare function reportRating(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 删除评价（管理员）
 * DELETE /api/v1/ratings/:id
 */
export declare function deleteRating(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=ratingController.d.ts.map