/**
 * 评价系统服务
 *
 * 处理双向评价、标签、有用性投票、举报等功能
 */
export interface Rating {
    id: string;
    task_id: string;
    rater_id: string;
    rater_type: string;
    ratee_id: string;
    ratee_type: string;
    rating: number;
    comment?: string;
    detailed_scores?: {
        quality?: number;
        communication?: number;
        timeliness?: number;
    };
    is_anonymous: boolean;
    is_edited: boolean;
    edit_count: number;
    last_edited_at?: Date;
    helpful_count: number;
    report_count: number;
    is_verified: boolean;
    response?: string;
    response_at?: Date;
    created_at: Date;
    updated_at: Date;
}
export interface CreateRatingParams {
    task_id: string;
    rater_id: string;
    ratee_id: string;
    rating: number;
    comment?: string;
    detailed_scores?: {
        quality?: number;
        communication?: number;
        timeliness?: number;
    };
    tag_ids?: string[];
    is_anonymous?: boolean;
}
export interface RatingTag {
    id: string;
    tag_name: string;
    tag_category: string;
    applicable_to: string;
    display_name: string;
    description?: string;
    icon?: string;
    usage_count: number;
}
export interface UserRatingStats {
    user_id: string;
    user_type: string;
    total_ratings_received: number;
    avg_rating: number;
    rating_5_count: number;
    rating_4_count: number;
    rating_3_count: number;
    rating_2_count: number;
    rating_1_count: number;
    avg_quality_score?: number;
    avg_communication_score?: number;
    avg_timeliness_score?: number;
    top_positive_tags: any[];
    top_negative_tags: any[];
    last_rating_received_at?: Date;
}
declare class RatingService {
    /**
     * 创建评价
     */
    createRating(params: CreateRatingParams): Promise<Rating>;
    /**
     * 更新评价
     */
    updateRating(ratingId: string, raterId: string, updates: {
        rating?: number;
        comment?: string;
        detailed_scores?: any;
        tag_ids?: string[];
    }): Promise<Rating>;
    /**
     * 回复评价（被评价方）
     */
    respondToRating(ratingId: string, rateeId: string, response: string): Promise<void>;
    /**
     * 标记评价有用/无用
     */
    markHelpfulness(ratingId: string, userId: string, isHelpful: boolean): Promise<void>;
    /**
     * 举报评价
     */
    reportRating(ratingId: string, reporterId: string, reason: string, description?: string): Promise<void>;
    /**
     * 获取任务的评价
     */
    getTaskRatings(taskId: string, userId?: string): Promise<any[]>;
    /**
     * 获取用户收到的评价
     */
    getUserRatings(userId: string, filters?: {
        rating?: number;
        limit?: number;
        offset?: number;
    }): Promise<{
        ratings: any[];
        total: number;
    }>;
    /**
     * 获取用户评价统计
     */
    getUserRatingStats(userId: string): Promise<UserRatingStats | null>;
    /**
     * 获取所有可用标签
     */
    getAvailableTags(applicableTo?: string): Promise<RatingTag[]>;
    /**
     * 删除评价（仅管理员）
     */
    deleteRating(ratingId: string, adminId: string, reason: string): Promise<void>;
}
export declare const ratingService: RatingService;
export {};
//# sourceMappingURL=ratingService.d.ts.map