import { Request, Response } from 'express'
import { favoriteService } from '../services/favorite.service'

/**
 * 收藏系统控制器
 */
export class FavoriteController {

  /**
   * 添加收藏
   * POST /api/favorites
   */
  async addFavorite(req: Request, res: Response) {
    try {
      const userId = req.userId

      if (!userId) {
        return res.status(401).json({ error: '未授权' })
      }
      const { itemType, itemId, userNote, category } = req.body

      if (!itemType || !itemId) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数'
        })
      }

      const favorite = await favoriteService.addFavorite(
        userId,
        itemType,
        itemId,
        userNote,
        category
      )

      res.json({
        success: true,
        data: favorite,
        message: '收藏成功'
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '添加收藏失败'
      })
    }
  }

  /**
   * 取消收藏
   * DELETE /api/favorites/:favoriteId
   */
  async removeFavorite(req: Request, res: Response) {
    try {
      const userId = req.userId

      if (!userId) {
        return res.status(401).json({ error: '未授权' })
      }
      const { favoriteId } = req.params

      await favoriteService.removeFavorite(userId, favoriteId)

      res.json({
        success: true,
        message: '取消收藏成功'
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '取消收藏失败'
      })
    }
  }

  /**
   * 获取收藏列表
   * GET /api/favorites
   */
  async getUserFavorites(req: Request, res: Response) {
    try {
      const userId = req.userId

      if (!userId) {
        return res.status(401).json({ error: '未授权' })
      }
      const { itemType, category, isPinned } = req.query

      const filter: any = {}
      if (itemType) filter.itemType = itemType
      if (category) filter.category = category
      if (isPinned !== undefined) filter.isPinned = isPinned === 'true'

      const favorites = await favoriteService.getUserFavorites(userId, filter)

      res.json({
        success: true,
        data: favorites,
        count: favorites.length
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '获取收藏列表失败'
      })
    }
  }

  /**
   * 更新收藏笔记
   * PUT /api/favorites/:favoriteId/note
   */
  async updateFavoriteNote(req: Request, res: Response) {
    try {
      const userId = req.userId

      if (!userId) {
        return res.status(401).json({ error: '未授权' })
      }
      const { favoriteId } = req.params
      const { userNote } = req.body

      const favorite = await favoriteService.updateFavoriteNote(userId, favoriteId, userNote)

      res.json({
        success: true,
        data: favorite,
        message: '笔记更新成功'
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '更新笔记失败'
      })
    }
  }

  /**
   * 更新收藏分类
   * PUT /api/favorites/:favoriteId/category
   */
  async updateFavoriteCategory(req: Request, res: Response) {
    try {
      const userId = req.userId

      if (!userId) {
        return res.status(401).json({ error: '未授权' })
      }
      const { favoriteId } = req.params
      const { category } = req.body

      const favorite = await favoriteService.updateFavoriteCategory(userId, favoriteId, category)

      res.json({
        success: true,
        data: favorite,
        message: '分类更新成功'
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '更新分类失败'
      })
    }
  }

  /**
   * 切换置顶状态
   * PUT /api/favorites/:favoriteId/pin
   */
  async togglePin(req: Request, res: Response) {
    try {
      const userId = req.userId

      if (!userId) {
        return res.status(401).json({ error: '未授权' })
      }
      const { favoriteId } = req.params

      const favorite = await favoriteService.togglePin(userId, favoriteId)

      res.json({
        success: true,
        data: favorite,
        message: favorite?.isPinned ? '已置顶' : '已取消置顶'
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '切换置顶状态失败'
      })
    }
  }

  /**
   * 获取所有分类
   * GET /api/favorites/categories
   */
  async getUserCategories(req: Request, res: Response) {
    try {
      const userId = req.userId

      if (!userId) {
        return res.status(401).json({ error: '未授权' })
      }

      const categories = await favoriteService.getUserCategories(userId)

      res.json({
        success: true,
        data: categories
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '获取分类失败'
      })
    }
  }

  /**
   * 获取收藏统计
   * GET /api/favorites/stats
   */
  async getFavoriteStats(req: Request, res: Response) {
    try {
      const userId = req.userId

      if (!userId) {
        return res.status(401).json({ error: '未授权' })
      }

      const stats = await favoriteService.getFavoriteStats(userId)

      res.json({
        success: true,
        data: stats
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '获取统计失败'
      })
    }
  }

  /**
   * 检查是否已收藏
   * GET /api/favorites/check/:itemType/:itemId
   */
  async checkIsFavorited(req: Request, res: Response) {
    try {
      const userId = req.userId

      if (!userId) {
        return res.status(401).json({ error: '未授权' })
      }
      const { itemType, itemId } = req.params

      const isFavorited = await favoriteService.isFavorited(userId, itemType, itemId)

      res.json({
        success: true,
        data: { isFavorited }
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '检查收藏状态失败'
      })
    }
  }
}

export const favoriteController = new FavoriteController()
