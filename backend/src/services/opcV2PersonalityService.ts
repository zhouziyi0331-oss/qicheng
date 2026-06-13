import Anthropic from '@anthropic-ai/sdk'
import { pool } from '../config/database'
import { config } from '../../config'
import { v4 as uuidv4 } from 'uuid'

const anthropic = new Anthropic({
  apiKey: config.anthropicApiKey
})

interface OPCAnswer {
  questionId: string
  questionNumber: number
  dimension: string
  answerValue: any
}

interface OPCAnalysisResult {
  personalityType: string
  personalityTypeLabel: string
  initialLevel: number
  levelReason: string
  trackRecommendation: string
  trackRecommendationLabel: string
  trackReason: string
  threeStrengths: string[]
  twoGaps: string[]
  declaration: string
}

// 人格标签映射
const PERSONALITY_LABELS = {
  visual_storyteller: '视觉叙事者',
  system_builder: '系统构建者',
  creative_executor: '创意执行者',
  data_translator: '数据翻译官',
  tool_integrator: '工具整合师',
  dialogue_designer: '对话设计师'
}

const TRACK_LABELS = {
  ai_content_creation: 'AI内容创作',
  ai_tool_development: 'AI工具开发',
  dual_track: '双赛道均可'
}

class OPCAnalysisService {
  /**
   * 提交测试答案并进行AI分析
   */
  async submitAndAnalyze(userId: string, answers: OPCAnswer[]): Promise<{
    sessionId: string
    analysisResult: OPCAnalysisResult
  }> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // 生成测试会话ID
      const sessionId = uuidv4()

      // 保存所有答案
      for (const answer of answers) {
        await client.query(
          `INSERT INTO opc_v2_user_answers (user_id, question_id, answer_value, test_session_id)
           VALUES ($1, $2, $3, $4)`,
          [userId, answer.questionId, JSON.stringify(answer.answerValue), sessionId]
        )
      }

      // 调用AI进行分析
      const analysisResult = await this.analyzeWithAI(answers)

