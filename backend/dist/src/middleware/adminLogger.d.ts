import { Request, Response, NextFunction } from 'express';
/**
 * Middleware: log all admin operations to admin_operation_logs table.
 * This table has NO UPDATE/DELETE permissions (Row Level Security).
 * Every admin action is permanently recorded.
 */
export declare function adminOperationLogger(action: string, targetType: string): (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=adminLogger.d.ts.map