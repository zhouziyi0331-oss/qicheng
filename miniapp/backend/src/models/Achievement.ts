import mongoose, { Schema, Document } from 'mongoose'

// 成就系统 - 每个用户获得的成就完全不同
export interface IAchievement extends Document {
  userId: mongoose.Types.ObjectId

  // 成就类型
  type: 'project_milestone' | 'ability_growth' | 'income_milestone' | 'learning_streak' | 'social_contribution' | 'special_event'

  // 成就信息
  title: string
  description: string
  icon: string // 图标名称

  // 成就等级
  level: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'

  // 解锁进度
  progress: {
    current: number
    target: number
    unit: string // 如：个、次、元、天
  }

  // 解锁状态
  isUnlocked: boolean
  unlockedAt?: Date

  // 成就奖励
  rewards?: {
    exp: number // 经验值
    badge?: string // 徽章
    title?: string // 称号
  }

  // 关联数据
  relatedData?: {
    projectIds?: mongoose.Types.ObjectId[]
    milestoneId?: mongoose.Types.ObjectId
    radarSnapshotId?: mongoose.Types.ObjectId
  }

  // 稀有度
  rarity: 'common' | 'rare' | 'epic' | 'legendary'

  // 是否展示在个人主页
  isDisplayed: boolean

  createdAt: Date
  updatedAt: Date
}

const AchievementSchema = new Schema<IAchievement>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  type: {
    type: String,
    enum: ['project_milestone', 'ability_growth', 'income_milestone', 'learning_streak', 'social_contribution', 'special_event'],
    required: true
  },

  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },

  level: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    default: 'bronze'
  },

  progress: {
    current: { type: Number, default: 0 },
    target: { type: Number, required: true },
    unit: { type: String, required: true }
  },

  isUnlocked: { type: Boolean, default: false },
  unlockedAt: { type: Date },

  rewards: {
    exp: { type: Number, default: 0 },
    badge: { type: String },
    title: { type: String }
  },

  relatedData: {
    projectIds: [{ type: Schema.Types.ObjectId }],
    milestoneId: { type: Schema.Types.ObjectId },
    radarSnapshotId: { type: Schema.Types.ObjectId }
  },

  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common'
  },

  isDisplayed: { type: Boolean, default: true }
}, {
  timestamps: true
})

// 索引优化
AchievementSchema.index({ userId: 1, isUnlocked: 1 })
AchievementSchema.index({ userId: 1, type: 1 })
AchievementSchema.index({ userId: 1, isDisplayed: 1 })

export const Achievement = mongoose.model<IAchievement>('Achievement', AchievementSchema)
