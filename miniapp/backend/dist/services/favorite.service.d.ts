import { IFavorite } from '../models/Favorite';
/**
 * 收藏系统服务
 *
 * 核心功能：用户可以收藏各种内容
 * 每个用户的收藏列表完全独立
 */
export declare class FavoriteService {
    /**
     * 添加收藏
     */
    addFavorite(userId: string, itemType: 'practice_project' | 'real_project' | 'decomposition_report' | 'comparison_report' | 'growth_path' | 'achievement', itemId: string, userNote?: string, category?: string): Promise<IFavorite>;
    /**
     * 取消收藏
     */
    removeFavorite(userId: string, favoriteId: string): Promise<void>;
    /**
     * 获取用户的收藏列表
     */
    getUserFavorites(userId: string, filter?: {
        itemType?: string;
        category?: string;
        isPinned?: boolean;
    }): Promise<IFavorite[]>;
    /**
     * 更新收藏笔记
     */
    updateFavoriteNote(userId: string, favoriteId: string, userNote: string): Promise<IFavorite | null>;
    /**
     * 更新收藏分类
     */
    updateFavoriteCategory(userId: string, favoriteId: string, category: string): Promise<IFavorite | null>;
    /**
     * 切换置顶状态
     */
    togglePin(userId: string, favoriteId: string): Promise<IFavorite | null>;
    /**
     * 获取所有收藏分类
     */
    getUserCategories(userId: string): Promise<string[]>;
    /**
     * 获取收藏统计
     */
    getFavoriteStats(userId: string): Promise<{
        total: number;
        byType: {
            type: string;
            count: number;
        }[];
        byCategory: {
            category: string;
            count: number;
        }[];
        pinnedCount: number;
    }>;
    /**
     * 检查是否已收藏
     */
    isFavorited(userId: string, itemType: string, itemId: string): Promise<boolean>;
    /**
     * 获取项目快照信息（辅助方法）
     */
    private getItemSnapshot;
}
export declare const favoriteService: FavoriteService;
//# sourceMappingURL=favorite.service.d.ts.map