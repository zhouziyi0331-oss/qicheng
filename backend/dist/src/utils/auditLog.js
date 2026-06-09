"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceType = exports.AuditAction = void 0;
exports.logAdminAction = logAdminAction;
exports.getAuditLogs = getAuditLogs;
const db_1 = require("./db");
/**
 * 记录管理员操作审计日志
 */
async function logAdminAction(params) {
    const { adminId, action, resourceType, resourceId, details, req } = params;
    // 从请求中提取IP和User-Agent
    const ipAddress = req ? getClientIp(req) : null;
    const userAgent = req?.headers['user-agent'] || null;
    const result = await (0, db_1.query)(`INSERT INTO admin_audit_logs (
      admin_id, action, resource_type, resource_id,
      details, ip_address, user_agent
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id`, [
        adminId,
        action,
        resourceType || null,
        resourceId || null,
        details ? JSON.stringify(details) : null,
        ipAddress,
        userAgent
    ]);
    return result[0].id;
}
/**
 * 获取客户端真实IP
 */
function getClientIp(req) {
    // 优先从代理头获取
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        const ips = forwarded.split(',');
        return ips[0].trim();
    }
    const realIp = req.headers['x-real-ip'];
    if (realIp) {
        return realIp;
    }
    // 最后使用socket地址
    return req.socket.remoteAddress || 'unknown';
}
/**
 * 查询审计日志
 */
async function getAuditLogs(filters) {
    const { adminId, action, resourceType, resourceId, startDate, endDate, page = 1, pageSize = 50 } = filters;
    const conditions = [];
    const params = [];
    let paramIndex = 1;
    if (adminId) {
        conditions.push(`admin_id = $${paramIndex++}`);
        params.push(adminId);
    }
    if (action) {
        conditions.push(`action = $${paramIndex++}`);
        params.push(action);
    }
    if (resourceType) {
        conditions.push(`resource_type = $${paramIndex++}`);
        params.push(resourceType);
    }
    if (resourceId) {
        conditions.push(`resource_id = $${paramIndex++}`);
        params.push(resourceId);
    }
    if (startDate) {
        conditions.push(`created_at >= $${paramIndex++}`);
        params.push(startDate);
    }
    if (endDate) {
        conditions.push(`created_at <= $${paramIndex++}`);
        params.push(endDate);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    // 获取总数
    const countResult = await (0, db_1.query)(`SELECT COUNT(*) as count FROM admin_audit_logs ${whereClause}`, params);
    const total = parseInt(countResult[0].count);
    // 获取列表
    const offset = (page - 1) * pageSize;
    params.push(pageSize, offset);
    const logs = await (0, db_1.query)(`SELECT
      al.*,
      au.username as admin_username,
      au.real_name as admin_real_name
     FROM admin_audit_logs al
     LEFT JOIN admin_users au ON al.admin_id = au.id
     ${whereClause}
     ORDER BY al.created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`, params);
    return {
        list: logs,
        pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize)
        }
    };
}
/**
 * 审计日志操作类型常量
 */
exports.AuditAction = {
    // 查看操作
    VIEW_STUDENT_DETAIL: 'view_student_detail',
    VIEW_COMPANY_DETAIL: 'view_company_detail',
    VIEW_PHONE: 'view_phone',
    VIEW_EMAIL: 'view_email',
    EXPORT_DATA: 'export_data',
    // 修改操作
    UPDATE_STUDENT: 'update_student',
    UPDATE_COMPANY: 'update_company',
    UPDATE_TASK: 'update_task',
    UPDATE_ORDER: 'update_order',
    // 审核操作
    APPROVE_COMPANY: 'approve_company',
    REJECT_COMPANY: 'reject_company',
    APPROVE_TASK: 'approve_task',
    REJECT_TASK: 'reject_task',
    APPROVE_WITHDRAWAL: 'approve_withdrawal',
    REJECT_WITHDRAWAL: 'reject_withdrawal',
    // 删除操作
    DELETE_STUDENT: 'delete_student',
    DELETE_COMPANY: 'delete_company',
    DELETE_TASK: 'delete_task',
    // 系统操作
    LOGIN: 'login',
    LOGOUT: 'logout',
    CHANGE_PASSWORD: 'change_password',
    CREATE_ADMIN: 'create_admin',
    UPDATE_ADMIN: 'update_admin',
    DELETE_ADMIN: 'delete_admin'
};
/**
 * 资源类型常量
 */
exports.ResourceType = {
    STUDENT: 'student',
    COMPANY: 'company',
    TASK: 'task',
    ORDER: 'order',
    WITHDRAWAL: 'withdrawal',
    ADMIN: 'admin',
    SYSTEM: 'system'
};
//# sourceMappingURL=auditLog.js.map