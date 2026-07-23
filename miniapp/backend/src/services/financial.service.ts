import { Income } from '../models/Income'
import { Withdrawal } from '../models/Withdrawal'
import { User } from '../models/User'
import { log } from '../utils/logger'
import mongoose from 'mongoose'

/**
 * 收入和提现服务
 */
export class FinancialService {

  /**
   * 获取用户余额（直接从User表读取，已缓存）
   */
  async getUserBalance(userId: string) {
    const user = await User.findById(userId)

    if (!user) {
      throw new Error('用户不存在')
    }

    return {
      totalIncome: Math.round(user.totalIncome * 100) / 100,
      totalWithdrawal: Math.round(user.totalWithdrawal * 100) / 100,
      availableBalance: Math.round(user.balance * 100) / 100
    }
  }

  /**
   * 重新计算用户余额（用于对账）
   */
  async recalculateUserBalance(userId: string) {
    const userObjectId = new mongoose.Types.ObjectId(userId)

    const [totalIncome, totalWithdrawal] = await Promise.all([
      Income.aggregate([
        {
          $match: {
            userId: userObjectId,
            status: 'confirmed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]),
      Withdrawal.aggregate([
        {
          $match: {
            userId: userObjectId,
            status: { $in: ['processing', 'completed'] }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ])
    ])

    const income = totalIncome[0]?.total || 0
    const withdrawal = totalWithdrawal[0]?.total || 0
    const balance = income - withdrawal

    // 更新用户余额字段
    const user = await User.findByIdAndUpdate(
      userId,
      {
        totalIncome: Math.round(income * 100) / 100,
        totalWithdrawal: Math.round(withdrawal * 100) / 100,
        balance: Math.round(balance * 100) / 100
      },
      { new: true }
    )

    if (!user) {
      throw new Error('用户不存在')
    }

    log.info('用户余额已重新计算', {
      userId,
      totalIncome: user.totalIncome,
      totalWithdrawal: user.totalWithdrawal,
      balance: user.balance
    })

    return {
      totalIncome: user.totalIncome,
      totalWithdrawal: user.totalWithdrawal,
      availableBalance: user.balance
    }
  }

  /**
   * 获取收入记录
   */
  async getIncomeRecords(
    userId: string,
    options?: {
      status?: string
      source?: string
      page?: number
      limit?: number
    }
  ) {
    const query: any = { userId: new mongoose.Types.ObjectId(userId) }

    if (options?.status) query.status = options.status
    if (options?.source) query.source = options.source

    const page = options?.page || 1
    const limit = options?.limit || 20
    const skip = (page - 1) * limit

    const [records, total] = await Promise.all([
      Income.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Income.countDocuments(query)
    ])

    return {
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * 申请提现
   */
  async requestWithdrawal(
    userId: string,
    data: {
      amount: number
      withdrawalMethod: 'wechat' | 'alipay' | 'bank_card'
      withdrawalAccount: string
    }
  ) {
    try {
      // 检查余额
      const balance = await this.getUserBalance(userId)

      if (balance.availableBalance < data.amount) {
        throw new Error('余额不足')
      }

      // 检查最小提现金额
      const MIN_WITHDRAWAL = 10
      if (data.amount < MIN_WITHDRAWAL) {
        throw new Error(`最小提现金额为¥${MIN_WITHDRAWAL}`)
      }

      // 计算手续费（1%，最低1元）
      const fee = Math.max(1, Math.round(data.amount * 0.01 * 100) / 100)
      const actualAmount = Math.round((data.amount - fee) * 100) / 100

      // 创建提现记录
      const withdrawal = await Withdrawal.create({
        userId: new mongoose.Types.ObjectId(userId),
        amount: data.amount,
        fee,
        actualAmount,
        withdrawalMethod: data.withdrawalMethod,
        withdrawalAccount: this.maskAccount(data.withdrawalAccount),
        status: 'pending'
      })

      // 立即更新用户余额（扣除提现金额）
      await User.findByIdAndUpdate(userId, {
        $inc: {
          balance: -data.amount,
          totalWithdrawal: data.amount
        }
      })

      log.info('提现申请已创建，余额已扣除', {
        userId,
        withdrawalId: withdrawal._id,
        amount: data.amount
      })

      return withdrawal

    } catch (error: any) {
      log.error('申请提现失败', { error: error.message, userId })
      throw new Error(error.message || '申请提现失败')
    }
  }

  /**
   * 脱敏账号
   */
  private maskAccount(account: string): string {
    if (account.length <= 4) return account

    const visible = 4
    const masked = '*'.repeat(account.length - visible)
    return masked + account.slice(-visible)
  }

  /**
   * 获取提现记录
   */
  async getWithdrawalRecords(
    userId: string,
    options?: {
      status?: string
      page?: number
      limit?: number
    }
  ) {
    const query: any = { userId: new mongoose.Types.ObjectId(userId) }

    if (options?.status) query.status = options.status

    const page = options?.page || 1
    const limit = options?.limit || 20
    const skip = (page - 1) * limit

    const [records, total] = await Promise.all([
      Withdrawal.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Withdrawal.countDocuments(query)
    ])

    return {
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * 取消提现（仅pending状态）
   */
  async cancelWithdrawal(userId: string, withdrawalId: string) {
    try {
      const withdrawal = await Withdrawal.findOne({
        _id: new mongoose.Types.ObjectId(withdrawalId),
        userId: new mongoose.Types.ObjectId(userId),
        status: 'pending'
      })

      if (!withdrawal) {
        throw new Error('提现记录不存在或无法取消')
      }

      withdrawal.status = 'cancelled'
      await withdrawal.save()

      log.info('提现已取消', { userId, withdrawalId })

      return withdrawal

    } catch (error: any) {
      log.error('取消提现失败', { error: error.message, userId, withdrawalId })
      throw new Error(error.message || '取消提现失败')
    }
  }

  /**
   * 获取收入统计
   */
  async getIncomeStats(userId: string) {
    const userObjectId = new mongoose.Types.ObjectId(userId)

    const stats = await Income.aggregate([
      {
        $match: {
          userId: userObjectId,
          status: 'confirmed'
        }
      },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 },
          total: { $sum: '$amount' }
        }
      }
    ])

    const bySource: any = {}
    let totalIncome = 0
    let totalCount = 0

    stats.forEach(stat => {
      bySource[stat._id] = {
        count: stat.count,
        total: Math.round(stat.total * 100) / 100
      }
      totalIncome += stat.total
      totalCount += stat.count
    })

    return {
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalCount,
      bySource
    }
  }

  /**
   * 管理员审核提现（内部接口）
   */
  async reviewWithdrawal(
    withdrawalId: string,
    action: 'approve' | 'reject',
    reviewNote?: string,
    reviewedBy?: string
  ) {
    try {
      const withdrawal = await Withdrawal.findOne({
        _id: new mongoose.Types.ObjectId(withdrawalId),
        status: 'pending'
      })

      if (!withdrawal) {
        throw new Error('提现记录不存在或已处理')
      }

      if (action === 'approve') {
        withdrawal.status = 'processing'
        withdrawal.reviewedBy = reviewedBy
        withdrawal.reviewedAt = new Date()
        withdrawal.reviewNote = reviewNote
      } else {
        withdrawal.status = 'failed'
        withdrawal.reviewedBy = reviewedBy
        withdrawal.reviewedAt = new Date()
        withdrawal.failureReason = reviewNote || '审核不通过'
      }

      await withdrawal.save()

      log.info('提现审核完成', {
        withdrawalId,
        action,
        status: withdrawal.status
      })

      return withdrawal

    } catch (error: any) {
      log.error('审核提现失败', { error: error.message, withdrawalId })
      throw new Error(error.message || '审核提现失败')
    }
  }

  /**
   * 完成提现（内部接口）
   */
  async completeWithdrawal(
    withdrawalId: string,
    transactionId: string
  ) {
    try {
      const withdrawal = await Withdrawal.findOne({
        _id: new mongoose.Types.ObjectId(withdrawalId),
        status: 'processing'
      })

      if (!withdrawal) {
        throw new Error('提现记录不存在或状态不正确')
      }

      withdrawal.status = 'completed'
      withdrawal.completedAt = new Date()
      withdrawal.transactionId = transactionId

      await withdrawal.save()

      log.info('提现已完成', { withdrawalId, transactionId })

      return withdrawal

    } catch (error: any) {
      log.error('完成提现失败', { error: error.message, withdrawalId })
      throw new Error(error.message || '完成提现失败')
    }
  }
}

export const financialService = new FinancialService()
