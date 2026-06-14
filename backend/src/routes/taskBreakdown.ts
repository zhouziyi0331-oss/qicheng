import { Router, Request, Response, NextFunction } from 'express';
import { taskBreakdownService } from '../services/taskBreakdownService';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * POST /api/v1/tasks/:taskId/breakdown
 * 获取任务拆解建议
 */
router.post(
  '/:taskId/breakdown',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { taskId } = req.params;
      const studentId = req.user?.userId;

      if (!studentId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const result = await taskBreakdownService.breakdownTask(taskId, studentId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/tasks/:taskId/breakdown/:breakdownId
 * 获取已保存的任务拆解
 */
router.get(
  '/:taskId/breakdown/:breakdownId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { breakdownId } = req.params;

      // TODO: Implement getBreakdown method in taskBreakdownService
      res.json({
        success: true,
        data: { breakdownId, message: 'Not yet implemented' },
      });
    } catch (error: any) {
      next(error);
    }
  }
);

export default router;
