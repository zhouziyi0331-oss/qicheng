import { Request, Response } from 'express';
/**
 * 管理员登录
 */
export declare function login(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 获取当前管理员信息
 */
export declare function getCurrentAdmin(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 修改密码
 */
export declare function changePassword(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=authController.d.ts.map