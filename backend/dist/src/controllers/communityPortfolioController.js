"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityPortfolioController = void 0;
const communityPortfolioService_1 = require("../services/communityPortfolioService");
class CommunityPortfolioController {
    // 社群相关
    static async getCommunities(req, res) {
        try {
            const filters = req.query;
            const communities = await communityPortfolioService_1.CommunityService.getCommunities(filters);
            res.json({ success: true, data: communities });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async joinCommunity(req, res) {
        try {
            const userId = req.user.userId;
            const { communityId } = req.params;
            await communityPortfolioService_1.CommunityService.joinCommunity(parseInt(communityId), userId);
            res.json({ success: true, message: '加入成功' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async createPost(req, res) {
        try {
            const authorId = req.user.userId;
            const { communityId } = req.params;
            const post = await communityPortfolioService_1.CommunityService.createPost(parseInt(communityId), authorId, req.body);
            res.json({ success: true, data: post });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getPosts(req, res) {
        try {
            const { communityId } = req.params;
            const filters = req.query;
            const posts = await communityPortfolioService_1.CommunityService.getPosts(parseInt(communityId), filters);
            res.json({ success: true, data: posts });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async likePost(req, res) {
        try {
            const userId = req.user.userId;
            const { postId } = req.params;
            await communityPortfolioService_1.CommunityService.likePost(parseInt(postId), userId);
            res.json({ success: true, message: '点赞成功' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async commentPost(req, res) {
        try {
            const authorId = req.user.userId;
            const { postId } = req.params;
            const { content, parentCommentId } = req.body;
            const comment = await communityPortfolioService_1.CommunityService.commentPost(parseInt(postId), authorId, content, parentCommentId);
            res.json({ success: true, data: comment });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // 作品集相关
    static async createPortfolio(req, res) {
        try {
            const studentId = req.user.userId;
            const portfolio = await communityPortfolioService_1.PortfolioService.createPortfolio(studentId, req.body);
            res.json({ success: true, data: portfolio });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getPortfolios(req, res) {
        try {
            const filters = req.query;
            const portfolios = await communityPortfolioService_1.PortfolioService.getPortfolios(filters);
            res.json({ success: true, data: portfolios });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getPortfolioDetail(req, res) {
        try {
            const { portfolioId } = req.params;
            const portfolio = await communityPortfolioService_1.PortfolioService.getPortfolioDetail(parseInt(portfolioId));
            res.json({ success: true, data: portfolio });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async likePortfolio(req, res) {
        try {
            const userId = req.user.userId;
            const { portfolioId } = req.params;
            await communityPortfolioService_1.PortfolioService.likePortfolio(parseInt(portfolioId), userId);
            res.json({ success: true, message: '点赞成功' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async commentPortfolio(req, res) {
        try {
            const authorId = req.user.userId;
            const { portfolioId } = req.params;
            const { content, parentCommentId } = req.body;
            const comment = await communityPortfolioService_1.PortfolioService.commentPortfolio(parseInt(portfolioId), authorId, content, parentCommentId);
            res.json({ success: true, data: comment });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getFeaturedPortfolios(req, res) {
        try {
            const portfolios = await communityPortfolioService_1.PortfolioService.getFeaturedPortfolios();
            res.json({ success: true, data: portfolios });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async addPortfolioTags(req, res) {
        try {
            const { portfolioId } = req.params;
            const { tags } = req.body;
            await communityPortfolioService_1.PortfolioService.addPortfolioTags(parseInt(portfolioId), tags);
            res.json({ success: true, message: '标签已添加' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getPopularTags(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 20;
            const tags = await communityPortfolioService_1.PortfolioService.getPopularTags(limit);
            res.json({ success: true, data: tags });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.CommunityPortfolioController = CommunityPortfolioController;
//# sourceMappingURL=communityPortfolioController.js.map