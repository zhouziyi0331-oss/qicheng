import mongoose, { Document, Schema } from 'mongoose'

/**
 * 能力雷达图
 * 多维度追踪用户能力成长
 * 每完成一次项目或测评，都会生成新的雷达图快照
 */

export interface IAbilityRadar extends Document {
  userId: mongoose.Types.ObjectId
  snapshotNumber: number // 第几次快照
  triggerType: 'assessment' | 'project_completed' | 'manual' // 触发类型
  triggerRefId?: mongoose.Types.ObjectId // 触发来源ID（测评ID或项目ID）
  dimensions: {
    name: string // 维度名称
    description: string // 维度描述
    score: number // 分数 0-100
    level: string // 等级
    growth: number // 相比上次的成长值
    tags: string[] // 相关能力标签
  }[]
  overallScore: number // 综合评分
  rank: string // 综合等级："新手"、"进阶"、"熟练"、"专家"、"大师"
  createdAt: Date
}

const AbilityRadarSchema = new Schema<IAbilityRadar>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  snapshotNumber: {
    type: Number,
    required: true,
    default: 1
  },
  triggerType: {
    type: String,
    enum: ['assessment', 'project_completed', 'manual'],
    required: true
  },
  triggerRefId: Schema.Types.ObjectId,
  dimensions: [{
    name: String,
    description: String,
    score: Number,
    level: String,
    growth: Number,
    tags: [String]
  }],
  overallScore: {
    type: Number,
    default: 0
  },
  rank: {
    type: String,
    enum: ['新手', '进阶', '熟练', '专家', '大师'],
    default: '新手'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// 复合索引
AbilityRadarSchema.index({ userId: 1, snapshotNumber: 1 })
AbilityRadarSchema.index({ userId: 1, createdAt: -1 })

export const AbilityRadar = mongoose.model<IAbilityRadar>('AbilityRadar', AbilityRadarSchema)
