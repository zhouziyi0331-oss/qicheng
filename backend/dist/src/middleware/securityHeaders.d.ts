import { Request, Response, NextFunction } from 'express';
/**
 * 安全响应头中间件
 * 添加各种安全相关的HTTP响应头
 */
export declare function securityHeaders(_req: Request, res: Response, next: NextFunction): void;
/**
 * 移除敏感响应头
 * 隐藏服务器技术栈信息
 */
export declare function removeServerHeaders(_req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=securityHeaders.d.ts.map