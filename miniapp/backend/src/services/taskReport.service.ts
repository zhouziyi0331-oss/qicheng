import { openai, AI_CONFIG } from '../config/openai'
import { RealProject } from '../models/RealProject'
import { StudentTagProfile, Tag } from '../models/Tag'
import { User } from '../models/User'
import { AbilityRadar } from '../models/AbilityRadar'
import { vectorMatchService } from './vectorMatch.service'
import { achievementMapService } from './achievementMap.service'
import { log } from '../utils/logger'
import mongoose from 'mongoose'

/**
 * 任务总结报告服务
 * 每个任务完成后生成详细报告（比项目完成总结更细致）
 */

interface TaskReportData {
  projectId: string
  projectTitle: string
  projectType: string
  difficulty: string
  budget: number
  completedAt: Date

  // 任务执行情况
  execution: {
    timeSpent: number           // 实际用时（天）
    onTime: boolean             // 是否按时完成
    quality: string             // 质量评价
    clientSatisfaction: number  // 客户满意度
  }

  // 能力展现
  abilitiesShown: Array<{
    tagName: string
    dimension: string
    level: number
    evidence: string            // 证据说明
  }>

  // 新获得的标签
  newTags: Array<{
    tagName: string
    category: string
    reason: string
  }>

  // 能力成长
  growthDetails: Array<{
    dimension: string
    before: number
    after: number
    growth: number
    newLevel: string
  }>

  // 经验值和等级
  expGain: {
    baseExp: number             // 基础经验值
    qualityBonus: number        // 质量加成
    difficultyBonus: number     // 难度加成
    totalExp: number            // 总经验值
    levelBefore: number         // 之前等级
    levelAfter: number          // 之后等级
    levelUp: boolean            // 是否升级
  }

  // 新解锁的成就
  newAchievements: Array<{
    id: string
    name: string
    icon: string
    rewards: any
  }>

  // AI总结
  aiSummary: {
    overall: string             // 总体评价
    highlights: string[]        // 亮点
    improvements: string[]      // 可改进
    nextSteps: string[]         // 下一步建议
  }
}

export class TaskReportService {

  /**
   * 生成任务总结报告
   */
  async generateTaskReport(userId: string, projectId: string): Promise<TaskReportData> {
    try {
      log.info('开始生成任务总结报告', { userId, projectId })

      // 1. 获取项目信息
      const project = await RealProject.findById(projectId)
      if (!project) {
        throw new Error('项目不存在')
      }

      // 2. 获取学生信息
      const user = await User.findById(userId)
      if (!user) {
        throw new Error('用户不存在')
      }

      // 3. 获取学生标签画像
      const studentProfile = await StudentTagProfile.findOne({
        userId: new mongoose.Types.ObjectId(userId)
      }).populate('tags.tagId skillLevels.tagId')

      if (!studentProfile) {
        throw new Error('学生标签画像不存在')
      }

      // 4. 记录之前的标签（用于检测新解锁的成就）
      const beforeTags = studentProfile.tags.map((t: any) => t.tagId.name)

      // 5. 分析任务执行情况
      const execution = await this.analyzeExecution(project, user)

      // 6. 分析能力展现
      const abilitiesShown = await this.analyzeAbilitiesShown(
        project,
        studentProfile,
        execution
      )

      // 7. 识别新获得的标签
      const newTags = await this.identifyNewTags(project, studentProfile, execution)

      // 8. 更新学生标签画像
      await this.updateStudentProfile(userId, newTags)

      // 9. 计算能力成长
      const growthDetails = await this.calculateDetailedGrowth(
        userId,
        abilitiesShown
      )

      // 10. 计算经验值和等级
      const expGain = await this.calculateExpGain(
        user,
        project,
        execution,
        abilitiesShown
      )

      // 11. 检查新解锁的成就
      const newAchievements = await achievementMapService.getNewlyUnlockedAchievements(
        userId,
        beforeTags
      )

      // 12. 生成AI总结
      const aiSummary = await this.generateAISummary(
        user,
        project,
        execution,
        abilitiesShown,
        growthDetails,
        newTags
      )

      // 13. 构建完整报告
      const report: TaskReportData = {
        projectId,
        projectTitle: project.title,
        projectType: project.category,
        difficulty: project.difficulty,
        budget: project.budget,
        completedAt: new Date(),
        execution,
        abilitiesShown,
        newTags,
        growthDetails,
        expGain,
        newAchievements,
        aiSummary
      }

      log.info('任务总结报告生成成功', {
        userId,
        projectId,
        expGain: expGain.totalExp,
        levelUp: expGain.levelUp,
        newAchievements: newAchievements.length
      })

      return report
    } catch (error: any) {
      log.error('生成任务总结报告失败', { userId, projectId, error: error.message })
      throw error
    }
  }

