import mongoose, { Document, Schema } from 'mongoose'

/**
 * 提现记录
 */

export interface IWithdrawal extends Document {
  userId: mongoose.Types.ObjectId
  amount: number // 提现金额（元）
  fee: number // 手续费（元）
  actualAmount: number // 实际到账金额（元）

  // 提现方式
  withdrawalMethod: 'wechat' | 'alipay' | 'bank_card'
  withdrawalAccount: string // 提现账号（脱敏）

  // 状态
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

  // 审核信息
  reviewedBy?: string // 审核人
  reviewedAt?: Date
  reviewNote?: string // 审核备注

  // 到账信息
  completedAt?: Date
  transactionId?: string // 交易流水号

  // 失败原因
  failureReason?: string

  createdAt: Date
}

const WithdrawalSchema = new Schema<IWithdrawal>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  fee: {
    type: Number,
    default: 0
  },
  actualAmount: {
    type: Number,
    required: true
  },
  withdrawalMethod: {
    type: String,
    enum: ['wechat', 'alipay', 'bank_card'],
    required: true
  },
  withdrawalAccount: String,
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  reviewedBy: String,
  reviewedAt: Date,
  reviewNote: String,
  completedAt: Date,
  transactionId: String,
  failureReason: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

WithdrawalSchema.index({ userId: 1, status: 1 })
WithdrawalSchema.index({ userId: 1, createdAt: -1 })

export const Withdrawal = mongoose.model<IWithdrawal>('Withdrawal', WithdrawalSchema)
