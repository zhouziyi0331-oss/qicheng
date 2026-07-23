import { openai, AI_CONFIG } from '../config/openai'
import { RealProject } from '../models/RealProject'
import { StudentTagProfile, Tag } from '../models/Tag'
import { User } from '../models/User'
import { vectorMatchService } from './vectorMatch.service'
import { log } from '../utils/logger'
import mongoose from 'mongoose'

/**
 * 项目完成总结服务
 * 基于标签体系生成项目总结报告
 */
export class ProjectSummaryService {

  /**
   * 生成项目完成总结
   */
  async generateProjectSummary(userId: string, projectId: string) {
    try {
      log.info('开始生成项目完成总结', { userId, projectId })

      // 1. 获取项目信息
      const project = await RealProject.findById(projectId)
      if (!project) {
        throw new Error('项目不存在')
      }

      // 2. 获取学生信息和标签画像
      const user = await User.findById(userId)
      const studentProfile = await StudentTagProfile.findOne({
        userId: new mongoose.Types.ObjectId(userId)
      }).populate('tags.tagId skillLevels.tagId interests.tagId')

      if (!studentProfile) {
        throw new Error('学生标签画像不存在，请先初始化')
      }

      // 3. 分析项目内容，提取展现的能力标签
      const demonstratedTags = await this.analyzeProjectAndExtractTags(
        project,
        studentProfile
      )

      // 4. 识别新获得的标签
      const newTags = await this.identifyNewTags(
        project,
        studentProfile,
        demonstratedTags
      )

      // 5. 计算能力成长
      const abilityGrowth = await this.calculateAbilityGrowth(
        userId,
        demonstratedTags
      )

      // 6. 生成AI总结文案
      const aiSummary = await this.generateAISummary(
        user,
        project,
        demonstratedTags,
        newTags,
        abilityGrowth
      )

      // 7. 更新学生标签画像（添加新标签）
      await this.updateStudentProfile(userId, newTags)

      // 8. 构建完整的总结报告
      const summary = {
        projectId,
        projectTitle: project.title,
        projectType: project.category,
        completedAt: new Date(),

        // 展现的能力
        demonstratedAbilities: demonstratedTags.map(t => ({
          tagId: t._id,
          tagName: t.name,
          category: t.category,
          dimension: this.getTagDimension(t),
          contribution: t.contribution
        })),

        // 新获得的标签
        newAcquiredTags: newTags.map(t => ({
          tagId: t.tagId,
          tagName: t.tagName,
          category: t.category,
          reason: t.reason
        })),

        // 能力成长
        abilityGrowth: abilityGrowth.map(g => ({
          dimension: g.dimension,
          before: g.before,
          after: g.after,
          growth: g.growth
        })),

        // AI总结
        aiSummary,

        // 统计
        stats: {
          totalTagsNow: studentProfile.tags.length + newTags.length,
          newTagsCount: newTags.length,
          dimensionsImproved: abilityGrowth.filter(g => g.growth > 0).length
        }
      }

      log.info('项目完成总结生成成功', {
        userId,
        projectId,
        newTagsCount: newTags.length
      })

      return summary
    } catch (error: any) {
      log.error('生成项目完成总结失败', { userId, projectId, error: error.message })
      throw error
    }
  }

  /**
   * 分析项目并提取展现的能力标签
   */
  private async analyzeProjectAndExtractTags(
    project: any,
    studentProfile: any
  ) {
    // 使用AI分析项目，提取学生展现的能力
    const prompt = `分析这个项目，提取学生展现的能力标签。

【项目信息】
标题：${project.title}
描述：${project.description}
类型：${project.category}
难度：${project.difficulty}

【学生已有标签】
${studentProfile.tags.map((t: any) => `- ${t.tagId.name}`).join('\n')}

请从学生已有标签中，选出在这个项目中**实际展现**的能力标签（5-10个），
以JSON数组格式返回：
[
  {"tagName": "擅长视觉叙事", "contribution": 0.9},
  {"tagName": "擅长品牌设计", "contribution": 0.8}
]

contribution表示该标签对项目的贡献度（0-1）。`

    const completion = await openai.chat.completions.create({
      model: AI_CONFIG.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })

    const result = JSON.parse(completion.choices[0].message.content || '{"tags":[]}')
    const tagNames = result.tags || []

    // 从学生画像中找到对应的标签对象
    const demonstratedTags = []
    for (const item of tagNames) {
      const tag = studentProfile.tags.find((t: any) =>
        t.tagId.name === item.tagName
      )
      if (tag) {
        demonstratedTags.push({
          ...tag.tagId.toObject(),
          contribution: item.contribution
        })
      }
    }

    return demonstratedTags
  }

