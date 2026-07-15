/**
 * Phase 3.2: OPC故事墙路由
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import opcStoryService from '../services/opcStoryService';
import logger from '../utils/logger';

const router = Router();

/**
 * 创建故事
 * POST /api/v1/opc-stories
 */
router.post(
  '/',
  authenticate,
  requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const {
        title,
        storyContent,
        storyType,
        emotionTags,
        lifeQuestion,
        beforeState,
        afterState,
        keyMoment,
        reflection
      } = req.body;

      if (!title || !storyContent || !storyType) {
        return res.status(400).json({
          success: false,
          message: '标题、内容和类型为必填项'
        });
      }

      logger.info('[OpcStory] 创建故事', { userId, storyType });

      const result = await opcStoryService.createStory({
        studentId: userId,
        title,
        storyContent,
        storyType,
        emotionTags,
        lifeQuestion,
        beforeState,
        afterState,
        keyMoment,
        reflection
      });

      res.json(result);
    } catch (error: any) {
      logger.error('[OpcStory] 创建故事失败:', error);
      next(error);
    }
  }
);

/**
 * 搜索/浏览故事
 * GET /api/v1/opc-stories/search
 */
router.get(
  '/search',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        personalityType,
        storyType,
        emotionTags,
        featured,
        search,
        limit,
        offset
      } = req.query;

      logger.info('[OpcStory] 搜索故事', {
        userId: req.user?.userId,
        personalityType,
        storyType
      });

      const filter = {
        personalityType: personalityType as string | undefined,
        storyType: storyType as 'discovery' | 'breakthrough' | 'acceptance' | 'growth' | undefined,
        emotionTags: emotionTags ? (Array.isArray(emotionTags) ? emotionTags as string[] : [emotionTags as string]) : undefined,
        featured: featured === 'true',
        search: search as string | undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      };

      const result = await opcStoryService.searchStories(filter);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('[OpcStory] 搜索故事失败:', error);
      next(error);
    }
  }
);

/**
 * 获取故事详情
 * GET /api/v1/opc-stories/:storyId
 */
router.get(
  '/:storyId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { storyId } = req.params;
      const userId = req.user?.userId;

      logger.info('[OpcStory] 获取故事详情', { storyId, userId });

      const story = await opcStoryService.getStoryById(storyId, userId);

      if (!story) {
        return res.status(404).json({
          success: false,
          message: '故事不存在'
        });
      }

      res.json({
        success: true,
        data: story
      });
    } catch (error: any) {
      logger.error('[OpcStory] 获取故事详情失败:', error);
      next(error);
    }
  }
);

/**
 * 点赞故事
 * POST /api/v1/opc-stories/:storyId/like
 */
router.post(
  '/:storyId/like',
  authenticate,
  requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { storyId } = req.params;
      const userId = req.user!.userId;

      logger.info('[OpcStory] 点赞故事', { storyId, userId });

      const success = await opcStoryService.likeStory(storyId, userId);

      res.json({
        success,
        message: success ? '点赞成功' : '已经点赞过了'
      });
    } catch (error: any) {
      logger.error('[OpcStory] 点赞故事失败:', error);
      next(error);
    }
  }
);

/**
 * 标记共鸣
 * POST /api/v1/opc-stories/:storyId/resonate
 */
router.post(
  '/:storyId/resonate',
  authenticate,
  requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { storyId } = req.params;
      const userId = req.user!.userId;
      const { resonanceType, note } = req.body;

      if (!resonanceType) {
        return res.status(400).json({
          success: false,
          message: '请选择共鸣类型'
        });
      }

      logger.info('[OpcStory] 标记共鸣', { storyId, userId, resonanceType });

      const success = await opcStoryService.markResonance({
        storyId,
        studentId: userId,
        resonanceType,
        note
      });

      res.json({
        success,
        message: '标记成功'
      });
    } catch (error: any) {
      logger.error('[OpcStory] 标记共鸣失败:', error);
      next(error);
    }
  }
);

/**
 * 获取故事统计
 * GET /api/v1/opc-stories-stats
 */
router.get(
  '-stats',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('[OpcStory] 获取故事统计');

      const stats = await opcStoryService.getStoryStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      logger.error('[OpcStory] 获取故事统计失败:', error);
      next(error);
    }
  }
);

/**
 * 推荐相似故事
 * GET /api/v1/opc-stories/:storyId/similar
 */
router.get(
  '/:storyId/similar',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { storyId } = req.params;
      const { limit } = req.query;

      logger.info('[OpcStory] 推荐相似故事', { storyId });

      const stories = await opcStoryService.recommendSimilarStories(
        storyId,
        limit ? parseInt(limit as string) : 5
      );

      res.json({
        success: true,
        data: stories
      });
    } catch (error: any) {
      logger.error('[OpcStory] 推荐相似故事失败:', error);
      next(error);
    }
  }
);

export default router;
