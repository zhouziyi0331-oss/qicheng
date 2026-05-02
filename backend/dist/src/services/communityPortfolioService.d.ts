/**
 * 社群服务
 */
export declare class CommunityService {
    /**
     * 获取社群列表
     */
    static getCommunities(filters?: any): Promise<any[]>;
    /**
     * 加入社群
     */
    static joinCommunity(communityId: number, userId: string): Promise<void>;
    /**
     * 发布帖子
     */
    static createPost(communityId: number, authorId: string, postData: any): Promise<any>;
    /**
     * 获取帖子列表
     */
    static getPosts(communityId: number, filters?: any): Promise<any[]>;
    /**
     * 点赞帖子
     */
    static likePost(postId: number, userId: string): Promise<void>;
    /**
     * 评论帖子
     */
    static commentPost(postId: number, authorId: string, content: string, parentCommentId?: number): Promise<any>;
}
/**
 * 作品集服务
 */
export declare class PortfolioService {
    /**
     * 创建作品
     */
    static createPortfolio(studentId: string, portfolioData: any): Promise<any>;
    /**
     * 获取作品列表
     */
    static getPortfolios(filters?: any): Promise<any[]>;
    /**
     * 获取作品详情
     */
    static getPortfolioDetail(portfolioId: number): Promise<any>;
    /**
     * 点赞作品
     */
    static likePortfolio(portfolioId: number, userId: string): Promise<void>;
    /**
     * 评论作品
     */
    static commentPortfolio(portfolioId: number, authorId: string, content: string, parentCommentId?: number): Promise<any>;
    /**
     * 获取精选作品
     */
    static getFeaturedPortfolios(): Promise<any[]>;
    /**
     * 添加作品标签
     */
    static addPortfolioTags(portfolioId: number, tagNames: string[]): Promise<void>;
    /**
     * 获取热门标签
     */
    static getPopularTags(limit?: number): Promise<any[]>;
}
//# sourceMappingURL=communityPortfolioService.d.ts.map