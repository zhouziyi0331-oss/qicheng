import { Request, Response } from 'express';
import { CommunityService, PortfolioService } from '../services/communityPortfolioService';

export class CommunityPortfolioController {
  // 社群相关
  static async getCommunities(req: Request, res: Response) {
    try {
      const filters = req.query;
      const communities = await CommunityService.getCommunities(filters);
      res.json({ success: true, data: communities });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async joinCommunity(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { communityId } = req.params;
      await CommunityService.joinCommunity(parseInt(communityId), userId);
      res.json({ success: true, message: '加入成功' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async createPost(req: Request, res: Response) {
    try {
      const authorId = req.user!.userId;
      const { communityId } = req.params;
      const post = await CommunityService.createPost(parseInt(communityId), authorId, req.body);
      res.json({ success: true, data: post });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getPosts(req: Request, res: Response) {
    try {
      const { communityId } = req.params;
      const filters = req.query;
      const posts = await CommunityService.getPosts(parseInt(communityId), filters);
      res.json({ success: true, data: posts });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async likePost(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { postId } = req.params;
      await CommunityService.likePost(parseInt(postId), userId);
      res.json({ success: true, message: '点赞成功' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async commentPost(req: Request, res: Response) {
    try {
      const authorId = req.user!.userId;
      const { postId } = req.params;
      const { content, parentCommentId } = req.body;
      const comment = await CommunityService.commentPost(parseInt(postId), authorId, content, parentCommentId);
      res.json({ success: true, data: comment });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 作品集相关
  static async createPortfolio(req: Request, res: Response) {
    try {
      const studentId = req.user!.userId;
      const portfolio = await PortfolioService.createPortfolio(studentId, req.body);
      res.json({ success: true, data: portfolio });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getPortfolios(req: Request, res: Response) {
    try {
      const filters = req.query;
      const portfolios = await PortfolioService.getPortfolios(filters);
      res.json({ success: true, data: portfolios });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getPortfolioDetail(req: Request, res: Response) {
    try {
      const { portfolioId } = req.params;
      const portfolio = await PortfolioService.getPortfolioDetail(parseInt(portfolioId));
      res.json({ success: true, data: portfolio });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async likePortfolio(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { portfolioId } = req.params;
      await PortfolioService.likePortfolio(parseInt(portfolioId), userId);
      res.json({ success: true, message: '点赞成功' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async commentPortfolio(req: Request, res: Response) {
    try {
      const authorId = req.user!.userId;
      const { portfolioId } = req.params;
      const { content, parentCommentId } = req.body;
      const comment = await PortfolioService.commentPortfolio(parseInt(portfolioId), authorId, content, parentCommentId);
      res.json({ success: true, data: comment });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getFeaturedPortfolios(req: Request, res: Response) {
    try {
      const portfolios = await PortfolioService.getFeaturedPortfolios();
      res.json({ success: true, data: portfolios });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async addPortfolioTags(req: Request, res: Response) {
    try {
      const { portfolioId } = req.params;
      const { tags } = req.body;
      await PortfolioService.addPortfolioTags(parseInt(portfolioId), tags);
      res.json({ success: true, message: '标签已添加' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getPopularTags(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const tags = await PortfolioService.getPopularTags(limit);
      res.json({ success: true, data: tags });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
