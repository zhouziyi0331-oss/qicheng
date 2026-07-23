import { AbilityRadar } from '../models/AbilityRadar'
import { RealProject } from '../models/RealProject'
import { openai, AI_CONFIG } from '../config/openai'
import { log } from '../utils/logger'
import mongoose from 'mongoose'

/**
 * 能力雷达图服务
 */
export class AbilityRadarService {

  /**
   * 项目完成后生成新的雷达图快照
   */
  async generateAfterProjectCompletion(userId: string, projectId: string) {
    try {
      log.info('项目完成后生成雷达图', { userId, projectId })

      // 获取项目信息
      const project = await RealProject.findById(projectId)
      if (!project) {
        throw new Error('项目不存在')
      }

      // 获取上一次快照
      const previousSnapshot = await AbilityRadar.findOne({
        userId: new mongoose.Types.ObjectId(userId)
      }).sort({ snapshotNumber: -1 })

      if (!previousSnapshot) {
        throw new Error('用户还没有初始测评，无法生成项目后的雷达图')
      }

      // 调用AI分析项目对能力的影响
      const abilityChanges = await this.analyzeProjectImpact(project, previousSnapshot)

      // 获取已有快照数量
      const existingCount = await AbilityRadar.countDocuments({
        userId: new mongoose.Types.ObjectId(userId)
      })
      const snapshotNumber = existingCount + 1

      // 计算新的分数
      const dimensions = previousSnapshot.dimensions.map(prevDim => {
        const change = abilityChanges.find((c: any) => c.dimension === prevDim.name)
        const newScore = change
          ? Math.min(100, Math.max(0, prevDim.score + change.scoreChange))
          : prevDim.score

        return {
          name: prevDim.name,
          description: prevDim.description,
          score: newScore,
          level: this.calculateLevel(newScore),
          growth: newScore - prevDim.score,
          tags: change ? change.newTags : []
        }
      })

      const overallScore = Math.round(
        dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length
      )

      let rank: '新手' | '进阶' | '熟练' | '专家' | '大师' = '新手'
      if (overallScore >= 90) rank = '大师'
      else if (overallScore >= 80) rank = '专家'
      else if (overallScore >= 70) rank = '熟练'
      else if (overallScore >= 50) rank = '进阶'

      const newSnapshot = await AbilityRadar.create({
        userId: new mongoose.Types.ObjectId(userId),
        snapshotNumber,
        triggerType: 'project_completed',
        triggerRefId: new mongoose.Types.ObjectId(projectId),
        dimensions,
        overallScore,
        rank
      })

      log.info('雷达图生成成功', { userId, snapshotNumber })

      return newSnapshot

    } catch (error: any) {
      log.error('生成雷达图失败', { error: error.message, userId, projectId })
      throw new Error('雷达图生成失败')
    }
  }

  /**
   * AI分析项目对能力的影响
   */
  private async analyzeProjectImpact(project: any, previousSnapshot: any) {
    try {
      const prompt = `分析这个项目对用户能力的影响：

项目信息：
- 标题: ${project.title}
- 描述: ${project.description}
- 难度: ${project.difficulty}
- 类别: ${project.category}
- 需要能力: ${project.requiredAbilities.join(', ')}
- 客户评分: ${project.clientRating?.score || 'N/A'}/5

用户当前能力维度：
${previousSnapshot.dimensions.map((d: any) => `- ${d.name}: ${d.score}分 (${d.level})`).join('\n')}

请分析完成这个项目后，用户的各项能力会有哪些提升。

返回JSON格式：
{
  "changes": [
    {
      "dimension": "沟通表达力",
      "scoreChange": 5,  // 分数变化（可以是负数）
      "reason": "原因说明",
      "newTags": ["新增能力标签1", "新增能力标签2"]
    }
  ]
}`

      const completion = await openai.chat.completions.create({
        model: AI_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: '你是能力成长分析专家，擅长分析项目经历对能力的影响。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      })

      const resultText = completion.choices[0].message.content || '{}'
      const result = JSON.parse(resultText)

      return result.changes || []

    } catch (error: any) {
      log.error('AI分析项目影响失败', { error: error.message })
      return []
    }
  }

  /**
   * 计算能力等级
   */
  private calculateLevel(score: number): string {
    if (score >= 85) return '专家'
    if (score >= 70) return '高级'
    if (score >= 50) return '中级'
    return '初级'
  }

  /**
   * 获取用户的雷达图历史
   */
  async getUserRadarHistory(userId: string) {
    const radars = await AbilityRadar.find({
      userId: new mongoose.Types.ObjectId(userId)
    }).sort({ snapshotNumber: 1 })

    return radars
  }

  /**
   * 获取最新雷达图
   */
  async getLatestRadar(userId: string) {
    const radar = await AbilityRadar.findOne({
      userId: new mongoose.Types.ObjectId(userId)
    }).sort({ snapshotNumber: -1 })

    return radar
  }

  /**
   * 对比两个雷达图
   */
  async compareRadars(userId: string, snapshot1: number, snapshot2: number) {
    const [radar1, radar2] = await Promise.all([
      AbilityRadar.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        snapshotNumber: snapshot1
      }),
      AbilityRadar.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        snapshotNumber: snapshot2
      })
    ])

    if (!radar1 || !radar2) {
      throw new Error('雷达图快照不存在')
    }

    // 计算变化
    const comparison = radar2.dimensions.map(d2 => {
      const d1 = radar1.dimensions.find(d => d.name === d2.name)
      return {
        dimension: d2.name,
        before: d1?.score || 0,
        after: d2.score,
        change: d2.score - (d1?.score || 0)
      }
    })

    return {
      before: radar1,
      after: radar2,
      comparison
    }
  }
}

export const abilityRadarService = new AbilityRadarService()
