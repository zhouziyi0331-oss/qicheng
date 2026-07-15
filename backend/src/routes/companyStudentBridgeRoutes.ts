/**
 * Phase 3.3: 企业-学生端打通路由
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import companyStudentBridgeService from '../services/companyStudentBridgeService';
import logger from '../utils/logger';

const router = Router();

/**
 * 企业订阅学生成长
 * POST /api/v1/company-student-bridge/subscribe
 */
router.post(
  '/subscribe',
  authenticate,
  requireRole('company'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.userId;
      const { studentId, subscriptionType, notificationPreferences } = req.body;

      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: '请指定学生ID'
        });
      }

      logger.info('[CompanyStudentBridge] 企业订阅学生', { companyId, studentId });

      const success = await companyStudentBridgeService.subscribeToStudent({
        companyId,
        studentId,
        subscriptionType,
        notificationPreferences
      });

      res.json({
        success,
        message: '订阅成功'
      });
    } catch (error: any) {
      logger.error('[CompanyStudentBridge] 订阅失败:', error);
      next(error);
    }
  }
);

/**
 * 企业添加学生声誉标签
 * POST /api/v1/company-student-bridge/reputation-tag
 */
router.post(
  '/reputation-tag',
  authenticate,
  requireRole('company'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.userId;
      const createdBy = req.user!.userId;
      const {
        studentId,
        tagType,
        tagName,
        tagDescription,
        evidence,
        sourceTaskId,
        confidenceScore,
        isVisibleToStudent
      } = req.body;

      if (!studentId || !tagType || !tagName) {
        return res.status(400).json({
          success: false,
          message: '学生ID、标签类型和标签名称为必填项'
        });
      }

      logger.info('[CompanyStudentBridge] 添加声誉标签', {
        companyId,
        studentId,
        tagType
      });

      const tagId = await companyStudentBridgeService.addReputationTag({
        companyId,
        studentId,
        tagType,
        tagName,
        tagDescription,
        evidence,
        sourceTaskId,
        confidenceScore,
        isVisibleToStudent,
        createdBy
      });

      res.json({
        success: true,
        data: { tagId },
        message: '标签添加成功'
      });
    } catch (error: any) {
      logger.error('[CompanyStudentBridge] 添加标签失败:', error);
      next(error);
    }
  }
);

/**
 * 企业获取成长通知
 * GET /api/v1/company-student-bridge/notifications
 */
router.get(
  '/notifications',
  authenticate,
  requireRole('company'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.userId;
      const { unreadOnly, limit, offset } = req.query;

      logger.info('[CompanyStudentBridge] 获取成长通知', { companyId });

      const result = await companyStudentBridgeService.getCompanyNotifications({
        companyId,
        unreadOnly: unreadOnly === 'true',
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('[CompanyStudentBridge] 获取通知失败:', error);
      next(error);
    }
  }
);

/**
 * 标记通知为已读
 * POST /api/v1/company-student-bridge/notifications/:notificationId/read
 */
router.post(
  '/notifications/:notificationId/read',
  authenticate,
  requireRole('company'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.userId;
      const notificationId = parseInt(req.params.notificationId);

      logger.info('[CompanyStudentBridge] 标记通知已读', {
        companyId,
        notificationId
      });

      const success = await companyStudentBridgeService.markNotificationAsRead(
        notificationId,
        companyId
      );

      res.json({
        success,
        message: success ? '标记成功' : '通知不存在'
      });
    } catch (error: any) {
      logger.error('[CompanyStudentBridge] 标记已读失败:', error);
      next(error);
    }
  }
);

/**
 * 学生获取自己的声誉标签
 * GET /api/v1/company-student-bridge/my-reputation
 */
router.get(
  '/my-reputation',
  authenticate,
  requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.user!.userId;

      logger.info('[CompanyStudentBridge] 学生获取声誉标签', { studentId });

      const tags = await companyStudentBridgeService.getStudentReputationTags(studentId);

      res.json({
        success: true,
        data: tags
      });
    } catch (error: any) {
      logger.error('[CompanyStudentBridge] 获取声誉标签失败:', error);
      next(error);
    }
  }
);

/**
 * 学生获取自己的成长里程碑
 * GET /api/v1/company-student-bridge/my-milestones
 */
router.get(
  '/my-milestones',
  authenticate,
  requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.user!.userId;
      const { milestoneType, limit } = req.query;

      logger.info('[CompanyStudentBridge] 学生获取成长里程碑', { studentId });

      const milestones = await companyStudentBridgeService.getStudentMilestones({
        studentId,
        milestoneType: milestoneType as string | undefined,
        limit: limit ? parseInt(limit as string) : undefined
      });

      res.json({
        success: true,
        data: milestones
      });
    } catch (error: any) {
      logger.error('[CompanyStudentBridge] 获取里程碑失败:', error);
      next(error);
    }
  }
);

export default router;
