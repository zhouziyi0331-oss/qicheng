import { Request, Response } from 'express'
import { mentorService } from '../services/mentor.service'
import { log } from '../utils/logger'

/**
 * AI导师控制器
 */

/**
 * AI对话
 */
export const chat = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const { message, context } = req.body

    if (!message) {
      return res.status(400).json({
        success: false,
        error: '消息内容不能为空'
      })
    }

    const result = await mentorService.chat(userId, message, context || {})

    res.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    log.error('AI导师对话失败', { userId: req.userId, error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

// 其他函数暂时移除，等待mentor.service.ts类型问题修复后再添加
