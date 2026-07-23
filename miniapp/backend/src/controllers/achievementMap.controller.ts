import { Request, Response } from 'express'
import { achievementMapService } from '../services/achievementMap.service'
import { log } from '../utils/logger'

/**
 * 成就地图控制器
 */

/**
 * 获取用户成就地图
 * GET /api/achievement-map
 */
export const getAchievementMap = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!

    const result = await achievementMapService.checkUnlockedAchievements(userId)

    res.json({
      success: true,
      data: result,
      message: '获取成就地图成功'
    })
  } catch (error: any) {
    log.error('获取成就地图失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}
