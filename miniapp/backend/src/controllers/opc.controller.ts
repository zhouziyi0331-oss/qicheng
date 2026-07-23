import { Request, Response } from 'express'
import { opcService } from '../services/opc.service'
import { log } from '../utils/logger'

/**
 * OPC测评控制器
 */

/**
 * 获取所有测试题
 */
export const getQuestions = async (req: Request, res: Response) => {
  try {
    const questions = await opcService.getQuestions()

    res.json({
      success: true,
      data: questions
    })
  } catch (error: any) {
    log.error('获取OPC测试题失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * 提交OPC测评
 */
export const submitTest = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const { answers } = req.body

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        error: '答案格式错误'
      })
    }

    const result = await opcService.submitAssessment(userId, answers)

    res.json({
      success: true,
      data: result,
      message: '测评提交成功'
    })
  } catch (error: any) {
    log.error('提交OPC测评失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * 获取用户OPC测评结果
 */
export const getResult = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params

    const result = await opcService.getLatestResult(userId)

    if (!result) {
      return res.status(404).json({
        success: false,
        error: '未找到测评结果'
      })
    }

    res.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    log.error('获取OPC测评结果失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * 获取用户最新的测评结果
 */
export const getLatestResult = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!

    const result = await opcService.getLatestResult(userId)

    if (!result) {
      return res.status(404).json({
        success: false,
        error: '未找到测评结果'
      })
    }

    res.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    log.error('获取最新测评结果失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * 获取用户所有测评历史
 */
export const getUserResults = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!

    const results = await opcService.getUserResults(userId)

    res.json({
      success: true,
      data: results
    })
  } catch (error: any) {
    log.error('获取测评历史失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * 生成OPC成长报告（占位，后续实现）
 */
export const generateReport = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params

    // TODO: 实现完整的成长报告生成逻辑
    // 包括：成长叙事时间线、工作风格演变分析等

    res.json({
      success: true,
      message: 'OPC成长报告功能开发中',
      data: {
        status: 'coming_soon'
      }
    })
  } catch (error: any) {
    log.error('生成OPC报告失败', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}
