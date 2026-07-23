/**
 * OPC整合服务
 * 将OPC 9维度整合到推荐算法中
 */

import { OPCResult } from '../models/OPCResult'
import mongoose from 'mongoose'

// OPC 9个维度
export interface OPCDimensions {
  visual: number          // 视觉表达能力 0-100
  systematic: number      // 系统化思维 0-100
  creative: number        // 创意创新 0-100
  logical: number         // 逻辑分析 0-100
  stable: number          // 稳定执行 0-100
  exploratory: number     // 探索学习 0-100
  execution: number       // 执行落地 0-100
  communication: number   // 沟通协作 0-100
  learning: number        // 学习适应 0-100
}

// 项目类型
export type ProjectType =
  | 'design'           // 设计类
  | 'development'      // 开发类
  | 'product'          // 产品类
  | 'creative'         // 创意类
  | 'research'         // 研究类
  | 'urgent'           // 紧急项目
  | 'team'             // 团队协作
  | 'exploration'      // 探索性

class OPCIntegrationService {

  /**
   * 获取学生的OPC维度分数
   */
  async getStudentOPCDimensions(userId: string): Promise<OPCDimensions | null> {
    try {
      const opcResult = await OPCResult.findOne({
        userId: new mongoose.Types.ObjectId(userId)
      }).sort({ completedAt: -1 })

      if (!opcResult || !opcResult.result?.dimensionScores) {
        return null
      }

      // 转换为标准化格式
      const dimensions: OPCDimensions = {
        visual: 0,
        systematic: 0,
        creative: 0,
        logical: 0,
        stable: 0,
        exploratory: 0,
        execution: 0,
        communication: 0,
        learning: 0
      }

      opcResult.result.dimensionScores.forEach((d: any) => {
        const dimName = d.dimension as keyof OPCDimensions
        if (dimName in dimensions) {
          dimensions[dimName] = d.score
        }
      })

      return dimensions

    } catch (error: any) {
      console.error('获取OPC维度失败:', error.message)
      return null
    }
  }

  /**
   * 计算OPC稳定性加成（影响难度适配度）
   * 范围：1.0 - 1.2（最多提升20%）
   */
  calculateStabilityBonus(opc: OPCDimensions): number {
    const stabilityScore =
      opc.stable * 0.3 +
      opc.execution * 0.3 +
      opc.systematic * 0.2

    const bonus = 1 + (stabilityScore / 100) * 0.2

    return Math.min(Math.max(bonus, 1.0), 1.2)
  }

  /**
   * 计算OPC可靠性系数（影响成功概率）
   * 范围：0.8 - 1.2（最多提升40%）
   */
  calculateReliabilityCoefficient(opc: OPCDimensions): number {
    const reliabilityScore =
      opc.stable * 0.4 +
      opc.execution * 0.3 +
      opc.communication * 0.3

    const coefficient = 0.8 + (reliabilityScore / 100) * 0.4

    return Math.min(Math.max(coefficient, 0.8), 1.2)
  }

  /**
   * 计算项目类型适配度
   * 根据项目类型和OPC维度计算适配分数
   */
  calculateProjectTypeFit(
    opc: OPCDimensions,
    projectType: ProjectType
  ): number {
    const typeWeights: Record<ProjectType, Partial<Record<keyof OPCDimensions, number>>> = {
      design: {
        visual: 0.5,
        creative: 0.3,
        execution: 0.2
      },
      development: {
        logical: 0.4,
        systematic: 0.3,
        execution: 0.3
      },
      product: {
        systematic: 0.3,
        logical: 0.3,
        communication: 0.2,
        creative: 0.2
      },
      creative: {
        creative: 0.5,
        exploratory: 0.3,
        visual: 0.2
      },
      research: {
        logical: 0.4,
        exploratory: 0.3,
        learning: 0.3
      },
      urgent: {
        execution: 0.5,
        stable: 0.3,
        systematic: 0.2
      },
      team: {
        communication: 0.5,
        systematic: 0.3,
        stable: 0.2
      },
      exploration: {
        learning: 0.4,
        exploratory: 0.4,
        creative: 0.2
      }
    }

    const weights = typeWeights[projectType]
    if (!weights) return 0.5 // 默认50%

    let score = 0
    for (const [dim, weight] of Object.entries(weights)) {
      const dimKey = dim as keyof OPCDimensions
      score += (opc[dimKey] / 100) * weight
    }

    return Math.min(Math.max(score, 0), 1.0)
  }

