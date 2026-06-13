import { Request, Response, NextFunction } from 'express';
import communityService from '../../services/communityService';
import { AppError } from '../../middleware/errorHandler';
import logger from '../../utils/logger';

/**
 * 社区控制器
 */

// POST /api/v1/community/posts - 发布社区帖子
export async function createPost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authorId = req.user!.userId;
    const { type, title, content, coverImage, requiredSkills, track, teamId, vacancyCount } = req.body;

    if (!type || !title || !content) {
      throw new AppError(400, '帖子类型、标题和内容为必填项', 'MISSING_FIELDS');
    }

    if (!['recruit', 'showcase', 'collab'].includes(type)) {
      throw new AppError(400, '帖子类型必须为recruit、showcase或collab', 'INVALID_POST_TYPE');
    }

    const postId = await communityService.createPost({
      authorId,
      type,
      title,
      content,
      coverImage,
      requiredSkills,
      track,
      teamId,
      vacancyCount,
    });

    res.status(201).json({
      success: true,
      message: '帖子发布成功',
      data: { postId },
    });
  } catch (err: unknown) {
    next(err);
  }
}

// GET /api/v1/community/posts - 获取社区帖子列表
export async function getPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { type, track, status, limit, offset } = req.query;

    const result = await communityService.getPosts({
      type: type as any,
      track: track as string,
      status: status as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err: unknown) {
    next(err);
  }
}

// GET /api/v1/community/posts/:postId - 获取帖子详情
export async function getPostDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { postId } = req.params;

    const post = await communityService.getPostDetail(postId);

    if (!post) {
      throw new AppError(404, '帖子不存在', 'POST_NOT_FOUND');
    }

    res.json({
      success: true,
      data: post,
    });
  } catch (err: unknown) {
    next(err);
  }
}

// POST /api/v1/community/posts/:postId/apply - 申请加入（招募帖）
export async function applyToPost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { postId } = req.params;
    const applicantId = req.user!.userId;
    const { message, skillsOffered } = req.body;

    await communityService.applyToPost(postId, applicantId, message, skillsOffered);

    res.json({
      success: true,
      message: '申请已提交，等待作者审核',
    });
  } catch (err: unknown) {
    next(err);
  }
}

// POST /api/v1/community/posts/:postId/review-application - 审核申请
export async function reviewApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { postId } = req.params;
    const authorId = req.user!.userId;
    const { applicantId, approved } = req.body;

    if (!applicantId || approved === undefined) {
      throw new AppError(400, '申请人ID和审核结果为必填项', 'MISSING_FIELDS');
    }

    await communityService.reviewApplication(postId, authorId, applicantId, approved);

    res.json({
      success: true,
      message: approved ? '申请已通过' : '申请已拒绝',
    });
  } catch (err: unknown) {
    next(err);
  }
}

// GET /api/v1/community/posts/:postId/applications - 获取帖子的申请列表
export async function getPostApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { postId } = req.params;
    const authorId = req.user!.userId;

    const applications = await communityService.getPostApplications(postId, authorId);

    res.json({
      success: true,
      data: applications,
    });
  } catch (err: unknown) {
    next(err);
  }
}

// POST /api/v1/community/posts/:postId/close - 关闭帖子
export async function closePost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { postId } = req.params;
    const authorId = req.user!.userId;

    await communityService.closePost(postId, authorId);

    res.json({
      success: true,
      message: '帖子已关闭',
    });
  } catch (err: unknown) {
    next(err);
  }
}

// DELETE /api/v1/community/posts/:postId - 删除帖子
export async function deletePost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { postId } = req.params;
    const authorId = req.user!.userId;

    await communityService.deletePost(postId, authorId);

    res.json({
      success: true,
      message: '帖子已删除',
    });
  } catch (err: unknown) {
    next(err);
  }
}

// GET /api/v1/community/my-posts - 获取我的帖子
export async function getMyPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { limit, offset } = req.query;

    const result = await communityService.getUserPosts(
      userId,
      limit ? parseInt(limit as string) : undefined,
      offset ? parseInt(offset as string) : undefined
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (err: unknown) {
    next(err);
  }
}

// GET /api/v1/community/my-applications - 获取我的申请
export async function getMyApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    const applications = await communityService.getUserApplications(userId);

    res.json({
      success: true,
      data: applications,
    });
  } catch (err: unknown) {
    next(err);
  }
}
