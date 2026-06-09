import { Router, Request, Response, NextFunction } from 'express';
import { dynamicProfileService } from '../services/dynamicProfileService';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * POST /api/v1/profile/update
 * 任务完成后更新学生能力画像
 * 通常由系统自动触发，也可手动触发
 */
router.post(
  '/update',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { studentId, taskId, assignmentId } = req.body;

      // 验证权限：只有管理员可以触发更新
      if (req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admin can trigger profile updates',
        });
      }

      if (!studentId || !taskId || !assignmentId) {
        return res.status(400).json({
          success: false,
          message: 'studentId, taskId, and assignmentId are required',
        });
      }

      const result = await dynamicProfileService.updateAfterTaskCompletion(
        studentId,
        taskId,
        assignmentId
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/profile/batch-update
 * 批量更新多个学生的能力画像
 */
router.post(
  '/batch-update',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { updates } = req.body;

      if (req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admin can trigger batch updates',
        });
      }

      if (!updates || !Array.isArray(updates)) {
        return res.status(400).json({
          success: false,
          message: 'updates array is required',
        });
      }

      // 验证每个更新对象的格式
      for (const update of updates) {
        if (!update.studentId || !update.taskId || !update.submissionId) {
          return res.status(400).json({
            success: false,
            message: 'Each update must have studentId, taskId, and submissionId',
          });
        }
      }

      const results = await dynamicProfileService.batchUpdate(updates);

      res.json({
        success: true,
        data: {
          totalUpdates: updates.length,
          successfulUpdates: results.length,
          results: results.map(r => dynamicProfileService.formatProfileUpdateForFrontend(r)),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/profile/:studentId/history
 * 获取学生能力画像变化历史
 */
router.get(
  '/:studentId/history',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { studentId } = req.params;
      const { limit = 20 } = req.query;

      // 验证用户只能查看自己的历史，或管理员可以查看所有
      if (req.user?.userId !== studentId && req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You can only view your own profile history',
        });
      }

      const history = await dynamicProfileService.getProfileHistory(
        studentId,
        Number(limit)
      );

      res.json({
        success: true,
        data: {
          studentId,
          history,
          total: history.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
