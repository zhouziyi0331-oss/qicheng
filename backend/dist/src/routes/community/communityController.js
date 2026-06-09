"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPost = createPost;
exports.getPosts = getPosts;
exports.getPostDetail = getPostDetail;
exports.applyToPost = applyToPost;
exports.reviewApplication = reviewApplication;
exports.getPostApplications = getPostApplications;
exports.closePost = closePost;
exports.deletePost = deletePost;
exports.getMyPosts = getMyPosts;
exports.getMyApplications = getMyApplications;
const communityService_1 = __importDefault(require("../../services/communityService"));
const errorHandler_1 = require("../../middleware/errorHandler");
/**
 * 社区控制器
 */
// POST /api/v1/community/posts - 发布社区帖子
async function createPost(req, res, next) {
    try {
        const authorId = req.user.userId;
        const { type, title, content, coverImage, requiredSkills, track, teamId, vacancyCount } = req.body;
        if (!type || !title || !content) {
            throw new errorHandler_1.AppError(400, '帖子类型、标题和内容为必填项', 'MISSING_FIELDS');
        }
        if (!['recruit', 'showcase', 'collab'].includes(type)) {
            throw new errorHandler_1.AppError(400, '帖子类型必须为recruit、showcase或collab', 'INVALID_POST_TYPE');
        }
        const postId = await communityService_1.default.createPost({
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
    }
    catch (err) {
        next(err);
    }
}
// GET /api/v1/community/posts - 获取社区帖子列表
async function getPosts(req, res, next) {
    try {
        const { type, track, status, limit, offset } = req.query;
        const result = await communityService_1.default.getPosts({
            type: type,
            track: track,
            status: status,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined,
        });
        res.json({
            success: true,
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
}
// GET /api/v1/community/posts/:postId - 获取帖子详情
async function getPostDetail(req, res, next) {
    try {
        const { postId } = req.params;
        const post = await communityService_1.default.getPostDetail(postId);
        if (!post) {
            throw new errorHandler_1.AppError(404, '帖子不存在', 'POST_NOT_FOUND');
        }
        res.json({
            success: true,
            data: post,
        });
    }
    catch (err) {
        next(err);
    }
}
// POST /api/v1/community/posts/:postId/apply - 申请加入（招募帖）
async function applyToPost(req, res, next) {
    try {
        const { postId } = req.params;
        const applicantId = req.user.userId;
        const { message, skillsOffered } = req.body;
        await communityService_1.default.applyToPost(postId, applicantId, message, skillsOffered);
        res.json({
            success: true,
            message: '申请已提交，等待作者审核',
        });
    }
    catch (err) {
        next(err);
    }
}
// POST /api/v1/community/posts/:postId/review-application - 审核申请
async function reviewApplication(req, res, next) {
    try {
        const { postId } = req.params;
        const authorId = req.user.userId;
        const { applicantId, approved } = req.body;
        if (!applicantId || approved === undefined) {
            throw new errorHandler_1.AppError(400, '申请人ID和审核结果为必填项', 'MISSING_FIELDS');
        }
        await communityService_1.default.reviewApplication(postId, authorId, applicantId, approved);
        res.json({
            success: true,
            message: approved ? '申请已通过' : '申请已拒绝',
        });
    }
    catch (err) {
        next(err);
    }
}
// GET /api/v1/community/posts/:postId/applications - 获取帖子的申请列表
async function getPostApplications(req, res, next) {
    try {
        const { postId } = req.params;
        const authorId = req.user.userId;
        const applications = await communityService_1.default.getPostApplications(postId, authorId);
        res.json({
            success: true,
            data: applications,
        });
    }
    catch (err) {
        next(err);
    }
}
// POST /api/v1/community/posts/:postId/close - 关闭帖子
async function closePost(req, res, next) {
    try {
        const { postId } = req.params;
        const authorId = req.user.userId;
        await communityService_1.default.closePost(postId, authorId);
        res.json({
            success: true,
            message: '帖子已关闭',
        });
    }
    catch (err) {
        next(err);
    }
}
// DELETE /api/v1/community/posts/:postId - 删除帖子
async function deletePost(req, res, next) {
    try {
        const { postId } = req.params;
        const authorId = req.user.userId;
        await communityService_1.default.deletePost(postId, authorId);
        res.json({
            success: true,
            message: '帖子已删除',
        });
    }
    catch (err) {
        next(err);
    }
}
// GET /api/v1/community/my-posts - 获取我的帖子
async function getMyPosts(req, res, next) {
    try {
        const userId = req.user.userId;
        const { limit, offset } = req.query;
        const result = await communityService_1.default.getUserPosts(userId, limit ? parseInt(limit) : undefined, offset ? parseInt(offset) : undefined);
        res.json({
            success: true,
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
}
// GET /api/v1/community/my-applications - 获取我的申请
async function getMyApplications(req, res, next) {
    try {
        const userId = req.user.userId;
        const applications = await communityService_1.default.getUserApplications(userId);
        res.json({
            success: true,
            data: applications,
        });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=communityController.js.map