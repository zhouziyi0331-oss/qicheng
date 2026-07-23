import mongoose, { Document, Schema } from 'mongoose'

/**
 * 穿越感时刻记录
 * 捕捉学生进入心流状态的时刻
 */

export interface IFlowMoment extends Document {
  userId: mongoose.Types.ObjectId
  taskId?: mongoose.Types.ObjectId
  momentText: string // 触发穿越感的原话
  durationMinutes?: number // 持续时长（分钟）
  context: string // 当时的场景
  capturedAt: Date
}

const FlowMomentSchema = new Schema<IFlowMoment>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  taskId: {
    type: Schema.Types.ObjectId,
    ref: 'RealProject'
  },
  momentText: {
    type: String,
    required: true
  },
  durationMinutes: {
    type: Number
  },
  context: {
    type: String,
    default: ''
  },
  capturedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

FlowMomentSchema.index({ userId: 1, capturedAt: -1 })

export const FlowMoment = mongoose.model<IFlowMoment>('FlowMoment', FlowMomentSchema)
