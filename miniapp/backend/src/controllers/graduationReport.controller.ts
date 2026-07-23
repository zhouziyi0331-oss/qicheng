import { Request, Response } from 'express'
import { graduationReportService } from '../services/graduationReport.service'
import { log } from '../utils/logger'

/**
 * 毕业报告控制器
 */

/**
 * 生成毕业报告
 * POST /api/graduation-report/generate
 */
export const generateGraduationReport = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!

    const report = await graduationReportService.generateGraduationReport(userId)

    res.json({
      success: true,
      data: report,
      message: '毕业报告生成成功'
    })
  } catch (error: any) {
    log.error('生成毕业报告失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}
