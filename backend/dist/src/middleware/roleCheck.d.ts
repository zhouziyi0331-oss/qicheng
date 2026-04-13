import { Request, Response, NextFunction } from 'express';
/**
 * 角色检查中间件
 * 确保用户具有指定的角色
 */
export declare const requireRole: (role: "student" | "company" | "admin") => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * 多角色检查中间件
 * 允许多个角色访问
 */
export declare const requireAnyRole: (roles: Array<"student" | "company" | "admin">) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=roleCheck.d.ts.map