      // 保存分析结果
      await client.query(
        `INSERT INTO opc_v2_user_profiles (
          user_id, test_session_id, personality_type, initial_level, level_reason,
          track_recommendation, track_reason, three_strengths, two_gaps, declaration,
          raw_ai_response
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          userId,
          sessionId,
          analysisResult.personalityType,
          analysisResult.initialLevel,
          analysisResult.levelReason,
          analysisResult.trackRecommendation,
          analysisResult.trackReason,
          JSON.stringify(analysisResult.threeStrengths),
          JSON.stringify(analysisResult.twoGaps),
          analysisResult.declaration,
          JSON.stringify(analysisResult)
        ]
      )

      // 更新users表
      await client.query(
        `UPDATE users
         SET current_opc_personality = $1,
             current_opc_level = $2,
             latest_opc_test_at = CURRENT_TIMESTAMP,
             first_opc_test_at = COALESCE(first_opc_test_at, CURRENT_TIMESTAMP)
         WHERE id = $3`,
        [analysisResult.personalityType, analysisResult.initialLevel, userId]
      )

      await client.query('COMMIT')

      return {
        sessionId,
        analysisResult: {
          ...analysisResult,
          personalityTypeLabel: PERSONALITY_LABELS[analysisResult.personalityType as keyof typeof PERSONALITY_LABELS],
          trackRecommendationLabel: TRACK_LABELS[analysisResult.trackRecommendation as keyof typeof TRACK_LABELS]
        }
      }
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * 使用AI分析用户答案
   */
  private async analyzeWithAI(answers: OPCAnswer[]): Promise<OPCAnalysisResult> {
    // 按维度整理答案
    const answersByDimension = answers.reduce((acc, answer) => {
      if (!acc[answer.dimension]) {
        acc[answer.dimension] = []
      }
      acc[answer.dimension].push({
        questionNumber: answer.questionNumber,
        answer: answer.answerValue
      })
      return acc
    }, {} as Record<string, any[]>)

    const prompt = `你是启程平台的能力分析师。根据学生的25道OPC测试答案，分析其AI能力人格。

**用户答案**：
${JSON.stringify(answersByDimension, null, 2)}

**6种人格标签定义**：
1. visual_storyteller (视觉叙事者): 擅长用画面表达抽象概念
2. system_builder (系统构建者): 擅长把混乱的需求拆成可执行步骤
3. creative_executor (创意执行者): 擅长快速生成大量方案并筛选最优
4. data_translator (数据翻译官): 擅长用数据讲故事
5. tool_integrator (工具整合师): 擅长把不同工具串联成自动流程
6. dialogue_designer (对话设计师): 擅长用语言引导AI产出精准结果

**输出要求**：
请严格按照以下JSON格式输出，不要添加任何其他内容：

{
  "personalityType": "visual_storyteller|system_builder|creative_executor|data_translator|tool_integrator|dialogue_designer",
  "initialLevel": 1-3,
  "levelReason": "30字内依据，说明为什么给这个等级",
  "trackRecommendation": "ai_content_creation|ai_tool_development|dual_track",
  "trackReason": "50字内理由，说明为什么推荐这个赛道",
  "threeStrengths": ["具体优势1（如：你能把模糊的需求拆成3步）", "具体优势2", "具体优势3"],
  "twoGaps": ["可操作gap1（如：建议上传作品样本）", "可操作gap2"],
  "declaration": "你是一个擅长XX的人。在AI时代，这种能力的名字叫「XX」。"
}

**禁止事项**：
- declaration不能说"根据你的信息"，必须直接陈述"你是一个擅长XX的人"
- 优势必须具体，不能"你很有创意"这种空话
- gap必须可操作，不能"需要更多经验"这种虚话
- 所有文案必须温暖、具体、让学生感到被理解

现在请分析并输出JSON。`

    try {
      const response = await anthropic.messages.create({
        model: 'claude-opus-4-20250514',
        max_tokens: 2000,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude')
      }

      // 提取JSON
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Failed to extract JSON from Claude response')
      }

      const result = JSON.parse(jsonMatch[0])

      // 验证结果
      this.validateAnalysisResult(result)

      return result
    } catch (error) {
      logger.error('AI分析失败:', error)
      throw new Error('AI分析服务暂时不可用，请稍后重试')
    }
  }

  /**
   * 验证AI分析结果
   */
  private validateAnalysisResult(result: any): void {
    const validPersonalityTypes = [
      'visual_storyteller',
      'system_builder',
      'creative_executor',
      'data_translator',
      'tool_integrator',
      'dialogue_designer'
    ]

    const validTracks = ['ai_content_creation', 'ai_tool_development', 'dual_track']

    if (!validPersonalityTypes.includes(result.personalityType)) {
      throw new Error(`Invalid personality type: ${result.personalityType}`)
    }

    if (!validTracks.includes(result.trackRecommendation)) {
      throw new Error(`Invalid track recommendation: ${result.trackRecommendation}`)
    }

    if (!Array.isArray(result.threeStrengths) || result.threeStrengths.length !== 3) {
      throw new Error('threeStrengths must be an array of 3 items')
    }

    if (!Array.isArray(result.twoGaps) || result.twoGaps.length !== 2) {
      throw new Error('twoGaps must be an array of 2 items')
    }

    if (!result.declaration || !result.declaration.includes('你是一个擅长')) {
      throw new Error('declaration must follow the required format')
    }
  }

  /**
   * 获取用户最新的OPC分析结果
   */
  async getLatestProfile(userId: string): Promise<any> {
    const client = await pool.connect()

    try {
      const result = await client.query(
        `SELECT
          p.*,
          (SELECT COUNT(*) FROM users WHERE current_opc_personality = p.personality_type) as same_personality_count,
          (SELECT COUNT(*) FROM users WHERE current_opc_personality = p.personality_type AND first_opc_test_at < NOW() - INTERVAL '7 days') as completed_first_order_count
         FROM opc_v2_user_profiles p
         WHERE p.user_id = $1
         ORDER BY p.created_at DESC
         LIMIT 1`,
        [userId]
      )

      if (result.rows.length === 0) {
        return null
      }

      const profile = result.rows[0]

      // 如果是jsonb类型，PostgreSQL已经自动解析为对象/数组
      // 如果是text类型，需要JSON.parse
      const parseIfNeeded = (value: any) => {
        if (typeof value === 'string') {
          try {
            return JSON.parse(value)
          } catch {
            return value
          }
        }
        return value
      }

      return {
        ...profile,
        personalityTypeLabel: PERSONALITY_LABELS[profile.personality_type as keyof typeof PERSONALITY_LABELS],
        trackRecommendationLabel: TRACK_LABELS[profile.track_recommendation as keyof typeof TRACK_LABELS],
        threeStrengths: parseIfNeeded(profile.three_strengths),
        twoGaps: parseIfNeeded(profile.two_gaps),
        samePersonalityCount: parseInt(profile.same_personality_count),
        completedFirstOrderCount: parseInt(profile.completed_first_order_count)
      }
    } finally {
      client.release()
    }
  }

  /**
   * 获取所有测试题目
   */
  async getQuestions(): Promise<any[]> {
    const client = await pool.connect()

    try {
      const result = await client.query(
        `SELECT id, question_number, dimension, question_text, question_type, options
         FROM opc_v2_test_questions
         WHERE is_active = true
         ORDER BY display_order, question_number`
      )

      return result.rows.map(row => ({
        ...row,
        options: row.options
      }))
    } finally {
      client.release()
    }
  }
}

export default new OPCAnalysisService()
