import { qdrantVectorService } from './qdrantVector.service'
import { openai, AI_CONFIG } from '../config/openai'
import { StudentTagProfile, Tag } from '../models/Tag'
import { User } from '../models/User'
import { RealProject } from '../models/RealProject'
import { log } from '../utils/logger'
import mongoose from 'mongoose'

/**
 * VectorCore - 向量数据库核心服务
 * 整个小程序的灵魂
 *
 * 核心理念：
 * 1. 学生在1536维向量空间中移动
 * 2. 向量移动 = 成长
 * 3. 向量距离 = 所有功能的触发器
 * 4. 一次更新，全部响应
 */

// 向量移动分析
interface VectorMovement {
  distance: number          // 移动距离（成长量）
  direction: string[]       // 移动方向（哪些维度成长）
  velocity: number          // 移动速度（成长速度）
  trajectory: number[][]    // 历史轨迹
}

// 统一响应结构
interface UnifiedResponse {
  // 学生当前状态
  currentState: {
    vector: number[]
    position: string        // 在向量空间的位置描述
    level: number
  }

  // 成长分析
  growth: {
    movement: VectorMovement
    summary: string
  }

  // 项目推荐（基于向量距离）
  recommendations: Array<{
    projectId: string
    title: string
    distance: number        // 向量距离
    matchScore: number      // 匹配分数 = 1 - distance
    reason: string
  }>

  // 成就解锁（基于向量距离）
  achievements: Array<{
    achievementId: string
    name: string
    unlocked: boolean       // distance < threshold
    progress: number        // 进度百分比
    distance: number
  }>

  // 职业路径（基于向量距离）
  careerPaths: Array<{
    careerName: string
    distance: number
    matchScore: number
    reason: string
  }>

  // 技能建议（基于向量距离）
  skillSuggestions: Array<{
    skill: string
    distance: number
    priority: 'high' | 'medium' | 'low'
    reason: string
  }>

  // 导师建议（基于向量距离）
  mentorAdvice: {
    message: string
    suggestions: string[]
    nextSteps: string[]
  }
}

export class VectorCoreService {

  /**
   * 核心方法1：更新学生向量（唯一入口）
   * 所有功能都从这里触发
   */
  async updateStudentVector(
    userId: string,
    newTags: Array<{ tagId: string; weight: number; source: string }>,
    context: {
      trigger: 'project_complete' | 'assessment' | 'manual'
      projectId?: string
      assessmentId?: string
    }
  ): Promise<UnifiedResponse> {
    try {
      log.info('VectorCore: 开始更新学生向量', { userId, trigger: context.trigger })

      // 1. 获取旧向量
      const oldVector = await this.getStudentVector(userId)

      // 2. 添加新标签到学生画像
      await this.addTagsToProfile(userId, newTags)

      // 3. 计算新向量
      const newVector = await this.computeStudentVector(userId)

      // 4. 分析向量移动
      const movement = this.calculateVectorMovement(oldVector, newVector)

      // 5. 更新Qdrant
      await qdrantVectorService.upsertStudentProfile(userId, newVector, {
        userId,
        level: await this.getUserLevel(userId),
        lastUpdated: new Date().toISOString(),
        trigger: context.trigger
      })

      // 6. 保存成长轨迹
      await this.saveGrowthTrajectory(userId, newVector, movement, context)

      // 7. 触发所有功能（一次性并行检索）
      const response = await this.triggerAllFeatures(userId, newVector, movement, context)

      log.info('VectorCore: 学生向量更新完成', {
        userId,
        distance: movement.distance,
        unlockedAchievements: response.achievements.filter(a => a.unlocked).length
      })

      return response
    } catch (error: any) {
      log.error('VectorCore: 更新学生向量失败', { userId, error: error.message })
      throw error
    }
  }

  /**
   * 核心方法2：触发所有功能（一次计算，全部响应）
   */
  private async triggerAllFeatures(
    userId: string,
    vector: number[],
    movement: VectorMovement,
    context: any
  ): Promise<UnifiedResponse> {
    // 并行检索所有相关向量
    const [
      nearbyProjects,
      nearbyAchievements,
      nearbyCareerPaths,
      nearbySkills,
      nearbyMentorAdvice
    ] = await Promise.all([
      qdrantVectorService.searchSimilar('qicheng_project_profiles', vector, 20),
      qdrantVectorService.searchSimilar('qicheng_achievement_profiles', vector, 20),
      qdrantVectorService.searchSimilar('qicheng_career_profiles', vector, 10),
      qdrantVectorService.searchSimilar('qicheng_skill_profiles', vector, 15),
      qdrantVectorService.searchSimilar('qicheng_mentor_advice', vector, 5)
    ])

    // 获取用户等级
    const level = await this.getUserLevel(userId)

    // 构建统一响应
    return {
      currentState: {
        vector,
        position: this.describePosition(vector),
        level
      },

      growth: {
        movement,
        summary: this.generateGrowthSummary(movement, context)
      },

      recommendations: this.rankProjects(nearbyProjects),

      achievements: this.checkAchievements(nearbyAchievements, movement),

      careerPaths: this.rankCareers(nearbyCareerPaths),

      skillSuggestions: this.suggestSkills(nearbySkills, movement),

      mentorAdvice: await this.generateMentorAdvice(nearbyMentorAdvice, movement)
    }
  }

