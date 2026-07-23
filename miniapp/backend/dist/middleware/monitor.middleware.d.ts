import { Request, Response, NextFunction } from 'express';
/**
 * 性能监控中间件
 * 记录每个请求的响应时间
 */
export declare const performanceMonitor: (req: Request, res: Response, next: NextFunction) => void;
/**
 * 请求统计
 */
interface RequestStats {
    total: number;
    success: number;
    error: number;
    avgDuration: number;
}
declare const stats: {
    [key: string]: RequestStats;
};
export declare const getStats: () => typeof stats;
/**
 * 统计中间件
 */
export declare const statisticsCollector: (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=monitor.middleware.d.ts.map