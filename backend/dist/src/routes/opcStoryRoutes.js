"use strict";
/**
 * Phase 3.2: OPC故事墙路由
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const opcStoryService_1 = __importDefault(require("../services/opcStoryService"));
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
/**
 * 创建故事
 * POST /api/v1/opc-stories
 */
router.post('/', auth_1.authenticate, (0, auth_1.requireRole)('student'), async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { title, storyContent, storyType, emotionTags, lifeQuestion, beforeState, afterState, keyMoment, reflection } = req.body;
        if (!title || !storyContent || !storyType) {
            return res.status(400).json({
                success: false,
                message: '标题、内容和类型为必填项'
            });
        }
        logger_1.default.info('[OpcStory] 创建故事', { userId, storyType });
        const result = await opcStoryService_1.default.createStory({
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
    }
    catch (error) {
        logger_1.default.error('[OpcStory] 创建故事失败:', error);
        next(error);
    }
});
/**
 * 搜索/浏览故事
 * GET /api/v1/opc-stories/search
 */
router.get('/search', auth_1.authenticate, async (req, res, next) => {
    try {
        const { personalityType, storyType, emotionTags, featured, search, limit, offset } = req.query;
        logger_1.default.info('[OpcStory] 搜索故事', {
            userId: req.user?.userId,
            personalityType,
            storyType
        });
        const filter = {
            personalityType: personalityType,
            storyType: storyType,
            emotionTags: emotionTags ? (Array.isArray(emotionTags) ? emotionTags : [emotionTags]) : undefined,
            featured: featured === 'true',
            search: search,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined
        };
        const result = await opcStoryService_1.default.searchStories(filter);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.default.error('[OpcStory] 搜索故事失败:', error);
        next(error);
    }
});
/**
 * 获取故事详情
 * GET /api/v1/opc-stories/:storyId
 */
router.get('/:storyId', auth_1.authenticate, async (req, res, next) => {
    try {
        const { storyId } = req.params;
        const userId = req.user?.userId;
        logger_1.default.info('[OpcStory] 获取故事详情', { storyId, userId });
        const story = await opcStoryService_1.default.getStoryById(storyId, userId);
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
    }
    catch (error) {
        logger_1.default.error('[OpcStory] 获取故事详情失败:', error);
        next(error);
    }
});
/**
 * 点赞故事
 * POST /api/v1/opc-stories/:storyId/like
 */
router.post('/:storyId/like', auth_1.authenticate, (0, auth_1.requireRole)('student'), async (req, res, next) => {
    try {
        const { storyId } = req.params;
        const userId = req.user.userId;
        logger_1.default.info('[OpcStory] 点赞故事', { storyId, userId });
        const success = await opcStoryService_1.default.likeStory(storyId, userId);
        res.json({
            success,
            message: success ? '点赞成功' : '已经点赞过了'
        });
    }
    catch (error) {
        logger_1.default.error('[OpcStory] 点赞故事失败:', error);
        next(error);
    }
});
/**
 * 标记共鸣
 * POST /api/v1/opc-stories/:storyId/resonate
 */
router.post('/:storyId/resonate', auth_1.authenticate, (0, auth_1.requireRole)('student'), async (req, res, next) => {
    try {
        const { storyId } = req.params;
        const userId = req.user.userId;
        const { resonanceType, note } = req.body;
        if (!resonanceType) {
            return res.status(400).json({
                success: false,
                message: '请选择共鸣类型'
            });
        }
        logger_1.default.info('[OpcStory] 标记共鸣', { storyId, userId, resonanceType });
        const success = await opcStoryService_1.default.markResonance({
            storyId,
            studentId: userId,
            resonanceType,
            note
        });
        res.json({
            success,
            message: '标记成功'
        });
    }
    catch (error) {
        logger_1.default.error('[OpcStory] 标记共鸣失败:', error);
        next(error);
    }
});
/**
 * 获取故事统计
 * GET /api/v1/opc-stories-stats
 */
router.get('-stats', auth_1.authenticate, async (req, res, next) => {
    try {
        logger_1.default.info('[OpcStory] 获取故事统计');
        const stats = await opcStoryService_1.default.getStoryStats();
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        logger_1.default.error('[OpcStory] 获取故事统计失败:', error);
        next(error);
    }
});
/**
 * 推荐相似故事
 * GET /api/v1/opc-stories/:storyId/similar
 */
router.get('/:storyId/similar', auth_1.authenticate, async (req, res, next) => {
    try {
        const { storyId } = req.params;
        const { limit } = req.query;
        logger_1.default.info('[OpcStory] 推荐相似故事', { storyId });
        const stories = await opcStoryService_1.default.recommendSimilarStories(storyId, limit ? parseInt(limit) : 5);
        res.json({
            success: true,
            data: stories
        });
    }
    catch (error) {
        logger_1.default.error('[OpcStory] 推荐相似故事失败:', error);
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=opcStoryRoutes.js.map