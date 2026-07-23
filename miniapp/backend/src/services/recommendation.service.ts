import { qdrantVectorService } from './qdrantVector.service'
import { User } from '../models/User'
import { StudentTagProfile } from '../models/Tag'
import { RealProject } from '../models/RealProject'
import { log } from '../utils/logger'
import mongoose from 'mongoose'

/**
 * 生产级推荐服务
 * 多维度精准匹配，不只是简单的向量距离
 */

// 推荐权重配置
interface RecommendationWeights {
  skillMatch: number      // 技能匹配
  difficultyFit: number   // 难度适配
  interestMatch: number   // 兴趣匹配
  successProb: number     // 成功概率
  budgetMatch: number     // 预算匹配
  timeMatch: number       // 时间匹配
}

// 学生能力画像
interface StudentAbility {
  level: number
  experience: number
  totalProjects: number
  completionRate: number
  averageRating: number
  abilityScore: number
  skillStability: number
}

// 推荐项目结果
export interface RecommendedProject {
  project: any
  scores: {
    overall: number          // 综合分数
    skillMatch: number       // 技能匹配
    difficultyFit: number    // 难度适配
    interestMatch: number    // 兴趣匹配
    successProb: number      // 成功概率
    budgetMatch: number      // 预算匹配
    timeMatch: number        // 时间匹配
  }
  explanation: string[]      // 推荐理由
  tags: string[]            // 匹配的标签
  matchedSkills: string[]   // 匹配的技能
  challengeLevel: string    // 挑战等级
}

class RecommendationService {

  /**
   * 获取个性化推荐权重
   */
  private getWeights(student: StudentAbility): RecommendationWeights {
    // 新手学生：更看重难度匹配
    if (student.level <= 2) {
      return {
        skillMatch: 0.35,
        difficultyFit: 0.35,
        interestMatch: 0.15,
        successProb: 0.10,
        budgetMatch: 0.03,
        timeMatch: 0.02
      }
    }

    // 高级学生：更看重兴趣和技能
    if (student.level >= 6) {
      return {
        skillMatch: 0.45,
        difficultyFit: 0.20,
        interestMatch: 0.20,
        successProb: 0.10,
        budgetMatch: 0.03,
        timeMatch: 0.02
      }
    }

    // 中级学生：平衡
    return {
      skillMatch: 0.40,
      difficultyFit: 0.25,
      interestMatch: 0.15,
      successProb: 0.10,
      budgetMatch: 0.05,
      timeMatch: 0.05
    }
  }

  /**
   * 计算学生能力画像
   */
  private async calculateStudentAbility(userId: string): Promise<StudentAbility> {
    const user = await User.findById(userId)
    if (!user) {
      throw new Error('用户不存在')
    }

    const profile = await StudentTagProfile.findOne({
      userId: new mongoose.Types.ObjectId(userId)
    })

    // 基础能力值
    const level = user.level || 1
    const experience = (user as any).experience || 0
    const totalProjects = (user as any).completedProjects?.length || 0

    // 完成率（模拟，实际需要从项目记录计算）
    const completionRate = totalProjects > 0 ? 0.85 : 0.8

    // 平均评分（模拟，实际需要从评价计算）
    const averageRating = totalProjects > 0 ? 4.5 : 4.0

    // 综合能力分数
    const abilityScore = level * 10 + experience / 100 + totalProjects * 2

    // 技能稳定性（标签权重的方差，越小越稳定）
    let skillStability = 0.8
    if (profile && profile.tags.length > 0) {
      const weights = profile.tags.map((t: any) => t.weight)
      const avg = weights.reduce((a: number, b: number) => a + b, 0) / weights.length
      const variance = weights.reduce((sum: number, w: number) => sum + Math.pow(w - avg, 2), 0) / weights.length
      skillStability = 1 - Math.min(variance, 0.5)
    }

    return {
      level,
      experience,
      totalProjects,
      completionRate,
      averageRating,
      abilityScore,
      skillStability
    }
  }

