import { Request, Response } from 'express'
import { achievementService } from '../services/achievement.service'

/**
 * 成就系统控制器
 */
export class AchievementController {

  /**
   * 获取用户成就列表
   * GET /api/achievements
   */
  async getUserAchievements(req: Request, res: Response) {
    try {
      const userId = req.userId

      if (!userId) {
        return res.status(401).json({ error: '未授权' })
      }
      const { isUnlocked, type } = req.query

      const filter: any = {}
      if (isUnlocked !== undefined) {
        filter.isUnlocked = isUnlocked === 'true'
      }
      if (type) {
        filter.type = type
      }

      const achievements = await achievementService.getUserAchievements(userId, filter)

      res.json({
        success: true,
        data: achievements,
        count: achievements.length
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '获取成就列表失败'
      })
    }
  }

  /**
   * 获取成就统计
   * GET /api/achievements/stats
   */
  async getAchievementStats(req: Request, res: Response) {
    try {
      const userId = req.userId

      if (!userId) {
        return res.status(401).json({ error: '未授权' })
      }

      const stats = await achievementService.getAchievementStats(userId)

      res.json({
        success: true,
        data: stats
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '获取成就统计失败'
      })
    }
  }

  /**
   * 检查并更新所有成就
   * POST /api/achievements/check
   */
  async checkAllAchievements(req: Request, res: Response) {
    try {
      const userId = req.userId

      if (!userId) {
        return res.status(401).json({ error: '未授权' })
      }

      const unlockedAchievements = await achievementService.checkAllAchievements(userId)

      res.json({
        success: true,
        data: unlockedAchievements,
        message: unlockedAchievements.length > 0
          ? `恭喜解锁${unlockedAchievements.length}个新成就！`
          : '暂无新成就解锁'
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '检查成就失败'
      })
    }
  }

  /**
   * 切换成就展示状态
   * PUT /api/achievements/:achievementId/display
   */
  async toggleAchievementDisplay(req: Request, res: Response) {
    try {
      const userId = req.userId

      if (!userId) {
        return res.status(401).json({ error: '未授权' })
      }
      const { achievementId } = req.params

      const achievement = await achievementService.toggleAchievementDisplay(userId, achievementId)

      res.json({
        success: true,
        data: achievement,
        message: '成就展示状态更新成功'
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '更新成就展示状态失败'
      })
    }
  }
}

export const achievementController = new AchievementController()
