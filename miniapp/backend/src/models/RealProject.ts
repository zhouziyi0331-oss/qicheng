import mongoose, { Document, Schema } from 'mongoose'

/**
 * 真实项目（接单项目）
 * 区别于"实践项目"，这是用户从平台接的真实项目
 */

export interface IRealProject extends Document {
  userId?: mongoose.Types.ObjectId // 接单用户（available状态时为空）
  projectNumber?: number // 用户的第几个真实项目（接单后生成）

  // 项目基本信息
  title: string
  description: string
  company: string // 发布公司/客户
  category: string // 项目类别
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  requiredAbilities: string[] // 需要的能力标签
  estimatedDays: number // 预计工作天数

  // 财务信息
  budget: number // 项目预算（元）
  actualEarnings: number // 实际收入（元）
  platformCommission: number // 平台抽成（元）
  netIncome: number // 净收入（元）

  // 项目状态
  status: 'available' | 'applied' | 'in_progress' | 'completed' | 'cancelled' | 'disputed'

  // 时间记录
  appliedAt?: Date // 申请时间
  acceptedAt?: Date // 接单时间
  startedAt?: Date // 开始时间
  completedAt?: Date // 完成时间

  // 完成信息
  deliverables: {
    type: string // 交付物类型
    url: string // 文件URL
    description: string
  }[]

  // 客户评价
  clientRating?: {
    score: number // 1-5星
    comment: string
    tags: string[] // 评价标签
  }

  // 能力成长记录
  abilitiesGained: string[] // 获得的新能力标签
  abilitiesImproved: string[] // 提升的能力标签

  createdAt: Date
}

const RealProjectSchema = new Schema<IRealProject>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  projectNumber: {
    type: Number
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  company: String,
  category: String,
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'expert'],
    default: 'medium'
  },
  requiredAbilities: [String],
  estimatedDays: {
    type: Number,
    default: 7
  },
  budget: {
    type: Number,
    default: 0
  },
  actualEarnings: {
    type: Number,
    default: 0
  },
  platformCommission: {
    type: Number,
    default: 0
  },
  netIncome: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['available', 'applied', 'in_progress', 'completed', 'cancelled', 'disputed'],
    default: 'available',
    index: true
  },
  appliedAt: Date,
  acceptedAt: Date,
  startedAt: Date,
  completedAt: Date,
  deliverables: [{
    type: { type: String },
    url: String,
    description: String
  }],
  clientRating: {
    score: Number,
    comment: String,
    tags: [String]
  },
  abilitiesGained: [String],
  abilitiesImproved: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

RealProjectSchema.index({ userId: 1, status: 1 })
RealProjectSchema.index({ status: 1, difficulty: 1 })
RealProjectSchema.index({ category: 1, status: 1 })

export const RealProject = mongoose.model<IRealProject>('RealProject', RealProjectSchema)
