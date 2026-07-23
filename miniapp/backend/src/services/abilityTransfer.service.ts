/**
 * 能力迁移分析服务
 * 分析学生能力可以迁移到哪些领域（核心功能已在毕业报告中实现）
 */
import { graduationReportService } from './graduationReport.service'
import { log } from '../utils/logger'

export class AbilityTransferService {

  /**
   * 获取能力迁移分析
   * 复用毕业报告中的能力迁移功能
   */
  async getAbilityTransferAnalysis(userId: string) {
    try {
      log.info('生成能力迁移分析', { userId })

      // 复用毕业报告服务
      const report = await graduationReportService.generateGraduationReport(userId)

      return {
        userId,
        generatedAt: new Date(),
        abilityTransfer: report.abilityTransfer,
        coreAbilities: report.coreAbilities,
        careerPaths: report.careerPaths
      }
    } catch (error: any) {
      log.error('生成能力迁移分析失败', { userId, error: error.message })
      throw error
    }
  }
}

export const abilityTransferService = new AbilityTransferService()
