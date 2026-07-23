import mongoose, { Document, Schema } from 'mongoose'

/**
 * 里程碑记录
 * 记录用户达成的重要成就和里程碑
 */
export interface IMilestone extends Document {
  userId: mongoose.Types.ObjectId
  type: 'level_up' | 'achievement' | 'first_time' | 'milestone' | 'special'
  title: string // 里程碑标题
  description?: string // 里程碑描述
  icon?: string // 图标
  metadata?: any // 额外信息
  achievedAt: Date // 达成时间
  createdAt: Date
}

const MilestoneSchema = new Schema<IMilestone>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['level_up', 'achievement', 'first_time', 'milestone', 'special'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  icon: {
    type: String
  },
  metadata: {
    type: Schema.Types.Mixed
  },
  achievedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// 复合索引
MilestoneSchema.index({ userId: 1, achievedAt: -1 })
MilestoneSchema.index({ userId: 1, type: 1 })

export const Milestone = mongoose.model<IMilestone>('Milestone', MilestoneSchema)
