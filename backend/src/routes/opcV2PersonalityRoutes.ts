import { Router, Request, Response, NextFunction } from 'express'
import opcV2PersonalityService from '../services/opcV2PersonalityService'
import { authenticate } from '../middleware/auth'
import { body, validationResult } from 'express-validator'

const router = Router()

/**
 * 获取所有OPC测试题目
 * GET /api/v1/opc/questions
 */
router.get('/questions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const questions = await opcV2PersonalityService.getQuestions()

    res.json({
      success: true,
      data: {
        questions,
        totalCount: questions.length
      }
    })
  } catch (error: any) {
    logger.error('获取OPC题目失败:', error)
    next(error)
  }
})

/**
 * 提交OPC测试答案并获取分析结果
 * POST /api/v1/opc/submit-answers
 */
router.post(
  '/submit-answers',
  authenticate,
  [
    body('answers').isArray({ min: 25, max: 25 }).withMessage('必须提交25道题的答案'),
    body('answers.*.questionId').isUUID().withMessage('questionId必须是有效的UUID'),
    body('answers.*.questionNumber').isInt({ min: 1, max: 25 }).withMessage('questionNumber必须在1-25之间'),
    body('answers.*.dimension').isIn(['ai_tools', 'creative_preference', 'work_style', 'interest_direction']).withMessage('dimension无效'),
    body('answers.*.answerValue').exists().withMessage('answerValue不能为空')
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        })
      }

      const userId = req.user!.userId
      const { answers } = req.body

      const result = await opcV2PersonalityService.submitAndAnalyze(userId, answers)

      res.json({
        success: true,
        data: {
          sessionId: result.sessionId,
          profile: result.analysisResult
        }
      })
    } catch (error: any) {
      logger.error('OPC分析失败:', error)
      next(error)
  }
})

/**
 * 获取用户最新的OPC分析结果
 * GET /api/v1/opc/profile
 */
router.get('/profile', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const profile = await opcV2PersonalityService.getLatestProfile(userId)

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: '尚未完成OPC测试'
      })
    }

    // 计算同类数据
    const samePersonalityCount = profile.samePersonalityCount || 0
    const completionRate = samePersonalityCount > 0
      ? Math.round((profile.completedFirstOrderCount / samePersonalityCount) * 100)
      : 0

    res.json({
      success: true,
      data: {
        profile: {
          personalityType: profile.personality_type,
          personalityTypeLabel: profile.personalityTypeLabel,
          initialLevel: profile.initial_level,
          levelReason: profile.level_reason,
          trackRecommendation: profile.track_recommendation,
          trackRecommendationLabel: profile.trackRecommendationLabel,
          trackReason: profile.track_reason,
          threeStrengths: profile.threeStrengths,
          twoGaps: profile.twoGaps,
          declaration: profile.declaration,
          createdAt: profile.created_at
        },
        stats: {
          samePersonalityCount,
          completionRate,
          message: `全国有${samePersonalityCount.toLocaleString()}个和你一样的「${profile.personalityTypeLabel}」。其中${completionRate}%已经在启程完成了第一单。`
        }
      }
    })
  } catch (error: any) {
    logger.error('获取OPC结果失败:', error)
    next(error)
  }
})

/**
 * 生成身份卡片
 * POST /api/v1/opc/generate-card
 */
router.post('/generate-card', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const profile = await opcV2PersonalityService.getLatestProfile(userId)

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: '请先完成OPC测试'
      })
    }

    // TODO: 实现卡片生成逻辑（Canvas绘制 + 七牛云上传）
    // 暂时返回模拟数据
    const cardUrl = `https://cdn.qicheng.com/opc-cards/${userId}.png`

    res.json({
      success: true,
      data: {
        cardUrl,
        personalityType: profile.personality_type,
        personalityTypeLabel: profile.personalityTypeLabel,
        level: profile.initial_level,
        declaration: profile.declaration.split('。')[0] // 取第一句作为卡片文案
      }
    })
  } catch (error: any) {
    logger.error('生成身份卡片失败:', error)
    next(error)
  }
})

export default router
