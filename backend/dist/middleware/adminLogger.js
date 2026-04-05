"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOperationLogger = adminOperationLogger;
const db_1 = require("../utils/db");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Middleware: log all admin operations to admin_operation_logs table.
 * This table has NO UPDATE/DELETE permissions (Row Level Security).
 * Every admin action is permanently recorded.
 */
function adminOperationLogger(action, targetType) {
    return async (req, res, next) => {
        // Run after the handler completes by patching res.json
        const originalJson = res.json.bind(res);
        res.json = function (body) {
            // Log after response is prepared (non-blocking)
            if (req.user?.role === 'admin') {
                const targetId = req.params.id || req.params.userId || req.params.taskId || null;
                (0, db_1.query)(`INSERT INTO admin_operation_logs
            (admin_id, action, target_type, target_id, detail, ip_address, user_agent)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
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
                ]).catch((err) => logger_1.default.error('Failed to write admin operation log', { error: err.message }));
            }
            return originalJson(body);
        };
        next();
    };
}
function sanitizeBody(body) {
    if (!body)
        return {};
    const { password, password_hash, ...safe } = body;
    void password;
    void password_hash;
    return safe;
}
//# sourceMappingURL=adminLogger.js.map