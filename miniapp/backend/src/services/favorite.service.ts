import { Favorite, IFavorite } from '../models/Favorite'
import { PracticeProject } from '../models/PracticeProject'
import { RealProject } from '../models/RealProject'
import { DecompositionReport } from '../models/DecompositionReport'
import { ComparisonReport } from '../models/ComparisonReport'
import { DynamicGrowthPath } from '../models/DynamicGrowthPath'
import { Achievement } from '../models/Achievement'
import mongoose from 'mongoose'

/**
 * 收藏系统服务
 *
 * 核心功能：用户可以收藏各种内容
 * 每个用户的收藏列表完全独立
 */
export class FavoriteService {

  /**
   * 添加收藏
   */
  async addFavorite(
    userId: string,
    itemType: 'practice_project' | 'real_project' | 'decomposition_report' | 'comparison_report' | 'growth_path' | 'achievement',
    itemId: string,
    userNote?: string,
    category?: string
  ): Promise<IFavorite> {
    // 获取项目快照信息
    const snapshot = await this.getItemSnapshot(itemType, itemId)

    // 检查是否已收藏
    const existing = await Favorite.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      itemType,
      itemId: new mongoose.Types.ObjectId(itemId)
    })

    if (existing) {
      throw new Error('已经收藏过该内容')
    }

    // 创建收藏
    const favorite = new Favorite({
      userId: new mongoose.Types.ObjectId(userId),
      itemType,
      itemId: new mongoose.Types.ObjectId(itemId),
      snapshot,
      userNote,
      category,
      isPinned: false
    })

    await favorite.save()
    return favorite
  }

  /**
   * 取消收藏
   */
  async removeFavorite(userId: string, favoriteId: string): Promise<void> {
    const result = await Favorite.deleteOne({
      _id: new mongoose.Types.ObjectId(favoriteId),
      userId: new mongoose.Types.ObjectId(userId)
    })

    if (result.deletedCount === 0) {
      throw new Error('收藏不存在')
    }
  }

  /**
   * 获取用户的收藏列表
   */
  async getUserFavorites(
    userId: string,
    filter?: {
      itemType?: string
      category?: string
      isPinned?: boolean
    }
  ): Promise<IFavorite[]> {
    const query: any = { userId: new mongoose.Types.ObjectId(userId) }

    if (filter?.itemType) {
      query.itemType = filter.itemType
    }

    if (filter?.category) {
      query.category = filter.category
    }

    if (filter?.isPinned !== undefined) {
      query.isPinned = filter.isPinned
    }

    return await Favorite.find(query)
      .sort({ isPinned: -1, createdAt: -1 })
  }

  /**
   * 更新收藏笔记
   */
  async updateFavoriteNote(
    userId: string,
    favoriteId: string,
    userNote: string
  ): Promise<IFavorite | null> {
    const favorite = await Favorite.findOne({
      _id: new mongoose.Types.ObjectId(favoriteId),
      userId: new mongoose.Types.ObjectId(userId)
    })

    if (!favorite) {
      throw new Error('收藏不存在')
    }

    favorite.userNote = userNote
    await favorite.save()

    return favorite
  }

  /**
   * 更新收藏分类
   */
  async updateFavoriteCategory(
    userId: string,
    favoriteId: string,
    category: string
  ): Promise<IFavorite | null> {
    const favorite = await Favorite.findOne({
      _id: new mongoose.Types.ObjectId(favoriteId),
      userId: new mongoose.Types.ObjectId(userId)
    })

    if (!favorite) {
      throw new Error('收藏不存在')
    }

    favorite.category = category
    await favorite.save()

    return favorite
  }

  /**
   * 切换置顶状态
   */
  async togglePin(userId: string, favoriteId: string): Promise<IFavorite | null> {
    const favorite = await Favorite.findOne({
      _id: new mongoose.Types.ObjectId(favoriteId),
      userId: new mongoose.Types.ObjectId(userId)
    })

    if (!favorite) {
      throw new Error('收藏不存在')
    }

    favorite.isPinned = !favorite.isPinned
    await favorite.save()

    return favorite
  }

  /**
   * 获取所有收藏分类
   */
  async getUserCategories(userId: string): Promise<string[]> {
    const favorites = await Favorite.find({
      userId: new mongoose.Types.ObjectId(userId),
      category: { $exists: true, $ne: null }
    }).distinct('category')

    return favorites
  }

  /**
   * 获取收藏统计
   */
  async getFavoriteStats(userId: string): Promise<{
    total: number
    byType: { type: string; count: number }[]
    byCategory: { category: string; count: number }[]
    pinnedCount: number
  }> {
    const favorites = await Favorite.find({
      userId: new mongoose.Types.ObjectId(userId)
    })

    // 按类型统计
    const typeStats = new Map<string, number>()
    for (const fav of favorites) {
      typeStats.set(fav.itemType, (typeStats.get(fav.itemType) || 0) + 1)
    }

    const byType = Array.from(typeStats.entries()).map(([type, count]) => ({
      type,
      count
    }))

    // 按分类统计
    const categoryStats = new Map<string, number>()
    for (const fav of favorites) {
      if (fav.category) {
        categoryStats.set(fav.category, (categoryStats.get(fav.category) || 0) + 1)
      }
    }

    const byCategory = Array.from(categoryStats.entries()).map(([category, count]) => ({
      category,
      count
    }))

    return {
      total: favorites.length,
      byType,
      byCategory,
      pinnedCount: favorites.filter(f => f.isPinned).length
    }
  }

  /**
   * 检查是否已收藏
   */
  async isFavorited(userId: string, itemType: string, itemId: string): Promise<boolean> {
    const favorite = await Favorite.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      itemType,
      itemId: new mongoose.Types.ObjectId(itemId)
    })

    return !!favorite
  }

  /**
   * 获取项目快照信息（辅助方法）
   */
  private async getItemSnapshot(
    itemType: string,
    itemId: string
  ): Promise<{ title: string; description?: string; imageUrl?: string; tags?: string[] }> {
    let item: any

    switch (itemType) {
      case 'practice_project':
        item = await PracticeProject.findById(itemId)
        return {
          title: item?.title || '',
          description: item?.description || '',
          tags: item?.tags || []
        }

      case 'real_project':
        item = await RealProject.findById(itemId)
        return {
          title: item?.title || '',
          description: item?.description || '',
          tags: item?.requiredSkills || []
        }

      case 'decomposition_report':
        item = await DecompositionReport.findById(itemId)
        const project = await PracticeProject.findById(item?.projectId)
        return {
          title: `${project?.title || ''} - 拆解报告`,
          description: item?.abilityBreakdown?.abilities?.[0]?.description || ''
        }

      case 'comparison_report':
        item = await ComparisonReport.findById(itemId)
        return {
          title: `对比报告 #${item?.comparisonNumber || ''}`,
          description: item?.analysis?.summary || ''
        }

      case 'growth_path':
        item = await DynamicGrowthPath.findById(itemId)
        return {
          title: `成长路径 v${item?.versionNumber || ''}`,
          description: item?.currentState?.overallLevel || ''
        }

      case 'achievement':
        item = await Achievement.findById(itemId)
        return {
          title: item?.title || '',
          description: item?.description || '',
          imageUrl: item?.icon || ''
        }

      default:
        return { title: '未知项目' }
    }
  }
}

export const favoriteService = new FavoriteService()