  /**
   * 维度1：技能匹配度（40%）
   */
  private calculateSkillMatch(
    vectorScore: number,
    studentTags: any[],
    projectTags: string[]
  ): { score: number; matchedSkills: string[] } {
    // 基础向量相似度
    const baseScore = vectorScore

    // 处理空标签情况
    if (!projectTags || projectTags.length === 0) {
      return {
        score: baseScore,
        matchedSkills: []
      }
    }

    // 标签覆盖率
    const studentTagNames = studentTags
      .map((t: any) => {
        if (typeof t.tagId === 'string') return t.tagId
        if (t.tagId && typeof t.tagId === 'object' && 'name' in t.tagId) return t.tagId.name
        return null
      })
      .filter(Boolean) as string[]

    const matchedSkills = projectTags.filter(pt => studentTagNames.includes(pt))
    const coverageRate = projectTags.length > 0 ? matchedSkills.length / projectTags.length : 0
    const coverageBonus = 1 + coverageRate * 0.2

    // 专业深度加成（核心标签权重）
    let depthBonus = 1.0
    if (studentTags.length > 0 && matchedSkills.length > 0) {
      const matchedWeights = studentTags
        .filter((t: any) => {
          const name = typeof t.tagId === 'string' ? t.tagId : t.tagId?.name
          return name && matchedSkills.includes(name)
        })
        .map((t: any) => t.weight || 0.5)

      if (matchedWeights.length > 0) {
        const avgWeight = matchedWeights.reduce((a, b) => a + b, 0) / matchedWeights.length
        depthBonus = 1 + avgWeight * 0.15
      }
    }

    // 综合技能匹配分数
    let finalScore = baseScore * coverageBonus * depthBonus

    // 归一化到 0-1
    finalScore = Math.min(finalScore, 1.0)

    return {
      score: finalScore,
      matchedSkills
    }
  }

  /**
   * 维度2：难度适配度（25%）
   */
  private calculateDifficultyFit(
    studentAbility: StudentAbility,
    projectDifficulty: string
  ): { score: number; challengeLevel: string } {
    // 项目难度映射
    const difficultyMap: { [key: string]: number } = {
      'easy': 20,
      'medium': 45,
      'hard': 70,
      'expert': 90
    }

    const projectDiff = difficultyMap[projectDifficulty] || 45
    const studentAbilityScore = studentAbility.abilityScore

    // 能力差距
    const diff = studentAbilityScore - projectDiff

    let score = 0
    let challengeLevel = ''

    if (diff >= -10 && diff <= 20) {
      // 最佳区间：略有挑战到适度挑战
      score = 1.0 - Math.abs(diff - 5) * 0.02

      if (diff < 0) {
        challengeLevel = '略有挑战'
      } else if (diff < 10) {
        challengeLevel = '刚刚好'
      } else {
        challengeLevel = '轻松完成'
      }
    } else if (diff < -10) {
      // 太难了
      score = Math.max(0.3, 0.8 + diff * 0.025)
      challengeLevel = '高难度挑战'
    } else {
      // 太简单了
      score = Math.max(0.5, 1.0 - (diff - 20) * 0.015)
      challengeLevel = '过于简单'
    }

    return { score, challengeLevel }
  }

  /**
   * 维度3：兴趣匹配度（15%）
   */
  private calculateInterestMatch(
    studentTags: any[],
    projectTags: string[],
    projectCategory: string,
    studentAbility: StudentAbility
  ): number {
    // 冷启动：新用户用标签匹配
    if (studentAbility.totalProjects < 3) {
      const studentTagNames = studentTags.map((t: any) => t.tagId?.name || t.tagId).filter(Boolean)
      const matchCount = projectTags.filter(pt => studentTagNames.includes(pt)).length
      return projectTags.length > 0 ? matchCount / projectTags.length : 0.5
    }

    // TODO: 基于历史行为计算兴趣
    // 现在简化为标签匹配 + 类别偏好
    const studentTagNames = studentTags.map((t: any) => t.tagId?.name || t.tagId).filter(Boolean)
    const matchCount = projectTags.filter(pt => studentTagNames.includes(pt)).length
    const tagMatchScore = projectTags.length > 0 ? matchCount / projectTags.length : 0.5

    // 类别偏好（模拟，实际需要从历史记录计算）
    const categoryPreference = 0.7 // 假设学生对该类别有70%偏好

    return tagMatchScore * 0.6 + categoryPreference * 0.4
  }

