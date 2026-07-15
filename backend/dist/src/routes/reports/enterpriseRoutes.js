"use strict";
/**
 * Phase R5: 企业查看学生报告路由
 * 扩展现有报告系统，允许企业查看学生能力报告
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const db_1 = require("../../utils/db");
const logger_1 = __importDefault(require("../../utils/logger"));
const errorHandler_1 = require("../../middleware/errorHandler");
const reportGeneratorAgent_1 = __importDefault(require("../../agents/reportGeneratorAgent"));
const router = (0, express_1.Router)();
/**
 * 检查企业是否有权限查看学生报告
 */
async function checkReportAccess(companyId, studentId) {
    // 1. 检查是否购买过报告
    const purchase = await (0, db_1.queryOne)(`SELECT id, expires_at FROM report_purchases
     WHERE company_id = $1 AND student_id = $2 AND expires_at > NOW()`, [companyId, studentId]);
    if (purchase) {
        return { hasAccess: true, reason: 'purchased' };
    }
    // 2. 检查是否有过合作（完成过任务）
    const collaboration = await (0, db_1.queryOne)(`SELECT COUNT(*) as count FROM task_applications ta
     JOIN tasks t ON ta.task_id = t.id
     WHERE t.company_id = $1 AND ta.student_id = $2 AND ta.status = 'completed'`, [companyId, studentId]);
    if (collaboration && parseInt(collaboration.count) > 0) {
        return { hasAccess: true, reason: 'collaborated' };
    }
    // 3. 检查学生是否公开了报告
    const student = await (0, db_1.queryOne)(`SELECT report_public FROM users WHERE id = $1`, [studentId]);
    if (student?.report_public) {
        return { hasAccess: true, reason: 'public' };
    }
    return { hasAccess: false, reason: 'no_access' };
}
/**
 * 企业查看学生报告
 * GET /api/v1/reports/enterprise/student/:studentId
 */
router.get('/student/:studentId', auth_1.authenticate, (0, auth_1.requireRole)('company'), async (req, res, next) => {
    try {
        const companyId = req.user.userId;
        const { studentId } = req.params;
        const { reportType = 'comprehensive', forceRegenerate = false } = req.query;
        // 检查访问权限
        const access = await checkReportAccess(companyId, studentId);
        if (!access.hasAccess) {
            throw new errorHandler_1.AppError(403, 'No permission to view this student report. Please purchase or collaborate first.');
        }
        logger_1.default.info('Company viewing student report', {
            companyId,
            studentId,
            accessReason: access.reason
        });
        // 查找最近的报告缓存（24小时内）
        let cachedReport = null;
        if (!forceRegenerate) {
            cachedReport = await (0, db_1.queryOne)(`SELECT report_data, generated_at FROM student_reports
           WHERE student_id = $1 AND report_type = $2
           AND generated_at > NOW() - INTERVAL '24 hours'
           ORDER BY generated_at DESC LIMIT 1`, [studentId, reportType]);
        }
        let report;
        let isCached = false;
        if (cachedReport) {
            report = cachedReport.report_data;
            isCached = true;
            logger_1.default.info('Using cached report', { studentId });
        }
        else {
            // 生成新报告
            logger_1.default.info('Generating new report', { studentId, reportType });
            report = await reportGeneratorAgent_1.default.generateReport(studentId, {
                reportType: reportType,
                timeRange: 90
            });
            // 保存报告到缓存
            await (0, db_1.query)(`INSERT INTO student_reports (student_id, report_type, report_data, generated_at, generated_for_company_id)
           VALUES ($1, $2, $3, NOW(), $4)`, [studentId, reportType, JSON.stringify(report), companyId]);
        }
        // 记录访问日志
        await (0, db_1.query)(`INSERT INTO report_access_logs (company_id, student_id, access_reason, report_type)
         VALUES ($1, $2, $3, $4)`, [companyId, studentId, access.reason, reportType]);
        res.json({
            success: true,
            data: {
                report,
                accessReason: access.reason,
                isCached,
                generatedAt: isCached ? cachedReport.generated_at : new Date()
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 企业购买学生报告访问权限
 * POST /api/v1/reports/enterprise/purchase
 */
router.post('/purchase', auth_1.authenticate, (0, auth_1.requireRole)('company'), async (req, res, next) => {
    try {
        const companyId = req.user.userId;
        const { studentId, duration = 30 } = req.body;
        if (!studentId) {
            throw new errorHandler_1.AppError(400, 'studentId is required');
        }
        // 检查学生是否存在
        const student = await (0, db_1.queryOne)(`SELECT id FROM users WHERE id = $1 AND role = 'student'`, [studentId]);
        if (!student) {
            throw new errorHandler_1.AppError(404, 'Student not found');
        }
        const reportPrice = 99;
        // 创建购买记录
        const result = await (0, db_1.queryOne)(`INSERT INTO report_purchases (company_id, student_id, price, duration_days, expires_at, purchase_at)
         VALUES ($1, $2, $3, $4, NOW() + INTERVAL '${duration} days', NOW())
         RETURNING id`, [companyId, studentId, reportPrice, duration]);
        logger_1.default.info('Report purchased', { companyId, studentId, purchaseId: result.id });
        res.json({
            success: true,
            data: {
                purchaseId: result.id,
                price: reportPrice,
                expiresAt: new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
            },
            message: 'Report access purchased successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 企业查看访问历史
 * GET /api/v1/reports/enterprise/access-history
 */
router.get('/access-history', auth_1.authenticate, (0, auth_1.requireRole)('company'), async (req, res, next) => {
    try {
        const companyId = req.user.userId;
        const { limit = 20, offset = 0 } = req.query;
        const logs = await (0, db_1.query)(`SELECT
          ral.id,
          ral.student_id,
          u.nickname as student_name,
          ral.access_reason,
          ral.report_type,
          ral.accessed_at
         FROM report_access_logs ral
         JOIN users u ON ral.student_id = u.id
         WHERE ral.company_id = $1
         ORDER BY ral.accessed_at DESC
         LIMIT $2 OFFSET $3`, [companyId, limit, offset]);
        res.json({
            success: true,
            data: logs.rows
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 企业查看购买记录
 * GET /api/v1/reports/enterprise/purchases
 */
router.get('/purchases', auth_1.authenticate, (0, auth_1.requireRole)('company'), async (req, res, next) => {
    try {
        const companyId = req.user.userId;
        const { active = true } = req.query;
        let whereClause = 'WHERE rp.company_id = $1';
        if (active === 'true' || active === true) {
            whereClause += ' AND rp.expires_at > NOW()';
        }
        const purchases = await (0, db_1.query)(`SELECT
          rp.id,
          rp.student_id,
          u.nickname as student_name,
          rp.price,
          rp.duration_days,
          rp.purchase_at,
          rp.expires_at,
          CASE WHEN rp.expires_at > NOW() THEN true ELSE false END as is_active
         FROM report_purchases rp
         JOIN users u ON rp.student_id = u.id
         ${whereClause}
         ORDER BY rp.purchase_at DESC`, [companyId]);
        res.json({
            success: true,
            data: purchases.rows
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=enterpriseRoutes.js.map