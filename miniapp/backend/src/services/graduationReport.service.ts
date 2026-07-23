import { openai, AI_CONFIG } from '../config/openai'
import { StudentTagProfile, Tag } from '../models/Tag'
import { User } from '../models/User'
import { RealProject } from '../models/RealProject'
import { AbilityRadar } from '../models/AbilityRadar'
import { log } from '../utils/logger'
import mongoose from 'mongoose'

/**
 * 毕业报告服务
 * 学生完成全部项目后的综合成长报告
 */

interface GraduationReportData {
  userId: string
  userName: string
  personalityTag: string
  level: number
  totalExp: number
  generatedAt: Date

  // 成长历程
  growthJourney: {
    totalProjects: number
    projectsByType: Record<string, number>
    timeSpan: string
    projectList: Array<{
      title: string
      category: string
      completedAt: Date
    }>
  }

  // 核心能力（基于标签）
  coreAbilities: {
    topTags: Array<{
      tagName: string
      category: string
      weight: number
    }>
    dimensionScores: Array<{
      dimension: string
      score: number
      level: string
      growth: number
    }>
    skillMatrix: Array<{
      skill: string
      level: number
      projects: number
    }>
  }

  // 能力迁移地图
  abilityTransfer: {
    currentStrengths: string[]
    transferableTo: Array<{
      field: string
      matchScore: number
      reason: string
    }>
    recommendations: string[]
  }

  // 适合的职业路径
  careerPaths: Array<{
    title: string
    matchScore: number
    requiredAbilities: string[]
    matchedAbilities: string[]
    missingAbilities: string[]
    developmentPlan: string
  }>

  // 适合的老板类型
  bossTypes: Array<{
    type: string
    matchScore: number
    reason: string
    workStyle: string
  }>

  // 能解决什么问题
  problemSolvingAbility: {
    categories: Array<{
      category: string
      problems: string[]
      evidence: string[]
    }>
    uniqueValue: string
  }

  // AI总结
  aiSummary: {
    overall: string
    achievements: string[]
    futureVision: string
  }
}

export class GraduationReportService {

  /**
   * 生成毕业报告
   */
  async generateGraduationReport(userId: string): Promise<GraduationReportData> {
    try {
      log.info('开始生成毕业报告', { userId })

      // 1. 获取学生信息
      const user = await User.findById(userId)
      if (!user) {
        throw new Error('用户不存在')
      }

      // 2. 获取学生标签画像
      const studentProfile = await StudentTagProfile.findOne({
        userId: new mongoose.Types.ObjectId(userId)
      }).populate('tags.tagId skillLevels.tagId interests.tagId')

      if (!studentProfile) {
        throw new Error('学生标签画像不存在')
      }

      // 3. 获取所有完成的项目
      const projects = await RealProject.find({
        userId: new mongoose.Types.ObjectId(userId),
        status: 'completed'
      }).sort({ completedAt: -1 })

      // 4. 获取能力雷达数据
      const latestRadar = await AbilityRadar.findOne({
        userId: new mongoose.Types.ObjectId(userId)
      }).sort({ createdAt: -1 })

      const firstRadar = await AbilityRadar.findOne({
        userId: new mongoose.Types.ObjectId(userId)
      }).sort({ createdAt: 1 })

      // 5. 生成各部分内容
      const growthJourney = this.analyzeGrowthJourney(projects)
      const coreAbilities = this.analyzeCoreAbilities(
        studentProfile,
        latestRadar,
        firstRadar
      )
      const abilityTransfer = await this.analyzeAbilityTransfer(
        user,
        studentProfile,
        coreAbilities
      )
      const careerPaths = await this.recommendCareerPaths(
        user,
        studentProfile,
        coreAbilities
      )
      const bossTypes = await this.analyzeBossTypes(
        user,
        studentProfile
      )
      const problemSolvingAbility = await this.analyzeProblemSolving(
        studentProfile,
        projects
      )
      const aiSummary = await this.generateAISummary(
        user,
        growthJourney,
        coreAbilities,
        careerPaths
      )

      // 6. 构建完整报告
      const report: GraduationReportData = {
        userId,
        userName: (user as any).name || '同学',
        personalityTag: (user as any).personalityTag || '混合型',
        level: user.level || 1,
        totalExp: (user as any).exp || 0,
        generatedAt: new Date(),
        growthJourney,
        coreAbilities,
        abilityTransfer,
        careerPaths,
        bossTypes,
        problemSolvingAbility,
        aiSummary
      }

      log.info('毕业报告生成成功', {
        userId,
        totalProjects: projects.length,
        careerPaths: careerPaths.length
      })

      return report
    } catch (error: any) {
      log.error('生成毕业报告失败', { userId, error: error.message })
      throw error
    }
  }

