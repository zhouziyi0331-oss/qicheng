import { Request, Response } from 'express';
/**
 * 获取企业列表
 */
export declare function getCompanyList(req: Request, res: Response): Promise<void>;
/**
 * 获取企业详情
 */
export declare function getCompanyDetail(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 审核企业认证
 */
export declare function verifyCompany(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 加入/移出黑名单
 */
export declare function toggleBlacklist(req: Request, res: Response): Promise<void>;
/**
 * 获取待审核企业列表
 */
export declare function getPendingVerifications(req: Request, res: Response): Promise<void>;
/**
 * 获取企业发布的任务列表
 */
export declare function getCompanyTasks(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=companyController.d.ts.map