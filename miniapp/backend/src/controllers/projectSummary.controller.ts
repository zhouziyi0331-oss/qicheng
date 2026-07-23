import { Request, Response } from 'express'
import { projectSummaryService } from '../services/projectSummary.service'
import { log } from '../utils/logger'

/**
 * 项目完成总结控制器
 */

/**
 * 生成项目完成总结
 * POST /api/project-summary/generate
 */
export const generateProjectSummary = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const { projectId } = req.body

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: '缺少projectId参数'
      })
    }

    const summary = await projectSummaryService.generateProjectSummary(userId, projectId)

    res.json({
      success: true,
      data: summary,
      message: '项目完成总结生成成功'
    })
  } catch (error: any) {
    log.error('生成项目完成总结失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}
