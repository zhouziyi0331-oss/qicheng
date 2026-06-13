import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import communityServiceEnhanced from '../services/communityServiceEnhanced';
import skillTagService from '../services/skillTagService';
import logger from '../utils/logger';

const router = Router();

/**
 * 权限中间件 - 检查用户等级
 */
function requireLevel(minLevel: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { pool } = require('../utils/db');
      const result = await pool.query(
        'SELECT current_level FROM users WHERE id = $1',
        [req.user!.userId]
      );

      if (!result.rows[0] || result.rows[0].current_level < minLevel) {
        return res.status(403).json({
          success: false,
          code: 'INSUFFICIENT_LEVEL',
          message: `需要Lv.${minLevel}及以上等级`,
        });
      }

      next();
    } catch (error: unknown) {
      next(error);
    }
  };
}

// ============================================================
// 帖子接口
// ============================================================

/**
 * 发布帖子
 * POST /api/v1/community/posts
 */
router.post(
  '/posts',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authorId = req.user!.userId;
      const postData = req.body;

      const postId = await communityServiceEnhanced.createPost({
        authorId,
        ...postData,
      });

      logger.info('Community post created via API', { postId, authorId, type: postData.type });

      res.json({
        success: true,
        data: { postId },
        message: '帖子发布成功',
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * 获取帖子列表
 * GET /api/v1/community/posts
 */
router.get(
  '/posts',
  authenticate,
  requireLevel(4),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type, track, limit, offset } = req.query;

      // 使用原有的communityService获取列表
      const communityService = require('../services/communityService').default;
      const result = await communityService.getPosts({
        type: type as any,
        track: track as string,
        limit: limit ? parseInt(limit as string) : 20,
        offset: offset ? parseInt(offset as string) : 0,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * 获取帖子详情
 * GET /api/v1/community/posts/:id
 */
router.get(
  '/posts/:id',
  authenticate,
  requireLevel(4),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const post = await communityServiceEnhanced.getPostDetails(id, userId);

      if (!post) {
        return res.status(404).json({
          success: false,
          message: '帖子不存在',
        });
      }

      res.json({
        success: true,
        data: post,
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * 删除帖子
 * DELETE /api/v1/community/posts/:id
 */
router.delete(
  '/posts/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      await communityServiceEnhanced.deletePost(id, userId);

      res.json({
        success: true,
        message: '帖子已删除',
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

// ============================================================
// 评论接口
// ============================================================

/**
 * 发布评论
 * POST /api/v1/community/posts/:id/comments
 */
router.post(
  '/posts/:id/comments',
  authenticate,
  requireLevel(2),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const postId = req.params.id;
      const userId = req.user!.userId;
      const { content, parentId } = req.body;

      if (!content) {
        return res.status(400).json({
          success: false,
          message: '评论内容不能为空',
        });
      }

      const commentId = await communityServiceEnhanced.createComment({
        postId,
        userId,
        content,
        parentId,
      });

      res.json({
        success: true,
        data: { commentId },
        message: '评论发布成功',
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * 获取评论列表
 * GET /api/v1/community/posts/:id/comments
 */
router.get(
  '/posts/:id/comments',
  authenticate,
  requireLevel(4),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const postId = req.params.id;
      const { limit, offset } = req.query;

      const comments = await communityServiceEnhanced.getComments(
        postId,
        limit ? parseInt(limit as string) : 50,
        offset ? parseInt(offset as string) : 0
      );

      res.json({
        success: true,
        data: comments,
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * 删除评论
 * DELETE /api/v1/community/comments/:id
 */
router.delete(
  '/comments/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const commentId = req.params.id;
      const userId = req.user!.userId;

      await communityServiceEnhanced.deleteComment(commentId, userId);

      res.json({
        success: true,
        message: '评论已删除',
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

// ============================================================
// 点赞接口
// ============================================================

/**
 * 点赞/取消点赞
 * POST /api/v1/community/like
 */
router.post(
  '/like',
  authenticate,
  requireLevel(2),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { targetType, targetId } = req.body;

      if (!targetType || !targetId) {
        return res.status(400).json({
          success: false,
          message: 'targetType和targetId不能为空',
        });
      }

      const result = await communityServiceEnhanced.toggleLike(userId, targetType, targetId);

      res.json({
        success: true,
        data: result,
        message: result.liked ? '点赞成功' : '取消点赞',
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

// ============================================================
// 举报接口
// ============================================================

/**
 * 举报内容
 * POST /api/v1/community/report
 */
router.post(
  '/report',
  authenticate,
  requireLevel(2),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reporterId = req.user!.userId;
      const { targetType, targetId, reason, description } = req.body;

      if (!targetType || !targetId || !reason) {
        return res.status(400).json({
          success: false,
          message: 'targetType、targetId和reason不能为空',
        });
      }

      await communityServiceEnhanced.reportContent(
        reporterId,
        targetType,
        targetId,
        reason,
        description
      );

      res.json({
        success: true,
        message: '举报已提交',
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

// ============================================================
// 技能标签接口
// ============================================================

/**
 * 获取我的技能标签（用于招募帖预填）
 * GET /api/v1/community/my-skills
 */
router.get(
  '/my-skills',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      const skills = await skillTagService.getUserSkills(userId);

      res.json({
        success: true,
        data: { skills },
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * 获取技能标签库
 * GET /api/v1/community/skills
 */
router.get(
  '/skills',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { track } = req.query;

      const skillLibrary = await skillTagService.getSkillLibrary(track as any);

      res.json({
        success: true,
        data: skillLibrary,
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

// ============================================================
// 招募申请接口（保留原有功能）
// ============================================================

/**
 * 申请加入招募
 * POST /api/v1/community/posts/:id/apply
 */
router.post(
  '/posts/:id/apply',
  authenticate,
  requireLevel(5),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const postId = req.params.id;
      const applicantId = req.user!.userId;
      const { message } = req.body;

      const communityService = require('../services/communityService').default;
      await communityService.applyToPost(postId, applicantId, message);

      logger.info('Community post application submitted via API', { postId, applicantId });

      res.json({
        success: true,
        message: '申请已提交',
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

export default router;
