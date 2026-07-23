import { Request, Response } from 'express'
import { matchService } from '../services/match.service'
import { log } from '../utils/logger'

/**
 * 项目匹配控制器
 */

/**
 * 获取智能匹配的项目列表
 */
export const getMatchedProjects = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const limit = parseInt(req.query.limit as string) || 20

    const matches = await matchService.matchProjects(userId, limit)

    res.json({
      success: true,
      data: matches,
      count: matches.length
    })
  } catch (error: any) {
    log.error('获取匹配项目失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * 获取单个项目的匹配信息
 */
export const getProjectMatchInfo = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const { projectId } = req.params

    const result = await matchService.getProjectWithMatchReason(userId, projectId)

    res.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    log.error('获取项目匹配信息失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}
