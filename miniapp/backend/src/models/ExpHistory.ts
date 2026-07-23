import mongoose, { Document, Schema } from 'mongoose'

/**
 * 经验值历史记录
 * 记录用户每次获得经验值的详细信息
 */
export interface IExpHistory extends Document {
  userId: mongoose.Types.ObjectId
  exp: number // 获得的经验值（可以是负数）
  reason: string // 获得原因
  metadata?: any // 额外信息
  createdAt: Date
}

const ExpHistorySchema = new Schema<IExpHistory>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  exp: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  metadata: {
    type: Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
})

// 复合索引：按用户和时间查询
ExpHistorySchema.index({ userId: 1, createdAt: -1 })

export const ExpHistory = mongoose.model<IExpHistory>('ExpHistory', ExpHistorySchema)
