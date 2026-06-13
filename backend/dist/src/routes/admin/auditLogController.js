"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogList = getAuditLogList;
exports.getAuditLogStats = getAuditLogStats;
const logger_1 = __importDefault(require("../../utils/logger"));
const auditLog_1 = require("../../utils/auditLog");
/**
 * 获取审计日志列表
 */
async function getAuditLogList(req, res) {
    try {
        const { adminId, action, resourceType, resourceId, startDate, endDate, page = '1', pageSize = '50' } = req.query;
        const filters = {
            adminId: adminId,
            action: action,
            resourceType: resourceType,
            resourceId: resourceId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            page: parseInt(page),
            pageSize: parseInt(pageSize)
        };
        const result = await (0, auditLog_1.getAuditLogs)(filters);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.default.error('获取审计日志失败：', error);
        res.status(500).json({
            success: false,
            message: '获取审计日志失败'
        });
    }
}
/**
 * 获取审计日志统计
 */
async function getAuditLogStats(req, res) {
    try {
        const { startDate, endDate } = req.query;
        // 这里可以添加更复杂的统计逻辑
        // 例如：按操作类型统计、按管理员统计、按时间段统计等
        res.json({
            success: true,
            data: {
                message: '审计日志统计功能待实现'
            }
        });
    }
    catch (error) {
        logger_1.default.error('获取审计日志统计失败：', error);
        res.status(500).json({
            success: false,
            message: '获取审计日志统计失败'
        });
    }
}
//# sourceMappingURL=auditLogController.js.map