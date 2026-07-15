/**
 * Phase 3.1: 引路人机制路由
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import mentorRelationshipService from '../services/mentorRelationshipService';
import logger from '../utils/logger';

const router = Router();

/**
 * 检查成为引路人的资格
 * GET /api/v1/mentor-relationship/qualification/check
 */
router.get(
  '/qualification/check',
  authenticate,
  requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      logger.info('[MentorRelationship] 检查引路人资格', { userId });

      const result = await mentorRelationshipService.checkQualification(userId);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('[MentorRelationship] 检查资格失败:', error);
      next(error);
    }
  }
);

/**
 * 申请成为引路人
 * POST /api/v1/mentor-relationship/apply
 */
router.post(
  '/apply',
  authenticate,
  requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { applicationReason, experienceSummary, specialties } = req.body;

      if (!applicationReason) {
        return res.status(400).json({
          success: false,
          message: '请填写申请理由'
        });
      }

      logger.info('[MentorRelationship] 申请成为引路人', { userId });

      const result = await mentorRelationshipService.applyToBeMentor({
        studentId: userId,
        applicationReason,
        experienceSummary,
        specialties
      });

      res.json(result);
    } catch (error: any) {
      logger.error('[MentorRelationship] 申请失败:', error);
      next(error);
    }
  }
);

/**
 * 为学生匹配引路人
 * GET /api/v1/mentor-relationship/match
 */
router.get(
  '/match',
  authenticate,
  requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      logger.info('[MentorRelationship] 匹配引路人', { userId });

      const matches = await mentorRelationshipService.findMentorForStudent(userId);

      res.json({
        success: true,
        data: matches
      });
    } catch (error: any) {
      logger.error('[MentorRelationship] 匹配失败:', error);
      next(error);
    }
  }
);

/**
 * 选择引路人，建立关系
 * POST /api/v1/mentor-relationship/connect
 */
router.post(
  '/connect',
  authenticate,
  requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { mentorStudentId, matchedReason } = req.body;

      if (!mentorStudentId) {
        return res.status(400).json({
          success: false,
          message: '请选择引路人'
        });
      }

      logger.info('[MentorRelationship] 建立引路人关系', {
        menteeId: userId,
        mentorId: mentorStudentId
      });

      const result = await mentorRelationshipService.createRelationship({
        mentorStudentId,
        menteeStudentId: userId,
        matchedReason: matchedReason || '系统匹配'
      });

      res.json(result);
    } catch (error: any) {
      logger.error('[MentorRelationship] 建立关系失败:', error);
      next(error);
    }
  }
);

/**
 * 记录引路人互动
 * POST /api/v1/mentor-relationship/interaction
 */
router.post(
  '/interaction',
  authenticate,
  requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { relationshipId, interactionType, content, menteeStudentId, context } = req.body;

      if (!relationshipId || !interactionType || !content) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数'
        });
      }

      logger.info('[MentorRelationship] 记录互动', {
        relationshipId,
        mentorId: userId,
        type: interactionType
      });

      const success = await mentorRelationshipService.recordInteraction({
        relationshipId,
        interactionType,
        content,
        mentorStudentId: userId,
        menteeStudentId,
        context
      });

      res.json({
        success,
        message: success ? '记录成功' : '记录失败'
      });
    } catch (error: any) {
      logger.error('[MentorRelationship] 记录互动失败:', error);
      next(error);
    }
  }
);

export default router;
