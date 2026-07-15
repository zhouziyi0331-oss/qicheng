/**
 * Phase 3.2: OPC故事墙服务
 * 让学生分享自己的OPC发现故事，看到"原来还可以这样"
 */
export interface OpcStory {
    id: string;
    studentId: string;
    studentName?: string;
    personalityType: string;
    title: string;
    storyContent: string;
    storyType: 'discovery' | 'breakthrough' | 'acceptance' | 'growth';
    emotionTags: string[];
    lifeQuestion?: string;
    beforeState?: string;
    afterState?: string;
    keyMoment?: string;
    reflection?: string;
    status: 'pending' | 'approved' | 'rejected' | 'published';
    viewCount: number;
    likeCount: number;
    commentCount: number;
    shareCount: number;
    isFeatured: boolean;
    createdAt: Date;
    publishedAt?: Date;
}
export interface StoryFilter {
    personalityType?: string;
    storyType?: 'discovery' | 'breakthrough' | 'acceptance' | 'growth';
    emotionTags?: string[];
    featured?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
}
export interface StoryStats {
    totalStories: number;
    byType: Record<string, number>;
    byPersonality: Record<string, number>;
    popularTags: Array<{
        tag: string;
        count: number;
    }>;
}
declare class OpcStoryService {
    /**
     * 创建故事
     */
    createStory(params: {
        studentId: string;
        title: string;
        storyContent: string;
        storyType: 'discovery' | 'breakthrough' | 'acceptance' | 'growth';
        emotionTags?: string[];
        lifeQuestion?: string;
        beforeState?: string;
        afterState?: string;
        keyMoment?: string;
        reflection?: string;
    }): Promise<{
        success: boolean;
        storyId?: string;
        message: string;
    }>;
    /**
     * 搜索/浏览故事
     */
    searchStories(filter: StoryFilter): Promise<{
        stories: OpcStory[];
        total: number;
    }>;
    /**
     * 获取故事详情
     */
    getStoryById(storyId: string, viewerId?: string): Promise<OpcStory | null>;
    /**
     * 点赞故事
     */
    likeStory(storyId: string, studentId: string): Promise<boolean>;
    /**
     * 标记共鸣
     */
    markResonance(params: {
        storyId: string;
        studentId: string;
        resonanceType: 'similar_experience' | 'same_feeling' | 'inspired';
        note?: string;
    }): Promise<boolean>;
    /**
     * 获取故事统计
     */
    getStoryStats(): Promise<StoryStats>;
    /**
     * 推荐相似故事（基于OPC类型和情绪标签）
     */
    recommendSimilarStories(storyId: string, limit?: number): Promise<OpcStory[]>;
}
declare const _default: OpcStoryService;
export default _default;
//# sourceMappingURL=opcStoryService.d.ts.map