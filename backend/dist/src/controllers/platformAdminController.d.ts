/**
 * 平台管理增强控制器
 *
 * 处理提现审核、用户认证、任务审核、风险预警等管理功能的HTTP请求
 */
import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}
/**
 * 获取待审核提现列表
 * GET /api/v1/admin/platform/withdrawals/pending
 */
export declare function getPendingWithdrawals(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 批准提现
 * POST /api/v1/admin/platform/withdrawals/:id/approve
 */
export declare function approveWithdrawal(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 拒绝提现
 * POST /api/v1/admin/platform/withdrawals/:id/reject
 */
export declare function rejectWithdrawal(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 获取待审核用户认证列表
 * GET /api/v1/admin/platform/verifications/pending
 */
export declare function getPendingVerifications(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 批准用户认证
 * POST /api/v1/admin/platform/verifications/:id/approve
 */
export declare function approveVerification(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 拒绝用户认证
 * POST /api/v1/admin/platform/verifications/:id/reject
 */
export declare function rejectVerification(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 审核任务
 * POST /api/v1/admin/platform/tasks/:id/review
 */
export declare function reviewTask(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 隐藏评价
 * POST /api/v1/admin/platform/ratings/:id/hide
 */
export declare function hideRating(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 创建风险预警
 * POST /api/v1/admin/platform/risk-alerts
 */
export declare function createRiskAlert(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 获取风险预警列表
 * GET /api/v1/admin/platform/risk-alerts
 */
export declare function getRiskAlerts(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 获取平台指标
 * GET /api/v1/admin/platform/metrics
 */
export declare function getPlatformMetrics(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 计算每日指标
 * POST /api/v1/admin/platform/metrics/calculate
 */
export declare function calculateDailyMetrics(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 获取系统配置
 * GET /api/v1/admin/platform/config/:key
 */
export declare function getSystemConfig(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 更新系统配置
 * PUT /api/v1/admin/platform/config/:key
 */
export declare function updateSystemConfig(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 获取所有待审核项目
 * GET /api/v1/admin/platform/pending-reviews
 */
export declare function getPendingReviews(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=platformAdminController.d.ts.map