"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = requireAdmin;
exports.getDashboard = getDashboard;
exports.getUsers = getUsers;
exports.banUser = banUser;
exports.unbanUser = unbanUser;
exports.getTasks = getTasks;
exports.reviewTask = reviewTask;
exports.getWithdrawals = getWithdrawals;
exports.processWithdrawal = processWithdrawal;
exports.getLogs = getLogs;
const db_1 = require("../../utils/db");
const errorHandler_1 = require("../../middleware/errorHandler");
const logger_1 = __importDefault(require("../../utils/logger"));
// ============================================================
// 中间件：验证管理员权限
// ============================================================
async function requireAdmin(req, res, next) {
    try {
        const userId = req.user.userId;
        const admin = await (0, db_1.queryOne)('SELECT admin_role, is_active FROM admins WHERE user_id = $1 AND deleted_at IS NULL', [userId]);
        if (!admin || !admin.is_active) {
            throw new errorHandler_1.AppError(403, '需要管理员权限', 'ADMIN_REQUIRED');
        }
        req.adminRole = admin.admin_role;
        next();
    }
    catch (err) {
        next(err);
    }
}
// ============================================================
// GET /admin/dashboard - 管理后台数据看板
// ============================================================
async function getDashboard(req, res, next) {
    try {
        // 1. 用户统计
        const userStats = await (0, db_1.queryOne)(`SELECT
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE role = 'student') as students,
         COUNT(*) FILTER (WHERE role = 'company') as companies,
         COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today
       FROM users WHERE deleted_at IS NULL`);
        // 2. 任务统计
        const taskStats = await (0, db_1.queryOne)(`SELECT
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status IN ('active', 'assigned', 'in_progress')) as active,
         COUNT(*) FILTER (WHERE status = 'completed') as completed,
         COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today
       FROM tasks WHERE deleted_at IS NULL`);
        // 3. 财务统计
        const financeStats = await (0, db_1.queryOne)(`SELECT
         COALESCE(SUM(gross_amount), 0) as total_paid,
         COALESCE(SUM(net_amount), 0) as total_withdrawn,
         COALESCE(SUM(platform_fee), 0) as platform_revenue
       FROM payments WHERE status = 'settled'`);
        // 4. 待处理事项
        const pendingItems = await (0, db_1.query)(`SELECT 'task_review' as type, COUNT(*) as count
       FROM task_review_queue WHERE status = 'pending'
       UNION ALL
       SELECT 'withdrawal', COUNT(*) FROM withdrawals WHERE status = 'pending'
       UNION ALL
       SELECT 'company_verify', COUNT(*) FROM company_profiles WHERE verified_at IS NULL`);
        // 5. 最近活动
        const recentActivities = await (0, db_1.query)(`SELECT action, target_type, detail, created_at, u.nickname as admin_name
       FROM admin_operation_logs aol
       JOIN users u ON aol.admin_id = u.id
       ORDER BY created_at DESC LIMIT 20`);
        res.json({
            success: true,
            data: {
                userStats,
                taskStats,
                financeStats,
                pendingItems,
                recentActivities,
            },
        });
    }
    catch (err) {
        next(err);
    }
}
// ============================================================
// GET /admin/users - 获取用户列表
// ============================================================
async function getUsers(req, res, next) {
    try {
        const { role, keyword, page = 1, limit = 20 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        let whereClause = 'WHERE u.deleted_at IS NULL';
        const params = [];
        if (role) {
            params.push(role);
            whereClause += ` AND u.role = $${params.length}`;
        }
        if (keyword) {
            params.push(`%${keyword}%`);
            whereClause += ` AND (u.phone LIKE $${params.length} OR u.nickname LIKE $${params.length})`;
        }
        params.push(Number(limit), offset);
        const users = await (0, db_1.query)(`SELECT
         u.id, u.role, u.user_type, u.phone, u.nickname, u.avatar_url,
         u.is_active, u.created_at, u.last_login_at,
         sp.level_a, sp.level_b, sp.track, sp.total_earnings, sp.task_count,
         cp.company_name, cp.verified_at
       FROM users u
       LEFT JOIN student_profiles sp ON u.id = sp.user_id
       LEFT JOIN company_profiles cp ON u.id = cp.user_id
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
        const total = await (0, db_1.queryOne)(`SELECT COUNT(*) as count FROM users u ${whereClause}`, params.slice(0, -2));
        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: total?.count || 0,
                },
            },
        });
    }
    catch (err) {
        next(err);
    }
}
// ============================================================
// POST /admin/users/:id/ban - 封禁用户
// ============================================================
async function banUser(req, res, next) {
    try {
        const { id } = req.params;
        const { reason, evidence, duration } = req.body; // duration: 天数，null=永久
        const adminId = req.user.userId;
        const user = await (0, db_1.queryOne)('SELECT role FROM users WHERE id = $1 AND deleted_at IS NULL', [id]);
        if (!user) {
            throw new errorHandler_1.AppError(404, '用户不存在', 'USER_NOT_FOUND');
        }
        await (0, db_1.withTransaction)(async (client) => {
            // 1. 禁用用户账号
            await client.query('UPDATE users SET is_active = FALSE WHERE id = $1', [id]);
            // 2. 添加到黑名单
            const tableName = user.role === 'student' ? 'student_blacklist' : 'company_blacklist';
            const idField = user.role === 'student' ? 'student_id' : 'company_id';
            await client.query(`INSERT INTO ${tableName} (${idField}, reason, evidence, banned_by, unban_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (${idField}) DO UPDATE SET
           reason = $2, evidence = $3, banned_by = $4, unban_at = $5, is_active = TRUE`, [id, reason, JSON.stringify(evidence), adminId, duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null]);
            // 3. 记录操作日志
            await client.query(`INSERT INTO admin_operation_logs (admin_id, action, target_type, target_id, detail)
         VALUES ($1, 'ban_user', 'user', $2, $3)`, [adminId, id, JSON.stringify({ reason, duration })]);
        });
        logger_1.default.info('User banned', { adminId, userId: id, reason });
        res.json({
            success: true,
            message: '用户已封禁',
        });
    }
    catch (err) {
        next(err);
    }
}
// ============================================================
// POST /admin/users/:id/unban - 解封用户
// ============================================================
async function unbanUser(req, res, next) {
    try {
        const { id } = req.params;
        const adminId = req.user.userId;
        const user = await (0, db_1.queryOne)('SELECT role FROM users WHERE id = $1 AND deleted_at IS NULL', [id]);
        if (!user) {
            throw new errorHandler_1.AppError(404, '用户不存在', 'USER_NOT_FOUND');
        }
        await (0, db_1.withTransaction)(async (client) => {
            // 1. 启用用户账号
            await client.query('UPDATE users SET is_active = TRUE WHERE id = $1', [id]);
            // 2. 从黑名单移除
            const tableName = user.role === 'student' ? 'student_blacklist' : 'company_blacklist';
            const idField = user.role === 'student' ? 'student_id' : 'company_id';
            await client.query(`UPDATE ${tableName} SET is_active = FALSE WHERE ${idField} = $1`, [id]);
            // 3. 记录操作日志
            await client.query(`INSERT INTO admin_operation_logs (admin_id, action, target_type, target_id, detail)
         VALUES ($1, 'unban_user', 'user', $2, '{}')`, [adminId, id]);
        });
        logger_1.default.info('User unbanned', { adminId, userId: id });
        res.json({
            success: true,
            message: '用户已解封',
        });
    }
    catch (err) {
        next(err);
    }
}
// ============================================================
// GET /admin/tasks - 获取任务列表
// ============================================================
async function getTasks(req, res, next) {
    try {
        const { status, keyword, page = 1, limit = 20 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        let whereClause = 'WHERE t.deleted_at IS NULL';
        const params = [];
        if (status) {
            params.push(status);
            whereClause += ` AND t.status = $${params.length}`;
        }
        if (keyword) {
            params.push(`%${keyword}%`);
            whereClause += ` AND t.title LIKE $${params.length}`;
        }
        params.push(Number(limit), offset);
        const tasks = await (0, db_1.query)(`SELECT
         t.*, u.nickname as company_name,
         COUNT(ta.id) as assignment_count
       FROM tasks t
       JOIN users u ON t.company_id = u.id
       LEFT JOIN task_assignments ta ON t.id = ta.task_id
       ${whereClause}
       GROUP BY t.id, u.nickname
       ORDER BY t.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
        const total = await (0, db_1.queryOne)(`SELECT COUNT(*) as count FROM tasks t ${whereClause}`, params.slice(0, -2));
        res.json({
            success: true,
            data: {
                tasks,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: total?.count || 0,
                },
            },
        });
    }
    catch (err) {
        next(err);
    }
}
// ============================================================
// POST /admin/tasks/:id/review - 审核任务
// ============================================================
async function reviewTask(req, res, next) {
    try {
        const { id } = req.params;
        const { action, notes } = req.body; // action: approve/reject
        const adminId = req.user.userId;
        const task = await (0, db_1.queryOne)('SELECT * FROM tasks WHERE id = $1', [id]);
        if (!task) {
            throw new errorHandler_1.AppError(404, '任务不存在', 'TASK_NOT_FOUND');
        }
        await (0, db_1.withTransaction)(async (client) => {
            if (action === 'approve') {
                await client.query(`UPDATE tasks SET status = 'active', updated_at = NOW() WHERE id = $1`, [id]);
            }
            else {
                await client.query(`UPDATE tasks SET status = 'cancelled', updated_at = NOW() WHERE id = $1`, [id]);
            }
            // 记录操作日志
            await client.query(`INSERT INTO admin_operation_logs (admin_id, action, target_type, target_id, detail)
         VALUES ($1, $2, 'task', $3, $4)`, [adminId, `task_${action}`, id, JSON.stringify({ notes })]);
            // 更新审核队列
            await client.query(`UPDATE task_review_queue SET status = $1, assigned_to = $2, review_notes = $3, reviewed_at = NOW()
         WHERE task_id = $4`, [action === 'approve' ? 'approved' : 'rejected', adminId, notes, id]);
        });
        logger_1.default.info('Task reviewed', { adminId, taskId: id, action });
        res.json({
            success: true,
            message: action === 'approve' ? '任务已通过审核' : '任务已拒绝',
        });
    }
    catch (err) {
        next(err);
    }
}
// ============================================================
// GET /admin/withdrawals - 获取提现申请列表
// ============================================================
async function getWithdrawals(req, res, next) {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        let whereClause = 'WHERE w.deleted_at IS NULL';
        const params = [];
        if (status) {
            params.push(status);
            whereClause += ` AND w.status = $${params.length}`;
        }
        params.push(Number(limit), offset);
        const withdrawals = await (0, db_1.query)(`SELECT
         w.*, u.nickname, u.phone,
         sb.balance as current_balance
       FROM withdrawals w
       JOIN users u ON w.user_id = u.id
       LEFT JOIN student_balances sb ON w.user_id = sb.user_id
       ${whereClause}
       ORDER BY w.requested_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
        const total = await (0, db_1.queryOne)(`SELECT COUNT(*) as count FROM withdrawals w ${whereClause}`, params.slice(0, -2));
        res.json({
            success: true,
            data: {
                withdrawals,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: total?.count || 0,
                },
            },
        });
    }
    catch (err) {
        next(err);
    }
}
// ============================================================
// POST /admin/withdrawals/:id/process - 处理提现申请
// ============================================================
async function processWithdrawal(req, res, next) {
    try {
        const { id } = req.params;
        const { action, notes } = req.body; // action: approve/reject
        const adminId = req.user.userId;
        const withdrawal = await (0, db_1.queryOne)('SELECT * FROM withdrawals WHERE id = $1', [id]);
        if (!withdrawal) {
            throw new errorHandler_1.AppError(404, '提现申请不存在', 'WITHDRAWAL_NOT_FOUND');
        }
        if (withdrawal.status !== 'pending') {
            throw new errorHandler_1.AppError(400, '该提现申请已处理', 'ALREADY_PROCESSED');
        }
        await (0, db_1.withTransaction)(async (client) => {
            if (action === 'approve') {
                // 扣除余额
                await client.query(`UPDATE student_balances
           SET balance = balance - $1, total_withdrawn = total_withdrawn + $1, updated_at = NOW()
           WHERE user_id = $2`, [withdrawal.amount, withdrawal.user_id]);
                await client.query(`UPDATE withdrawals
           SET status = 'done', processor_id = $1, process_note = $2, processed_at = NOW()
           WHERE id = $3`, [adminId, notes, id]);
            }
            else {
                await client.query(`UPDATE withdrawals
           SET status = 'failed', processor_id = $1, process_note = $2, processed_at = NOW()
           WHERE id = $3`, [adminId, notes, id]);
            }
            // 记录操作日志
            await client.query(`INSERT INTO admin_operation_logs (admin_id, action, target_type, target_id, detail)
         VALUES ($1, $2, 'withdrawal', $3, $4)`, [adminId, `withdrawal_${action}`, id, JSON.stringify({ notes, amount: withdrawal.amount })]);
        });
        logger_1.default.info('Withdrawal processed', { adminId, withdrawalId: id, action });
        res.json({
            success: true,
            message: action === 'approve' ? '提现已批准' : '提现已拒绝',
        });
    }
    catch (err) {
        next(err);
    }
}
// ============================================================
// GET /admin/logs - 获取操作日志
// ============================================================
async function getLogs(req, res, next) {
    try {
        const { action, targetType, page = 1, limit = 50 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        let whereClause = '';
        const params = [];
        if (action) {
            params.push(action);
            whereClause += ` WHERE action = $${params.length}`;
        }
        if (targetType) {
            params.push(targetType);
            whereClause += whereClause ? ` AND target_type = $${params.length}` : ` WHERE target_type = $${params.length}`;
        }
        params.push(Number(limit), offset);
        const logs = await (0, db_1.query)(`SELECT
         aol.*, u.nickname as admin_name
       FROM admin_operation_logs aol
       JOIN users u ON aol.admin_id = u.id
       ${whereClause}
       ORDER BY aol.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
        res.json({
            success: true,
            data: logs,
        });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=adminController.js.map