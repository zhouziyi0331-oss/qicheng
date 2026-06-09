/**
 * 支付托管和提现控制器（新版）
 *
 * 基于063_escrow_withdrawal_system.sql的完整实现
 */
import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}
/**
 * 获取托管账户信息
 * GET /api/v1/escrow/account
 */
export declare function getAccount(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 获取或创建托管账户
 * POST /api/v1/escrow/account/init
 */
export declare function initAccount(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 托管资金（企业支付任务款项）
 * POST /api/v1/escrow/deposit
 */
export declare function depositFunds(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 释放资金（任务完成后支付给学生）
 * POST /api/v1/escrow/release
 */
export declare function releaseFunds(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 申请提现
 * POST /api/v1/escrow/withdrawal/request
 */
export declare function requestWithdrawal(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 获取提现记录
 * GET /api/v1/escrow/withdrawal/history
 */
export declare function getWithdrawalHistory(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * 获取账户流水
 * GET /api/v1/escrow/transactions
 */
export declare function getTransactions(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=escrowController.d.ts.map