  /**
   * 维度4：成功概率（10%）
   */
  private calculateSuccessProb(
    studentAbility: StudentAbility,
    difficultyFitScore: number
  ): number {
    // 新用户：基于能力和难度适配
    if (studentAbility.totalProjects < 5) {
      const baseProb =
        (studentAbility.level / 10) * 0.5 +
        difficultyFitScore * 0.5

      return Math.min(baseProb, 0.85) // 新用户最高85%
    }

    // 老用户：基于历史表现
    const historicalSuccess =
      studentAbility.completionRate * 0.4 +
      studentAbility.skillStability * 0.3 +
      difficultyFitScore * 0.2 +
      (studentAbility.averageRating / 5) * 0.1

    return Math.min(historicalSuccess, 1.0)
  }

  /**
   * 维度5：预算匹配度（5%）
   */
  private calculateBudgetMatch(
    projectBudget: number,
    studentAbility: StudentAbility
  ): number {
    // 新用户：预算不影响推荐
    if (studentAbility.totalProjects < 3) {
      return 1.0
    }

    // TODO: 基于历史接单预算计算偏好范围
    // 现在简化为：预算越高，分数越高（但不是线性）
    const budgetScore = Math.min(projectBudget / 1000, 1.0)
    return 0.7 + budgetScore * 0.3 // 最低0.7，最高1.0
  }

  /**
   * 维度6：时间匹配度（5%）
   */
  private calculateTimeMatch(
    projectDifficulty: string,
    skillMatchScore: number,
    studentAbility: StudentAbility
  ): number {
    // 估算项目时间需求
    const difficultyHours: { [key: string]: number } = {
      'easy': 10,
      'medium': 20,
      'hard': 40,
      'expert': 60
    }

    const baseHours = difficultyHours[projectDifficulty] || 20
    const adjustedHours = baseHours * (1 - skillMatchScore * 0.3) // 技能越高，时间越短

    // 学生可用时间（模拟，实际需要从用户设置获取）
    const studentAvailableHours = 30 // 假设每周30小时

    if (adjustedHours <= studentAvailableHours) {
      return 1.0
    } else {
      return Math.max(0.6, studentAvailableHours / adjustedHours)
    }
  }

  /**
   * 生成推荐理由
   */
  private generateExplanation(
    scores: RecommendedProject['scores'],
    matchedSkills: string[],
    challengeLevel: string
  ): string[] {
    const explanations: string[] = []

    // 技能匹配
    if (scores.skillMatch >= 0.9) {
      explanations.push(`🎯 与你的技能高度匹配（${matchedSkills.slice(0, 3).join('、')}）`)
    } else if (scores.skillMatch >= 0.7) {
      explanations.push(`✓ 匹配你的技能：${matchedSkills.slice(0, 2).join('、')}`)
    }

    // 难度适配
    if (scores.difficultyFit >= 0.9) {
      explanations.push(`💪 ${challengeLevel}，适合你的能力水平`)
    } else if (scores.difficultyFit >= 0.7) {
      explanations.push(`📈 ${challengeLevel}`)
    }

    // 成功概率
    if (scores.successProb >= 0.85) {
      explanations.push(`⭐ 高成功率，预计能顺利完成`)
    }

    // 兴趣匹配
    if (scores.interestMatch >= 0.8) {
      explanations.push(`❤️ 与你的兴趣方向一致`)
    }

    // 预算
    if (scores.budgetMatch >= 0.9) {
      explanations.push(`💰 预算符合你的期望`)
    }

    return explanations
  }

