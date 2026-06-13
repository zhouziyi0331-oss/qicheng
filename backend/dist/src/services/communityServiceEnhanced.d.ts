/**
 * 社区服务 - 增强版
 * 处理社区帖子发布、评论、点赞、举报等功能
 */
interface CreatePostParams {
    authorId: string;
    type: 'recruit' | 'showcase' | 'collab' | 'skill_share' | 'help';
    title: string;
    content: string;
    coverImage?: string;
    requiredSkills?: string[];
    track?: string;
    teamId?: string;
    vacancyCount?: number;
    projectSource?: 'platform_order' | 'self_initiated' | 'external';
    mySkills?: string[];
    requiredSkillsDetail?: Array<{
        skillName: string;
        requiredLevel: 'must' | 'plus';
    }>;
    profitSplit?: 'equal' | 'proportional' | 'negotiable';
    estimatedDuration?: string;
    recruitCount?: number;
    relatedTrack?: 'content' | 'dev' | 'both';
    relatedLevels?: number[];
}
interface CreateCommentParams {
    postId: string;
    userId: string;
    content: string;
    parentId?: string;
}
declare class CommunityServiceEnhanced {
    /**
     * 发布社区帖子（增强版）
     */
    createPost(params: CreatePostParams): Promise<string>;
    /**
     * 创建评论
     */
    createComment(params: CreateCommentParams): Promise<string>;
    /**
     * 获取帖子的评论列表
     */
    getComments(postId: string, limit?: number, offset?: number): Promise<any[]>;
    /**
     * 点赞/取消点赞
     */
    toggleLike(userId: string, targetType: 'post' | 'comment', targetId: string): Promise<{
        liked: boolean;
    }>;
    /**
     * 举报内容
     */
    reportContent(reporterId: string, targetType: 'post' | 'comment', targetId: string, reason: 'spam' | 'harassment' | 'company_complaint' | 'student_attack' | 'false_info' | 'other', description?: string): Promise<void>;
    /**
     * 删除评论
     */
    deleteComment(commentId: string, userId: string): Promise<void>;
    /**
     * 删除帖子
     */
    deletePost(postId: string, userId: string): Promise<void>;
    /**
     * 获取帖子详情（增强版）
     */
    getPostDetails(postId: string, userId: string): Promise<any>;
}
declare const _default: CommunityServiceEnhanced;
export default _default;
//# sourceMappingURL=communityServiceEnhanced.d.ts.map