  /**
   * 核心方法3：计算向量移动（成长量）
   */
  private calculateVectorMovement(oldVector: number[], newVector: number[]): VectorMovement {
    // 计算欧几里得距离
    const distance = this.euclideanDistance(oldVector, newVector)

    // 计算移动方向（哪些维度成长了）
    const direction = this.analyzeDirection(oldVector, newVector)

    // 计算移动速度（暂时简化，实际应该除以时间）
    const velocity = distance

    return {
      distance,
      direction,
      velocity,
      trajectory: [oldVector, newVector]
    }
  }

  /**
   * 获取学生向量
   */
  private async getStudentVector(userId: string): Promise<number[]> {
    try {
      const result = await qdrantVectorService.searchById('qicheng_student_profiles', userId)
      const vector = result?.vector
      // 确保返回number[]类型
      if (Array.isArray(vector) && vector.every(v => typeof v === 'number')) {
        return vector as number[]
      }
      return this.getZeroVector()
    } catch (error) {
      log.warn('获取学生向量失败，返回零向量', { userId })
      return this.getZeroVector()
    }
  }

  /**
   * 计算学生向量
   */
  private async computeStudentVector(userId: string): Promise<number[]> {
    // 获取学生标签画像
    const profile = await StudentTagProfile.findOne({
      userId: new mongoose.Types.ObjectId(userId)
    }).populate('tags.tagId')

    if (!profile || profile.tags.length === 0) {
      return this.getZeroVector()
    }

    // 构建学生描述文本
    const description = this.buildStudentDescription(profile)

    // 调用OpenAI生成向量
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: description
    })

    return embedding.data[0].embedding
  }

  /**
   * 构建学生描述文本
   */
  private buildStudentDescription(profile: any): string {
    const tags = profile.tags
      .sort((a: any, b: any) => b.weight - a.weight)
      .slice(0, 30)
      .map((t: any) => t.tagId.name)
      .join(', ')

    return `学生能力画像：${tags}`
  }

  /**
   * 添加标签到学生画像
   */
  private async addTagsToProfile(
    userId: string,
    newTags: Array<{ tagId: string; weight: number; source: string }>
  ) {
    const profile = await StudentTagProfile.findOne({
      userId: new mongoose.Types.ObjectId(userId)
    })

    if (!profile) {
      throw new Error('学生画像不存在')
    }

    for (const tag of newTags) {
      // 检查是否已存在
      const existingIndex = profile.tags.findIndex(
        (t: any) => t.tagId.toString() === tag.tagId
      )

      if (existingIndex >= 0) {
        // 更新权重
        profile.tags[existingIndex].weight = Math.min(
          profile.tags[existingIndex].weight + tag.weight * 0.1,
          1.0
        )
      } else {
        // 添加新标签
        profile.tags.push({
          tagId: new mongoose.Types.ObjectId(tag.tagId),
          weight: tag.weight,
          source: (tag.source as 'system' | 'opc' | 'project' | 'self') || 'system',
          confidence: 0.8,
          addedAt: new Date()
        })
      }
    }

    await profile.save()
  }

  /**
   * 计算欧几里得距离
   */
  private euclideanDistance(v1: number[], v2: number[]): number {
    if (v1.length !== v2.length) return 0

    let sum = 0
    for (let i = 0; i < v1.length; i++) {
      sum += Math.pow(v1[i] - v2[i], 2)
    }

    return Math.sqrt(sum)
  }

  /**
   * 分析移动方向
   */
  private analyzeDirection(oldVector: number[], newVector: number[]): string[] {
    // 简化版：找出变化最大的维度
    // 实际应该映射到9个能力维度
    const changes: Array<{ index: number; change: number }> = []

    for (let i = 0; i < oldVector.length; i++) {
      const change = newVector[i] - oldVector[i]
      if (Math.abs(change) > 0.01) {
        changes.push({ index: i, change })
      }
    }

    // 排序找出top变化
    changes.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))

    // 返回描述（简化版）
    return changes.slice(0, 3).map((c, i) =>
      `维度${c.index}: ${c.change > 0 ? '+' : ''}${(c.change * 100).toFixed(1)}%`
    )
  }

  /**
   * 描述学生在向量空间的位置
   */
  private describePosition(vector: number[]): string {
    // 简化版：返回向量的模
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0))

    if (magnitude < 10) return '新手区域'
    if (magnitude < 20) return '进阶区域'
    if (magnitude < 30) return '熟练区域'
    return '专家区域'
  }

  /**
   * 生成成长总结
   */
  private generateGrowthSummary(movement: VectorMovement, context: any): string {
    if (movement.distance < 0.01) {
      return '本次项目对整体能力提升较小，建议尝试更具挑战性的项目'
    }

    const growthLevel = movement.distance > 1.0 ? '显著' : movement.distance > 0.5 ? '明显' : '稳步'

    return `本次${context.trigger === 'project_complete' ? '项目完成' : '测评'}让你的能力有${growthLevel}成长，` +
      `主要体现在：${movement.direction.slice(0, 2).join('、')}`
  }

  /**
   * 项目排序
   */
  private rankProjects(nearbyProjects: any[]): any[] {
    return nearbyProjects.slice(0, 20).map(p => ({
      projectId: p.id,
      title: p.payload?.title || '未知项目',
      distance: p.score,
      matchScore: Math.round((1 - p.score) * 100),
      reason: `能力匹配度${Math.round((1 - p.score) * 100)}%`
    }))
  }

  /**
   * 检查成就解锁
   */
  private checkAchievements(nearbyAchievements: any[], movement: VectorMovement): any[] {
    return nearbyAchievements.map(a => {
      const threshold = a.payload?.unlockThreshold || 0.5
      const unlocked = a.score < threshold

      return {
        achievementId: a.id,
        name: a.payload?.name || '未知成就',
        unlocked,
        progress: Math.min(Math.round((1 - a.score / threshold) * 100), 100),
        distance: a.score
      }
    })
  }

  /**
   * 职业路径排序
   */
  private rankCareers(nearbyCareerPaths: any[]): any[] {
    return nearbyCareerPaths.slice(0, 5).map(c => ({
      careerName: c.payload?.name || '未知职业',
      distance: c.score,
      matchScore: Math.round((1 - c.score) * 100),
      reason: `你的能力画像与该职业匹配度为${Math.round((1 - c.score) * 100)}%`
    }))
  }

  /**
   * 技能建议
   */
  private suggestSkills(nearbySkills: any[], movement: VectorMovement): any[] {
    // 距离远的技能 = 需要学习的技能
    const farSkills = nearbySkills.filter(s => s.score > 0.5).slice(0, 10)

    return farSkills.map(s => ({
      skill: s.payload?.name || '未知技能',
      distance: s.score,
      priority: s.score > 0.8 ? 'high' : s.score > 0.65 ? 'medium' : 'low',
      reason: `这个技能与你当前的能力画像距离较远，建议优先学习`
    }))
  }

  /**
   * 生成导师建议
   */
  private async generateMentorAdvice(
    nearbyAdvice: any[],
    movement: VectorMovement
  ): Promise<any> {
    // 选择最近的建议
    const closestAdvice = nearbyAdvice[0]

    if (!closestAdvice) {
      return {
        message: '继续保持当前的学习节奏！',
        suggestions: ['尝试更多类型的项目', '深化已有技能'],
        nextSteps: ['完成当前项目', '寻找新的挑战']
      }
    }

    return {
      message: closestAdvice.payload?.message || '你正在稳步成长！',
      suggestions: closestAdvice.payload?.suggestions || [],
      nextSteps: closestAdvice.payload?.nextSteps || []
    }
  }

  /**
   * 保存成长轨迹
   */
  private async saveGrowthTrajectory(
    userId: string,
    vector: number[],
    movement: VectorMovement,
    context: any
  ) {
    // 这里应该保存到专门的成长轨迹collection
    // 暂时简化
    log.info('保存成长轨迹', {
      userId,
      distance: movement.distance,
      trigger: context.trigger
    })
  }

  /**
   * 获取用户等级
   */
  private async getUserLevel(userId: string): Promise<number> {
    const user = await User.findById(userId)
    return user?.level || 1
  }

  /**
   * 获取零向量
   */
  private getZeroVector(): number[] {
    return new Array(1536).fill(0)
  }

  /**
   * 查询学生当前状态（不更新向量）
   */
  async getStudentState(userId: string): Promise<UnifiedResponse> {
    const vector = await this.getStudentVector(userId)

    return await this.triggerAllFeatures(
      userId,
      vector,
      { distance: 0, direction: [], velocity: 0, trajectory: [] },
      { trigger: 'manual' }
    )
  }
}

export const vectorCoreService = new VectorCoreService()