  /**
   * 分析任务执行情况
   */
  private async analyzeExecution(project: any, user: any) {
    // 这里简化处理，实际应该从项目记录中获取
    const createdAt = new Date(project.createdAt)
    const completedAt = new Date()
    const timeSpent = Math.ceil((completedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))

    // 预估时间（根据难度）
    const estimatedDays: Record<string, number> = {
      'easy': 3,
      'medium': 7,
      'hard': 14,
      'expert': 21
    }
    const estimated = estimatedDays[project.difficulty] || 7

    return {
      timeSpent,
      onTime: timeSpent <= estimated,
      quality: timeSpent <= estimated ? 'excellent' : 'good',
      clientSatisfaction: timeSpent <= estimated ? 95 : 85
    }
  }

  /**
   * 分析能力展现（更详细）
   */
  private async analyzeAbilitiesShown(
    project: any,
    studentProfile: any,
    execution: any
  ) {
    const prompt = `详细分析学生在这个任务中展现的能力。

【项目信息】
标题：${project.title}
描述：${project.description}
类型：${project.category}
难度：${project.difficulty}

【执行情况】
用时：${execution.timeSpent}天
按时完成：${execution.onTime ? '是' : '否'}
质量：${execution.quality}

【学生已有标签】
${studentProfile.tags.slice(0, 20).map((t: any) => `- ${t.tagId.name}`).join('\n')}

请选出5-8个在这个任务中**实际展现**的能力标签，
对每个能力给出：
1. 能力等级（1-5）
2. 具体证据（这个能力如何体现）

以JSON格式返回：
{
  "abilities": [
    {
      "tagName": "擅长视觉叙事",
      "level": 4,
      "evidence": "通过色彩和构图讲述了品牌故事"
    }
  ]
}`

    const completion = await openai.chat.completions.create({
      model: AI_CONFIG.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })

    const result = JSON.parse(completion.choices[0].message.content || '{"abilities":[]}')
    const abilities = result.abilities || []

    // 补充dimension信息
    return abilities.map((a: any) => ({
      tagName: a.tagName,
      dimension: this.inferDimension(a.tagName),
      level: a.level,
      evidence: a.evidence
    }))
  }

  /**
   * 识别新获得的标签（更详细）
   */
  private async identifyNewTags(
    project: any,
    studentProfile: any,
    execution: any
  ) {
    const prompt = `分析学生完成这个任务后，新获得了哪些标签。

【项目信息】
标题：${project.title}
类型：${project.category}
难度：${project.difficulty}

【执行情况】
按时完成：${execution.onTime ? '是' : '否'}
质量：${execution.quality}

【学生已有标签】
${studentProfile.tags.slice(0, 20).map((t: any) => `- ${t.tagId.name}`).join('\n')}

请推荐3-5个学生新获得的标签，以JSON格式返回：
{
  "tags": [
    {
      "tagName": "做过品牌设计项目",
      "category": "experience",
      "reason": "完成了完整的品牌Logo设计项目"
    }
  ]
}`

    const completion = await openai.chat.completions.create({
      model: AI_CONFIG.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    })

    const result = JSON.parse(completion.choices[0].message.content || '{"tags":[]}')
    const newTagNames = result.tags || []

    // 在标签库中查找或创建
    const newTags = []
    for (const item of newTagNames) {
      let tag = await Tag.findOne({
        name: item.tagName,
        category: item.category
      })

      if (!tag) {
        tag = await vectorMatchService.createTag(
          item.tagName,
          item.category,
          item.reason,
          1.0
        )
      }

      newTags.push({
        tagId: tag._id,
        tagName: tag.name,
        category: tag.category,
        reason: item.reason,
        weight: 0.6,
        source: 'project'
      })
    }

    return newTags
  }

  /**
   * 更新学生标签画像
   */
  private async updateStudentProfile(userId: string, newTags: any[]) {
    for (const tag of newTags) {
      await vectorMatchService.addStudentTag(
        userId,
        tag.tagId.toString(),
        tag.weight,
        tag.source
      )
    }
  }

  /**
   * 计算详细的能力成长
   */
  private async calculateDetailedGrowth(userId: string, abilitiesShown: any[]) {
    const latestRadar = await AbilityRadar.findOne({
      userId: new mongoose.Types.ObjectId(userId)
    }).sort({ createdAt: -1 })

    if (!latestRadar) {
      return []
    }

    const growth = []
    const dimensionMap: Record<string, string> = {
      'visual': 'visual',
      'systematic': 'systematic',
      'creative': 'creative',
      'logical': 'logical',
      'stable': 'stable',
      'exploratory': 'exploratory',
      'execution': 'execution',
      'communication': 'communication',
      'learning': 'learning'
    }

    for (const [key, dimensionName] of Object.entries(dimensionMap)) {
      const dimension = latestRadar.dimensions.find(d => d.name === dimensionName)
      if (dimension) {
        const relatedAbilities = abilitiesShown.filter(a => a.dimension === key)

        if (relatedAbilities.length > 0) {
          const avgLevel = relatedAbilities.reduce((sum, a) => sum + a.level, 0) / relatedAbilities.length
          const growthValue = Math.round(avgLevel * 2) // level 1-5 -> growth 2-10

          const newScore = dimension.score + growthValue
          growth.push({
            dimension: dimensionName,
            before: dimension.score,
            after: newScore,
            growth: growthValue,
            newLevel: this.getScoreLevel(newScore)
          })
        }
      }
    }

    return growth
  }

