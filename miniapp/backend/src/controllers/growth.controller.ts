import { Request, Response } from 'express'
import { assessmentService } from '../services/assessment.service'
import { abilityRadarService } from '../services/abilityRadar.service'
import { comparisonReportService } from '../services/comparisonReport.service'
import { dynamicGrowthPathService } from '../services/dynamicGrowthPath.service'
import { graduationReportService } from '../services/graduationReport.service'
import { paymentService } from '../services/payment.service'
import { log } from '../utils/logger'

/**
 * 个人成长控制器
 * 处理OC测评、能力雷达图、对比报告、成长路径、毕业报告
 */

/**
 * POST /api/growth/assessment
 * 提交测评并生成结果
 */
export const submitAssessment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const { answers } = req.body

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: '测评答案格式不正确' })
    }

    const result = await assessmentService.generateAssessmentResult(userId, answers)

    res.json({
      success: true,
      data: result
    })

  } catch (error: any) {
    log.error('提交测评失败', { error: error.message })
    res.status(500).json({ error: error.message || '提交测评失败' })
  }
}

/**
 * GET /api/growth/assessments
 * 获取测评历史
 */
export const getAssessments = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId

    const assessments = await assessmentService.getUserAssessments(userId)

    res.json({
      success: true,
      data: {
        total: assessments.length,
        assessments
      }
    })

  } catch (error: any) {
    log.error('获取测评历史失败', { error: error.message })
    res.status(500).json({ error: '获取测评历史失败' })
  }
}

/**
 * GET /api/growth/assessment/latest
 * 获取最新测评
 */
export const getLatestAssessment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId

    const assessment = await assessmentService.getLatestAssessment(userId)

    if (!assessment) {
      return res.status(404).json({ error: '未找到测评记录' })
    }

    res.json({
      success: true,
      data: assessment
    })

  } catch (error: any) {
    log.error('获取最新测评失败', { error: error.message })
    res.status(500).json({ error: '获取最新测评失败' })
  }
}

/**
 * GET /api/growth/ability-radar
 * 获取能力雷达图历史
 */
export const getAbilityRadarHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId

    const radars = await abilityRadarService.getUserRadarHistory(userId)

    res.json({
      success: true,
      data: {
        total: radars.length,
        radars
      }
    })

  } catch (error: any) {
    log.error('获取雷达图历史失败', { error: error.message })
    res.status(500).json({ error: '获取雷达图历史失败' })
  }
}

/**
 * GET /api/growth/ability-radar/latest
 * 获取最新雷达图
 */
export const getLatestAbilityRadar = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId

    const radar = await abilityRadarService.getLatestRadar(userId)

    if (!radar) {
      return res.status(404).json({ error: '未找到雷达图' })
    }

    res.json({
      success: true,
      data: radar
    })

  } catch (error: any) {
    log.error('获取最新雷达图失败', { error: error.message })
    res.status(500).json({ error: '获取最新雷达图失败' })
  }
}

/**
 * GET /api/growth/ability-radar/compare
 * 对比两个雷达图
 */
export const compareRadars = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const { snapshot1, snapshot2 } = req.query

    if (!snapshot1 || !snapshot2) {
      return res.status(400).json({ error: '请提供两个快照编号' })
    }

    const comparison = await abilityRadarService.compareRadars(
      userId,
      parseInt(snapshot1 as string),
      parseInt(snapshot2 as string)
    )

    res.json({
      success: true,
      data: comparison
    })

  } catch (error: any) {
    log.error('对比雷达图失败', { error: error.message })
    res.status(500).json({ error: error.message || '对比雷达图失败' })
  }
}

/**
 * GET /api/growth/comparison-reports
 * 获取对比报告历史
 */
export const getComparisonReports = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId

    const reports = await comparisonReportService.getUserComparisonReports(userId)

    res.json({
      success: true,
      data: {
        total: reports.length,
        reports
      }
    })

  } catch (error: any) {
    log.error('获取对比报告失败', { error: error.message })
    res.status(500).json({ error: '获取对比报告失败' })
  }
}

/**
 * GET /api/growth/comparison-reports/latest
 * 获取最新对比报告
 */
export const getLatestComparisonReport = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId

    const report = await comparisonReportService.getLatestComparisonReport(userId)

    if (!report) {
      return res.status(404).json({ error: '未找到对比报告' })
    }

    res.json({
      success: true,
      data: report
    })

  } catch (error: any) {
    log.error('获取最新对比报告失败', { error: error.message })
    res.status(500).json({ error: '获取最新对比报告失败' })
  }
}

