import { Request, Response } from 'express';
export declare class CommunityPortfolioController {
    static getCommunities(req: Request, res: Response): Promise<void>;
    static joinCommunity(req: Request, res: Response): Promise<void>;
    static createPost(req: Request, res: Response): Promise<void>;
    static getPosts(req: Request, res: Response): Promise<void>;
    static likePost(req: Request, res: Response): Promise<void>;
    static commentPost(req: Request, res: Response): Promise<void>;
    static createPortfolio(req: Request, res: Response): Promise<void>;
    static getPortfolios(req: Request, res: Response): Promise<void>;
    static getPortfolioDetail(req: Request, res: Response): Promise<void>;
    static likePortfolio(req: Request, res: Response): Promise<void>;
    static commentPortfolio(req: Request, res: Response): Promise<void>;
    static getFeaturedPortfolios(req: Request, res: Response): Promise<void>;
    static addPortfolioTags(req: Request, res: Response): Promise<void>;
    static getPopularTags(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=communityPortfolioController.d.ts.map