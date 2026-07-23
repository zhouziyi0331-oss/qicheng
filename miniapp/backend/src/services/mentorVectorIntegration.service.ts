/**
 * AI导师增强版 - 向量匹配集成
 * 在PBL引导中加入基于向量匹配的项目推荐
 */

import { vectorMatchService } from './vectorMatch.service'
import { MentorServiceEnhanced } from './mentorEnhanced.service'

/**
 * 扩展AI导师服务：集成向量推荐
 */
export class MentorWithVectorMatch extends MentorServiceEnhanced {

  /**
   * 智能项目推荐（结合向量匹配）
   * 在学生寻找新项目时调用
   */
  async recommendProjectsWithReason(userId: string, limit: number = 10) {
    try {
      // 使用向量匹配获取推荐
      const recommendations = await vectorMatchService.recommendProjects(userId, limit)

      // 为每个推荐生成个性化理由
      const recommendationsWithAI = []

      for (const rec of recommendations.slice(0, 5)) { // 只对前5个生成详细理由
        const aiReason = await this.generateRecommendationReason(
          userId,
          rec.project,
          rec.overallScore,
          rec.vectorSimilarity,
          rec.matchedTags,
          rec.missingRequiredSkills,
          rec.isStretchProject
        )

        recommendationsWithAI.push({
          ...rec,
          aiGeneratedReason: aiReason
        })
      }

      // 其余推荐使用简短理由
      for (const rec of recommendations.slice(5)) {
        recommendationsWithAI.push({
          ...rec,
          aiGeneratedReason: this.generateShortReason(rec)
        })
      }

      return recommendationsWithAI
    } catch (error: any) {
      console.error('智能推荐失败:', error.message)
      throw error
    }
  }

  /**
   * 生成AI推荐理由
   */
  private async generateRecommendationReason(
    userId: string,
    project: any,
    overallScore: number,
    vectorSimilarity: number,
    matchedTags: any[],
    missingSkills: any[],
    isStretch: boolean
  ) {
    const { User } = await import('../models/User')
    const { Tag } = await import('../models/Tag')

    const user = await User.findById(userId)

    // 获取匹配标签名称
    const matchedTagNames = []
    for (const mt of matchedTags.slice(0, 3)) {
      const tag = await Tag.findById(mt.tagId)
      if (tag) matchedTagNames.push(tag.name)
    }

    // 获取缺失技能名称
    const missingSkillNames = []
    for (const skillId of missingSkills.slice(0, 2)) {
      const skill = await Tag.findById(skillId)
      if (skill) missingSkillNames.push(skill.name)
    }

    const prompt = `为学生生成项目推荐理由。

学生信息：
- OPC人格：${user?.personalityTag || '未知'}
- 等级：Lv.${user?.level || 1}
- 完成项目：${user?.totalProjects || 0}个

项目信息：
- 标题：${project.title}
- 描述：${project.description}
- 难度：${project.difficulty}
- 预算：¥${project.budget}

匹配情况：
- 匹配分数：${overallScore}/100
- 相似度：${(vectorSimilarity * 100).toFixed(1)}%
- 匹配的标签：${matchedTagNames.join('、') || '无'}
- 缺失技能：${missingSkillNames.join('、') || '无'}
- ${isStretch ? '🔥 这是一个冒险项目（略高于当前水平）' : '适合当前水平'}

请生成一段推荐理由（100-150字），要求：
1. **个性化**：结合学生的OPC人格特点
2. **具体**：说明为什么这个项目适合TA
3. **坦诚**：如果有缺失技能，诚实告知但鼓励尝试
4. **温暖**：像朋友推荐一样，不要太正式
5. **如果是冒险项目**：强调成长机会

不要说"根据匹配分数"、"算法推荐"等技术词汇，要像真人导师一样推荐。`

    const { openai, AI_CONFIG } = await import('../config/openai')

    const completion = await openai.chat.completions.create({
      model: AI_CONFIG.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 300
    })

    return completion.choices[0].message.content || '这个项目可能适合你。'
  }

  /**
   * 生成简短推荐理由
   */
  private generateShortReason(rec: any): string {
    const score = rec.overallScore
    const isStretch = rec.isStretchProject

    if (isStretch) {
      return `🔥 冒险项目 - 匹配度${score}分。这个项目略高于你当前水平，是个不错的成长机会。`
    }

    if (score >= 80) {
      return `匹配度${score}分。这个项目非常适合你，可以发挥你的优势。`
    } else if (score >= 60) {
      return `匹配度${score}分。这个项目比较适合，有一定挑战但可以胜任。`
    } else {
      return `匹配度${score}分。这个项目有些挑战，但如果感兴趣可以试试。`
    }
  }

  /**
   * 当学生完成项目后，更新标签画像
   */
  async updateProfileAfterProject(userId: string, projectId: string) {
    try {
      const { RealProject } = await import('../models/RealProject')
      const { Tag } = await import('../models/Tag')

      const project = await RealProject.findById(projectId)
      if (!project) {
        throw new Error('项目不存在')
      }

      // 从项目中提取学生新获得/提升的能力
      const gainedAbilities = project.abilitiesGained || []
      const improvedAbilities = project.abilitiesImproved || []

      // 将能力转为标签并添加到学生画像
      for (const abilityName of gainedAbilities) {
        // 查找对应标签
        const tag = await Tag.findOne({
          name: { $regex: abilityName, $options: 'i' },
          category: 'skill'
        })

        if (tag) {
          await vectorMatchService.addStudentTag(
            userId,
            tag._id.toString(),
            0.6, // 新获得的能力，权重0.6
            'project'
          )
        }
      }

      for (const abilityName of improvedAbilities) {
        const tag = await Tag.findOne({
          name: { $regex: abilityName, $options: 'i' },
          category: 'skill'
        })

        if (tag) {
          await vectorMatchService.addStudentTag(
            userId,
            tag._id.toString(),
            0.8, // 提升的能力，权重0.8
            'project'
          )
        }
      }

      console.log('项目完成后更新标签画像成功', { userId, projectId })
    } catch (error: any) {
      console.error('更新标签画像失败:', error.message)
    }
  }
}

export const mentorWithVectorMatch = new MentorWithVectorMatch()
