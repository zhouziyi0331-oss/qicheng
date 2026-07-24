import { Request, Response } from 'express'
import { levelUpService } from '../services/levelUp.service'
import { log } from '../utils/logger'

/**
 * 晋级验证控制器
 */

/**
 * 检查是否满足晋级条件
 * POST /api/level/check
 */
export const checkLevelUp = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const { completedOrderId } = req.body

    const result = await levelUpService.checkLevelUp(userId, completedOrderId)

    res.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    log.error('检查晋级失败', { userId: req.userId, error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * 获取晋级对话内容
 * POST /api/level/dialog
 */
export const getLevelDialog = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const { fromLevel, toLevel } = req.body

    if (fromLevel === undefined || toLevel === undefined) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数'
      })
    }

    const dialogData = await levelUpService.generateDialog(userId, fromLevel, toLevel)

    res.json({
      success: true,
      data: dialogData
    })
  } catch (error: any) {
    log.error('获取晋级对话失败', { userId: req.userId, error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * 提交晋级答案
 * POST /api/level/answer
 */
export const submitAnswer = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const { fromLevel, toLevel, selectedOption } = req.body

    if (!selectedOption || !['A', 'B', 'C', 'D'].includes(selectedOption)) {
      return res.status(400).json({
        success: false,
        error: '无效的选项'
      })
    }

    await levelUpService.saveAnswer(userId, fromLevel, toLevel, selectedOption)

    res.json({
      success: true,
      data: {
        message: '答案已记录'
      }
    })
  } catch (error: any) {
    log.error('提交答案失败', { userId: req.userId, error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * 确认晋级
 * POST /api/level/confirm
 */
export const confirmLevelUp = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const { toLevel } = req.body

    if (toLevel === undefined) {
      return res.status(400).json({
        success: false,
        error: '缺少目标等级'
      })
    }

    const result = await levelUpService.confirmLevelUp(userId, toLevel)

    res.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    log.error('确认晋级失败', { userId: req.userId, error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}
