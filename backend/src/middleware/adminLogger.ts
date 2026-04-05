import { Request, Response, NextFunction } from 'express';
import { query } from '../utils/db';
import logger from '../utils/logger';

/**
 * Middleware: log all admin operations to admin_operation_logs table.
 * This table has NO UPDATE/DELETE permissions (Row Level Security).
 * Every admin action is permanently recorded.
 */
export function adminOperationLogger(
  action: string,
  targetType: string
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Run after the handler completes by patching res.json
    const originalJson = res.json.bind(res);
    res.json = function (body: unknown) {
      // Log after response is prepared (non-blocking)
      if (req.user?.role === 'admin') {
        const targetId = req.params.id || req.params.userId || req.params.taskId || null;
        query(
          `INSERT INTO admin_operation_logs
            (admin_id, action, target_type, target_id, detail, ip_address, user_agent)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            req.user.userId,
            action,
            targetType,
            targetId,
            JSON.stringify({
              method: req.method,
              path: req.path,
              body: sanitizeBody(req.body),
              responseStatus: res.statusCode,
            }),
            req.ip,
            req.headers['user-agent'],
          ]
        ).catch((err) => logger.error('Failed to write admin operation log', { error: err.message }));
      }
      return originalJson(body);
    };
    next();
  };
}

function sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
  if (!body) return {};
  const { password, password_hash, ...safe } = body as Record<string, unknown>;
  void password; void password_hash;
  return safe;
}
