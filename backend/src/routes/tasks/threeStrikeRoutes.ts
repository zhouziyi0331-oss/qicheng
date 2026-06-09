import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth';
import threeStrikeSafetyNetService from '../../services/threeStrikeSafetyNetService';
import logger from '../../utils/logger';

const router = Router();

/**
 * 获取三次审核兜底状态
 * GET /api/v1/tasks/:taskId/three-strike-status
 */
router.get(
  '/:taskId/three-strike-status',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { taskId } = req.params;
      const studentId = req.user!.userId;

      const status = await threeStrikeSafetyNetService.getThreeStrikeStatus(taskId, studentId);

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * 获取可转单的学生列表
 * GET /api/v1/tasks/:taskId/transfer-candidates
 */
router.get(
  '/:taskId/transfer-candidates',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { taskId } = req.params;
      const studentId = req.user!.userId;

      const candidates = await threeStrikeSafetyNetService.getTransferCandidates(
        taskId,
        studentId
      );

      res.json({
        success: true,
        data: candidates,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * 执行转单
 * POST /api/v1/tasks/:taskId/transfer
 * Body: { toStudentId, reason }
 */
router.post(
  '/:taskId/transfer',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { taskId } = req.params;
      const fromStudentId = req.user!.userId;
      const { toStudentId, reason } = req.body;

      if (!toStudentId) {
        return res.status(400).json({
          success: false,
          error: 'toStudentId is required',
        });
      }

      await threeStrikeSafetyNetService.transferTask({
        taskId,
        fromStudentId,
        toStudentId,
        reason: reason || '任务转单',
      });

      logger.info('Task transferred via API', {
        taskId,
        fromStudentId,
        toStudentId,
      });

      res.json({
        success: true,
        message: '转单成功，你将获得20%的转单费用',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * 获取可召唤的大师列表
 * GET /api/v1/tasks/:taskId/available-masters
 */
router.get(
  '/:taskId/available-masters',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { taskId } = req.params;

      const masters = await threeStrikeSafetyNetService.getAvailableMasters(taskId);

      res.json({
        success: true,
        data: masters,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * 召唤大师
 * POST /api/v1/tasks/:taskId/summon-master
 * Body: { masterId, message }
 */
router.post(
  '/:taskId/summon-master',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { taskId } = req.params;
      const studentId = req.user!.userId;
      const { masterId, message } = req.body;

      if (!masterId) {
        return res.status(400).json({
          success: false,
          error: 'masterId is required',
        });
      }

      await threeStrikeSafetyNetService.summonMaster({
        taskId,
        studentId,
        masterId,
        message,
      });

      logger.info('Master summoned via API', {
        taskId,
        studentId,
        masterId,
      });

      res.json({
        success: true,
        message: '大师已召唤，大师费用已冻结',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
