import { graduationReportService } from './graduationReport.service'
import { log } from '../utils/logger'

/**
 * 职业发展建议服务
 * 基于标签推荐职业路径（核心功能已在毕业报告中实现）
 */
export class CareerAdvisoryService {

  /**
   * 获取职业发展建议
   * 复用毕业报告中的职业路径推荐
   */
  async getCareerAdvice(userId: string) {
    try {
      log.info('生成职业发展建议', { userId })

      // 复用毕业报告服务
      const report = await graduationReportService.generateGraduationReport(userId)

      return {
        userId,
        generatedAt: new Date(),
        careerPaths: report.careerPaths,
        abilityTransfer: report.abilityTransfer,
        bossTypes: report.bossTypes,
        summary: report.aiSummary.futureVision
      }
    } catch (error: any) {
      log.error('生成职业发展建议失败', { userId, error: error.message })
      throw error
    }
  }
}

export const careerAdvisoryService = new CareerAdvisoryService()