/**
 * POST /api/growth/growth-path/generate
 * 生成/更新成长路径
 */
export const generateGrowthPath = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId

    const growthPath = await dynamicGrowthPathService.generateGrowthPath(userId)

    res.json({
      success: true,
      data: growthPath
    })

  } catch (error: any) {
    log.error('生成成长路径失败', { error: error.message })
    res.status(500).json({ error: error.message || '生成成长路径失败' })
  }
}

/**
 * GET /api/growth/growth-path/latest
 * 获取最新成长路径
 */
export const getLatestGrowthPath = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId

    const path = await dynamicGrowthPathService.getLatestGrowthPath(userId)

    if (!path) {
      return res.status(404).json({ error: '未找到成长路径' })
    }

    res.json({
      success: true,
      data: path
    })

  } catch (error: any) {
    log.error('获取成长路径失败', { error: error.message })
    res.status(500).json({ error: '获取成长路径失败' })
  }
}

/**
 * GET /api/growth/growth-path/history
 * 获取成长路径历史
 */
export const getGrowthPathHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId

    const paths = await dynamicGrowthPathService.getGrowthPathHistory(userId)

    res.json({
      success: true,
      data: {
        total: paths.length,
        paths
      }
    })

  } catch (error: any) {
    log.error('获取成长路径历史失败', { error: error.message })
    res.status(500).json({ error: '获取成长路径历史失败' })
  }
}

/**
 * POST /api/growth/growth-path/milestone
 * 更新里程碑状态
 */
export const updateMilestone = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const { milestoneTitle, completed } = req.body

    if (!milestoneTitle) {
      return res.status(400).json({ error: '请提供里程碑标题' })
    }

    const path = await dynamicGrowthPathService.updateMilestone(
      userId,
      milestoneTitle,
      completed
    )

    res.json({
      success: true,
      data: path
    })

  } catch (error: any) {
    log.error('更新里程碑失败', { error: error.message })
    res.status(500).json({ error: error.message || '更新里程碑失败' })
  }
}

/**
 * POST /api/growth/graduation-report/generate
 * 生成毕业报告
 */
export const generateGraduationReport = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId

    const result = await graduationReportService.generateGraduationReport(userId)

    res.json({
      success: true,
      data: result
    })

  } catch (error: any) {
    log.error('生成毕业报告失败', { error: error.message })
    res.status(500).json({ error: error.message || '生成毕业报告失败' })
  }
}

/**
 * GET /api/growth/graduation-report
 * 获取毕业报告
 */
export const getGraduationReport = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId

    const report = await graduationReportService.generateGraduationReport(userId)

    if (!report) {
      return res.status(404).json({ error: '未找到毕业报告' })
    }

    // 如果未解锁，只返回部分信息
    if (!report.isUnlocked) {
      return res.json({
        success: true,
        data: {
          reportId: report._id,
          status: report.status,
          isUnlocked: false,
          preview: {
            journeySummary: report.journeySummary,
            projectAchievements: report.projectAchievements,
            abilityGrowth: {
              initialLevel: report.abilityGrowth?.initialLevel,
              finalLevel: report.abilityGrowth?.finalLevel,
              levelUpCount: report.abilityGrowth?.levelUpCount
            }
          },
          message: '完整报告需要解锁'
        }
      })
    }

    res.json({
      success: true,
      data: report
    })

  } catch (error: any) {
    log.error('获取毕业报告失败', { error: error.message })
    res.status(500).json({ error: '获取毕业报告失败' })
  }
}

/**
 * POST /api/growth/graduation-report/unlock
 * 解锁毕业报告
 */
export const unlockGraduationReport = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId

    // 验证支付
    const report = await graduationReportService.generateGraduationReport(userId)
    if (!report) {
      return res.status(404).json({ error: '毕业报告不存在' })
    }

    const hasPaid = await paymentService.verifyPayment(userId, 'graduation_report', report._id.toString())
    if (!hasPaid) {
      return res.status(403).json({ error: '请先完成支付' })
    }

    // TODO: 实现unlockGraduationReport方法
    // const unlockedReport = await graduationReportService.unlockGraduationReport(userId)

    res.json({
      success: true,
      data: report // 暂时直接返回报告
    })

  } catch (error: any) {
    log.error('解锁毕业报告失败', { error: error.message })
    res.status(500).json({ error: error.message || '解锁毕业报告失败' })
  }
}
