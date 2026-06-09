/**
 * 评价系统控制器
 *
 * 处理评价相关的HTTP请求
 */

import { Request, Response } from 'express';
import { ratingService } from '../services/ratingService';
import logger from '../utils/logger';

// =====================================================
// 类型定义
// =====================================================

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// =====================================================
// 评价CRUD接口
// =====================================================

/**
 * 创建评价
 * POST /api/v1/ratings
 */
export async function createRating(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      task_id,
      ratee_id,
      rating,
      comment,
      detailed_scores,
      tag_ids,
      is_anonymous,
    } = req.body;

    if (!task_id || !ratee_id || !rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const newRating = await ratingService.createRating({
      task_id,
      rater_id: userId,
      ratee_id,
      rating,
      comment,
      detailed_scores,
      tag_ids,
      is_anonymous,
    });

    return res.status(201).json({
      success: true,
      data: newRating,
    });
  } catch (error) {
    logger.error('Failed to create rating', { error });
    return res.status(500).json({
      error: 'Failed to create rating',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * 更新评价
 * PUT /api/v1/ratings/:id
 */
export async function updateRating(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { rating, comment, detailed_scores, tag_ids } = req.body;

    const updatedRating = await ratingService.updateRating(id, userId, {
      rating,
      comment,
      detailed_scores,
      tag_ids,
    });

    return res.json({
      success: true,
      data: updatedRating,
    });
  } catch (error) {
    logger.error('Failed to update rating', { error });
    return res.status(500).json({
      error: 'Failed to update rating',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * 回复评价
 * POST /api/v1/ratings/:id/respond
 */
export async function respondToRating(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { response } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!response) {
      return res.status(400).json({ error: 'Response is required' });
    }

    await ratingService.respondToRating(id, userId, response);

    return res.json({
      success: true,
      message: 'Response added successfully',
    });
  } catch (error) {
    logger.error('Failed to respond to rating', { error });
    return res.status(500).json({
      error: 'Failed to respond to rating',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// =====================================================
// 查询接口
// =====================================================

/**
 * 获取任务的评价
 * GET /api/v1/ratings/task/:taskId
 */
export async function getTaskRatings(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { taskId } = req.params;

    const ratings = await ratingService.getTaskRatings(taskId, userId);

    return res.json({
      success: true,
      data: ratings,
    });
  } catch (error) {
    logger.error('Failed to get task ratings', { error });
    return res.status(500).json({
      error: 'Failed to get task ratings',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * 获取用户收到的评价
 * GET /api/v1/ratings/user/:userId
 */
export async function getUserRatings(req: AuthRequest, res: Response) {
  try {
    const { userId } = req.params;
    const rating = req.query.rating ? parseInt(req.query.rating as string) : undefined;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await ratingService.getUserRatings(userId, {
      rating,
      limit,
      offset,
    });

    return res.json({
      success: true,
      data: result.ratings,
      total: result.total,
      limit,
      offset,
    });
  } catch (error) {
    logger.error('Failed to get user ratings', { error });
    return res.status(500).json({
      error: 'Failed to get user ratings',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * 获取用户评价统计
 * GET /api/v1/ratings/user/:userId/stats
 */
export async function getUserRatingStats(req: AuthRequest, res: Response) {
  try {
    const { userId } = req.params;

    const stats = await ratingService.getUserRatingStats(userId);

    if (!stats) {
      return res.json({
        success: true,
        data: {
          user_id: userId,
          total_ratings_received: 0,
          avg_rating: 0,
        },
      });
    }

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Failed to get user rating stats', { error });
    return res.status(500).json({
      error: 'Failed to get user rating stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * 获取可用标签
 * GET /api/v1/ratings/tags
 */
export async function getAvailableTags(req: AuthRequest, res: Response) {
  try {
    const applicableTo = req.query.applicable_to as string;

    const tags = await ratingService.getAvailableTags(applicableTo);

    return res.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    logger.error('Failed to get available tags', { error });
    return res.status(500).json({
      error: 'Failed to get available tags',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// =====================================================
// 互动接口
// =====================================================

/**
 * 标记评价有用/无用
 * POST /api/v1/ratings/:id/helpful
 */
export async function markHelpful(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { is_helpful } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (is_helpful === undefined) {
      return res.status(400).json({ error: 'is_helpful is required' });
    }

    await ratingService.markHelpfulness(id, userId, is_helpful);

    return res.json({
      success: true,
      message: 'Helpfulness marked successfully',
    });
  } catch (error) {
    logger.error('Failed to mark helpfulness', { error });
    return res.status(500).json({
      error: 'Failed to mark helpfulness',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * 举报评价
 * POST /api/v1/ratings/:id/report
 */
export async function reportRating(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { reason, description } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'Reason is required' });
    }

    const validReasons = ['fake', 'offensive', 'spam', 'irrelevant'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ error: 'Invalid reason' });
    }

    await ratingService.reportRating(id, userId, reason, description);

    return res.json({
      success: true,
      message: 'Rating reported successfully',
    });
  } catch (error) {
    logger.error('Failed to report rating', { error });
    return res.status(500).json({
      error: 'Failed to report rating',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// =====================================================
// 管理员接口
// =====================================================

/**
 * 删除评价（管理员）
 * DELETE /api/v1/ratings/:id
 */
export async function deleteRating(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { id } = req.params;
    const { reason } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 只有管理员可以删除评价
    if (userRole !== 'admin' && userRole !== 'platform') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'Reason is required' });
    }

    await ratingService.deleteRating(id, userId, reason);

    return res.json({
      success: true,
      message: 'Rating deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete rating', { error });
    return res.status(500).json({
      error: 'Failed to delete rating',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
