import { Request, Response } from 'express'
import { taskReportService } from '../services/taskReport.service'
import { log } from '../utils/logger'

/**
 * 任务报告控制器
 */

/**
 * 生成任务总结报告
 * POST /api/task-report/generate
 */
export const generateTaskReport = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const { projectId } = req.body

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: '缺少projectId参数'
      })
    }

    const report = await taskReportService.generateTaskReport(userId, projectId)

    res.json({
      success: true,
      data: report,
      message: '任务总结报告生成成功'
    })
  } catch (error: any) {
    log.error('生成任务总结报告失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}
