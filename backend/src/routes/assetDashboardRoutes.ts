/**
 * Phase 2.2: 资产仪表盘路由
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import abilityValuationService from '../services/abilityValuationService';
import logger from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

const router = Router();

/**
 * 获取学生的资产仪表盘
 * GET /api/v1/asset-dashboard
 */
router.get(
  '/',
  authenticate,
  requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      logger.info('[AssetDashboard] 获取资产仪表盘', { userId });

      const dashboard = await abilityValuationService.generateDashboard(userId);

      res.json({
        success: true,
        data: dashboard
      });
    } catch (error: any) {
      logger.error('[AssetDashboard] 获取资产仪表盘失败:', error);
      next(error);
    }
  }
);

/**
 * 获取能力价值详情
 * GET /api/v1/asset-dashboard/ability/:abilityName
 */
router.get(
  '/ability/:abilityName',
  authenticate,
  requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { abilityName } = req.params;

      logger.info('[AssetDashboard] 获取能力价值详情', {
        userId,
        abilityName
      });

      // 获取完整仪表盘数据
      const dashboard = await abilityValuationService.generateDashboard(userId);

      // 找到指定能力
      const ability = dashboard.assets.find(a => a.abilityName === abilityName);

      if (!ability) {
        throw new AppError(404, '能力不存在');
      }

      res.json({
        success: true,
        data: {
          ability,
          trends: dashboard.trends // 包含趋势数据
        }
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * 获取市场价值对比
 * GET /api/v1/asset-dashboard/market-comparison
 */
router.get(
  '/market-comparison',
  authenticate,
  requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      logger.info('[AssetDashboard] 获取市场对比', { userId });

      const dashboard = await abilityValuationService.generateDashboard(userId);

      res.json({
        success: true,
        data: {
          totalValue: dashboard.totalValue,
          marketComparison: dashboard.marketComparison,
          growthRate: dashboard.growthRate
        }
      });
    } catch (error: any) {
      next(error);
    }
  }
);

export default router;
