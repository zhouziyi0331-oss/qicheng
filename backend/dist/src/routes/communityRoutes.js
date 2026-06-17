"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const communityService_1 = __importDefault(require("../services/communityService"));
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
/**
 * 发布社区帖子
 * POST /api/v1/community/posts
 * Body: { type, title, content, requiredSkills?, teamId?, track?, vacancyCount? }
 *
 * 权限：
 * - recruit类型：仅Lv.6可发布
 * - 其他类型：Lv.4+可发布
 */
router.post('/posts', auth_1.authenticate, async (req, res, next) => {
    try {
        const authorId = req.user.userId;
        const { type, title, content, requiredSkills, teamId, track, vacancyCount } = req.body;
        if (!type || !title || !content) {
            return res.status(400).json({
                success: false,
                error: 'type, title, and content are required',
            });
        }
        const postId = await communityService_1.default.createPost({
            authorId,
            type: type,
            title,
            content,
            requiredSkills,
            teamId,
            track,
            vacancyCount,
        });
        logger_1.default.info('Community post created via API', { postId, authorId, type, title });
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
 * 获取社区帖子列表
 * GET /api/v1/community/posts
 * Query: type?, track?, authorId?, limit?, offset?
 *
 * 权限：Lv.4+可浏览
 */
router.get('/posts', auth_1.authenticate, async (req, res, next) => {
    try {
        const { type, track, authorId, limit, offset } = req.query;
        const posts = await communityService_1.default.getPosts({
            type: type,
            track: track,
            authorId: authorId,
            limit: limit ? parseInt(limit) : 20,
            offset: offset ? parseInt(offset) : 0,
        });
        res.json({
            success: true,
            data: posts,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 获取帖子详情
 * GET /api/v1/community/posts/:id
 *
 * 权限：Lv.4+可查看
 */
router.get('/posts/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const post = await communityService_1.default.getPostDetail(id);
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
 * 申请加入招募
 * POST /api/v1/community/posts/:id/apply
 * Body: { message? }
 *
 * 权限：Lv.5+可申请
 */
router.post('/posts/:id/apply', auth_1.authenticate, async (req, res, next) => {
    try {
        const postId = req.params.id;
        const applicantId = req.user.userId;
        const { message } = req.body;
        await communityService_1.default.applyToPost({
            postId,
            applicantId,
            message,
        });
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
/**
 * 回复帖子
 * POST /api/v1/community/posts/:id/reply
 * Body: { content, parentReplyId? }
 *
 * 权限：Lv.4+可回复
 */
router.post('/posts/:id/reply', auth_1.authenticate, async (req, res, next) => {
    try {
        const postId = req.params.id;
        const authorId = req.user.userId;
        const { content, parentReplyId } = req.body;
        if (!content) {
            return res.status(400).json({
                success: false,
                error: 'content is required',
            });
        }
        const replyId = await communityService_1.default.applyToPost(postId, authorId, content, parentReplyId);
        logger_1.default.info('Community post reply created via API', { postId, replyId, authorId });
        res.json({
            success: true,
            data: { replyId },
            message: '回复成功',
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 关闭招募帖
 * POST /api/v1/community/posts/:id/close
 *
 * 权限：仅帖子作者可关闭
 */
router.post('/posts/:id/close', auth_1.authenticate, async (req, res, next) => {
    try {
        const postId = req.params.id;
        const authorId = req.user.userId;
        await communityService_1.default.closePost(postId, authorId);
        logger_1.default.info('Community post closed via API', { postId, authorId });
        res.json({
            success: true,
            message: '招募已关闭',
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 获取我的申请列表
 * GET /api/v1/community/my-applications
 */
router.get('/my-applications', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const applications = await communityService_1.default.getUserApplications(userId);
        res.json({
            success: true,
            data: applications,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=communityRoutes.js.map