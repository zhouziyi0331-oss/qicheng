/**
 * Phase 1.4: 升级通关仪式路由
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import levelUpCeremonyService from '../services/levelUpCeremonyService';
import logger from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

const router = Router();

/**
 * 获取学生的升级仪式历史
 * GET /api/v1/level-up/ceremonies
 */
router.get(
  '/ceremonies',
  authenticate,
  requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { limit = '10' } = req.query;

      logger.info('[LevelUpCeremony] 获取升级仪式历史', {
        userId,
        limit
      });

      const ceremonies = await levelUpCeremonyService.getStudentCeremonies(
        userId,
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: {
          ceremonies,
          total: ceremonies.length
        }
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * 获取单个升级仪式详情
 * GET /api/v1/level-up/ceremonies/:ceremonyId
 */
router.get(
  '/ceremonies/:ceremonyId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { ceremonyId } = req.params;

      logger.info('[LevelUpCeremony] 获取仪式详情', {
        userId,
        ceremonyId
      });

      const ceremony = await levelUpCeremonyService.getCeremonyById(ceremonyId);

      if (!ceremony) {
        throw new AppError(404, '仪式记录不存在');
      }

      // 确保只能查看自己的仪式
      if (ceremony.student_id !== userId) {
        throw new AppError(403, '无权查看此仪式');
      }

      res.json({
        success: true,
        data: ceremony
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * 标记仪式已查看
 * POST /api/v1/level-up/ceremonies/:ceremonyId/viewed
 */
router.post(
  '/ceremonies/:ceremonyId/viewed',
  authenticate,
  requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { ceremonyId } = req.params;

      logger.info('[LevelUpCeremony] 标记已查看', {
        userId,
        ceremonyId
      });

      const ceremony = await levelUpCeremonyService.getCeremonyById(ceremonyId);

      if (!ceremony) {
        throw new AppError(404, '仪式记录不存在');
      }

      if (ceremony.student_id !== userId) {
        throw new AppError(403, '无权操作此仪式');
      }

      // 更新查看状态
      const { query } = require('../utils/db');
      await query(
        `UPDATE level_up_ceremonies
         SET viewed = true, viewed_at = NOW()
         WHERE id = $1`,
        [ceremonyId]
      );

      res.json({
        success: true,
        message: '已标记为已查看'
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * 标记仪式已分享
 * POST /api/v1/level-up/ceremonies/:ceremonyId/shared
 */
router.post(
  '/ceremonies/:ceremonyId/shared',
  authenticate,
  requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { ceremonyId } = req.params;

      logger.info('[LevelUpCeremony] 标记已分享', {
        userId,
        ceremonyId
      });

      const ceremony = await levelUpCeremonyService.getCeremonyById(ceremonyId);

      if (!ceremony) {
        throw new AppError(404, '仪式记录不存在');
      }

      if (ceremony.student_id !== userId) {
        throw new AppError(403, '无权操作此仪式');
      }

      // 更新分享状态
      const { query } = require('../utils/db');
      await query(
        `UPDATE level_up_ceremonies
         SET shared = true, shared_at = NOW()
         WHERE id = $1`,
        [ceremonyId]
      );

      res.json({
        success: true,
        message: '已标记为已分享'
      });
    } catch (error: any) {
      next(error);
    }
  }
);

export default router;
