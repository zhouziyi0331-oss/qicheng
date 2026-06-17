import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import communityService from '../services/communityService';
import logger from '../utils/logger';

const router = Router();

/**
 * 发布社区帖子
 * POST /api/v1/community/posts
 * Body: { type, title, content, requiredSkills?, teamId?, track?, vacancyCount? }
 *
 * 权限：
 * - recruit类型：仅Lv.6可发布
 * - 其他类型：Lv.4+可发布
 */
router.post(
  '/posts',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authorId = req.user!.userId;
      const { type, title, content, requiredSkills, teamId, track, vacancyCount } = req.body;

      if (!type || !title || !content) {
        return res.status(400).json({
          success: false,
          error: 'type, title, and content are required',
        });
      }

      const postId = await communityService.createPost({
        authorId,
          type: type as "recruit" | "showcase" | "collab",
        title,
        content,
        requiredSkills,
        teamId,
        track,
        vacancyCount,
      });

      logger.info('Community post created via API', { postId, authorId, type, title });

      res.json({
        success: true,
        data: { postId },
        message: '帖子发布成功',
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * 获取社区帖子列表
 * GET /api/v1/community/posts
 * Query: type?, track?, authorId?, limit?, offset?
 *
 * 权限：Lv.4+可浏览
 */
router.get(
  '/posts',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type, track, authorId, limit, offset } = req.query;

      const posts = await communityService.getPosts({
        type: type as "recruit" | "showcase" | "collab" | undefined,
        track: track as string,
        authorId: authorId as string,
        limit: limit ? parseInt(limit as string) : 20,
        offset: offset ? parseInt(offset as string) : 0,
      });

      res.json({
        success: true,
        data: posts,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * 获取帖子详情
 * GET /api/v1/community/posts/:id
 *
 * 权限：Lv.4+可查看
 */
router.get(
  '/posts/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const post = await communityService.getPostDetail(id);

      res.json({
        success: true,
        data: post,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * 申请加入招募
 * POST /api/v1/community/posts/:id/apply
 * Body: { message? }
 *
 * 权限：Lv.5+可申请
 */
router.post(
  '/posts/:id/apply',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const postId = req.params.id;
      const applicantId = req.user!.userId;
      const { message } = req.body;

      await communityService.applyToPost({
        postId,
        applicantId,
        message,
      });

      logger.info('Community post application submitted via API', { postId, applicantId });

      res.json({
        success: true,
        message: '申请已提交',
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * 回复帖子
 * POST /api/v1/community/posts/:id/reply
 * Body: { content, parentReplyId? }
 *
 * 权限：Lv.4+可回复
 */
router.post(
  '/posts/:id/reply',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const postId = req.params.id;
      const authorId = req.user!.userId;
      const { content, parentReplyId } = req.body;

      if (!content) {
        return res.status(400).json({
          success: false,
          error: 'content is required',
        });
      }

      const replyId = await communityService.applyToPost(
        postId,
        authorId,
        content,
        parentReplyId
      );

      logger.info('Community post reply created via API', { postId, replyId, authorId });

      res.json({
        success: true,
        data: { replyId },
        message: '回复成功',
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * 关闭招募帖
 * POST /api/v1/community/posts/:id/close
 *
 * 权限：仅帖子作者可关闭
 */
router.post(
  '/posts/:id/close',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const postId = req.params.id;
      const authorId = req.user!.userId;

      await communityService.closePost(postId, authorId);

      logger.info('Community post closed via API', { postId, authorId });

      res.json({
        success: true,
        message: '招募已关闭',
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * 获取我的申请列表
 * GET /api/v1/community/my-applications
 */
router.get(
  '/my-applications',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      const applications = await communityService.getUserApplications(userId);

      res.json({
        success: true,
        data: applications,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

export default router;
