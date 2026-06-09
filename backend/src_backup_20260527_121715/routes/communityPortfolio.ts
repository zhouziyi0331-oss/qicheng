import { Router } from 'express';
import { CommunityPortfolioController } from '../controllers/communityPortfolioController';
import { authenticate } from '../middleware/auth';

const router = Router();

// 社群相关
router.get('/communities', CommunityPortfolioController.getCommunities);
router.post('/communities/:communityId/join', authenticate, CommunityPortfolioController.joinCommunity);
router.post('/communities/:communityId/posts', authenticate, CommunityPortfolioController.createPost);
router.get('/communities/:communityId/posts', CommunityPortfolioController.getPosts);
router.post('/posts/:postId/like', authenticate, CommunityPortfolioController.likePost);
router.post('/posts/:postId/comment', authenticate, CommunityPortfolioController.commentPost);

// 作品集相关
router.post('/portfolios', authenticate, CommunityPortfolioController.createPortfolio);
router.get('/portfolios', CommunityPortfolioController.getPortfolios);
router.get('/portfolios/featured', CommunityPortfolioController.getFeaturedPortfolios);
router.get('/portfolios/:portfolioId', CommunityPortfolioController.getPortfolioDetail);
router.post('/portfolios/:portfolioId/like', authenticate, CommunityPortfolioController.likePortfolio);
router.post('/portfolios/:portfolioId/comment', authenticate, CommunityPortfolioController.commentPortfolio);
router.post('/portfolios/:portfolioId/tags', authenticate, CommunityPortfolioController.addPortfolioTags);
router.get('/tags/popular', CommunityPortfolioController.getPopularTags);

export default router;
