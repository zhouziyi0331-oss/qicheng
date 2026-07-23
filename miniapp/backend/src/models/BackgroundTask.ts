import mongoose, { Document, Schema } from 'mongoose'

/**
 * 后台任务模型
 * 记录所有异步后台任务的状态
 */

export interface IBackgroundTask extends Document {
  userId: mongoose.Types.ObjectId
  taskType: 'ability_radar' | 'comparison_report' | 'growth_path' | 'graduation_report' | 'achievement_check'
  taskName: string // 任务描述

  // 任务状态
  status: 'pending' | 'processing' | 'completed' | 'failed'

  // 关联数据
  relatedId?: string // 关联的项目ID或其他ID
  metadata?: any // 额外的任务参数

  // 执行记录
  attempts: number // 尝试次数
  maxAttempts: number // 最大尝试次数
  lastAttemptAt?: Date // 最后一次尝试时间
  completedAt?: Date // 完成时间

  // 错误信息
  error?: string // 错误消息
  errorStack?: string // 错误堆栈

  // 结果
  result?: any // 任务结果

  createdAt: Date
  updatedAt: Date
}

const BackgroundTaskSchema = new Schema<IBackgroundTask>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  taskType: {
    type: String,
    enum: ['ability_radar', 'comparison_report', 'growth_path', 'graduation_report', 'achievement_check'],
    required: true,
    index: true
  },
  taskName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
    index: true
  },
  relatedId: String,
  metadata: Schema.Types.Mixed,
  attempts: {
    type: Number,
    default: 0
  },
  maxAttempts: {
    type: Number,
    default: 3
  },
  lastAttemptAt: Date,
  completedAt: Date,
  error: String,
  errorStack: String,
  result: Schema.Types.Mixed
}, {
  timestamps: true
})

// 复合索引
BackgroundTaskSchema.index({ userId: 1, status: 1 })
BackgroundTaskSchema.index({ status: 1, createdAt: -1 })
BackgroundTaskSchema.index({ userId: 1, taskType: 1, status: 1 })

export const BackgroundTask = mongoose.model<IBackgroundTask>('BackgroundTask', BackgroundTaskSchema)
