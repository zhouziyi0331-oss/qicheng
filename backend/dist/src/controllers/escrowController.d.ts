import { Request, Response, NextFunction } from 'express';
/**
 * 获取用户托管账户信息
 */
export declare function getAccount(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
/**
 * 创建任务报价（企业）
 */
export declare function createQuote(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * 学生接受报价
 */
export declare function acceptQuote(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * 企业支付并进入托管
 */
export declare function payAndEscrow(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * 任务完成，进入待结算
 */
export declare function completeTaskAndSettle(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * 释放待结算资金
 */
export declare function releaseSettlement(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * 获取交易流水
 */
export declare function getTransactionLogs(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * 创建提现申请
 */
export declare function createWithdrawal(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * 获取用户提现记录
 */
export declare function getUserWithdrawals(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * 获取提现统计
 */
export declare function getWithdrawalStats(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * 审核提现申请（管理员）
 */
export declare function reviewWithdrawal(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * 获取待审核提现列表（管理员）
 */
export declare function getPendingWithdrawals(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=escrowController.d.ts.map