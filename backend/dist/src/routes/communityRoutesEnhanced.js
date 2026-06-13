"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const communityServiceEnhanced_1 = __importDefault(require("../services/communityServiceEnhanced"));
const skillTagService_1 = __importDefault(require("../services/skillTagService"));
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
/**
 * 权限中间件 - 检查用户等级
 */
function requireLevel(minLevel) {
    return async (req, res, next) => {
        try {
            const { pool } = require('../utils/db');
            const result = await pool.query('SELECT current_level FROM users WHERE id = $1', [req.user.userId]);
            if (!result.rows[0] || result.rows[0].current_level < minLevel) {
                return res.status(403).json({
                    success: false,
                    code: 'INSUFFICIENT_LEVEL',
                    message: `需要Lv.${minLevel}及以上等级`,
                });
            }
            next();
        }
        catch (error) {
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
router.post('/posts', auth_1.authenticate, async (req, res, next) => {
    try {
        const authorId = req.user.userId;
        const postData = req.body;
        const postId = await communityServiceEnhanced_1.default.createPost({
            authorId,
            ...postData,
        });
        logger_1.default.info('Community post created via API', { postId, authorId, type: postData.type });
        res.json({
            success: true,
            data: { postId },
            message: '帖子发布成功',
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 获取帖子列表
 * GET /api/v1/community/posts
 */
router.get('/posts', auth_1.authenticate, requireLevel(4), async (req, res, next) => {
    try {
        const { type, track, limit, offset } = req.query;
        // 使用原有的communityService获取列表
        const communityService = require('../services/communityService').default;
        const result = await communityService.getPosts({
            type: type,
            track: track,
            limit: limit ? parseInt(limit) : 20,
            offset: offset ? parseInt(offset) : 0,
        });
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 获取帖子详情
 * GET /api/v1/community/posts/:id
 */
router.get('/posts/:id', auth_1.authenticate, requireLevel(4), async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const post = await communityServiceEnhanced_1.default.getPostDetails(id, userId);
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
    }
    catch (error) {
        next(error);
    }
});
/**
 * 删除帖子
 * DELETE /api/v1/community/posts/:id
 */
router.delete('/posts/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        await communityServiceEnhanced_1.default.deletePost(id, userId);
        res.json({
            success: true,
            message: '帖子已删除',
        });
    }
    catch (error) {
        next(error);
    }
});
// ============================================================
// 评论接口
// ============================================================
/**
 * 发布评论
 * POST /api/v1/community/posts/:id/comments
 */
router.post('/posts/:id/comments', auth_1.authenticate, requireLevel(2), async (req, res, next) => {
    try {
        const postId = req.params.id;
        const userId = req.user.userId;
        const { content, parentId } = req.body;
        if (!content) {
            return res.status(400).json({
                success: false,
                message: '评论内容不能为空',
            });
        }
        const commentId = await communityServiceEnhanced_1.default.createComment({
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
    }
    catch (error) {
        next(error);
    }
});
/**
 * 获取评论列表
 * GET /api/v1/community/posts/:id/comments
 */
router.get('/posts/:id/comments', auth_1.authenticate, requireLevel(4), async (req, res, next) => {
    try {
        const postId = req.params.id;
        const { limit, offset } = req.query;
        const comments = await communityServiceEnhanced_1.default.getComments(postId, limit ? parseInt(limit) : 50, offset ? parseInt(offset) : 0);
        res.json({
            success: true,
            data: comments,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 删除评论
 * DELETE /api/v1/community/comments/:id
 */
router.delete('/comments/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const commentId = req.params.id;
        const userId = req.user.userId;
        await communityServiceEnhanced_1.default.deleteComment(commentId, userId);
        res.json({
            success: true,
            message: '评论已删除',
        });
    }
    catch (error) {
        next(error);
    }
});
// ============================================================
// 点赞接口
// ============================================================
/**
 * 点赞/取消点赞
 * POST /api/v1/community/like
 */
router.post('/like', auth_1.authenticate, requireLevel(2), async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { targetType, targetId } = req.body;
        if (!targetType || !targetId) {
            return res.status(400).json({
                success: false,
                message: 'targetType和targetId不能为空',
            });
        }
        const result = await communityServiceEnhanced_1.default.toggleLike(userId, targetType, targetId);
        res.json({
            success: true,
            data: result,
            message: result.liked ? '点赞成功' : '取消点赞',
        });
    }
    catch (error) {
        next(error);
    }
});
// ============================================================
// 举报接口
// ============================================================
/**
 * 举报内容
 * POST /api/v1/community/report
 */
router.post('/report', auth_1.authenticate, requireLevel(2), async (req, res, next) => {
    try {
        const reporterId = req.user.userId;
        const { targetType, targetId, reason, description } = req.body;
        if (!targetType || !targetId || !reason) {
            return res.status(400).json({
                success: false,
                message: 'targetType、targetId和reason不能为空',
            });
        }
        await communityServiceEnhanced_1.default.reportContent(reporterId, targetType, targetId, reason, description);
        res.json({
            success: true,
            message: '举报已提交',
        });
    }
    catch (error) {
        next(error);
    }
});
// ============================================================
// 技能标签接口
// ============================================================
/**
 * 获取我的技能标签（用于招募帖预填）
 * GET /api/v1/community/my-skills
 */
router.get('/my-skills', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const skills = await skillTagService_1.default.getUserSkills(userId);
        res.json({
            success: true,
            data: { skills },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 获取技能标签库
 * GET /api/v1/community/skills
 */
router.get('/skills', auth_1.authenticate, async (req, res, next) => {
    try {
        const { track } = req.query;
        const skillLibrary = await skillTagService_1.default.getSkillLibrary(track);
        res.json({
            success: true,
            data: skillLibrary,
        });
    }
    catch (error) {
        next(error);
    }
});
// ============================================================
// 招募申请接口（保留原有功能）
// ============================================================
/**
 * 申请加入招募
 * POST /api/v1/community/posts/:id/apply
 */
router.post('/posts/:id/apply', auth_1.authenticate, requireLevel(5), async (req, res, next) => {
    try {
        const postId = req.params.id;
        const applicantId = req.user.userId;
        const { message } = req.body;
        const communityService = require('../services/communityService').default;
        await communityService.applyToPost(postId, applicantId, message);
        logger_1.default.info('Community post application submitted via API', { postId, applicantId });
        res.json({
            success: true,
            message: '申请已提交',
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=communityRoutesEnhanced.js.map