  /**
   * 推断项目类型
   * 根据项目标签和类别推断类型
   */
  inferProjectType(
    category: string,
    tags: string[],
    difficulty: string,
    hasDeadline: boolean
  ): ProjectType {
    // 紧急项目判断
    if (hasDeadline) {
      return 'urgent'
    }

    // 根据类别判断
    if (category === 'design' || category === '设计') {
      // 判断是设计还是创意
      const creativeKeywords = ['创意', '品牌', 'Logo', '海报']
      if (tags.some(t => creativeKeywords.some(k => t.includes(k)))) {
        return 'creative'
      }
      return 'design'
    }

    if (category === 'development' || category === '开发') {
      return 'development'
    }

    if (category === 'product' || category === '产品') {
      return 'product'
    }

    // 根据标签判断
    const tagString = tags.join(',')

    if (tagString.includes('团队') || tagString.includes('协作')) {
      return 'team'
    }

    if (tagString.includes('研究') || tagString.includes('调研') || tagString.includes('分析')) {
      return 'research'
    }

    if (tagString.includes('探索') || tagString.includes('新技术') || tagString.includes('学习')) {
      return 'exploration'
    }

    // 默认返回开发类
    return 'development'
  }

  /**
   * 根据OPC推荐初始标签（冷启动）
   */
  recommendInitialTags(opc: OPCDimensions): string[] {
    const tags: string[] = []

    // 视觉能力高
    if (opc.visual >= 80) {
      tags.push('平面设计', 'UI设计', '视觉叙事', '配色能力')
    } else if (opc.visual >= 60) {
      tags.push('UI设计', '视觉设计')
    }

    // 系统化思维高
    if (opc.systematic >= 80 && opc.logical >= 75) {
      tags.push('系统架构', '后端开发', '数据库设计', '算法能力')
    } else if (opc.systematic >= 60) {
      tags.push('系统思维', '逻辑分析')
    }

    // 创意能力高
    if (opc.creative >= 80) {
      tags.push('创意设计', '品牌设计', '内容创作', '文案撰写')
    } else if (opc.creative >= 60) {
      tags.push('创意思维', '内容创作')
    }

    // 执行稳定性高
    if (opc.execution >= 85 && opc.stable >= 80) {
      tags.push('项目管理', '执行力', '按时交付', '质量保证')
    } else if (opc.execution >= 60) {
      tags.push('执行力', '任务管理')
    }

    // 沟通能力高
    if (opc.communication >= 80) {
      tags.push('团队协作', '沟通能力', '用户访谈', '需求分析')
    } else if (opc.communication >= 60) {
      tags.push('团队协作', '沟通协调')
    }

    // 探索学习能力高
    if (opc.exploratory >= 80 && opc.learning >= 75) {
      tags.push('快速学习', '探索精神', '跨领域整合', '新技术学习')
    } else if (opc.learning >= 60) {
      tags.push('学习能力', '适应能力')
    }

    return tags
  }

  /**
   * 生成基于OPC的推荐理由
   */
  generateOPCReasons(
    opc: OPCDimensions,
    projectType: ProjectType,
    projectTags: string[]
  ): string[] {
    const reasons: string[] = []

    // 视觉能力匹配
    if (opc.visual >= 80 && (projectType === 'design' || projectType === 'creative')) {
      reasons.push('🎨 你的视觉表达能力很强，适合这个项目')
    }

    // 稳定性和执行力
    if (opc.stable >= 85 && opc.execution >= 80) {
      reasons.push('✓ 你的执行稳定性高，预计能按时完成')
    }

    // 创意能力
    if (opc.creative >= 85 && projectType === 'creative') {
      reasons.push('💡 你的创意思维活跃，能为项目带来新想法')
    }

    // 沟通协作
    if (opc.communication >= 80 && projectType === 'team') {
      reasons.push('🤝 你的沟通能力强，适合团队项目')
    }

    // 学习探索
    if (opc.learning >= 80 && opc.exploratory >= 75 && projectType === 'exploration') {
      reasons.push('📚 你的学习能力强，能快速掌握新知识')
    }

    // 逻辑系统
    if (opc.logical >= 80 && opc.systematic >= 75 && projectType === 'development') {
      reasons.push('🧠 你的逻辑思维和系统化能力强，适合这个开发项目')
    }

    // 紧急项目
    if (opc.execution >= 85 && projectType === 'urgent') {
      reasons.push('⚡ 你的执行力强，能应对紧急项目')
    }

    return reasons
  }
}

export const opcIntegrationService = new OPCIntegrationService()
