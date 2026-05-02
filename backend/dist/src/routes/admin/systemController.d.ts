import { Request, Response } from 'express';
/**
 * 获取管理员列表
 */
export declare function getAdminList(req: Request, res: Response): Promise<void>;
/**
 * 创建管理员
 */
export declare function createAdmin(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 更新管理员
 */
export declare function updateAdmin(req: Request, res: Response): Promise<void>;
/**
 * 重置管理员密码
 */
export declare function resetAdminPassword(req: Request, res: Response): Promise<void>;
/**
 * 删除管理员
 */
export declare function deleteAdmin(req: Request, res: Response): Promise<void>;
/**
 * 获取操作日志列表
 */
export declare function getOperationLogs(req: Request, res: Response): Promise<void>;
/**
 * 获取系统配置
 */
export declare function getSystemConfig(req: Request, res: Response): Promise<void>;
/**
 * 更新系统配置
 */
export declare function updateSystemConfig(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=systemController.d.ts.map