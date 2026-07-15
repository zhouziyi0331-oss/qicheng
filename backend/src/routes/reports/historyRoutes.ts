/**
 * Phase R5.4: 报告历史增强路由
 * 报告历史、对比、可视化API
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import reportHistoryService from '../../services/reportHistoryService';
import reportPDFService from '../../services/reportPDFService';
import logger from '../../utils/logger';
import { AppError } from '../../middleware/errorHandler';

const router = Router();

/**
 * 获取报告历史
 * GET /api/v1/reports/student/history
 */
router.get(
  '/history',
  authenticate,
  requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const {
        reportType,
        limit = '10',
        offset = '0'
      } = req.query;

      logger.info('[报告历史] 查询报告历史', {
        userId,
        reportType,
        limit,
        offset
      });

      const result = await reportHistoryService.getReportHistory(userId, {
        reportType: reportType as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

      res.json({
        success: true,
        data: {
          reports: result.reports,
          total: result.total,
          pagination: {
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
            hasMore: result.total > parseInt(offset as string) + parseInt(limit as string)
          }
        }
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * 对比两个报告
 * POST /api/v1/reports/student/compare
 */
router.post(
  '/compare',
  authenticate,
  requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { olderReportId, newerReportId } = req.body;

      if (!olderReportId || !newerReportId) {
        throw new AppError(400, 'olderReportId and newerReportId are required');
      }

      logger.info('[报告对比] 对比报告', {
        userId,
        olderReportId,
        newerReportId
      });

      const comparison = await reportHistoryService.compareReports(
        userId,
        olderReportId,
        newerReportId
      );

      res.json({
        success: true,
        data: comparison
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * 获取成长曲线数据
 * GET /api/v1/reports/student/growth-curve
 */
router.get(
  '/growth-curve',
  authenticate,
  requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { timeRange = '90' } = req.query;

      logger.info('[成长曲线] 获取成长曲线', {
        userId,
        timeRange
      });

      const curveData = await reportHistoryService.getGrowthCurve(
        userId,
        parseInt(timeRange as string)
      );

      res.json({
        success: true,
        data: curveData
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * 获取技能雷达图数据
 * GET /api/v1/reports/student/skill-radar
 */
router.get(
  '/skill-radar',
  authenticate,
  requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      logger.info('[技能雷达] 获取技能雷达数据', { userId });

      const radarData = await reportHistoryService.getSkillRadarData(userId);

      if (!radarData) {
        throw new AppError(404, 'No report found for this student');
      }

      res.json({
        success: true,
        data: radarData
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * 获取里程碑时间轴
 * GET /api/v1/reports/student/milestone-timeline
 */
router.get(
  '/milestone-timeline',
  authenticate,
  requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      logger.info('[里程碑时间轴] 获取时间轴', { userId });

      const timeline = await reportHistoryService.getMilestoneTimeline(userId);

      res.json({
        success: true,
        data: {
          milestones: timeline,
          total: timeline.length
        }
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * 导出报告为PDF
 * GET /api/v1/reports/student/export-pdf/:reportId
 */
router.get(
  '/export-pdf/:reportId',
  authenticate,
  requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { reportId } = req.params;
      const { includeCharts = 'true', format = 'A4' } = req.query;

      logger.info('[PDF导出] 导出报告', {
        userId,
        reportId,
        includeCharts,
        format
      });

      const pdfBuffer = await reportPDFService.exportReportToPDF({
        studentId: userId,
        reportId,
        includeCharts: includeCharts === 'true',
        format: format as 'A4' | 'Letter'
      });

      // 设置响应头
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="report-${reportId}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);
    } catch (error: any) {
      next(error);
    }
  }
);

export default router;