  /**
   * 分析成长历程
   */
  private analyzeGrowthJourney(projects: any[]) {
    const projectsByType: Record<string, number> = {}
    const projectList = []

    for (const project of projects) {
      const type = project.category || 'other'
      projectsByType[type] = (projectsByType[type] || 0) + 1

      projectList.push({
        title: project.title,
        category: project.category,
        completedAt: project.completedAt || project.updatedAt
      })
    }

    // 计算时间跨度
    const firstProject = projects[projects.length - 1]
    const lastProject = projects[0]
    const timeSpan = firstProject && lastProject
      ? this.calculateTimeSpan(firstProject.createdAt, lastProject.completedAt)
      : '未知'

    return {
      totalProjects: projects.length,
      projectsByType,
      timeSpan,
      projectList: projectList.slice(0, 20) // 最多显示20个
    }
  }

  /**
   * 分析核心能力
   */
  private analyzeCoreAbilities(
    studentProfile: any,
    latestRadar: any,
    firstRadar: any
  ) {
    // Top标签（按权重排序）
    const topTags = studentProfile.tags
      .sort((a: any, b: any) => b.weight - a.weight)
      .slice(0, 10)
      .map((t: any) => ({
        tagName: t.tagId.name,
        category: t.tagId.category,
        weight: t.weight
      }))

    // 维度分数和成长
    const dimensionScores = latestRadar
      ? latestRadar.dimensions.map((d: any) => {
          const firstDim = firstRadar?.dimensions.find((fd: any) => fd.name === d.name)
          const growth = firstDim ? d.score - firstDim.score : 0

          return {
            dimension: d.name,
            score: d.score,
            level: d.level,
            growth
          }
        })
      : []

    // 技能矩阵
    const skillMatrix = studentProfile.skillLevels
      .slice(0, 10)
      .map((s: any) => ({
        skill: s.tagId.name,
        level: s.level,
        projects: s.experienceProjects
      }))

    return {
      topTags,
      dimensionScores,
      skillMatrix
    }
  }

  /**
   * 分析能力迁移
   */
  private async analyzeAbilityTransfer(
    user: any,
    studentProfile: any,
    coreAbilities: any
  ) {
    const topSkills = coreAbilities.topTags
      .filter((t: any) => t.category === 'advantage')
      .slice(0, 5)
      .map((t: any) => t.tagName)

    const prompt = `分析学生的能力可以迁移到哪些领域。

【学生信息】
OPC人格：${user.personalityTag}
核心能力：
${topSkills.join('\n')}

【能力维度】
${coreAbilities.dimensionScores.map((d: any) => `- ${d.dimension}: ${d.score}分`).join('\n')}

请分析：
1. 当前的核心优势（3-5个）
2. 可以迁移到的领域（3-5个，每个给出匹配分数和理由）
3. 发展建议（3个）

以JSON格式返回：
{
  "currentStrengths": ["...", "..."],
  "transferableTo": [
    {"field": "UI设计师", "matchScore": 95, "reason": "..."}
  ],
  "recommendations": ["...", "..."]
}`

    const completion = await openai.chat.completions.create({
      model: AI_CONFIG.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })

    return JSON.parse(completion.choices[0].message.content || '{}')
  }

  /**
   * 推荐职业路径
   */
  private async recommendCareerPaths(
    user: any,
    studentProfile: any,
    coreAbilities: any
  ) {
    const topSkills = coreAbilities.topTags.slice(0, 10).map((t: any) => t.tagName)

    const prompt = `为学生推荐职业路径。

【学生信息】
OPC人格：${user.personalityTag}
等级：Lv.${user.level}

【核心能力】
${topSkills.join('\n')}

【能力维度】
${coreAbilities.dimensionScores.map((d: any) => `- ${d.dimension}: ${d.score}分 (${d.level})`).join('\n')}

请推荐3-5个适合的职业路径，以JSON格式返回：
{
  "careers": [
    {
      "title": "品牌设计师",
      "matchScore": 95,
      "requiredAbilities": ["擅长品牌设计", "擅长视觉叙事"],
      "matchedAbilities": ["擅长品牌设计", "擅长视觉叙事"],
      "missingAbilities": ["需要更多商业思维"],
      "developmentPlan": "继续深化品牌设计能力，补充商业知识"
    }
  ]
}`

    const completion = await openai.chat.completions.create({
      model: AI_CONFIG.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })

    const result = JSON.parse(completion.choices[0].message.content || '{"careers":[]}')
    return result.careers || []
  }

