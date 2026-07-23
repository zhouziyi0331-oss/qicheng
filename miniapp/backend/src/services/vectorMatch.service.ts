import OpenAI from 'openai'
import { Tag, StudentTagProfile, ProjectTagProfile, MatchRecord } from '../models/Tag'
import { User } from '../models/User'
import { RealProject } from '../models/RealProject'
import { OPCResult } from '../models/OPCResult'
import { qdrantVectorService } from './qdrantVector.service'
import { log } from '../utils/logger'
import mongoose from 'mongoose'

/**
 * 向量匹配服务 - 真正的向量数据库实现
 * 使用Qdrant进行高效的向量检索
 */
export class VectorMatchService {
  private openai: OpenAI | null = null

  constructor() {
    // 延迟初始化OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      })
    }
  }

  private getOpenAI(): OpenAI {
    if (!this.openai) {
      throw new Error('OpenAI API key未配置')
    }
    return this.openai
  }

  // ========== 向量化（Embeddings） ==========

  /**
   * 生成文本的向量表示
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const client = this.getOpenAI()
      const response = await client.embeddings.create({
        model: 'text-embedding-3-small', // 1536维向量
        input: text
      })

      return response.data[0].embedding
    } catch (error: any) {
      log.error('生成向量失败', { error: error.message, text })
      throw new Error('向量生成失败')
    }
  }

  /**
   * 批量生成向量
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const client = this.getOpenAI()
      const response = await client.embeddings.create({
        model: 'text-embedding-3-small',
        input: texts
      })

      return response.data.map(item => item.embedding)
    } catch (error: any) {
      log.error('批量生成向量失败', { error: error.message, count: texts.length })
      throw new Error('批量向量生成失败')
    }
  }

  // ========== 标签管理 ==========

  /**
   * 创建标签并生成向量，存入Qdrant
   */
  async createTag(
    name: string,
    category: string,
    description?: string,
    weight: number = 1.0
  ) {
    try {
      // 检查MongoDB中是否已存在
      const existing = await Tag.findOne({ name, category })
      if (existing) {
        log.info('标签已存在', { name, category })
        return existing
      }

      // 生成向量
      const embeddingText = description ? `${name}: ${description}` : name
      const embedding = await this.generateEmbedding(embeddingText)

      // 保存到MongoDB
      const tag = await Tag.create({
        name,
        category,
        description,
        weight,
        usageCount: 0,
        isActive: true
      })

      // 保存向量到Qdrant
      await qdrantVectorService.upsertTagVector(
        tag._id.toString(),
        embedding,
        {
          name: tag.name,
          category: tag.category,
          description: tag.description,
          weight: tag.weight,
          createdAt: tag.createdAt
        }
      )

      log.info('标签创建成功（MongoDB + Qdrant）', { tagId: tag._id, name, category })
      return tag
    } catch (error: any) {
      log.error('创建标签失败', { error: error.message, name, category })
      throw error
    }
  }

  /**
   * 批量创建标签
   */
  async batchCreateTags(tags: Array<{
    name: string
    category: string
    description?: string
    weight?: number
  }>) {
    const results = []
    const qdrantBatch = []

    for (const tagData of tags) {
      try {
        // 检查MongoDB中是否已存在
        const existing = await Tag.findOne({
          name: tagData.name,
          category: tagData.category
        })

        if (existing) {
          log.info('标签已存在，跳过', { name: tagData.name })
          results.push(existing)
          continue
        }

        // 生成向量
        const embeddingText = tagData.description
          ? `${tagData.name}: ${tagData.description}`
          : tagData.name
        const embedding = await this.generateEmbedding(embeddingText)

        // 保存到MongoDB
        const tag = await Tag.create({
          name: tagData.name,
          category: tagData.category,
          description: tagData.description,
          weight: tagData.weight || 1.0,
          usageCount: 0,
          isActive: true
        })

        results.push(tag)

        // 准备Qdrant批量数据
        qdrantBatch.push({
          tagId: tag._id.toString(),
          vector: embedding,
          metadata: {
            name: tag.name,
            category: tag.category,
            description: tag.description,
            weight: tag.weight,
            createdAt: tag.createdAt
          }
        })

        // 每50个批量插入一次Qdrant
        if (qdrantBatch.length >= 50) {
          await qdrantVectorService.batchUpsertTagVectors(qdrantBatch)
          log.info('Qdrant批量插入完成', { count: qdrantBatch.length })
          qdrantBatch.length = 0 // 清空
        }

      } catch (error) {
        log.error('批量创建标签-单个失败', { tagData })
      }
    }

    // 插入剩余的
    if (qdrantBatch.length > 0) {
      await qdrantVectorService.batchUpsertTagVectors(qdrantBatch)
      log.info('Qdrant批量插入完成（剩余）', { count: qdrantBatch.length })
    }

    log.info('批量创建标签完成', { total: tags.length, success: results.length })
    return results
  }

  // ========== 学生标签画像 ==========

  /**
   * 基于OPC测评初始化学生标签画像
   */
  async initializeStudentProfile(userId: string) {
    try {
      const user = await User.findById(userId)
      if (!user) {
        throw new Error('用户不存在')
      }

      // 获取OPC测评结果
      const opcResult = await OPCResult.findOne({
        userId: new mongoose.Types.ObjectId(userId)
      }).sort({ completedAt: -1 })

      if (!opcResult) {
        throw new Error('请先完成OPC测评')
      }

      // 检查是否已存在画像
      let profile = await StudentTagProfile.findOne({
        userId: new mongoose.Types.ObjectId(userId)
      })

      if (!profile) {
        profile = await StudentTagProfile.create({
          userId: new mongoose.Types.ObjectId(userId),
          tags: [],
          skillLevels: [],
          interests: [],
          lastUpdated: new Date()
        })
      }

      // 从OPC结果提取标签
      const personalityTag = user.personalityTag || opcResult.result.personalityTag

      // 查找或创建人格标签
      const personalityTagDoc = await Tag.findOne({
        name: personalityTag,
        category: 'personality'
      })

      if (personalityTagDoc) {
        const existingTag = profile.tags.find(
          t => t.tagId.toString() === personalityTagDoc._id.toString()
        )

        if (!existingTag) {
          profile.tags.push({
            tagId: personalityTagDoc._id,
            weight: 0.9,
            source: 'opc',
            confidence: 0.9,
            addedAt: new Date()
          })
        }
      }

      // 从维度分数提取技能标签
      if (opcResult.result.dimensionScores) {
        for (const dim of opcResult.result.dimensionScores) {
          if (dim.score >= 60) {
            const skillTag = await Tag.findOne({
              name: dim.dimension,
              category: 'skill'
            })

            if (skillTag) {
              const existingTag = profile.tags.find(
                t => t.tagId.toString() === skillTag._id.toString()
              )

              if (!existingTag) {
                profile.tags.push({
                  tagId: skillTag._id,
                  weight: dim.score / 100,
                  source: 'opc',
                  confidence: 0.8,
                  addedAt: new Date()
                })
              }

              const existingSkill = profile.skillLevels.find(
                s => s.tagId.toString() === skillTag._id.toString()
              )

              if (!existingSkill) {
                profile.skillLevels.push({
                  tagId: skillTag._id,
                  level: Math.ceil(dim.score / 20),
                  experienceProjects: 0,
                  lastUpdated: new Date()
                })
              }
            }
          }
        }
      }

      // 生成学生的综合向量表示（加权平均）
      const profileEmbedding = await this.computeProfileEmbedding(profile.tags)
      profile.profileEmbedding = profileEmbedding

      profile.lastUpdated = new Date()
      await profile.save()

      // 保存向量到Qdrant
      if (profileEmbedding && profileEmbedding.length > 0) {
        await qdrantVectorService.upsertStudentProfile(
          userId,
          profileEmbedding,
          {
            personalityTag: user.personalityTag,
            level: user.level,
            totalProjects: user.totalProjects,
            tagCount: profile.tags.length,
            skillLevelCount: profile.skillLevels.length,
            interestCount: profile.interests.length
          }
        )
      }

      log.info('学生标签画像初始化成功（MongoDB + Qdrant）', {
        userId,
        tagCount: profile.tags.length
      })
      return profile
    } catch (error: any) {
      log.error('初始化学生标签画像失败', { userId, error: error.message })
      throw error
    }
  }

  /**
   * 计算画像的综合向量表示（加权平均）
   */
  async computeProfileEmbedding(tags: Array<{ tagId: any, weight: number }>): Promise<number[]> {
    if (tags.length === 0) {
      return []
    }

    // 从Qdrant获取所有标签的向量
    const tagIds = tags.map(t => t.tagId.toString())
    const tagVectors: Array<{ tagId: string, vector: number[] }> = []

    for (const tagId of tagIds) {
      try {
        const result = await qdrantVectorService.searchSimilarTags(
          [], // 空查询，只是用来retrieve
          1,
          { must: [{ key: 'tagId', match: { value: tagId } }] }
        )

        // 实际上用retrieve更好，但为了简化先用这个
        // TODO: 优化为直接retrieve

      } catch (error) {
        log.warn('获取标签向量失败', { tagId })
      }
    }

    // 获取标签文档（包含向量，如果之前存了的话）
    const tagDocs = await Tag.find({
      _id: { $in: tags.map(t => t.tagId) }
    })

    // 由于我们现在向量在Qdrant，MongoDB里没存embedding
    // 需要从Qdrant获取，这里先用一个workaround：
    // 把所有标签名拼接起来，生成一个综合向量

    const tagNames = tagDocs.map(t => t.name).join(', ')
    if (!tagNames) {
      return []
    }

    const combinedEmbedding = await this.generateEmbedding(tagNames)
    return combinedEmbedding
  }

  /**
   * 添加学生标签
   */
  async addStudentTag(
    userId: string,
    tagId: string,
    weight: number,
    source: 'opc' | 'project' | 'self' | 'system'
  ) {
    try {
      let profile = await StudentTagProfile.findOne({
        userId: new mongoose.Types.ObjectId(userId)
      })

      if (!profile) {
        profile = await StudentTagProfile.create({
          userId: new mongoose.Types.ObjectId(userId),
          tags: [],
          skillLevels: [],
          interests: [],
          lastUpdated: new Date()
        })
      }

      const existingIndex = profile.tags.findIndex(
        t => t.tagId.toString() === tagId
      )

      if (existingIndex >= 0) {
        profile.tags[existingIndex].weight = (profile.tags[existingIndex].weight + weight) / 2
        profile.tags[existingIndex].confidence = Math.min(1, profile.tags[existingIndex].confidence + 0.1)
      } else {
        profile.tags.push({
          tagId: new mongoose.Types.ObjectId(tagId),
          weight,
          source,
          confidence: 0.7,
          addedAt: new Date()
        })
      }

      // 重新计算综合向量
      profile.profileEmbedding = await this.computeProfileEmbedding(profile.tags)
      profile.lastUpdated = new Date()
      await profile.save()

      // 更新Qdrant
      if (profile.profileEmbedding && profile.profileEmbedding.length > 0) {
        const user = await User.findById(userId)
        await qdrantVectorService.upsertStudentProfile(
          userId,
          profile.profileEmbedding,
          {
            personalityTag: user?.personalityTag,
            level: user?.level,
            totalProjects: user?.totalProjects,
            tagCount: profile.tags.length,
            skillLevelCount: profile.skillLevels.length,
            interestCount: profile.interests.length
          }
        )
      }

      // 增加标签使用次数
      await Tag.findByIdAndUpdate(tagId, { $inc: { usageCount: 1 } })

      log.info('添加学生标签成功（MongoDB + Qdrant）', { userId, tagId, weight, source })
      return profile
    } catch (error: any) {
      log.error('添加学生标签失败', { userId, tagId, error: error.message })
      throw error
    }
  }

  // ========== 项目标签画像 ==========

  /**
   * 为项目创建标签画像
   */
  async createProjectProfile(
    projectId: string,
    projectType: 'real' | 'practice',
    tags: Array<{ tagId: string, importance: number, isRequired: boolean }>,
    industries: string[],
    requiredSkills: Array<{ tagId: string, priority: string, minLevel: number }>,
    suitablePersonalities: string[]
  ) {
    try {
      let profile = await ProjectTagProfile.findOne({
        projectId: new mongoose.Types.ObjectId(projectId),
        projectType
      })

      if (!profile) {
        profile = await ProjectTagProfile.create({
          projectId: new mongoose.Types.ObjectId(projectId),
          projectType,
          tags: [],
          industries: [],
          requiredSkills: [],
          suitablePersonalities: [],
          lastUpdated: new Date()
        })
      }

      profile.tags = tags.map(t => ({
        tagId: new mongoose.Types.ObjectId(t.tagId),
        importance: t.importance,
        isRequired: t.isRequired,
        addedAt: new Date()
      }))

      profile.industries = industries.map(id => new mongoose.Types.ObjectId(id))
      profile.requiredSkills = requiredSkills.map(s => ({
        tagId: new mongoose.Types.ObjectId(s.tagId),
        priority: s.priority as 'must' | 'important' | 'nice-to-have',
        minLevel: s.minLevel
      }))
      profile.suitablePersonalities = suitablePersonalities.map(id => new mongoose.Types.ObjectId(id))

      // 计算项目的综合向量
      profile.projectEmbedding = await this.computeProfileEmbedding(
        profile.tags.map(t => ({ tagId: t.tagId, weight: t.importance }))
      )

      profile.lastUpdated = new Date()
      await profile.save()

      // 保存向量到Qdrant
      if (profile.projectEmbedding && profile.projectEmbedding.length > 0) {
        const project = await RealProject.findById(projectId)
        if (project) {
          await qdrantVectorService.upsertProjectProfile(
            projectId,
            profile.projectEmbedding,
            {
              projectType,
              title: project.title,
              category: project.category,
              difficulty: project.difficulty,
              budget: project.budget,
              status: project.status,
              tagCount: profile.tags.length,
              requiredSkillCount: profile.requiredSkills.length
            }
          )
        }
      }

      // 增加标签使用次数
      for (const tag of tags) {
        await Tag.findByIdAndUpdate(tag.tagId, { $inc: { usageCount: 1 } })
      }

      log.info('项目标签画像创建成功（MongoDB + Qdrant）', {
        projectId,
        projectType,
        tagCount: tags.length
      })
      return profile
    } catch (error: any) {
      log.error('创建项目标签画像失败', { projectId, error: error.message })
      throw error
    }
  }

  // ========== 向量匹配推荐（核心功能） ==========

  /**
   * 智能项目推荐（使用Qdrant向量检索）
   */
  async recommendProjects(userId: string, limit: number = 20) {
    try {
      log.info('开始向量匹配推荐（Qdrant）', { userId })

      // 1. 获取学生标签画像
      let studentProfile = await StudentTagProfile.findOne({
        userId: new mongoose.Types.ObjectId(userId)
      }).populate('tags.tagId skillLevels.tagId interests.tagId')

      if (!studentProfile) {
        studentProfile = await this.initializeStudentProfile(userId)
      }

      if (!studentProfile.profileEmbedding || studentProfile.profileEmbedding.length === 0) {
        throw new Error('学生画像向量为空，请先完善标签')
      }

      // 2. 使用Qdrant进行向量检索（核心！）
      const qdrantResults = await qdrantVectorService.searchRecommendedProjects(
        studentProfile.profileEmbedding,
        limit * 2 // 多取一些，后续再精细筛选
      )

      log.info('Qdrant向量检索完成', {
        resultCount: qdrantResults.length,
        avgSimilarity: qdrantResults.length > 0
          ? (qdrantResults.reduce((sum, r) => sum + r.vectorSimilarity, 0) / qdrantResults.length).toFixed(3)
          : 0
      })

      // 3. 获取项目详情和画像
      const projectIds = qdrantResults.map(r => r.projectId.toString())
      const projects = await RealProject.find({
        _id: { $in: projectIds },
        status: 'available'
      })

      const projectProfiles = await ProjectTagProfile.find({
        projectId: { $in: projectIds },
        projectType: 'real'
      }).populate('tags.tagId requiredSkills.tagId suitablePersonalities')

      // 4. 计算详细匹配分数
      const matches = []

      for (const qdrantResult of qdrantResults) {
        const project = projects.find(
          p => p._id.toString() === qdrantResult.projectId.toString()
        )

        if (!project) continue

        const projectProfile = projectProfiles.find(
          pp => pp.projectId.toString() === qdrantResult.projectId.toString()
        )

        if (!projectProfile) continue

        const matchResult = await this.calculateMatchScore(
          userId,
          studentProfile,
          project,
          projectProfile,
          qdrantResult.vectorSimilarity // 使用Qdrant返回的相似度
        )

        matches.push(matchResult)
      }

      // 5. 按总分排序
      matches.sort((a, b) => b.overallScore - a.overallScore)

      // 6. 取前N个
      const topMatches = matches.slice(0, limit)

      // 7. 保存匹配记录
      for (const match of topMatches) {
        await this.saveMatchRecord(userId, match)
      }

      log.info('向量匹配推荐完成', {
        userId,
        qdrantResults: qdrantResults.length,
        matchedCount: topMatches.length,
        topScore: topMatches.length > 0 ? topMatches[0].overallScore : 0
      })

      return topMatches
    } catch (error: any) {
      log.error('向量匹配推荐失败', { userId, error: error.message })
      throw error
    }
  }

  /**
   * 计算学生-项目匹配分数
   */
  async calculateMatchScore(
    userId: string,
    studentProfile: any,
    project: any,
    projectProfile: any,
    vectorSimilarity: number // 来自Qdrant
  ) {
    // 1. 向量相似度（来自Qdrant，已经是0-1之间）
    const vectorScore = vectorSimilarity

    // 2. 技能匹配分数
    const skillMatchScore = this.calculateSkillMatch(
      studentProfile.skillLevels,
      projectProfile.requiredSkills
    )

    // 3. 人格匹配分数
    const personalityMatchScore = this.calculatePersonalityMatch(
      studentProfile.tags,
      projectProfile.suitablePersonalities
    )

    // 4. 兴趣匹配分数
    const interestMatchScore = this.calculateInterestMatch(
      studentProfile.interests,
      projectProfile.tags
    )

    // 5. 综合分数
    const overallScore = Math.round(
      vectorScore * 100 * 0.40 +       // 向量相似度占40%
      skillMatchScore * 0.35 +          // 技能匹配占35%
      personalityMatchScore * 0.15 +    // 人格匹配占15%
      interestMatchScore * 0.10         // 兴趣匹配占10%
    )

    // 6. 是否为冒险项目
    const user = await User.findById(userId)
    const isStretchProject = this.isStretchProject(user, project)

    // 7. 匹配的标签详情
    const matchedTags = this.findMatchedTags(
      studentProfile.tags,
      projectProfile.tags
    )

    // 8. 缺失的必需技能
    const missingRequiredSkills = this.findMissingRequiredSkills(
      studentProfile.skillLevels,
      projectProfile.requiredSkills
    )

    return {
      project,
      projectProfile,
      overallScore,
      vectorSimilarity: vectorScore,
      skillMatchScore,
      personalityMatchScore,
      interestMatchScore,
      matchedTags,
      missingRequiredSkills,
      isStretchProject
    }
  }

  /**
   * 计算技能匹配分数
   */
  calculateSkillMatch(studentSkills: any[], requiredSkills: any[]): number {
    if (requiredSkills.length === 0) {
      return 80
    }

    let totalScore = 0
    let mustCount = 0
    let mustMatchCount = 0

    for (const required of requiredSkills) {
      const studentSkill = studentSkills.find(
        s => s.tagId._id.toString() === required.tagId.toString()
      )

      if (required.priority === 'must') {
        mustCount++
        if (studentSkill && studentSkill.level >= required.minLevel) {
          mustMatchCount++
          totalScore += 30
        }
      } else if (required.priority === 'important') {
        if (studentSkill && studentSkill.level >= required.minLevel) {
          totalScore += 20
        } else if (studentSkill) {
          totalScore += 10
        }
      } else {
        if (studentSkill && studentSkill.level >= required.minLevel) {
          totalScore += 10
        }
      }
    }

    if (mustCount > 0 && mustMatchCount < mustCount) {
      totalScore = totalScore * 0.3
    }

    return Math.min(100, totalScore)
  }

  /**
   * 计算人格匹配分数
   */
  calculatePersonalityMatch(studentTags: any[], suitablePersonalities: any[]): number {
    if (suitablePersonalities.length === 0) {
      return 70
    }

    const studentPersonalities = studentTags.filter(
      t => t.tagId && t.tagId.category === 'personality'
    )

    for (const sp of studentPersonalities) {
      const isMatch = suitablePersonalities.some(
        suitable => suitable.toString() === sp.tagId._id.toString()
      )

      if (isMatch) {
        return 100
      }
    }

    return 40
  }

  /**
   * 计算兴趣匹配分数
   */
  calculateInterestMatch(studentInterests: any[], projectTags: any[]): number {
    if (studentInterests.length === 0) {
      return 50
    }

    let matchCount = 0

    for (const interest of studentInterests) {
      const isMatch = projectTags.some(
        pt => pt.tagId.toString() === interest.tagId.toString()
      )

      if (isMatch) {
        matchCount++
      }
    }

    return Math.min(100, matchCount * 30)
  }

  /**
   * 判断是否为冒险项目
   */
  isStretchProject(user: any, project: any): boolean {
    if (!user) return false

    const userLevel = user.level || 1
    const difficultyMap: Record<string, number> = {
      'easy': 1,
      'medium': 3,
      'hard': 5,
      'expert': 6
    }

    const projectLevel = difficultyMap[project.difficulty] || 3
    const gap = projectLevel - userLevel

    return gap >= 1 && gap <= 2
  }

  /**
   * 找出匹配的标签
   */
  findMatchedTags(studentTags: any[], projectTags: any[]) {
    const matched = []

    for (const st of studentTags) {
      for (const pt of projectTags) {
        if (st.tagId._id.toString() === pt.tagId.toString()) {
          matched.push({
            tagId: st.tagId._id,
            studentWeight: st.weight,
            projectImportance: pt.importance,
            contribution: st.weight * pt.importance * 100
          })
        }
      }
    }

    return matched
  }

  /**
   * 找出缺失的必需技能
   */
  findMissingRequiredSkills(studentSkills: any[], requiredSkills: any[]) {
    const missing = []

    for (const required of requiredSkills) {
      if (required.priority === 'must') {
        const studentSkill = studentSkills.find(
          s => s.tagId._id.toString() === required.tagId.toString()
        )

        if (!studentSkill || studentSkill.level < required.minLevel) {
          missing.push(required.tagId)
        }
      }
    }

    return missing
  }

  /**
   * 保存匹配记录
   */
  async saveMatchRecord(userId: string, matchResult: any) {
    try {
      await MatchRecord.create({
        userId: new mongoose.Types.ObjectId(userId),
        projectId: matchResult.project._id,
        projectType: 'real',
        overallScore: matchResult.overallScore,
        vectorSimilarity: matchResult.vectorSimilarity,
        skillMatchScore: matchResult.skillMatchScore,
        personalityMatchScore: matchResult.personalityMatchScore,
        interestMatchScore: matchResult.interestMatchScore,
        matchedTags: matchResult.matchedTags,
        missingRequiredSkills: matchResult.missingRequiredSkills,
        isStretchProject: matchResult.isStretchProject,
        matchedAt: new Date()
      })
    } catch (error: any) {
      log.error('保存匹配记录失败', { userId, error: error.message })
    }
  }
}

export const vectorMatchService = new VectorMatchService()
