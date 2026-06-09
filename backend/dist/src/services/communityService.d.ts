/**
 * 社区服务
 * 处理社区帖子发布、申请、技能展示
 */
interface CreatePostParams {
    authorId: string;
    type: 'recruit' | 'showcase' | 'collab';
    title: string;
    content: string;
    coverImage?: string;
    requiredSkills?: string[];
    track?: string;
    teamId?: string;
    vacancyCount?: number;
}
interface CommunityPost {
    id: string;
    authorId: string;
    type: string;
    title: string;
    content: string;
    coverImage?: string;
    requiredSkills: string[];
    track?: string;
    teamId?: string;
    vacancyCount?: number;
    totalApplicants: number;
    status: string;
    createdAt: Date;
    expiresAt: Date;
    author?: {
        name: string;
        level: number;
        track: string;
        avatar?: string;
    };
}
declare class CommunityService {
    /**
     * 发布社区帖子
     */
    createPost(params: CreatePostParams): Promise<string>;
    /**
     * 获取社区帖子列表
     */
    getPosts(options?: {
        type?: 'recruit' | 'showcase' | 'collab';
        track?: string;
        status?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        posts: CommunityPost[];
        totalCount: number;
    }>;
    /**
     * 获取帖子详情
     */
    getPostDetail(postId: string): Promise<CommunityPost | null>;
    /**
     * 申请加入（招募帖）
     */
    applyToPost(postId: string, applicantId: string, message?: string, skillsOffered?: string[]): Promise<void>;
    /**
     * 审核申请
     */
    reviewApplication(postId: string, authorId: string, applicantId: string, approved: boolean): Promise<void>;
    /**
     * 获取帖子的申请列表
     */
    getPostApplications(postId: string, authorId: string): Promise<any[]>;
    /**
     * 关闭帖子
     */
    closePost(postId: string, authorId: string): Promise<void>;
    /**
     * 删除帖子
     */
    deletePost(postId: string, authorId: string): Promise<void>;
    /**
     * 获取用户发布的帖子
     */
    getUserPosts(userId: string, limit?: number, offset?: number): Promise<{
        posts: CommunityPost[];
        totalCount: number;
    }>;
    /**
     * 获取用户申请的帖子
     */
    getUserApplications(userId: string): Promise<any[]>;
}
declare const _default: CommunityService;
export default _default;
//# sourceMappingURL=communityService.d.ts.map