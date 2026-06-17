"use strict";
/**
 * 评价系统控制器
 *
 * 处理评价相关的HTTP请求
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRating = createRating;
exports.updateRating = updateRating;
exports.respondToRating = respondToRating;
exports.getTaskRatings = getTaskRatings;
exports.getUserRatings = getUserRatings;
exports.getUserRatingStats = getUserRatingStats;
exports.getAvailableTags = getAvailableTags;
exports.markHelpful = markHelpful;
exports.reportRating = reportRating;
exports.deleteRating = deleteRating;
const ratingService_1 = require("../services/ratingService");
const logger_1 = __importDefault(require("../utils/logger"));
// =====================================================
// 类型定义
// =====================================================
// =====================================================
// 评价CRUD接口
// =====================================================
/**
 * 创建评价
 * POST /api/v1/ratings
 */
async function createRating(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { task_id, ratee_id, rating, comment, detailed_scores, tag_ids, is_anonymous, } = req.body;
        if (!task_id || !ratee_id || !rating) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }
        const newRating = await ratingService_1.ratingService.createRating({
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
    }
    catch (error) {
        logger_1.default.error('Failed to create rating', { error });
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
async function updateRating(req, res) {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { rating, comment, detailed_scores, tag_ids } = req.body;
        const updatedRating = await ratingService_1.ratingService.updateRating(id, userId, {
            rating,
            comment,
            detailed_scores,
            tag_ids,
        });
        return res.json({
            success: true,
            data: updatedRating,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to update rating', { error });
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
async function respondToRating(req, res) {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const { response } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!response) {
            return res.status(400).json({ error: 'Response is required' });
        }
        await ratingService_1.ratingService.respondToRating(id, userId, response);
        return res.json({
            success: true,
            message: 'Response added successfully',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to respond to rating', { error });
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
async function getTaskRatings(req, res) {
    try {
        const userId = req.user?.userId;
        const { taskId } = req.params;
        const ratings = await ratingService_1.ratingService.getTaskRatings(taskId, userId);
        return res.json({
            success: true,
            data: ratings,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get task ratings', { error });
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
async function getUserRatings(req, res) {
    try {
        const { userId } = req.params;
        const rating = req.query.rating ? parseInt(req.query.rating) : undefined;
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;
        const result = await ratingService_1.ratingService.getUserRatings(userId, {
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
    }
    catch (error) {
        logger_1.default.error('Failed to get user ratings', { error });
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
async function getUserRatingStats(req, res) {
    try {
        const { userId } = req.params;
        const stats = await ratingService_1.ratingService.getUserRatingStats(userId);
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
    }
    catch (error) {
        logger_1.default.error('Failed to get user rating stats', { error });
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
async function getAvailableTags(req, res) {
    try {
        const applicableTo = req.query.applicable_to;
        const tags = await ratingService_1.ratingService.getAvailableTags(applicableTo);
        return res.json({
            success: true,
            data: tags,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get available tags', { error });
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
async function markHelpful(req, res) {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const { is_helpful } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (is_helpful === undefined) {
            return res.status(400).json({ error: 'is_helpful is required' });
        }
        await ratingService_1.ratingService.markHelpfulness(id, userId, is_helpful);
        return res.json({
            success: true,
            message: 'Helpfulness marked successfully',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to mark helpfulness', { error });
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
async function reportRating(req, res) {
    try {
        const userId = req.user?.userId;
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
        await ratingService_1.ratingService.reportRating(id, userId, reason, description);
        return res.json({
            success: true,
            message: 'Rating reported successfully',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to report rating', { error });
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
async function deleteRating(req, res) {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        const { id } = req.params;
        const { reason } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // 只有管理员可以删除评价
        if (userRole !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        if (!reason) {
            return res.status(400).json({ error: 'Reason is required' });
        }
        await ratingService_1.ratingService.deleteRating(id, userId, reason);
        return res.json({
            success: true,
            message: 'Rating deleted successfully',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to delete rating', { error });
        return res.status(500).json({
            error: 'Failed to delete rating',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
//# sourceMappingURL=ratingController.js.map