  /**
   * 识别新获得的标签
   */
  private async identifyNewTags(
    project: any,
    studentProfile: any,
    demonstratedTags: any[]
  ) {
    // 使用AI识别学生通过这个项目新获得的标签
    const prompt = `分析学生完成这个项目后，新获得了哪些标签。

【项目信息】
标题：${project.title}
描述：${project.description}
类型：${project.category}

【学生已有标签】
${studentProfile.tags.map((t: any) => `- ${t.tagId.name}`).join('\n')}

【可选的新标签类型】
过往经验类标签，例如：
- "做过品牌设计项目"
- "做过网站开发项目"
- "从0到1做过产品"
- "处理过客户需求"
- "独立完成过项目"
等等...

请根据项目内容，推荐3-5个学生新获得的经验类标签，
以JSON数组格式返回：
[
  {"tagName": "做过品牌设计项目", "reason": "完成了完整的品牌Logo设计"},
  {"tagName": "从0到1做过产品", "reason": "从零开始建立品牌视觉体系"}
]`

    const completion = await openai.chat.completions.create({
      model: AI_CONFIG.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    })

    const result = JSON.parse(completion.choices[0].message.content || '{"tags":[]}')
    const newTagNames = result.tags || []

    // 在标签库中查找或创建这些标签
    const newTags = []
    for (const item of newTagNames) {
      // 先查找是否已存在
      let tag = await Tag.findOne({
        name: item.tagName,
        category: 'experience'
      })

      // 如果不存在，创建新标签
      if (!tag) {
        tag = await vectorMatchService.createTag(
          item.tagName,
          'experience',
          item.reason,
          1.0
        )
      }

      newTags.push({
        tagId: tag._id,
        tagName: tag.name,
        category: tag.category,
        reason: item.reason,
        weight: 0.6, // 新获得的经验标签权重0.6
        source: 'project'
      })
    }

    return newTags
  }

  /**
   * 计算能力成长
   */
  private async calculateAbilityGrowth(userId: string, demonstratedTags: any[]) {
    // 从AbilityRadar获取之前的能力分数
    const { AbilityRadar } = await import('../models/AbilityRadar')

    const latestRadar = await AbilityRadar.findOne({
      userId: new mongoose.Types.ObjectId(userId)
    }).sort({ createdAt: -1 })

    if (!latestRadar) {
      return []
    }

    // 计算每个维度的成长
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
        // 根据展现的标签，计算该维度的提升
        const relatedTags = demonstratedTags.filter(t =>
          this.getTagDimension(t) === key
        )

        const growthValue = relatedTags.length > 0
          ? Math.min(relatedTags.length * 2, 10) // 每个相关标签+2分，最多+10
          : 0

        if (growthValue > 0) {
          growth.push({
            dimension: dimensionName,
            before: dimension.score,
            after: dimension.score + growthValue,
            growth: growthValue
          })
        }
      }
    }

    return growth
  }

  /**
   * 生成AI总结文案
   */
  private async generateAISummary(
    user: any,
    project: any,
    demonstratedTags: any[],
    newTags: any[],
    abilityGrowth: any[]
  ) {
    const prompt = `为学生生成项目完成总结。

【学生信息】
- 姓名：${user.name || '同学'}
- OPC人格：${user.personalityTag}
- 等级：Lv.${user.level}

【项目信息】
- 标题：${project.title}
- 类型：${project.category}
- 难度：${project.difficulty}

【展现的能力】
${demonstratedTags.map(t => `- ${t.name}`).join('\n')}

【新获得的标签】
${newTags.map(t => `- ${t.tagName}（${t.reason}）`).join('\n')}

【能力成长】
${abilityGrowth.map(g => `- ${g.dimension}维度：${g.before} → ${g.after}（+${g.growth}）`).join('\n')}

请生成一段温暖、鼓励、具体的项目总结（200-300字），包括：
1. 祝贺完成项目
2. 总结展现的核心能力（2-3个）
3. 强调新获得的经验
4. 鼓励继续成长

语气要温暖、真诚，像朋友一样，不要太正式。`

    const completion = await openai.chat.completions.create({
      model: AI_CONFIG.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 500
    })

    return completion.choices[0].message.content || '恭喜你完成项目！'
  }

  /**
   * 更新学生标签画像（添加新标签）
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
   * 获取标签对应的能力维度
   */
  private getTagDimension(tag: any): string {
    // 根据标签名称推断对应的能力维度
    const name = tag.name.toLowerCase()

    if (name.includes('视觉') || name.includes('设计') || name.includes('ui') || name.includes('色彩')) {
      return 'visual'
    }
    if (name.includes('系统') || name.includes('架构') || name.includes('流程') || name.includes('规范')) {
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
    if (name.includes('学习') || name.includes('上手') || name.includes('迁移')) {
      return 'learning'
    }

    return 'mixed'
  }
}

export const projectSummaryService = new ProjectSummaryService()
