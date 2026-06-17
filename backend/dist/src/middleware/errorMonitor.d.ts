import { Request, Response, NextFunction } from 'express';
/**
 * 全局错误处理中间件
 */
export declare function errorMonitor(err: any, req: Request, res: Response, _next: NextFunction): void;
/**
 * 获取错误统计
 */
export declare function getErrorStats(): {
    totalErrors: number;
    errorRate: number;
    recentErrors: {
        timestamp: number;
        message: string;
        path: string;
        statusCode: number;
    }[];
    lastReset: string;
};
//# sourceMappingURL=errorMonitor.d.ts.map