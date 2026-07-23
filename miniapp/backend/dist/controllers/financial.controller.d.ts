import { Request, Response } from 'express';
/**
 * 财务控制器
 * 处理收入、提现相关
 */
/**
 * GET /api/financial/balance
 * 获取用户余额
 */
export declare const getBalance: (req: Request, res: Response) => Promise<void>;
/**
 * GET /api/financial/income
 * 获取收入记录
 */
export declare const getIncomeRecords: (req: Request, res: Response) => Promise<void>;
/**
 * GET /api/financial/income/stats
 * 获取收入统计
 */
export declare const getIncomeStats: (req: Request, res: Response) => Promise<void>;
/**
 * POST /api/financial/withdrawal/request
 * 申请提现
 */
export declare const requestWithdrawal: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * GET /api/financial/withdrawal
 * 获取提现记录
 */
export declare const getWithdrawalRecords: (req: Request, res: Response) => Promise<void>;
/**
 * POST /api/financial/withdrawal/:id/cancel
 * 取消提现
 */
export declare const cancelWithdrawal: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=financial.controller.d.ts.map