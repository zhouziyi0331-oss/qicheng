/**
 * 任务追加需求控制器
 *
 * 处理任务追加需求相关的HTTP请求
 */
import { Response } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                role: string;
            };
        }
    }
}
/**
 * 创建追加需求（企业）
 * POST /api/v1/task-amendments
 */
export declare function createAmendment(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 学生响应追加需求
 * POST /api/v1/task-amendments/:id/respond
 */
export declare function studentRespond(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 企业最终决定（协商后）
 * POST /api/v1/task-amendments/:id/decide
 */
export declare function companyDecide(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 取消追加需求（企业主动取消）
 * POST /api/v1/task-amendments/:id/cancel
 */
export declare function cancelAmendment(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 获取任务的所有追加需求
 * GET /api/v1/task-amendments/task/:taskId
 */
export declare function getTaskAmendments(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 获取追加需求详情
 * GET /api/v1/task-amendments/:id
 */
export declare function getAmendment(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * AI评估追加需求的合理性
 * POST /api/v1/task-amendments/:id/analyze
 */
export declare function analyzeAmendment(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=taskAmendmentController.d.ts.map