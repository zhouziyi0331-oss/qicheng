/**
 * Phase R5.2: 公共报告分享访问
 * 通过分享链接访问学生报告（无需登录）
 */

import { Router, Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../../utils/db';
import logger from '../../utils/logger';
import { AppError } from '../../middleware/errorHandler';
import reportGeneratorAgent from '../../agents/reportGeneratorAgent';

const router = Router();

/**
 * 通过分享链接访问报告（无需认证）
 * GET /api/v1/reports/shared/:shareToken
 */
router.get(
  '/:shareToken',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { shareToken } = req.params;

      // 验证分享链接
      const shareLink = await queryOne<{
        id: string;
        student_id: string;
        report_type: string;
        expires_at: Date;
        view_count: number;
      }>(
        `SELECT id, student_id, report_type, expires_at, view_count
         FROM report_share_links
         WHERE share_token = $1`,
        [shareToken]
      );

      if (!shareLink) {
        throw new AppError(404, 'Share link not found');
      }

      // 检查是否过期
      if (new Date(shareLink.expires_at) < new Date()) {
        throw new AppError(410, 'Share link has expired');
      }

      logger.info('Accessing report via share link', {
        shareToken,
        studentId: shareLink.student_id,
        linkId: shareLink.id
      });

      // 查找最近的报告缓存（24小时内）
      let cachedReport = await queryOne<{
        report_data: any;
        generated_at: Date;
      }>(
        `SELECT report_data, generated_at FROM student_reports
         WHERE student_id = $1 AND report_type = $2
         AND generated_at > NOW() - INTERVAL '24 hours'
         ORDER BY generated_at DESC LIMIT 1`,
        [shareLink.student_id, shareLink.report_type]
      );

      let report;
      let isCached = false;

      if (cachedReport) {
        report = cachedReport.report_data;
        isCached = true;
      } else {
        // 生成新报告
        report = await reportGeneratorAgent.generateReport(shareLink.student_id, {
          reportType: shareLink.report_type as any,
          timeRange: 90
        });

        // 保存报告到缓存
        await query(
          `INSERT INTO student_reports (student_id, report_type, report_data, generated_at)
           VALUES ($1, $2, $3, NOW())`,
          [shareLink.student_id, shareLink.report_type, JSON.stringify(report)]
        );
      }

      // 增加查看计数
      await query(
        `UPDATE report_share_links
         SET view_count = view_count + 1,
             last_viewed_at = NOW()
         WHERE id = $1`,
        [shareLink.id]
      );

      // 记录访问日志（如果有IP等信息）
      const ipAddress = req.ip || req.socket.remoteAddress;
      await query(
        `INSERT INTO report_share_access_logs (share_link_id, student_id, ip_address, user_agent, accessed_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [shareLink.id, shareLink.student_id, ipAddress, req.headers['user-agent']]
      );

      res.json({
        success: true,
        data: {
          report,
          shareInfo: {
            expiresAt: shareLink.expires_at,
            viewCount: shareLink.view_count + 1,
            reportType: shareLink.report_type
          },
          isCached,
          generatedAt: isCached ? cachedReport!.generated_at : new Date()
        }
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * 验证分享链接是否有效（轻量级检查）
 * GET /api/v1/reports/shared/:shareToken/validate
 */
router.get(
  '/:shareToken/validate',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { shareToken } = req.params;

      const shareLink = await queryOne<{
        id: string;
        student_id: string;
        expires_at: Date;
      }>(
        `SELECT id, student_id, expires_at
         FROM report_share_links
         WHERE share_token = $1`,
        [shareToken]
      );

      if (!shareLink) {
        return res.json({
          success: false,
          valid: false,
          reason: 'not_found'
        });
      }

      const isExpired = new Date(shareLink.expires_at) < new Date();
      if (isExpired) {
        return res.json({
          success: false,
          valid: false,
          reason: 'expired',
          expiresAt: shareLink.expires_at
        });
      }

      res.json({
        success: true,
        valid: true,
        expiresAt: shareLink.expires_at
      });
    } catch (error: any) {
      next(error);
    }
  }
);

export default router;
