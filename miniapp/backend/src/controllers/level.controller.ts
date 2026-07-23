import { Request, Response } from 'express'
import { levelService } from '../services/level.service'
import { log } from '../utils/logger'

/**
 * 等级控制器
 */

/**
 * GET /api/level/info
 * 获取用户等级信息
 */
export const getLevelInfo = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId

    const levelInfo = await levelService.getUserLevel(userId)

    res.json({
      success: true,
      data: levelInfo
    })
  } catch (error: any) {
    log.error('获取等级信息失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * GET /api/level/all
 * 获取所有等级配置
 */
export const getAllLevels = async (req: Request, res: Response) => {
  try {
    const levels = levelService.getAllLevels()

    res.json({
      success: true,
      data: levels
    })
  } catch (error: any) {
    log.error('获取等级配置失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * GET /api/level/leaderboard
 * 获取等级榜单
 */
export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50

    const leaderboard = await levelService.getLevelLeaderboard(limit)

    res.json({
      success: true,
      data: leaderboard
    })
  } catch (error: any) {
    log.error('获取等级榜单失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * POST /api/level/test-add-exp
 * 测试：手动增加经验值（仅开发环境）
 */
export const testAddExp = async (req: Request, res: Response) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: '生产环境不可用'
      })
    }

    const userId = (req as any).userId
    const { exp, reason } = req.body

    if (!exp || !reason) {
      return res.status(400).json({
        success: false,
        error: '缺少参数'
      })
    }

    const result = await levelService.addExp(userId, exp, reason)

    res.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    log.error('测试增加经验值失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}