  /**
   * 分析适合的老板类型
   */
  private async analyzeBossTypes(user: any, studentProfile: any) {
    const topTraits = studentProfile.tags
      .filter((t: any) => t.tagId.category === 'trait')
      .slice(0, 5)
      .map((t: any) => t.tagId.name)

    const prompt = `分析适合学生的老板类型。

【学生信息】
OPC人格：${user.personalityTag}

【核心特质】
${topTraits.join('\n')}

请推荐3个适合的老板类型，以JSON格式返回：
{
  "bossTypes": [
    {
      "type": "重视创意的老板",
      "matchScore": 90,
      "reason": "你的创意能力强，需要欣赏和支持创意的老板",
      "workStyle": "给予创意自由，鼓励创新"
    }
  ]
}`

    const completion = await openai.chat.completions.create({
      model: AI_CONFIG.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })

    const result = JSON.parse(completion.choices[0].message.content || '{"bossTypes":[]}')
    return result.bossTypes || []
  }

  /**
   * 分析能解决什么问题
   */
  private async analyzeProblemSolving(studentProfile: any, projects: any[]) {
    const experiences = studentProfile.tags
      .filter((t: any) => t.tagId.category === 'experience')
      .map((t: any) => t.tagId.name)

    const advantages = studentProfile.tags
      .filter((t: any) => t.tagId.category === 'advantage')
      .slice(0, 5)
      .map((t: any) => t.tagId.name)

    const prompt = `分析学生能解决什么问题。

【核心优势】
${advantages.join('\n')}

【过往经验】
${experiences.slice(0, 10).join('\n')}

【完成项目】
${projects.slice(0, 5).map(p => p.title).join('\n')}

请分析：
1. 能解决的问题类别（3-5个类别，每个类别列出2-3个具体问题）
2. 独特价值（一句话总结）

以JSON格式返回：
{
  "categories": [
    {
      "category": "品牌视觉",
      "problems": ["品牌Logo设计", "VI系统搭建"],
      "evidence": ["完成过6个品牌设计项目"]
    }
  ],
  "uniqueValue": "擅长用视觉讲故事的品牌设计师"
}`

    const completion = await openai.chat.completions.create({
      model: AI_CONFIG.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })

    return JSON.parse(completion.choices[0].message.content || '{}')
  }

  /**
   * 生成AI总结
   */
  private async generateAISummary(
    user: any,
    growthJourney: any,
    coreAbilities: any,
    careerPaths: any[]
  ) {
    const prompt = `为学生生成毕业报告总结。

【学生信息】
姓名：${user.name || '同学'}
OPC人格：${user.personalityTag}
等级：Lv.${user.level}

【成长历程】
完成项目：${growthJourney.totalProjects}个
时间跨度：${growthJourney.timeSpan}

【核心能力】
${coreAbilities.topTags.slice(0, 5).map((t: any) => `- ${t.tagName}`).join('\n')}

【推荐职业】
${careerPaths.slice(0, 3).map(c => `- ${c.title} (匹配度${c.matchScore}%)`).join('\n')}

请生成：
1. overall: 总体评价（200字，温暖、鼓励）
2. achievements: 3个主要成就
3. futureVision: 未来展望（100字）

以JSON格式返回。`

    const completion = await openai.chat.completions.create({
      model: AI_CONFIG.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 800
    })

    return JSON.parse(completion.choices[0].message.content || '{}')
  }

  /**
   * 计算时间跨度
   */
  private calculateTimeSpan(start: Date, end: Date): string {
    const diff = new Date(end).getTime() - new Date(start).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days < 30) {
      return `${days}天`
    } else if (days < 365) {
      return `${Math.floor(days / 30)}个月`
    } else {
      return `${Math.floor(days / 365)}年${Math.floor((days % 365) / 30)}个月`
    }
  }
}

export const graduationReportService = new GraduationReportService()
