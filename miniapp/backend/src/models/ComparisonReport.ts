import mongoose, { Document, Schema } from 'mongoose'

/**
 * 深度对比报告
 * 对比用户在不同时间点的能力变化
 * 规则：
 * - 第1次：测评 vs 第1次项目
 * - 第2次：第2次项目 vs 第1次项目
 * - 第N次：第N次项目 vs 第(N-1)次项目
 */

export interface IComparisonReport extends Document {
  userId: mongoose.Types.ObjectId
  comparisonNumber: number // 第几次对比
  beforeSnapshot: {
    type: 'assessment' | 'project'
    refId: mongoose.Types.ObjectId
    date: Date
    abilityRadarId: mongoose.Types.ObjectId
    overallScore: number
  }
  afterSnapshot: {
    type: 'assessment' | 'project'
    refId: mongoose.Types.ObjectId
    date: Date
    abilityRadarId: mongoose.Types.ObjectId
    overallScore: number
  }
  analysis: {
    dimensionChanges: {
      dimension: string
      beforeScore: number
      afterScore: number
      change: number // 正数表示提升，负数表示下降
      changePercent: string // 变化百分比
      evaluation: string // AI评价
    }[]
    newAbilities: string[] // 新增能力标签
    improvedAbilities: string[] // 提升的能力
    stableAbilities: string[] // 保持稳定的能力
    overallGrowth: number // 整体成长分数
    summary: string // AI生成的总结
    recommendations: string[] // AI推荐的下一步行动
  }
  createdAt: Date
}

const ComparisonReportSchema = new Schema<IComparisonReport>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  comparisonNumber: {
    type: Number,
    required: true
  },
  beforeSnapshot: {
    type: {
      type: String,
      enum: ['assessment', 'project']
    },
    refId: Schema.Types.ObjectId,
    date: Date,
    abilityRadarId: Schema.Types.ObjectId,
    overallScore: Number
  },
  afterSnapshot: {
    type: {
      type: String,
      enum: ['assessment', 'project']
    },
    refId: Schema.Types.ObjectId,
    date: Date,
    abilityRadarId: Schema.Types.ObjectId,
    overallScore: Number
  },
  analysis: {
    dimensionChanges: [{
      dimension: String,
      beforeScore: Number,
      afterScore: Number,
      change: Number,
      changePercent: String,
      evaluation: String
    }],
    newAbilities: [String],
    improvedAbilities: [String],
    stableAbilities: [String],
    overallGrowth: Number,
    summary: String,
    recommendations: [String]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

ComparisonReportSchema.index({ userId: 1, comparisonNumber: 1 })
ComparisonReportSchema.index({ userId: 1, createdAt: -1 })

export const ComparisonReport = mongoose.model<IComparisonReport>('ComparisonReport', ComparisonReportSchema)
