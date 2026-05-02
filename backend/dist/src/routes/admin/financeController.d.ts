import { Request, Response } from 'express';
/**
 * 获取财务概览
 */
export declare function getFinanceOverview(req: Request, res: Response): Promise<void>;
/**
 * 获取交易流水
 */
export declare function getTransactionList(req: Request, res: Response): Promise<void>;
/**
 * 获取提现申请列表
 */
export declare function getWithdrawalList(req: Request, res: Response): Promise<void>;
/**
 * 审核提现申请
 */
export declare function approveWithdrawal(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 获取收入统计
 */
export declare function getRevenueStats(req: Request, res: Response): Promise<void>;
/**
 * 获取平台抽成配置
 */
export declare function getCommissionConfig(req: Request, res: Response): Promise<void>;
/**
 * 更新平台抽成配置
 */
export declare function updateCommissionConfig(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=financeController.d.ts.map