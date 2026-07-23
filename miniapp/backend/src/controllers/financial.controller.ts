import { Request, Response } from 'express'
import { financialService } from '../services/financial.service'
import { log } from '../utils/logger'

/**
 * 财务控制器
 * 处理收入、提现相关
 */

/**
 * GET /api/financial/balance
 * 获取用户余额
 */
export const getBalance = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId

    const balance = await financialService.getUserBalance(userId)

    res.json({
      success: true,
      data: balance
    })

  } catch (error: any) {
    log.error('获取余额失败', { error: error.message })
    res.status(500).json({ error: '获取余额失败' })
  }
}

/**
 * GET /api/financial/income
 * 获取收入记录
 */
export const getIncomeRecords = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const { status, source, page, limit } = req.query

    const options: any = {}
    if (status) options.status = status
    if (source) options.source = source
    if (page) options.page = parseInt(page as string)
    if (limit) options.limit = parseInt(limit as string)

    const result = await financialService.getIncomeRecords(userId, options)

    res.json({
      success: true,
      data: result
    })

  } catch (error: any) {
    log.error('获取收入记录失败', { error: error.message })
    res.status(500).json({ error: '获取收入记录失败' })
  }
}

/**
 * GET /api/financial/income/stats
 * 获取收入统计
 */
export const getIncomeStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId

    const stats = await financialService.getIncomeStats(userId)

    res.json({
      success: true,
      data: stats
    })

  } catch (error: any) {
    log.error('获取收入统计失败', { error: error.message })
    res.status(500).json({ error: '获取收入统计失败' })
  }
}

/**
 * POST /api/financial/withdrawal/request
 * 申请提现
 */
export const requestWithdrawal = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const { amount, withdrawalMethod, withdrawalAccount } = req.body

    if (!amount || !withdrawalMethod || !withdrawalAccount) {
      return res.status(400).json({ error: '请填写完整提现信息' })
    }

    const withdrawal = await financialService.requestWithdrawal(userId, {
      amount: parseFloat(amount),
      withdrawalMethod,
      withdrawalAccount
    })

    res.json({
      success: true,
      data: withdrawal,
      message: '提现申请已提交，预计1-3个工作日到账'
    })

  } catch (error: any) {
    log.error('申请提现失败', { error: error.message })
    res.status(400).json({ error: error.message || '申请提现失败' })
  }
}

/**
 * GET /api/financial/withdrawal
 * 获取提现记录
 */
export const getWithdrawalRecords = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const { status, page, limit } = req.query

    const options: any = {}
    if (status) options.status = status
    if (page) options.page = parseInt(page as string)
    if (limit) options.limit = parseInt(limit as string)

    const result = await financialService.getWithdrawalRecords(userId, options)

    res.json({
      success: true,
      data: result
    })

  } catch (error: any) {
    log.error('获取提现记录失败', { error: error.message })
    res.status(500).json({ error: '获取提现记录失败' })
  }
}

/**
 * POST /api/financial/withdrawal/:id/cancel
 * 取消提现
 */
export const cancelWithdrawal = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const { id } = req.params

    const withdrawal = await financialService.cancelWithdrawal(userId, id)

    res.json({
      success: true,
      data: withdrawal,
      message: '提现已取消'
    })

  } catch (error: any) {
    log.error('取消提现失败', { error: error.message })
    res.status(400).json({ error: error.message || '取消提现失败' })
  }
}
