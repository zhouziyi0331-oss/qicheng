/**
 * Phase 2.1: OPC身份卡片路由
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import opcIdentityCardService from '../services/opcIdentityCardService';
import logger from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

const router = Router();

/**
 * 生成身份卡片
 * POST /api/v1/opc/identity-cards
 */
router.post(
  '/identity-cards',
  authenticate,
  requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { theme, includeStats } = req.body;

      logger.info('[OPCIdentityCard] 生成身份卡片', {
        userId,
        theme,
        includeStats
      });

      const card = await opcIdentityCardService.generateCard(userId, {
        theme,
        includeStats
      });

      res.json({
        success: true,
        data: card,
        message: '身份卡片生成成功'
      });
    } catch (error: any) {
      if (error.message === '未找到OPC测评结果') {
        next(new AppError(404, '请先完成OPC测评'));
      } else {
        next(error);
      }
    }
  }
);

/**
 * 获取学生的身份卡片列表
 * GET /api/v1/opc/identity-cards
 */
router.get(
  '/identity-cards',
  authenticate,
  requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { limit = '10' } = req.query;

      logger.info('[OPCIdentityCard] 获取身份卡片列表', {
        userId,
        limit
      });

      const cards = await opcIdentityCardService.getStudentCards(
        userId,
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: {
          cards,
          total: cards.length
        }
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * 获取单个身份卡片（公开访问，用于分享）
 * GET /api/v1/opc/identity-cards/:cardId
 */
router.get(
  '/identity-cards/:cardId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { cardId } = req.params;
      const { incrementView = 'true' } = req.query;

      logger.info('[OPCIdentityCard] 获取身份卡片详情', {
        cardId,
        incrementView
      });

      const card = await opcIdentityCardService.getCardById(
        cardId,
        incrementView === 'true'
      );

      if (!card) {
        throw new AppError(404, '身份卡片不存在');
      }

      res.json({
        success: true,
        data: card
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * 删除身份卡片
 * DELETE /api/v1/opc/identity-cards/:cardId
 */
router.delete(
  '/identity-cards/:cardId',
  authenticate,
  requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { cardId } = req.params;

      logger.info('[OPCIdentityCard] 删除身份卡片', {
        userId,
        cardId
      });

      const deleted = await opcIdentityCardService.deleteCard(cardId, userId);

      if (!deleted) {
        throw new AppError(404, '身份卡片不存在或无权删除');
      }

      res.json({
        success: true,
        message: '身份卡片已删除'
      });
    } catch (error: any) {
      next(error);
    }
  }
);

export default router;
