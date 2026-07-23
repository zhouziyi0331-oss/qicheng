import { Request, Response } from 'express'
import { levelUpValidationService } from '../services/levelUpValidation.service'
import { log } from '../utils/logger'

/**
 * 晋级验证控制器
 */

/**
 * 生成晋级验证内容
 */
export const generateValidation = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const { fromLevel, toLevel } = req.body

    if (typeof toLevel !== 'number' || toLevel < 1 || toLevel > 5) {
      return res.status(400).json({
        success: false,
        error: '目标等级必须在1-5之间'
      })
    }

    const validation = await levelUpValidationService.generateValidation(
      userId,
      fromLevel || 0,
      toLevel
    )

    res.json({
      success: true,
      data: validation
    })
  } catch (error: any) {
    log.error('生成晋级验证失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * 提交晋级验证答案
 */
export const submitValidation = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const { level, questionId, selectedOption } = req.body

    if (!level || !selectedOption) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数'
      })
    }

    const result = await levelUpValidationService.submitValidation(
      userId,
      level,
      questionId || 'main',
      selectedOption
    )

    res.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    log.error('提交晋级验证失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * 获取用户的晋级历史
 */
export const getValidationHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!

    // TODO: 从数据库获取用户的晋级历史
    const history: any[] = []

    res.json({
      success: true,
      data: {
        history
      }
    })
  } catch (error: any) {
    log.error('获取晋级历史失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}
