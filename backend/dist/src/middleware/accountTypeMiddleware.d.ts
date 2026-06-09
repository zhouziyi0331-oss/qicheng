/**
 * 账号类型校验中间件
 * 确保学生端和企业端接口的访问隔离
 */
import { Request, Response, NextFunction } from 'express';
/**
 * 校验学生账号
 * 用于 /api/v1/student/* 路径
 */
export declare function requireStudentAccount(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
/**
 * 校验企业账号
 * 用于 /api/v1/enterprise/* 路径
 */
export declare function requireEnterpriseAccount(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
/**
 * 校验赛道选择状态
 * 确保学生已选择赛道后才能访问某些功能
 */
export declare function requireTrackSelected(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=accountTypeMiddleware.d.ts.map