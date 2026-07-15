/**
 * Phase 2.3: 成长对比路由
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import growthComparisonService from '../services/growthComparisonService';
import logger from '../utils/logger';

const router = Router();

/**
 * 获取学生的成长对比数据
 * GET /api/v1/growth-comparison
 */
router.get(
  '/',
  authenticate,
  requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      logger.info('[GrowthComparison] 获取成长对比', { userId });

      const comparison = await growthComparisonService.generateComparison(userId);

      res.json({
        success: true,
        data: comparison
      });
    } catch (error: any) {
      logger.error('[GrowthComparison] 获取成长对比失败:', error);
      next(error);
    }
  }
);

export default router;
