/**
 * AI智能定价控制器
 *
 * 处理AI智能定价相关的HTTP请求
 */
import { Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
interface AuthRequest extends Request {
    user?: JwtPayload;
}
/**
 * 获取智能定价建议
 * POST /api/v1/ai-pricing/suggest
 */
export declare function getPricingSuggestion(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 保存定价历史（任务发布时调用）
 * POST /api/v1/ai-pricing/save-history
 */
export declare function savePricingHistory(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 记录定价调整
 * POST /api/v1/ai-pricing/record-adjustment
 */
export declare function recordAdjustment(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 获取定价准确度分析
 * GET /api/v1/ai-pricing/accuracy
 */
export declare function getPricingAccuracy(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 手动更新市场基准价格（管理员）
 * POST /api/v1/ai-pricing/update-benchmarks
 */
export declare function updateBenchmarks(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=aiPricingController.d.ts.map