interface Portfolio {
    id?: string;
    student_id: string;
    title: string;
    description: string;
    category: string;
    tech_stack: string[];
    cover_image?: string;
    images?: string[];
    video_url?: string;
    demo_url?: string;
    github_url?: string;
    role?: string;
    duration_days?: number;
    highlights?: string[];
    challenges_overcome?: string;
    related_task_id?: string;
    is_from_platform?: boolean;
    is_public?: boolean;
    display_order?: number;
}
interface PortfolioFilter {
    studentId?: string;
    category?: string;
    tags?: string[];
    isPublic?: boolean;
    status?: string;
    limit?: number;
    offset?: number;
}
/**
 * E-06: 学生作品集服务
 * 管理学生作品集的增删改查、浏览记录、点赞等功能
 */
declare class PortfolioService {
    /**
     * 创建作品集
     */
    createPortfolio(data: Portfolio): Promise<any>;
    /**
     * 获取作品集列表
     */
    getPortfolios(filter: PortfolioFilter): Promise<any[]>;
    /**
     * 获取单个作品集详情
     */
    getPortfolioById(portfolioId: string, viewerId?: string): Promise<any>;
    /**
     * 更新作品集
     */
    updatePortfolio(portfolioId: string, updates: Partial<Portfolio>): Promise<any>;
    /**
     * 删除作品集
     */
    deletePortfolio(portfolioId: string, studentId: string): Promise<void>;
    /**
     * 记录浏览
     */
    recordView(portfolioId: string, viewerId?: string, viewerRole?: string): Promise<void>;
    /**
     * 点赞/取消点赞
     */
    toggleLike(portfolioId: string, userId: string): Promise<{
        liked: boolean;
    }>;
    /**
     * 添加标签
     */
    addTags(portfolioId: string, tags: string[]): Promise<void>;
    /**
     * 删除标签
     */
    removeTag(portfolioId: string, tagName: string): Promise<void>;
    /**
     * 审核作品集
     */
    reviewPortfolio(portfolioId: string, reviewerId: string, status: 'approved' | 'rejected', reviewNotes?: string): Promise<any>;
    /**
     * 获取学生的作品集统计
     */
    getStudentPortfolioStats(studentId: string): Promise<any>;
    /**
     * 获取热门作品集
     */
    getTrendingPortfolios(limit?: number): Promise<any[]>;
    /**
     * 搜索作品集
     */
    searchPortfolios(keyword: string, limit?: number): Promise<any[]>;
}
declare const _default: PortfolioService;
export default _default;
//# sourceMappingURL=portfolioService.d.ts.map