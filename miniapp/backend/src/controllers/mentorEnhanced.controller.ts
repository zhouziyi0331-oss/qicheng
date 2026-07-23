import { Request, Response } from 'express'
import { mentorServiceEnhanced } from '../services/mentorEnhanced.service'
import { log } from '../utils/logger'

/**
 * AI导师增强控制器
 */

/**
 * PBL流程 - Step 1: 问题拆解
 */
export const pblBreakdownTask = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const { taskId } = req.params

    const result = await mentorServiceEnhanced.pblBreakdownTask(userId, taskId)

    res.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    log.error('PBL问题拆解失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * PBL流程 - Step 2: 学生确认理解
 */
export const pblConfirmUnderstanding = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const { taskId } = req.params
    const { understanding } = req.body

    if (!understanding) {
      return res.status(400).json({
        success: false,
        error: '请表达你对项目的理解'
      })
    }

    const result = await mentorServiceEnhanced.pblConfirmUnderstanding(userId, taskId, understanding)

    res.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    log.error('PBL理解确认失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * 增强版卡点支持
 */
export const reportStuckEnhanced = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const { taskId } = req.params
    const { stuckPoint, whatTriedSoFar } = req.body

    if (!stuckPoint) {
      return res.status(400).json({
        success: false,
        error: '请描述你的卡点'
      })
    }

    const result = await mentorServiceEnhanced.reportStuckEnhanced(
      userId,
      taskId,
      stuckPoint,
      whatTriedSoFar
    )

    res.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    log.error('增强版卡点支持失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * 作品审核
 */
export const reviewWork = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const { taskId } = req.params
    const { submissionUrl, submissionDescription } = req.body

    if (!submissionUrl || !submissionDescription) {
      return res.status(400).json({
        success: false,
        error: '请提供作品链接和说明'
      })
    }

    const review = await mentorServiceEnhanced.reviewWork(
      userId,
      taskId,
      submissionUrl,
      submissionDescription
    )

    res.json({
      success: true,
      data: review
    })
  } catch (error: any) {
    log.error('作品审核失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * 成长对比分析
 */
export const analyzeGrowthComparison = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!

    const result = await mentorServiceEnhanced.analyzeGrowthComparison(userId)

    res.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    log.error('成长对比分析失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}
