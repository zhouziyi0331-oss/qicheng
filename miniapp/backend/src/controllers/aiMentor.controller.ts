import { Request, Response } from 'express'
import { aiMentorService } from '../services/aiMentor.service'
import { log } from '../utils/logger'

/**
 * AI导师控制器
 */

/**
 * 获取AI导师指导
 * GET /api/ai-mentor/guidance
 */
export const getMentorGuidance = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!

    const guidance = await aiMentorService.generateMentorGuidance(userId)

    res.json({
      success: true,
      data: guidance,
      message: 'AI导师指导生成成功'
    })
  } catch (error: any) {
    log.error('获取AI导师指导失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}
