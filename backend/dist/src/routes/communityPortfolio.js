"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const communityPortfolioController_1 = require("../controllers/communityPortfolioController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// 社群相关
router.get('/communities', communityPortfolioController_1.CommunityPortfolioController.getCommunities);
router.post('/communities/:communityId/join', auth_1.authenticate, communityPortfolioController_1.CommunityPortfolioController.joinCommunity);
router.post('/communities/:communityId/posts', auth_1.authenticate, communityPortfolioController_1.CommunityPortfolioController.createPost);
router.get('/communities/:communityId/posts', communityPortfolioController_1.CommunityPortfolioController.getPosts);
router.post('/posts/:postId/like', auth_1.authenticate, communityPortfolioController_1.CommunityPortfolioController.likePost);
router.post('/posts/:postId/comment', auth_1.authenticate, communityPortfolioController_1.CommunityPortfolioController.commentPost);
// 作品集相关
router.post('/portfolios', auth_1.authenticate, communityPortfolioController_1.CommunityPortfolioController.createPortfolio);
router.get('/portfolios', communityPortfolioController_1.CommunityPortfolioController.getPortfolios);
router.get('/portfolios/featured', communityPortfolioController_1.CommunityPortfolioController.getFeaturedPortfolios);
router.get('/portfolios/:portfolioId', communityPortfolioController_1.CommunityPortfolioController.getPortfolioDetail);
router.post('/portfolios/:portfolioId/like', auth_1.authenticate, communityPortfolioController_1.CommunityPortfolioController.likePortfolio);
router.post('/portfolios/:portfolioId/comment', auth_1.authenticate, communityPortfolioController_1.CommunityPortfolioController.commentPortfolio);
router.post('/portfolios/:portfolioId/tags', auth_1.authenticate, communityPortfolioController_1.CommunityPortfolioController.addPortfolioTags);
router.get('/tags/popular', communityPortfolioController_1.CommunityPortfolioController.getPopularTags);
exports.default = router;
//# sourceMappingURL=communityPortfolio.js.map