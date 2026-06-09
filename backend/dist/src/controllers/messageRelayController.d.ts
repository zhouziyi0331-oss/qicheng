/**
 * 消息中转控制器
 *
 * 处理消息中转和联系方式交换的HTTP请求
 */
import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}
/**
 * 发送消息（通过AI中转）
 *
 * POST /api/relay/send
 *
 * Body:
 * {
 *   taskId: string;
 *   receiverId: string;
 *   content: string;
 * }
 */
export declare function sendMessage(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 获取任务的中转消息
 *
 * GET /api/relay/messages/:taskId
 *
 * Query:
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 */
export declare function getMessages(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 获取消息统计
 *
 * GET /api/relay/statistics
 *
 * Query:
 * - studentId: string (optional)
 * - companyId: string (optional)
 * - startDate: string (optional)
 * - endDate: string (optional)
 */
export declare function getStatistics(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 获取违规记录
 *
 * GET /api/relay/violations
 *
 * Query:
 * - userId: string (optional)
 * - limit: number (default: 20)
 * - offset: number (default: 0)
 */
export declare function getViolations(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 同意交换联系方式
 *
 * POST /api/relay/exchange/agree
 *
 * Body:
 * {
 *   studentId: string;
 *   companyId: string;
 * }
 */
export declare function agreeToExchange(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 获取交换状态
 *
 * GET /api/relay/exchange/status
 *
 * Query:
 * - studentId: string
 * - companyId: string
 */
export declare function getExchangeStatus(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 检查是否可以交换联系方式
 *
 * GET /api/relay/exchange/can-exchange
 *
 * Query:
 * - studentId: string
 * - companyId: string
 */
export declare function canExchange(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=messageRelayController.d.ts.map