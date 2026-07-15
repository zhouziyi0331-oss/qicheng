"use strict";
/**
 * Phase R5.2: 学生报告功能扩展
 * 学生查看"谁看了我的报告"、设置报告可见性等
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
const historyRoutes_1 = __importDefault(require("./historyRoutes"));
const router = (0, express_1.Router)();
// Phase R5.4: 报告历史增强路由
router.use('/', historyRoutes_1.default);
/**
 * 学生查看自己的报告
 * GET /api/v1/reports/student/my-report
 */
router.get('/my-report', auth_1.authenticate, (0, auth_1.requireRole)('student'), async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { reportType = 'comprehensive', forceRegenerate = false } = req.query;
        logger_1.default.info('Student viewing own report', { userId, reportType });
        // 查找最近的报告缓存（24小时内）
        let cachedReport = null;
        if (!forceRegenerate) {
            cachedReport = await (0, db_1.queryOne)(`SELECT report_data, generated_at FROM student_reports
           WHERE student_id = $1 AND report_type = $2
           AND generated_at > NOW() - INTERVAL '24 hours'
           ORDER BY generated_at DESC LIMIT 1`, [userId, reportType]);
        }
        let report;
        let isCached = false;
        if (cachedReport) {
            report = cachedReport.report_data;
            isCached = true;
        }
        else {
            // 生成新报告
            report = await reportGeneratorAgent_1.default.generateReport(userId, {
                reportType: reportType,
                timeRange: 90
            });
            // 保存报告到缓存
            await (0, db_1.query)(`INSERT INTO student_reports (student_id, report_type, report_data, generated_at)
           VALUES ($1, $2, $3, NOW())`, [userId, reportType, JSON.stringify(report)]);
        }
        res.json({
            success: true,
            data: {
                report,
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
 * 学生查看"谁看了我的报告"
 * GET /api/v1/reports/student/who-viewed
 */
router.get('/who-viewed', auth_1.authenticate, (0, auth_1.requireRole)('student'), async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { limit = 20, offset = 0, days = 30 } = req.query;
        logger_1.default.info('Student checking who viewed their report', { userId });
        // 获取查看记录
        const viewLogs = await (0, db_1.query)(`SELECT
          ral.id,
          ral.company_id,
          u.company_name,
          u.avatar_url as company_avatar,
          ral.access_reason,
          ral.report_type,
          ral.accessed_at,
          CASE
            WHEN rp.id IS NOT NULL THEN true
            ELSE false
          END as is_paid_access
         FROM report_access_logs ral
         JOIN users u ON ral.company_id = u.id
         LEFT JOIN report_purchases rp ON rp.company_id = ral.company_id
           AND rp.student_id = ral.student_id
           AND rp.expires_at > NOW()
         WHERE ral.student_id = $1
           AND ral.accessed_at > NOW() - INTERVAL '${days} days'
         ORDER BY ral.accessed_at DESC
         LIMIT $2 OFFSET $3`, [userId, limit, offset]);
        // 统计数据
        const stats = await (0, db_1.queryOne)(`SELECT
          COUNT(*) as total_views,
          COUNT(DISTINCT company_id) as unique_companies,
          COUNT(*) FILTER (WHERE access_reason = 'purchased') as paid_views,
          COUNT(*) FILTER (WHERE access_reason = 'public') as public_views
         FROM report_access_logs
         WHERE student_id = $1
           AND accessed_at > NOW() - INTERVAL '${days} days'`, [userId]);
        res.json({
            success: true,
            data: {
                viewLogs: viewLogs.rows,
                stats: {
                    totalViews: parseInt(stats.total_views),
                    uniqueCompanies: parseInt(stats.unique_companies),
                    paidViews: parseInt(stats.paid_views),
                    publicViews: parseInt(stats.public_views)
                },
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    days: parseInt(days)
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 学生设置报告可见性
 * PUT /api/v1/reports/student/visibility
 */
router.put('/visibility', auth_1.authenticate, (0, auth_1.requireRole)('student'), async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { isPublic } = req.body;
        if (typeof isPublic !== 'boolean') {
            throw new errorHandler_1.AppError(400, 'isPublic must be a boolean');
        }
        await (0, db_1.query)(`UPDATE users SET report_public = $1, updated_at = NOW() WHERE id = $2`, [isPublic, userId]);
        logger_1.default.info('Report visibility changed', { userId, isPublic });
        res.json({
            success: true,
            message: `Report is now ${isPublic ? 'public' : 'private'}`,
            data: { isPublic }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 学生获取报告可见性状态
 * GET /api/v1/reports/student/visibility
 */
router.get('/visibility', auth_1.authenticate, (0, auth_1.requireRole)('student'), async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await (0, db_1.queryOne)(`SELECT report_public FROM users WHERE id = $1`, [userId]);
        res.json({
            success: true,
            data: {
                isPublic: user?.report_public || false
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 学生查看报告统计
 * GET /api/v1/reports/student/stats
 */
router.get('/stats', auth_1.authenticate, (0, auth_1.requireRole)('student'), async (req, res, next) => {
    try {
        const userId = req.user.userId;
        // 总体统计
        const overall = await (0, db_1.queryOne)(`SELECT
          (SELECT COUNT(*) FROM report_access_logs WHERE student_id = $1) as total_views,
          (SELECT COUNT(DISTINCT company_id) FROM report_access_logs WHERE student_id = $1) as unique_companies,
          (SELECT COUNT(*) FROM report_purchases WHERE student_id = $1) as total_purchases,
          (SELECT COUNT(*) FROM report_purchases WHERE student_id = $1 AND expires_at > NOW()) as active_purchases`, [userId]);
        // 最近30天趋势
        const trend = await (0, db_1.query)(`SELECT
          DATE(accessed_at) as date,
          COUNT(*) as views,
          COUNT(DISTINCT company_id) as unique_companies
         FROM report_access_logs
         WHERE student_id = $1
           AND accessed_at > NOW() - INTERVAL '30 days'
         GROUP BY DATE(accessed_at)
         ORDER BY date DESC`, [userId]);
        // 访问原因分布
        const reasonDistribution = await (0, db_1.query)(`SELECT
          access_reason,
          COUNT(*) as count
         FROM report_access_logs
         WHERE student_id = $1
         GROUP BY access_reason`, [userId]);
        res.json({
            success: true,
            data: {
                overall: {
                    totalViews: parseInt(overall.total_views),
                    uniqueCompanies: parseInt(overall.unique_companies),
                    totalPurchases: parseInt(overall.total_purchases),
                    activePurchases: parseInt(overall.active_purchases)
                },
                trend: trend.rows,
                reasonDistribution: reasonDistribution.rows
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 学生生成报告分享链接
 * POST /api/v1/reports/student/share-link
 */
router.post('/share-link', auth_1.authenticate, (0, auth_1.requireRole)('student'), async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { expiresInDays = 7, reportType = 'comprehensive' } = req.body;
        // 生成唯一的分享token
        const crypto = require('crypto');
        const shareToken = crypto.randomBytes(32).toString('hex');
        // 保存分享链接
        const result = await (0, db_1.queryOne)(`INSERT INTO report_share_links (student_id, share_token, report_type, expires_at, created_at)
         VALUES ($1, $2, $3, NOW() + INTERVAL '${expiresInDays} days', NOW())
         RETURNING id`, [userId, shareToken, reportType]);
        logger_1.default.info('Report share link created', {
            userId,
            shareToken,
            linkId: result.id,
            expiresInDays
        });
        res.json({
            success: true,
            data: {
                shareLink: `${process.env.FRONTEND_URL || 'https://qicheng.com'}/reports/shared/${shareToken}`,
                shareToken,
                expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
                expiresInDays
            },
            message: 'Share link created successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 学生查看自己的分享链接
 * GET /api/v1/reports/student/share-links
 */
router.get('/share-links', auth_1.authenticate, (0, auth_1.requireRole)('student'), async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const links = await (0, db_1.query)(`SELECT
          id,
          share_token,
          report_type,
          created_at,
          expires_at,
          view_count,
          CASE WHEN expires_at > NOW() THEN true ELSE false END as is_active
         FROM report_share_links
         WHERE student_id = $1
         ORDER BY created_at DESC`, [userId]);
        res.json({
            success: true,
            data: links.rows
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 学生删除分享链接
 * DELETE /api/v1/reports/student/share-links/:linkId
 */
router.delete('/share-links/:linkId', auth_1.authenticate, (0, auth_1.requireRole)('student'), async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { linkId } = req.params;
        // 确保只能删除自己的链接
        const result = await (0, db_1.query)(`DELETE FROM report_share_links
         WHERE id = $1 AND student_id = $2
         RETURNING id`, [linkId, userId]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError(404, 'Share link not found or not owned by you');
        }
        logger_1.default.info('Report share link deleted', { userId, linkId });
        res.json({
            success: true,
            message: 'Share link deleted successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=studentRoutes.js.map