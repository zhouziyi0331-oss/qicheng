import mongoose, { Document, Schema } from 'mongoose'

/**
 * 动态成长路径
 * 根据用户能力、项目历史，AI动态生成个性化成长建议
 * 每次测评、完成项目后都会重新生成
 */

export interface IDynamicGrowthPath extends Document {
  userId: mongoose.Types.ObjectId
  versionNumber: number // 第几个版本
  generatedAt: Date

  // 当前状态
  currentState: {
    overallLevel: string // 综合等级
    strongestAbilities: string[] // 最强能力（Top 3）
    weakestAbilities: string[] // 最弱能力（Top 3）
    completedProjects: number // 完成项目数
    totalEarnings: number // 总收入
  }

  // AI生成的成长路径
  phases: {
    phaseNumber: number // 阶段编号
    phaseName: string // 阶段名称
    goal: string // 阶段目标
    duration: string // 预计时长

    // 推荐行动
    actions: {
      actionType: 'learn_skill' | 'do_project' | 'find_mentor' | 'join_community' | 'other'
      title: string
      description: string
      priority: 'high' | 'medium' | 'low'
      estimatedTime: string
      expectedOutcome: string
    }[]

    // 推荐项目类型
    recommendedProjects: {
      category: string
      difficulty: string
      reason: string
    }[]

    // 能力提升目标
    abilityGoals: {
      ability: string
      currentScore: number
      targetScore: number
      improvementPath: string
    }[]
  }[]

  // 里程碑
  milestones: {
    title: string
    description: string
    targetDate?: Date
    completed: boolean
    completedAt?: Date
  }[]

  // 预测
  predictions: {
    expectedLevel: string // 预计达到的等级
    expectedTimeframe: string // 预计时间
    expectedEarnings: number // 预计收入
    confidenceLevel: string // 置信度："高"、"中"、"低"
  }
}

const DynamicGrowthPathSchema = new Schema<IDynamicGrowthPath>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  versionNumber: {
    type: Number,
    required: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  currentState: {
    overallLevel: String,
    strongestAbilities: [String],
    weakestAbilities: [String],
    completedProjects: Number,
    totalEarnings: Number
  },
  phases: [{
    phaseNumber: Number,
    phaseName: String,
    goal: String,
    duration: String,
    actions: [{
      actionType: {
        type: String,
        enum: ['learn_skill', 'do_project', 'find_mentor', 'join_community', 'other']
      },
      title: String,
      description: String,
      priority: {
        type: String,
        enum: ['high', 'medium', 'low']
      },
      estimatedTime: String,
      expectedOutcome: String
    }],
    recommendedProjects: [{
      category: String,
      difficulty: String,
      reason: String
    }],
    abilityGoals: [{
      ability: String,
      currentScore: Number,
      targetScore: Number,
      improvementPath: String
    }]
  }],
  milestones: [{
    title: String,
    description: String,
    targetDate: Date,
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date
  }],
  predictions: {
    expectedLevel: String,
    expectedTimeframe: String,
    expectedEarnings: Number,
    confidenceLevel: String
  }
}, {
  timestamps: true
})

DynamicGrowthPathSchema.index({ userId: 1, versionNumber: 1 })
DynamicGrowthPathSchema.index({ userId: 1, generatedAt: -1 })

export const DynamicGrowthPath = mongoose.model<IDynamicGrowthPath>('DynamicGrowthPath', DynamicGrowthPathSchema)
