/**
 * 账号隔离 - 注册控制器
 * 实现学生端和企业端的独立注册接口
 */
import { Request, Response } from 'express';
/**
 * 学生注册
 * POST /api/v1/auth/register/student
 */
export declare function registerStudent(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 企业注册
 * POST /api/v1/auth/register/enterprise
 */
export declare function registerEnterprise(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 学生登录
 * POST /api/v1/auth/login/student
 */
export declare function loginStudent(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 企业登录
 * POST /api/v1/auth/login/enterprise
 */
export declare function loginEnterprise(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=authIsolationController.d.ts.map