  /**
   * 计算经验值和等级
   */
  private async calculateExpGain(
    user: any,
    project: any,
    execution: any,
    abilitiesShown: any[]
  ) {
    // 基础经验值（根据项目预算）
    const baseExp = Math.round(project.budget * 0.1)

    // 质量加成
    const qualityBonus = execution.quality === 'excellent' ? baseExp * 0.3 : baseExp * 0.1

    // 难度加成
    const difficultyMultiplier: Record<string, number> = {
      'easy': 1.0,
      'medium': 1.2,
      'hard': 1.5,
      'expert': 2.0
    }
    const difficultyBonus = baseExp * (difficultyMultiplier[project.difficulty] - 1)

    // 总经验值
    const totalExp = Math.round(baseExp + qualityBonus + difficultyBonus)

    // 计算等级
    const levelBefore = user.level || 1
    const expBefore = user.exp || 0
    const expAfter = expBefore + totalExp

    // 简化的升级规则：每1000经验升1级
    const levelAfter = Math.floor(expAfter / 1000) + 1
    const levelUp = levelAfter > levelBefore

    // 更新用户经验和等级
    await User.findByIdAndUpdate(user._id, {
      exp: expAfter,
      level: levelAfter
    })

    return {
      baseExp,
      qualityBonus: Math.round(qualityBonus),
      difficultyBonus: Math.round(difficultyBonus),
      totalExp,
      levelBefore,
      levelAfter,
      levelUp
    }
  }

  /**
   * 生成AI总结
   */
  private async generateAISummary(
    user: any,
    project: any,
    execution: any,
    abilitiesShown: any[],
    growthDetails: any[],
    newTags: any[]
  ) {
    const prompt = `为学生生成任务总结报告。

【学生信息】
姓名：${user.name || '同学'}
OPC人格：${user.personalityTag}
等级：Lv.${user.level}

【任务信息】
标题：${project.title}
难度：${project.difficulty}
用时：${execution.timeSpent}天
按时：${execution.onTime ? '是' : '否'}

【能力展现】
${abilitiesShown.map(a => `- ${a.tagName}（${a.evidence}）`).join('\n')}

【能力成长】
${growthDetails.map(g => `- ${g.dimension}: ${g.before} → ${g.after} (+${g.growth})`).join('\n')}

请生成：
1. overall: 总体评价（100字）
2. highlights: 3个亮点
3. improvements: 2个可改进点
4. nextSteps: 3个下一步建议

以JSON格式返回：
{
  "overall": "...",
  "highlights": ["...", "...", "..."],
  "improvements": ["...", "..."],
  "nextSteps": ["...", "...", "..."]
}`

    const completion = await openai.chat.completions.create({
      model: AI_CONFIG.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      response_format: { type: 'json_object' }
    })

    return JSON.parse(completion.choices[0].message.content || '{}')
  }

  /**
   * 推断标签对应的维度
   */
  private inferDimension(tagName: string): string {
    const name = tagName.toLowerCase()

    if (name.includes('视觉') || name.includes('设计') || name.includes('ui') || name.includes('色彩')) {
      return 'visual'
    }
    if (name.includes('系统') || name.includes('架构') || name.includes('流程')) {
      return 'systematic'
    }
    if (name.includes('创意') || name.includes('创新') || name.includes('原创')) {
      return 'creative'
    }
    if (name.includes('逻辑') || name.includes('分析') || name.includes('数据')) {
      return 'logical'
    }
    if (name.includes('稳定') || name.includes('质量') || name.includes('按时')) {
      return 'stable'
    }
    if (name.includes('探索') || name.includes('学习') || name.includes('跨界')) {
      return 'exploratory'
    }
    if (name.includes('执行') || name.includes('快速') || name.includes('落地')) {
      return 'execution'
    }
    if (name.includes('沟通') || name.includes('协作') || name.includes('团队')) {
      return 'communication'
    }
    if (name.includes('学习') || name.includes('上手')) {
      return 'learning'
    }

    return 'mixed'
  }

  /**
   * 获取分数对应的等级
   */
  private getScoreLevel(score: number): string {
    if (score >= 90) return '大师'
    if (score >= 80) return '专家'
    if (score >= 70) return '熟练'
    if (score >= 60) return '进阶'
    return '新手'
  }
}

export const taskReportService = new TaskReportService()
