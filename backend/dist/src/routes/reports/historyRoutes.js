"use strict";
/**
 * Phase R5.4: 报告历史增强路由
 * 报告历史、对比、可视化API
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const reportHistoryService_1 = __importDefault(require("../../services/reportHistoryService"));
const reportPDFService_1 = __importDefault(require("../../services/reportPDFService"));
const logger_1 = __importDefault(require("../../utils/logger"));
const errorHandler_1 = require("../../middleware/errorHandler");
const router = (0, express_1.Router)();
/**
 * 获取报告历史
 * GET /api/v1/reports/student/history
 */
router.get('/history', auth_1.authenticate, (0, auth_1.requireRole)('student'), async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { reportType, limit = '10', offset = '0' } = req.query;
        logger_1.default.info('[报告历史] 查询报告历史', {
            userId,
            reportType,
            limit,
            offset
        });
        const result = await reportHistoryService_1.default.getReportHistory(userId, {
            reportType: reportType,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        res.json({
            success: true,
            data: {
                reports: result.reports,
                total: result.total,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: result.total > parseInt(offset) + parseInt(limit)
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 对比两个报告
 * POST /api/v1/reports/student/compare
 */
router.post('/compare', auth_1.authenticate, (0, auth_1.requireRole)('student'), async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { olderReportId, newerReportId } = req.body;
        if (!olderReportId || !newerReportId) {
            throw new errorHandler_1.AppError(400, 'olderReportId and newerReportId are required');
        }
        logger_1.default.info('[报告对比] 对比报告', {
            userId,
            olderReportId,
            newerReportId
        });
        const comparison = await reportHistoryService_1.default.compareReports(userId, olderReportId, newerReportId);
        res.json({
            success: true,
            data: comparison
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 获取成长曲线数据
 * GET /api/v1/reports/student/growth-curve
 */
router.get('/growth-curve', auth_1.authenticate, (0, auth_1.requireRole)('student'), async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { timeRange = '90' } = req.query;
        logger_1.default.info('[成长曲线] 获取成长曲线', {
            userId,
            timeRange
        });
        const curveData = await reportHistoryService_1.default.getGrowthCurve(userId, parseInt(timeRange));
        res.json({
            success: true,
            data: curveData
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 获取技能雷达图数据
 * GET /api/v1/reports/student/skill-radar
 */
router.get('/skill-radar', auth_1.authenticate, (0, auth_1.requireRole)('student'), async (req, res, next) => {
    try {
        const userId = req.user.userId;
        logger_1.default.info('[技能雷达] 获取技能雷达数据', { userId });
        const radarData = await reportHistoryService_1.default.getSkillRadarData(userId);
        if (!radarData) {
            throw new errorHandler_1.AppError(404, 'No report found for this student');
        }
        res.json({
            success: true,
            data: radarData
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 获取里程碑时间轴
 * GET /api/v1/reports/student/milestone-timeline
 */
router.get('/milestone-timeline', auth_1.authenticate, (0, auth_1.requireRole)('student'), async (req, res, next) => {
    try {
        const userId = req.user.userId;
        logger_1.default.info('[里程碑时间轴] 获取时间轴', { userId });
        const timeline = await reportHistoryService_1.default.getMilestoneTimeline(userId);
        res.json({
            success: true,
            data: {
                milestones: timeline,
                total: timeline.length
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 导出报告为PDF
 * GET /api/v1/reports/student/export-pdf/:reportId
 */
router.get('/export-pdf/:reportId', auth_1.authenticate, (0, auth_1.requireRole)('student'), async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { reportId } = req.params;
        const { includeCharts = 'true', format = 'A4' } = req.query;
        logger_1.default.info('[PDF导出] 导出报告', {
            userId,
            reportId,
            includeCharts,
            format
        });
        const pdfBuffer = await reportPDFService_1.default.exportReportToPDF({
            studentId: userId,
            reportId,
            includeCharts: includeCharts === 'true',
            format: format
        });
        // 设置响应头
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="report-${reportId}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.send(pdfBuffer);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=historyRoutes.js.map