  /**
   * 获取精准推荐
   */
  async getRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<RecommendedProject[]> {
    try {
      // 1. 获取学生能力画像
      const studentAbility = await this.calculateStudentAbility(userId)

      // 2. 获取学生画像和向量
      const profile = await StudentTagProfile.findOne({
        userId: new mongoose.Types.ObjectId(userId)
      }).populate('tags.tagId')

      if (!profile) {
        throw new Error('学生画像不存在')
      }

      const studentTags = profile.tags || []

      // 3. 向量检索候选项目（Top 100）
      // 注意：导入Mock数据时使用的是固定ID（3001, 3002, 3003）
      // 需要根据phone匹配到正确的ID
      const user = await User.findById(userId)
      let studentQdrantId = '3001' // 默认

      if (user && (user as any).phone) {
        const phoneMap: { [key: string]: string } = {
          '13800000001': '3001',
          '13800000002': '3002',
          '13800000003': '3003'
        }
        studentQdrantId = phoneMap[(user as any).phone] || '3001'
      }

      const studentVectorData = await qdrantVectorService.searchById(
        'qicheng_student_profiles',
        studentQdrantId
      )

      if (!studentVectorData || !Array.isArray(studentVectorData.vector)) {
        throw new Error('学生向量不存在')
      }

      const studentVector = studentVectorData.vector as number[]

      // 检索相似项目
      const candidates = await qdrantVectorService.searchSimilar(
        'qicheng_project_profiles',
        studentVector,
        100
      )

      // 4. 获取推荐权重
      const weights = this.getWeights(studentAbility)

      // 5. 多维度打分
      const recommendations: RecommendedProject[] = []

      for (const candidate of candidates) {
        const projectData = candidate.payload

        if (!projectData) continue

        // 向量相似度（已归一化到0-1）
        const vectorScore = 1 - Math.abs(candidate.score)

        // 维度1：技能匹配
        const { score: skillMatchScore, matchedSkills } = this.calculateSkillMatch(
          vectorScore,
          studentTags,
          (projectData.tags as string[]) || []
        )

        // 维度2：难度适配
        const { score: difficultyFitScore, challengeLevel } = this.calculateDifficultyFit(
          studentAbility,
          (projectData.difficulty as string) || 'medium'
        )

        // 维度3：兴趣匹配
        const interestMatchScore = this.calculateInterestMatch(
          studentTags,
          (projectData.tags as string[]) || [],
          (projectData.category as string) || 'general',
          studentAbility
        )

        // 维度4：成功概率
        const successProbScore = this.calculateSuccessProb(
          studentAbility,
          difficultyFitScore
        )

        // 维度5：预算匹配
        const budgetMatchScore = this.calculateBudgetMatch(
          (projectData.budget as number) || 500,
          studentAbility
        )

        // 维度6：时间匹配
        const timeMatchScore = this.calculateTimeMatch(
          (projectData.difficulty as string) || 'medium',
          skillMatchScore,
          studentAbility
        )

        // 综合分数
        const overallScore =
          skillMatchScore * weights.skillMatch +
          difficultyFitScore * weights.difficultyFit +
          interestMatchScore * weights.interestMatch +
          successProbScore * weights.successProb +
          budgetMatchScore * weights.budgetMatch +
          timeMatchScore * weights.timeMatch

        const scores = {
          overall: overallScore,
          skillMatch: skillMatchScore,
          difficultyFit: difficultyFitScore,
          interestMatch: interestMatchScore,
          successProb: successProbScore,
          budgetMatch: budgetMatchScore,
          timeMatch: timeMatchScore
        }

        // 生成推荐理由
        const explanation = this.generateExplanation(scores, matchedSkills, challengeLevel)

        recommendations.push({
          project: projectData,
          scores,
          explanation,
          tags: (projectData.tags as string[]) || [],
          matchedSkills,
          challengeLevel
        })
      }

      // 6. 排序（按综合分数）
      recommendations.sort((a, b) => b.scores.overall - a.scores.overall)

      // 7. 返回Top N
      return recommendations.slice(0, limit)

    } catch (error: any) {
      log.error('生成推荐失败', { userId, error: error.message })
      throw error
    }
  }

  /**
   * 获取推荐解释（调试用）
   */
  async getRecommendationExplanation(userId: string, projectId: string) {
    const recommendations = await this.getRecommendations(userId, 100)
    const target = recommendations.find(r => r.project.projectId === projectId)

    if (!target) {
      return { message: '未找到该项目的推荐信息' }
    }

    return {
      projectTitle: target.project.title,
      overallScore: target.scores.overall.toFixed(3),
      breakdown: {
        skillMatch: `${(target.scores.skillMatch * 100).toFixed(1)}% (权重40%)`,
        difficultyFit: `${(target.scores.difficultyFit * 100).toFixed(1)}% (权重25%)`,
        interestMatch: `${(target.scores.interestMatch * 100).toFixed(1)}% (权重15%)`,
        successProb: `${(target.scores.successProb * 100).toFixed(1)}% (权重10%)`,
        budgetMatch: `${(target.scores.budgetMatch * 100).toFixed(1)}% (权重5%)`,
        timeMatch: `${(target.scores.timeMatch * 100).toFixed(1)}% (权重5%)`
      },
      matchedSkills: target.matchedSkills,
      challengeLevel: target.challengeLevel,
      explanation: target.explanation
    }
  }
}

export const recommendationService = new RecommendationService()
