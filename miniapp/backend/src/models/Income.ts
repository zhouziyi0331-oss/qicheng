import mongoose, { Document, Schema } from 'mongoose'

/**
 * 收入记录
 * 记录用户每一笔收入
 */

export interface IIncome extends Document {
  userId: mongoose.Types.ObjectId
  source: 'real_project' | 'referral' | 'bonus' | 'other' // 收入来源
  sourceRefId?: mongoose.Types.ObjectId // 来源ID（如项目ID）
  amount: number // 金额（元）
  description: string // 描述
  status: 'pending' | 'confirmed' | 'cancelled' // 状态
  confirmedAt?: Date
  createdAt: Date
}

const IncomeSchema = new Schema<IIncome>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  source: {
    type: String,
    enum: ['real_project', 'referral', 'bonus', 'other'],
    required: true
  },
  sourceRefId: Schema.Types.ObjectId,
  amount: {
    type: Number,
    required: true
  },
  description: String,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending',
    index: true
  },
  confirmedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

IncomeSchema.index({ userId: 1, status: 1 })
IncomeSchema.index({ userId: 1, createdAt: -1 })

export const Income = mongoose.model<IIncome>('Income', IncomeSchema)
