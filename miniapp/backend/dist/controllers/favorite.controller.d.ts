import { Request, Response } from 'express';
/**
 * 收藏系统控制器
 */
export declare class FavoriteController {
    /**
     * 添加收藏
     * POST /api/favorites
     */
    addFavorite(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 取消收藏
     * DELETE /api/favorites/:favoriteId
     */
    removeFavorite(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 获取收藏列表
     * GET /api/favorites
     */
    getUserFavorites(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 更新收藏笔记
     * PUT /api/favorites/:favoriteId/note
     */
    updateFavoriteNote(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 更新收藏分类
     * PUT /api/favorites/:favoriteId/category
     */
    updateFavoriteCategory(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 切换置顶状态
     * PUT /api/favorites/:favoriteId/pin
     */
    togglePin(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 获取所有分类
     * GET /api/favorites/categories
     */
    getUserCategories(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 获取收藏统计
     * GET /api/favorites/stats
     */
    getFavoriteStats(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * 检查是否已收藏
     * GET /api/favorites/check/:itemType/:itemId
     */
    checkIsFavorited(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
export declare const favoriteController: FavoriteController;
//# sourceMappingURL=favorite.controller.d.ts.map