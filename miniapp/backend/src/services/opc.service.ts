import { OPCQuestion } from '../models/OPCQuestion'
import { OPCResult } from '../models/OPCResult'
import { User } from '../models/User'
import { log } from '../utils/logger'
import mongoose from 'mongoose'

/**
 * OPC测评服务
 * 实现36题测评、7种人格标签生成、项目匹配
 */
export class OPCService {

  /**
   * 获取所有测试题
   */
  async getQuestions() {
    const questions = await OPCQuestion.find().sort({ questionId: 1 })
    return questions
  }

  /**
   * 计算各维度分数
   */
  private calculateDimensionScores(answers: { questionId: number; answer: string; score: number }[]) {
    const dimensionScores: Record<string, number[]> = {
      visual: [],
      systematic: [],
      creative: [],
      logical: [],
      stable: [],
      exploratory: [],
      execution: [],
      communication: [],
      learning: []
    }

    // 按维度分组分数
    for (const answer of answers) {
      // 这里需要从题库中获取题目所属维度
      // 暂时使用简化逻辑，实际应该查询题库
      const dimension = this.getQuestionDimension(answer.questionId)
      if (dimension && dimensionScores[dimension]) {
        dimensionScores[dimension].push(answer.score)
      }
    }

    // 计算每个维度的平均分
    const result: { dimension: string; score: number }[] = []
    for (const [dimension, scores] of Object.entries(dimensionScores)) {
      if (scores.length > 0) {
        const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length
        result.push({ dimension, score: Math.round(avgScore) })
      }
    }

    return result
  }

  /**
   * 获取题目所属维度（简化版）
   * 实际应该从数据库查询
   */
  private getQuestionDimension(questionId: number): string {
    // 题目1-4: visual
    if (questionId <= 4) return 'visual'
    // 题目5-8: systematic
    if (questionId <= 8) return 'systematic'
    // 题目9-12: creative
    if (questionId <= 12) return 'creative'
    // 题目13-16: logical
    if (questionId <= 16) return 'logical'
    // 题目17-20: stable
    if (questionId <= 20) return 'stable'
    // 题目21-24: exploratory
    if (questionId <= 24) return 'exploratory'
    // 题目25-28: execution
    if (questionId <= 28) return 'execution'
    // 题目29-32: communication
    if (questionId <= 32) return 'communication'
    // 题目33-36: learning
    if (questionId <= 36) return 'learning'
    return 'mixed'
  }

  /**
   * 生成人格标签（7种）
   * 基于维度分数的算法
   */
  private calculatePersonalityTag(dimensionScores: { dimension: string; score: number }[]): string {
    const scores: Record<string, number> = {}
    for (const item of dimensionScores) {
      scores[item.dimension] = item.score
    }

    const visual = scores.visual || 0
    const systematic = scores.systematic || 0
    const creative = scores.creative || 0
    const logical = scores.logical || 0
    const stable = scores.stable || 0
    const exploratory = scores.exploratory || 0
    const execution = scores.execution || 0

    // 视觉叙事者：视觉表达 > 80, 创意思维 > 70
    if (visual > 80 && creative > 70) {
      return '视觉叙事者'
    }

    // 系统构建者：逻辑分析 > 80, 系统化 > 75
    if (logical > 80 && systematic > 75) {
      return '系统构建者'
    }

    // 创意执行者：创意思维 > 75, 执行力 > 70
    if (creative > 75 && execution > 70) {
      return '创意执行者'
    }

    // 逻辑拆解者：逻辑分析 > 80, 问题解决 > 75
    if (logical > 80 && execution > 75) {
      return '逻辑拆解者'
    }

    // 稳健交付者：稳定性 > 80, 执行力 > 75
    if (stable > 80 && execution > 75) {
      return '稳健交付者'
    }

    // 探索整合者：探索性 > 75, 学习力 > 70
    if (exploratory > 75 && scores.learning > 70) {
      return '探索整合者'
    }

    // 混合型：没有明显优势维度
    return '混合型'
  }

  /**
   * 生成优势和建议
   */
  private generateStrengthsAndSuggestions(
    personalityTag: string,
    dimensionScores: { dimension: string; score: number }[]
  ) {
    const strengthsMap: Record<string, string[]> = {
      '视觉叙事者': ['视觉表达能力强', '擅长用图像传达信息', '创意思维活跃'],
      '系统构建者': ['逻辑思维清晰', '擅长搭建框架', '系统化思考能力强'],
      '创意执行者': ['创意丰富', '执行力强', '能将想法落地'],
      '逻辑拆解者': ['逻辑分析能力强', '擅长拆解复杂问题', '问题解决能力突出'],
      '稳健交付者': ['执行稳定', '按时交付', '质量可靠'],
      '探索整合者': ['探索精神强', '学习能力快', '善于整合资源'],
      '混合型': ['能力均衡', '适应性强', '全面发展']
    }

    const suggestionsMap: Record<string, string[]> = {
      '视觉叙事者': ['可以尝试更多视觉设计项目', '练习用图像讲故事', '关注视觉趋势'],
      '系统构建者': ['适合架构设计类项目', '可以深入学习系统设计', '尝试带领团队搭建框架'],
      '创意执行者': ['适合创意+落地的综合项目', '保持创意的同时提升执行效率', '尝试项目管理角色'],
      '逻辑拆解者': ['适合复杂问题解决类项目', '可以深入学习算法和数据结构', '尝试技术难题攻关'],
      '稳健交付者': ['适合需要稳定交付的项目', '可以尝试更高难度的挑战', '保持质量的同时提升速度'],
      '探索整合者': ['适合新领域探索类项目', '保持好奇心', '尝试跨领域整合'],
      '混合型': ['尝试不同类型的项目找到兴趣点', '在实践中发现自己的独特优势', '保持开放的心态']
    }

    return {
      strengths: strengthsMap[personalityTag] || [],
      suggestions: suggestionsMap[personalityTag] || []
    }
  }

