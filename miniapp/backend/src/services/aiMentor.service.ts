import { openai, AI_CONFIG } from '../config/openai'
import { StudentTagProfile, Tag } from '../models/Tag'
import { User } from '../models/User'
import { RealProject } from '../models/RealProject'
import { AbilityRadar } from '../models/AbilityRadar'
import { log } from '../utils/logger'
import mongoose from 'mongoose'

/**
 * AI导师服务
 * 基于标签提供个性化学习指导
 */

interface MentorGuidance {
  userId: string
  generatedAt: Date

  // 学生画像分析
  profileAnalysis: {
    personalityTag: string
    level: number
    topStrengths: string[]
    weaknesses: string[]
    learningStyle: string
  }

  // 能力短板识别
  gapAnalysis: {
    dimensionGaps: Array<{
      dimension: string
      currentScore: number
      targetScore: number
      gap: number
      priority: 'high' | 'medium' | 'low'
    }>
    missingSkills: Array<{
      skill: string
      importance: number
      reason: string
    }>
  }

  // 推荐的下一个项目
  recommendedProjects: Array<{
    projectType: string
    difficulty: string
    reason: string
    willImprove: string[]
    estimatedTime: string
  }>

  // 学习路径
  learningPath: {
    shortTerm: Array<{
      goal: string
      actions: string[]
      timeline: string
    }>
    mediumTerm: Array<{
      goal: string
      actions: string[]
      timeline: string
    }>
    longTerm: Array<{
      goal: string
      actions: string[]
      timeline: string
    }>
  }

  // 个性化建议
  personalizedAdvice: {
    basedOnPersonality: string[]
    basedOnProgress: string[]
    basedOnGoals: string[]
  }

  // AI导师寄语
  mentorMessage: string
}

export class AIMentorService {

  /**
   * 生成AI导师指导
   */
  async generateMentorGuidance(userId: string): Promise<MentorGuidance> {
    try {
      log.info('开始生成AI导师指导', { userId })

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

      // 3. 获取能力雷达
      const latestRadar = await AbilityRadar.findOne({
        userId: new mongoose.Types.ObjectId(userId)
      }).sort({ createdAt: -1 })

      // 4. 获取完成的项目
      const projects = await RealProject.find({
        userId: new mongoose.Types.ObjectId(userId),
        status: 'completed'
      }).sort({ completedAt: -1 })

      // 5. 分析学生画像
      const profileAnalysis = this.analyzeProfile(user, studentProfile, latestRadar)

      // 6. 识别能力短板
      const gapAnalysis = await this.analyzeGaps(
        studentProfile,
        latestRadar,
        projects
      )

      // 7. 推荐下一个项目
      const recommendedProjects = await this.recommendNextProjects(
        user,
        studentProfile,
        gapAnalysis,
        projects
      )

      // 8. 生成学习路径
      const learningPath = await this.generateLearningPath(
        user,
        studentProfile,
        gapAnalysis
      )

      // 9. 生成个性化建议
      const personalizedAdvice = await this.generatePersonalizedAdvice(
        user,
        studentProfile,
        projects,
        gapAnalysis
      )

      // 10. 生成AI导师寄语
      const mentorMessage = await this.generateMentorMessage(
        user,
        profileAnalysis,
        recommendedProjects
      )

      const guidance: MentorGuidance = {
        userId,
        generatedAt: new Date(),
        profileAnalysis,
        gapAnalysis,
        recommendedProjects,
        learningPath,
        personalizedAdvice,
        mentorMessage
      }

      log.info('AI导师指导生成成功', { userId })
      return guidance
    } catch (error: any) {
      log.error('生成AI导师指导失败', { userId, error: error.message })
      throw error
    }
  }

  /**
   * 分析学生画像
   */
  private analyzeProfile(user: any, studentProfile: any, latestRadar: any) {
    // 提取top优势标签
    const topStrengths = studentProfile.tags
      .filter((t: any) => t.tagId.category === 'advantage')
      .sort((a: any, b: any) => b.weight - a.weight)
      .slice(0, 5)
      .map((t: any) => t.tagId.name)

    // 识别弱项（分数低的维度）
    const weaknesses = latestRadar
      ? latestRadar.dimensions
          .filter((d: any) => d.score < 60)
          .map((d: any) => d.name)
      : []

    // 根据OPC人格推断学习风格
    const learningStyleMap: Record<string, string> = {
      '视觉叙事者': '视觉化学习，喜欢图像和案例',
      '系统构建者': '结构化学习，喜欢框架和体系',
      '创意执行者': '实践中学习，边做边学',
      '逻辑拆解者': '分析式学习，喜欢推理和验证',
      '稳健交付者': '循序渐进学习，注重扎实基础',
      '探索整合者': '跨界学习，喜欢连接不同领域',
      '混合型': '多元化学习方式'
    }

    return {
      personalityTag: user.personalityTag || '混合型',
      level: user.level || 1,
      topStrengths,
      weaknesses,
      learningStyle: learningStyleMap[user.personalityTag] || '多元化学习方式'
    }
  }

