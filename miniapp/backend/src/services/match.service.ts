import { RealProject } from '../models/RealProject'
import { User } from '../models/User'
import { OPCResult } from '../models/OPCResult'
import { log } from '../utils/logger'
import mongoose from 'mongoose'

/**
 * 项目匹配服务
 * 基于OPC人格标签的智能匹配
 */
export class MatchService {

  /**
   * 智能项目匹配
   * 返回推荐项目列表，包含匹配理由和冒险标记
   */
  async matchProjects(userId: string, limit: number = 20) {
    try {
      log.info('开始智能项目匹配', { userId })

      // 1. 获取用户信息和OPC测评结果
      const user = await User.findById(userId)
      if (!user) {
        throw new Error('用户不存在')
      }

      const opcResult = await OPCResult.findOne({
        userId: new mongoose.Types.ObjectId(userId)
      }).sort({ completedAt: -1 })

      // 2. 获取所有可接单的项目
      const projects = await RealProject.find({
        status: 'available',
      }).limit(100)

      if (projects.length === 0) {
        return []
      }

      // 3. 计算每个项目的匹配分数
      const matches = []
      for (const project of projects) {
        const score = this.calculateMatchScore(user, opcResult, project)
        const isStretch = this.isStretchProject(user, project)
        const reason = this.generateMatchReason(
          user.personalityTag || opcResult?.result.personalityTag,
          project,
          isStretch
        )

        matches.push({
          project,
          score,
          isStretch,
          reason
        })
      }

      // 4. 排序：按匹配分数排序
      matches.sort((a, b) => b.score - a.score)

      // 5. 保留20%冒险项目
      const stretchCount = Math.floor(limit * 0.2)
      const regular = matches.filter(m => !m.isStretch).slice(0, limit - stretchCount)
      const stretch = matches.filter(m => m.isStretch).slice(0, stretchCount)

      // 6. 合并结果
      const result = [...regular, ...stretch]
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)

      log.info('项目匹配完成', {
        userId,
        totalProjects: projects.length,
        matchedCount: result.length,
        stretchCount: result.filter(r => r.isStretch).length
      })

      return result
    } catch (error: any) {
      log.error('项目匹配失败', { userId, error: error.message })
      throw error
    }
  }

  /**
   * 计算项目匹配分数
   */
  private calculateMatchScore(
    user: any,
    opcResult: any,
    project: any
  ): number {
    let score = 0 // 从0开始计算

    // 1. 难度匹配（40分）
    const userLevel = user.level || 1
    const projectDifficultyScore = this.getDifficultyScore(project.difficulty)
    const userLevelScore = userLevel // 用户等级1-6

    const difficultyGap = Math.abs(projectDifficultyScore - userLevelScore)

    if (difficultyGap === 0) {
      score += 40 // 完美匹配
    } else if (difficultyGap === 1) {
      score += 30 // 接近匹配
    } else if (difficultyGap === 2) {
      score += 20 // 有挑战
    } else if (difficultyGap === 3) {
      score += 10 // 较大差距
    } else {
      score += 5 // 差距很大
    }

    // 2. OPC人格标签匹配（30分）
    const personalityTag = user.personalityTag || opcResult?.result.personalityTag
    const projectPersonalities = this.getProjectSuitablePersonalities(project)

    if (personalityTag && projectPersonalities.length > 0) {
      if (projectPersonalities.includes(personalityTag)) {
        score += 30 // 人格匹配
      } else {
        // 检查是否有关联性（某些人格标签互相匹配）
        const relatedPersonalities = this.getRelatedPersonalities(personalityTag)
        const hasRelated = projectPersonalities.some(p => relatedPersonalities.includes(p))
        if (hasRelated) {
          score += 15 // 有关联性
        }
      }
    }

    // 3. 能力标签匹配（20分）
    if (opcResult?.result?.dimensionScores) {
      const matchingScore = this.calculateAbilityMatch(
        opcResult.result.dimensionScores,
        project.requiredAbilities
      )
      score += matchingScore
    }

    // 4. 完成项目经验加分（10分）
    const completedProjects = user.totalProjects || 0
    if (completedProjects >= 20) {
      score += 10 // 经验丰富
    } else if (completedProjects >= 10) {
      score += 7
    } else if (completedProjects >= 5) {
      score += 5
    } else if (completedProjects >= 1) {
      score += 3
    }

    // 5. 随机扰动（避免每次结果完全一样）
    score += Math.random() * 5

    return Math.min(100, Math.round(score))
  }

  /**
   * 将难度字符串映射到数字
   */
  private getDifficultyScore(difficulty: string): number {
    const difficultyMap: Record<string, number> = {
      'easy': 1,
      'medium': 3,
      'hard': 5,
      'expert': 6
    }
    return difficultyMap[difficulty] || 3
  }

  /**
   * 获取项目适合的人格标签
   */
  private getProjectSuitablePersonalities(project: any): string[] {
    // 基于项目类别推断适合的人格标签
    const categoryMap: Record<string, string[]> = {
      // 内容运营类
      '内容运营': ['创意执行者', '混合型'],
      '内容创作': ['视觉叙事者', '创意执行者'],
      '账号运营': ['系统构建者', '创意执行者'],
      '内容设计': ['视觉叙事者', '设计师思维'],
      '直播运营': ['表达引领者', '创意执行者'],

      // 技术开发类
      '前端开发': ['系统构建者', '逻辑拆解者'],
      '小程序开发': ['系统构建者', '逻辑拆解者'],
      '数据采集': ['逻辑拆解者', '系统构建者'],
      '移动开发': ['系统构建者', '逻辑拆解者'],
      'Web开发': ['系统构建者', '逻辑拆解者'],

      // 设计类
      '品牌设计': ['视觉叙事者', '设计师思维'],
      'UI设计': ['视觉叙事者', '系统构建者'],
      '平面设计': ['视觉叙事者', '创意执行者'],
      '动画制作': ['视觉叙事者', '创意执行者'],
      '摄影修图': ['视觉叙事者', '细节精进者']
    }

    const personalities = categoryMap[project.category] || ['混合型']

    // 如果项目有明确的suitablePersonality字段，优先使用
    if (project.suitablePersonality && Array.isArray(project.suitablePersonality)) {
      return project.suitablePersonality
    }

    return personalities
  }

  /**
   * 获取相关联的人格标签
   */
  private getRelatedPersonalities(personalityTag: string): string[] {
    const relationsMap: Record<string, string[]> = {
      '视觉叙事者': ['设计师思维', '创意执行者'],
      '系统构建者': ['逻辑拆解者', '架构思维'],
      '创意执行者': ['视觉叙事者', '表达引领者'],
      '逻辑拆解者': ['系统构建者', '分析型'],
      '表达引领者': ['创意执行者', '沟通者'],
      '设计师思维': ['视觉叙事者', '创意执行者'],
      '混合型': [] // 混合型和所有类型都有一定关联
    }
    return relationsMap[personalityTag] || []
  }

  /**
   * 计算能力标签匹配度
   */
  private calculateAbilityMatch(
    dimensionScores: any[],
    requiredAbilities: string[]
  ): number {
    if (!requiredAbilities || requiredAbilities.length === 0) {
      return 10 // 没有明确要求，给基础分
    }

    // 能力关键词映射到OPC维度
    const abilityToDimensionMap: Record<string, string[]> = {
      '视觉': ['visual'],
      '设计': ['visual', 'creative'],
      '创意': ['creative'],
      '系统': ['systematic'],
      '逻辑': ['logical'],
      '分析': ['logical', 'systematic'],
      '执行': ['execution'],
      '沟通': ['communication'],
      '学习': ['learning']
    }

    let matchCount = 0
    let totalScore = 0

    for (const ability of requiredAbilities) {
      // 查找相关维度
      for (const [keyword, dimensions] of Object.entries(abilityToDimensionMap)) {
        if (ability.includes(keyword)) {
          // 检查用户在这些维度的分数
          for (const dimension of dimensions) {
            const dimScore = dimensionScores.find(d => d.dimension === dimension)
            if (dimScore && dimScore.score >= 60) {
              matchCount++
              totalScore += dimScore.score
            }
          }
        }
      }
    }

    // 根据匹配数量给分
    if (matchCount >= 3) {
      return 20 // 多个能力匹配
    } else if (matchCount >= 2) {
      return 15
    } else if (matchCount >= 1) {
      return 10
    }

    return 5 // 基础分
  }

  /**
   * 判断是否为冒险项目
   * 冒险项目：比用户当前等级高1-2个难度级别
   */
  private isStretchProject(user: any, project: any): boolean {
    const userLevel = user.level || 1
    const projectDifficultyScore = this.getDifficultyScore(project.difficulty)

    // 冒险项目：项目难度略高于用户等级（1-2级差距）
    const gap = projectDifficultyScore - userLevel
    return gap >= 1 && gap <= 2
  }

  /**
   * 生成匹配理由
   * 基于OPC人格标签生成个性化文案
   */
  private generateMatchReason(
    personalityTag: string | undefined,
    project: any,
    isStretch: boolean
  ): string {
    // 如果是冒险项目，添加冒险标记
    const stretchPrefix = isStretch ? '🔥 冒险项目 - ' : ''

    // 如果没有人格标签，返回通用理由
    if (!personalityTag) {
      return stretchPrefix + '这个项目可能让你发现自己'
    }

    // 基于人格标签的个性化理由
    const reasonMap: Record<string, string> = {
      '视觉叙事者': '这个项目需要强大的视觉表达能力，正好适合你。你擅长用图像讲故事，这里有很大的发挥空间。',
      '系统构建者': '你习惯先搭框架再填细节，这个项目正好需要这种工作方式。系统化思维在这里会很有优势。',
      '创意执行者': '这个项目需要创意+落地能力的组合，很适合你。既能发挥创意，又能快速实现，正是你的强项。',
      '逻辑拆解者': '项目需要把复杂问题拆解成可执行步骤，这是你的强项。你的逻辑思维能力在这里会派上大用场。',
      '稳健交付者': '这个项目看重按时交付和质量稳定，你可以胜任。你的稳定性和可靠性是最大的优势。',
      '探索整合者': '项目需要探索新领域并整合资源，正好匹配你的风格。你的学习能力和整合能力会在这里闪光。',
      '混合型': '这个项目需要多方面的能力，适合你的全面风格。你能在不同角色间灵活切换。'
    }

    const baseReason = reasonMap[personalityTag] || '这个项目可能让你发现自己'

    return stretchPrefix + baseReason
  }

  /**
   * 获取项目详情（包含匹配理由）
   */
  async getProjectWithMatchReason(userId: string, projectId: string) {
    try {
      const user = await User.findById(userId)
      const project = await RealProject.findById(projectId)

      if (!user || !project) {
        throw new Error('用户或项目不存在')
      }

      const opcResult = await OPCResult.findOne({
        userId: new mongoose.Types.ObjectId(userId)
      }).sort({ completedAt: -1 })

      const score = this.calculateMatchScore(user, opcResult, project)
      const isStretch = this.isStretchProject(user, project)
      const reason = this.generateMatchReason(
        user.personalityTag || opcResult?.result.personalityTag,
        project,
        isStretch
      )

      return {
        project,
        matchInfo: {
          score,
          isStretch,
          reason
        }
      }
    } catch (error: any) {
      log.error('获取项目匹配信息失败', { userId, projectId, error: error.message })
      throw error
    }
  }
}

export const matchService = new MatchService()
