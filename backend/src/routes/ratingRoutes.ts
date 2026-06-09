/**
 * 评价系统路由
 *
 * 定义评价相关的API路由
 */

import express from 'express';
import * as ratingController from '../controllers/ratingController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// =====================================================
// 所有路由都需要认证
// =====================================================
router.use(authenticate);

// =====================================================
// 评价CRUD路由
// =====================================================

/**
 * 创建评价
 * POST /api/v1/ratings
 */
router.post('/', ratingController.createRating);

/**
 * 更新评价
 * PUT /api/v1/ratings/:id
 */
router.put('/:id', ratingController.updateRating);

/**
 * 回复评价
 * POST /api/v1/ratings/:id/respond
 */
router.post('/:id/respond', ratingController.respondToRating);

/**
 * 删除评价（管理员）
 * DELETE /api/v1/ratings/:id
 */
router.delete('/:id', ratingController.deleteRating);

// =====================================================
// 查询路由
// =====================================================

/**
 * 获取任务的评价
 * GET /api/v1/ratings/task/:taskId
 */
router.get('/task/:taskId', ratingController.getTaskRatings);

/**
 * 获取用户收到的评价
 * GET /api/v1/ratings/user/:userId
 */
router.get('/user/:userId', ratingController.getUserRatings);

/**
 * 获取用户评价统计
 * GET /api/v1/ratings/user/:userId/stats
 */
router.get('/user/:userId/stats', ratingController.getUserRatingStats);

/**
 * 获取可用标签
 * GET /api/v1/ratings/tags
 */
router.get('/tags', ratingController.getAvailableTags);

// =====================================================
// 互动路由
// =====================================================

/**
 * 标记评价有用/无用
 * POST /api/v1/ratings/:id/helpful
 */
router.post('/:id/helpful', ratingController.markHelpful);

/**
 * 举报评价
 * POST /api/v1/ratings/:id/report
 */
router.post('/:id/report', ratingController.reportRating);

export default router;
