import mongoose, { Schema, Document } from 'mongoose'

// 小猫的秘密空间 - 每个用户的私密成长空间
export interface ISecretSpace extends Document {
  userId: mongoose.Types.ObjectId

  // 天数统计
  daysSinceJoined: number // 加入天数
  consecutiveDays: number // 连续签到天数
  lastCheckInDate: Date // 最后签到日期

  // 心情日记
  moodRecords: Array<{
    date: Date
    mood: 'excited' | 'happy' | 'normal' | 'tired' | 'frustrated' // 心情状态
    note: string // 心情笔记
    tags: string[] // 标签（如：完成项目、遇到困难、获得成就）
  }>

  // 私密笔记
  privateNotes: Array<{
    title: string
    content: string
    createdAt: Date
    updatedAt: Date
    tags: string[]
  }>

  // 成长里程碑（用户自己设定的）
  personalMilestones: Array<{
    title: string
    description: string
    targetDate?: Date
    completed: boolean
    completedAt?: Date
  }>

  // 收藏的名言/激励语
  favoriteQuotes: Array<{
    text: string
    author?: string
    savedAt: Date
  }>

  // 空间设置
  settings: {
    theme: 'cat' | 'star' | 'forest' | 'ocean' // 主题
    backgroundColor: string
    isPublic: boolean // 是否公开（可能以后支持分享）
  }

  createdAt: Date
  updatedAt: Date
}

const SecretSpaceSchema = new Schema<ISecretSpace>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },

  daysSinceJoined: { type: Number, default: 0 },
  consecutiveDays: { type: Number, default: 0 },
  lastCheckInDate: { type: Date },

  moodRecords: [{
    date: { type: Date, required: true },
    mood: {
      type: String,
      enum: ['excited', 'happy', 'normal', 'tired', 'frustrated'],
      required: true
    },
    note: { type: String, default: '' },
    tags: [{ type: String }]
  }],

  privateNotes: [{
    title: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    tags: [{ type: String }]
  }],

  personalMilestones: [{
    title: { type: String, required: true },
    description: { type: String, required: true },
    targetDate: { type: Date },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date }
  }],

  favoriteQuotes: [{
    text: { type: String, required: true },
    author: { type: String },
    savedAt: { type: Date, default: Date.now }
  }],

  settings: {
    theme: {
      type: String,
      enum: ['cat', 'star', 'forest', 'ocean'],
      default: 'cat'
    },
    backgroundColor: { type: String, default: '#FFF5E1' },
    isPublic: { type: Boolean, default: false }
  }
}, {
  timestamps: true
})

// 索引优化
SecretSpaceSchema.index({ userId: 1 })
SecretSpaceSchema.index({ 'moodRecords.date': -1 })

export const SecretSpace = mongoose.model<ISecretSpace>('SecretSpace', SecretSpaceSchema)