  /**
   * 分析能力短板
   */
  private async analyzeGaps(
    studentProfile: any,
    latestRadar: any,
    projects: any[]
  ) {
    // 维度短板
    const dimensionGaps = latestRadar
      ? latestRadar.dimensions.map((d: any) => {
          const targetScore = 80 // 目标分数
          const gap = Math.max(0, targetScore - d.score)

          let priority: 'high' | 'medium' | 'low' = 'low'
          if (gap > 30) priority = 'high'
          else if (gap > 15) priority = 'medium'

          return {
            dimension: d.name,
            currentScore: d.score,
            targetScore,
            gap,
            priority
          }
        }).filter((g: any) => g.gap > 0)
      : []

    // 缺失的重要技能（基于AI分析）
    const currentSkills = studentProfile.tags
      .filter((t: any) => t.tagId.category === 'advantage')
      .map((t: any) => t.tagId.name)

    const prompt = `分析学生缺失的重要技能。

【当前技能】
${currentSkills.slice(0, 10).join('\n')}

【完成项目】
${projects.slice(0, 5).map((p: any) => `- ${p.category}`).join('\n')}

【能力短板】
${dimensionGaps.map((g: any) => `- ${g.dimension}: ${g.currentScore}分（差距${g.gap}分）`).join('\n')}

请推荐3-5个学生缺失但重要的技能，以JSON格式返回：
{
  "skills": [
    {
      "skill": "用户调研能力",
      "importance": 8,
      "reason": "需要更好地理解用户需求"
    }
  ]
}`

    const completion = await openai.chat.completions.create({
      model: AI_CONFIG.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    })

    const result = JSON.parse(completion.choices[0].message.content || '{"skills":[]}')

    return {
      dimensionGaps,
      missingSkills: result.skills || []
    }
  }

  /**
   * 推荐下一个项目
   */
  private async recommendNextProjects(
    user: any,
    studentProfile: any,
    gapAnalysis: any,
    projects: any[]
  ) {
    const weakDimensions = gapAnalysis.dimensionGaps
      .filter((g: any) => g.priority === 'high')
      .map((g: any) => g.dimension)

    const prompt = `为学生推荐下一个项目。

【学生信息】
OPC人格：${user.personalityTag}
等级：Lv.${user.level}

【能力短板】
${weakDimensions.join(', ')}

【缺失技能】
${gapAnalysis.missingSkills.slice(0, 3).map((s: any) => s.skill).join(', ')}

【已完成项目】
${projects.slice(0, 3).map((p: any) => p.category).join(', ')}

请推荐3个适合的下一个项目，每个项目：
1. 能补足能力短板
2. 难度适中（不要太难也不要太简单）
3. 能快速提升

以JSON格式返回：
{
  "projects": [
    {
      "projectType": "用户调研项目",
      "difficulty": "medium",
      "reason": "补足logical维度，提升用户理解能力",
      "willImprove": ["logical", "communication"],
      "estimatedTime": "5-7天"
    }
  ]
}`

    const completion = await openai.chat.completions.create({
      model: AI_CONFIG.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })

    const result = JSON.parse(completion.choices[0].message.content || '{"projects":[]}')
    return result.projects || []
  }

  /**
   * 生成学习路径
   */
  private async generateLearningPath(
    user: any,
    studentProfile: any,
    gapAnalysis: any
  ) {
    const prompt = `为学生设计学习路径。

【学生信息】
OPC人格：${user.personalityTag}
等级：Lv.${user.level}

【能力短板】
${gapAnalysis.dimensionGaps.slice(0, 3).map((g: any) => `- ${g.dimension}: 差距${g.gap}分`).join('\n')}

【缺失技能】
${gapAnalysis.missingSkills.slice(0, 3).map((s: any) => s.skill).join('\n')}

设计学习路径：
1. 短期（1-2周）：2个目标
2. 中期（1-2个月）：2个目标
3. 长期（3-6个月）：1个目标

每个目标包括：具体行动、时间线

以JSON格式返回：
{
  "shortTerm": [
    {"goal": "提升逻辑分析能力", "actions": ["..."], "timeline": "1-2周"}
  ],
  "mediumTerm": [...],
  "longTerm": [...]
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
   * 生成个性化建议
   */
  private async generatePersonalizedAdvice(
    user: any,
    studentProfile: any,
    projects: any[],
    gapAnalysis: any
  ) {
    const prompt = `为学生提供个性化建议。

【学生信息】
OPC人格：${user.personalityTag}
等级：Lv.${user.level}
完成项目：${projects.length}个

【能力短板】
${gapAnalysis.dimensionGaps.slice(0, 3).map((g: any) => g.dimension).join(', ')}

分别提供：
1. 基于人格的建议（3条）
2. 基于进度的建议（3条）
3. 基于目标的建议（3条）

以JSON格式返回：
{
  "basedOnPersonality": ["...", "...", "..."],
  "basedOnProgress": ["...", "...", "..."],
  "basedOnGoals": ["...", "...", "..."]
}`

    const completion = await openai.chat.completions.create({
      model: AI_CONFIG.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8
    })

    return JSON.parse(completion.choices[0].message.content || '{}')
  }

  /**
   * 生成AI导师寄语
   */
  private async generateMentorMessage(
    user: any,
    profileAnalysis: any,
    recommendedProjects: any[]
  ) {
    const prompt = `作为AI导师，给学生一段鼓励和指导的话。

【学生信息】
姓名：${user.name || '同学'}
OPC人格：${profileAnalysis.personalityTag}
等级：Lv.${profileAnalysis.level}
核心优势：${profileAnalysis.topStrengths.slice(0, 3).join('、')}

【推荐项目】
${recommendedProjects.slice(0, 2).map((p: any) => `- ${p.projectType}`).join('\n')}

要求：
1. 温暖、真诚、像朋友一样
2. 肯定已有的优势
3. 鼓励继续成长
4. 具体建议下一步
5. 200-250字

直接返回寄语内容（不要JSON格式）。`

    const completion = await openai.chat.completions.create({
      model: AI_CONFIG.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9,
      max_tokens: 400
    })

    return completion.choices[0].message.content || '继续加油，你一定可以的！'
  }
}

export const aiMentorService = new AIMentorService()