  /**
   * 提交OPC测评
   */
  async submitAssessment(
    userId: string,
    answers: { questionId: number; answer: string; score: number }[]
  ) {
    try {
      log.info('开始处理OPC测评提交', { userId, answerCount: answers.length })

      // 1. 计算各维度分数
      const dimensionScores = this.calculateDimensionScores(answers)

      // 2. 生成人格标签
      const personalityTag = this.calculatePersonalityTag(dimensionScores)

      // 3. 生成优势和建议
      const { strengths, suggestions } = this.generateStrengthsAndSuggestions(
        personalityTag,
        dimensionScores
      )

      // 4. 保存测评结果
      const opcResult = await OPCResult.create({
        userId: new mongoose.Types.ObjectId(userId),
        answers,
        result: {
          personalityTag,
          dimensionScores,
          strengths,
          suggestions
        },
        completedAt: new Date()
      })

      // 5. 更新用户表 - 记录人格标签
      await User.findByIdAndUpdate(userId, {
        personalityTag,
        opcCompleted: true,
        opcCompletedAt: new Date()
      })

      // 6. 生成能力雷达图快照（使用现有的AbilityRadar系统）
      const { AbilityRadar } = require('../models/AbilityRadar')

      // 获取用户已有的快照数量
      const existingSnapshots = await AbilityRadar.countDocuments({
        userId: new mongoose.Types.ObjectId(userId)
      })

      const overallScore = Math.round(
        dimensionScores.reduce((sum, d) => sum + d.score, 0) / dimensionScores.length
      )

      await AbilityRadar.create({
        userId: new mongoose.Types.ObjectId(userId),
        snapshotNumber: existingSnapshots + 1,
        triggerType: 'assessment',
        triggerRefId: opcResult._id,
        dimensions: dimensionScores.map(d => ({
          name: d.dimension,
          description: this.getDimensionDescription(d.dimension),
          score: d.score,
          level: this.getScoreLevel(d.score),
          growth: 0, // 首次测评，成长为0
          tags: []
        })),
        overallScore,
        rank: this.getOverallRank(overallScore),
        createdAt: new Date()
      })

      log.info('OPC测评处理成功', { userId, personalityTag })

      // 增加经验值
      await this.addExpForOPC(userId)

      return {
        opcResultId: opcResult._id,
        personalityTag,
        dimensionScores,
        strengths,
        suggestions
      }
    } catch (error: any) {
      log.error('OPC测评提交失败', { userId, error: error.message })
      throw error
    }
  }

  /**
   * 获取分数等级
   */
  private getScoreLevel(score: number): string {
    if (score >= 90) return '专家'
    if (score >= 75) return '高级'
    if (score >= 60) return '中级'
    return '初级'
  }

  /**
   * 获取维度描述
   */
  private getDimensionDescription(dimension: string): string {
    const descriptions: Record<string, string> = {
      visual: '视觉表达能力',
      systematic: '系统化思维能力',
      creative: '创意创新能力',
      logical: '逻辑分析能力',
      stable: '稳定执行能力',
      exploratory: '探索学习能力',
      execution: '执行落地能力',
      communication: '沟通协作能力',
      learning: '学习适应能力'
    }
    return descriptions[dimension] || dimension
  }

  /**
   * 获取综合等级
   */
  private getOverallRank(overallScore: number): string {
    if (overallScore >= 90) return '大师'
    if (overallScore >= 75) return '专家'
    if (overallScore >= 60) return '熟练'
    if (overallScore >= 40) return '进阶'
    return '新手'
  }

  /**
   * 获取用户最新的OPC测评结果
   */
  async getLatestResult(userId: string) {
    const result = await OPCResult.findOne({
      userId: new mongoose.Types.ObjectId(userId)
    }).sort({ completedAt: -1 })

    return result
  }

  /**
   * 获取用户所有OPC测评历史
   */
  async getUserResults(userId: string) {
    const results = await OPCResult.find({
      userId: new mongoose.Types.ObjectId(userId)
    }).sort({ completedAt: -1 })

    return results
  }
  /**
   * OPC测评完成时增加经验值
   */
  private async addExpForOPC(userId: string) {
    try {
      const { levelService } = require('./level.service')
      await levelService.addExpForOPCCompletion(userId)
      log.info('OPC测评经验值已添加', { userId })
    } catch (error: any) {
      log.error('添加OPC测评经验值失败', { error: error.message })
      // 不影响主流程
    }
  }
}

export const opcService = new OPCService()
