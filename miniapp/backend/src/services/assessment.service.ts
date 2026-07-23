import { openai, AI_CONFIG } from '../config/openai'
import { Assessment } from '../models/Assessment'
import { AbilityRadar } from '../models/AbilityRadar'
import { log } from '../utils/logger'
import mongoose from 'mongoose'

/**
 * OC测评服务
 * 生成个性化的能力测评报告
 */
export class AssessmentService {

  /**
   * 生成测评结果（AI分析）
   */
  async generateAssessmentResult(
    userId: string,
    answers: { questionId: string; answer: any }[]
  ) {
    try {
      log.info('开始生成测评结果', { userId })

      // 获取用户已有测评次数
      const existingCount = await Assessment.countDocuments({
        userId: new mongoose.Types.ObjectId(userId)
      })
      const assessmentNumber = existingCount + 1

      // 构建AI提示词
      const prompt = this.buildAssessmentPrompt(answers, assessmentNumber)

      // 调用GPT-4生成分析
      const completion = await openai.chat.completions.create({
        model: AI_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: `你是一位专业的职业能力评估专家。你需要分析用户的测评答案，生成个性化的能力评估报告。

评估维度包括但不限于：
- 沟通表达力
- 执行推进力
- 创新思维力
- 逻辑分析力
- 团队协作力
- 学习适应力
- 问题解决力
- 资源整合力

请根据用户的回答，给出0-100分的量化评分，并判断等级（初级/中级/高级/专家）。
同时识别用户的身份标签（如：创新者、执行者、协调者、思考者等）。

返回JSON格式，严格遵循schema。`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: AI_CONFIG.temperature,
        max_tokens: AI_CONFIG.maxTokens,
        response_format: { type: 'json_object' }
      })

      const resultText = completion.choices[0].message.content || '{}'
      const aiResult = JSON.parse(resultText)

      // 保存测评记录
      const assessment = await Assessment.create({
        userId: new mongoose.Types.ObjectId(userId),
        assessmentNumber,
        answers,
        result: {
          identityTags: aiResult.identityTags || [],
          abilityScores: aiResult.abilityScores || [],
          personalityType: aiResult.personalityType || '',
          strengthAreas: aiResult.strengthAreas || [],
          improvementAreas: aiResult.improvementAreas || []
        },
        completedAt: new Date()
      })

      // 生成能力雷达图快照
      await this.generateAbilityRadarSnapshot(userId, assessment._id, aiResult.abilityScores)

      log.info('测评结果生成成功', { userId, assessmentId: assessment._id })

      // 触发成就检查
      const { backgroundTaskService } = require('./backgroundTask.service')
      await backgroundTaskService.createTask({
        userId,
        taskType: 'achievement_check',
        taskName: '检查成就解锁（测评完成）'
      })

      return {
        assessmentId: assessment._id,
        assessmentNumber,
        result: assessment.result
      }

    } catch (error: any) {
      log.error('生成测评结果失败', { error: error.message, userId })
      throw new Error('测评结果生成失败')
    }
  }

  /**
   * 构建AI提示词
   */
  private buildAssessmentPrompt(
    answers: { questionId: string; answer: any }[],
    assessmentNumber: number
  ): string {
    const answersText = answers.map(a =>
      `问题${a.questionId}: ${JSON.stringify(a.answer)}`
    ).join('\n')

    return `这是用户的第${assessmentNumber}次OC测评。

用户的回答：
${answersText}

请分析用户的能力特征，生成评估报告。

返回JSON格式：
{
  "identityTags": ["标签1", "标签2", "标签3"],  // 3-5个身份标签
  "abilityScores": [
    {
      "dimension": "沟通表达力",
      "score": 75,
      "level": "中级"
    }
    // ... 至少8个维度
  ],
  "personalityType": "INTJ",  // MBTI类型
  "strengthAreas": ["优势1", "优势2", "优势3"],  // 3个优势领域
  "improvementAreas": ["待提升1", "待提升2"]  // 2个待提升领域
}`
  }

  /**
   * 生成能力雷达图快照
   */
  private async generateAbilityRadarSnapshot(
    userId: string,
    assessmentId: mongoose.Types.ObjectId,
    abilityScores: any[]
  ) {
    try {
      // 获取已有快照数量
      const existingCount = await AbilityRadar.countDocuments({
        userId: new mongoose.Types.ObjectId(userId)
      })
      const snapshotNumber = existingCount + 1

      // 获取上一次快照（如果有）
      const previousSnapshot = await AbilityRadar.findOne({
        userId: new mongoose.Types.ObjectId(userId)
      }).sort({ snapshotNumber: -1 })

      // 计算成长值
      const dimensions = abilityScores.map(score => {
        let growth = 0
        if (previousSnapshot) {
          const prevDim = previousSnapshot.dimensions.find(d => d.name === score.dimension)
          if (prevDim) {
            growth = score.score - prevDim.score
          }
        }

        return {
          name: score.dimension,
          description: `${score.dimension}相关能力`,
          score: score.score,
          level: score.level,
          growth,
          tags: []
        }
      })

      // 计算综合评分
      const overallScore = Math.round(
        dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length
      )

      // 判断等级
      let rank = '新手'
      if (overallScore >= 80) rank = '专家'
      else if (overallScore >= 70) rank = '熟练'
      else if (overallScore >= 50) rank = '进阶'

      await AbilityRadar.create({
        userId: new mongoose.Types.ObjectId(userId),
        snapshotNumber,
        triggerType: 'assessment',
        triggerRefId: assessmentId,
        dimensions,
        overallScore,
        rank
      })

      log.info('能力雷达图快照生成成功', { userId, snapshotNumber })

    } catch (error: any) {
      log.error('生成能力雷达图快照失败', { error: error.message, userId })
      // 不抛出错误，允许测评继续
    }
  }

  /**
   * 获取用户的测评历史
   */
  async getUserAssessments(userId: string) {
    const assessments = await Assessment.find({
      userId: new mongoose.Types.ObjectId(userId)
    }).sort({ assessmentNumber: 1 })

    return assessments
  }

  /**
   * 获取最新测评
   */
  async getLatestAssessment(userId: string) {
    const assessment = await Assessment.findOne({
      userId: new mongoose.Types.ObjectId(userId)
    }).sort({ assessmentNumber: -1 })

    return assessment
  }
}

export const assessmentService = new AssessmentService()
