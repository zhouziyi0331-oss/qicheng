import mongoose, { Document, Schema } from 'mongoose'

/**
 * 毕业报告
 * 用户完成整个学习历程后的综合报告
 * 每个人的报告都是独一无二的
 */

export interface IGraduationReport extends Document {
  userId: mongoose.Types.ObjectId
  generatedAt: Date

  // 学习历程总结
  journeySummary: {
    startDate: Date // 开始日期
    endDate: Date // 毕业日期
    totalDays: number // 总天数
    firstAssessmentDate: Date
    lastAssessmentDate: Date
    assessmentCount: number // 完成测评次数
  }

  // 项目成果
  projectAchievements: {
    practiceProjects: number // 完成的实践项目数
    realProjects: number // 完成的真实项目数
    totalProjects: number
    projectCategories: string[] // 涉及的项目类别
    clientSatisfaction: number // 客户满意度（平均分）
  }

  // 能力成长
  abilityGrowth: {
    initialLevel: string // 初始等级
    finalLevel: string // 最终等级
    levelUpCount: number // 升级次数

    // 能力维度成长
    dimensionGrowth: {
      dimension: string
      initialScore: number
      finalScore: number
      growth: number
      growthPercent: string
    }[]

    // 获得的所有能力标签
    allAbilityTags: string[]
    totalAbilityCount: number

    // 最大进步维度
    mostImprovedDimension: {
      dimension: string
      growth: number
    }
  }

  // 财务成果
  financialSummary: {
    totalEarnings: number // 总收入
    totalWithdrawals: number // 总提现
    currentBalance: number // 当前余额
    averageProjectEarnings: number // 平均项目收入
    highestProjectEarnings: number // 最高项目收入
  }

  // AI生成的个性化评价
  aiEvaluation: {
    overallAssessment: string // 整体评价
    strengthsAnalysis: string // 优势分析
    achievementsHighlight: string[] // 成就亮点
    growthStory: string // 成长故事
    futureRecommendations: string[] // 未来建议
    careerPathSuggestions: string[] // 职业路径建议
  }

  // 数据可视化
  visualData: {
    abilityRadarComparison: {
      initial: any // 初始雷达图数据
      final: any // 最终雷达图数据
    }
    growthCurve: {
      date: Date
      overallScore: number
    }[]
    projectTimeline: {
      date: Date
      projectTitle: string
      projectType: 'practice' | 'real'
      earnings: number
    }[]
  }

  // 证书信息
  certificate: {
    certificateId: string
    issuedAt: Date
    level: string // 证书等级
    specialization: string[] // 专业方向
  }

  status: 'generating' | 'completed' | 'failed'
  isUnlocked: boolean // 是否解锁（可能需要付费）
  unlockedAt?: Date
}

const GraduationReportSchema = new Schema<IGraduationReport>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  journeySummary: {
    startDate: Date,
    endDate: Date,
    totalDays: Number,
    firstAssessmentDate: Date,
    lastAssessmentDate: Date,
    assessmentCount: Number
  },
  projectAchievements: {
    practiceProjects: Number,
    realProjects: Number,
    totalProjects: Number,
    projectCategories: [String],
    clientSatisfaction: Number
  },
  abilityGrowth: {
    initialLevel: String,
    finalLevel: String,
    levelUpCount: Number,
    dimensionGrowth: [{
      dimension: String,
      initialScore: Number,
      finalScore: Number,
      growth: Number,
      growthPercent: String
    }],
    allAbilityTags: [String],
    totalAbilityCount: Number,
    mostImprovedDimension: {
      dimension: String,
      growth: Number
    }
  },
  financialSummary: {
    totalEarnings: Number,
    totalWithdrawals: Number,
    currentBalance: Number,
    averageProjectEarnings: Number,
    highestProjectEarnings: Number
  },
  aiEvaluation: {
    overallAssessment: String,
    strengthsAnalysis: String,
    achievementsHighlight: [String],
    growthStory: String,
    futureRecommendations: [String],
    careerPathSuggestions: [String]
  },
  visualData: {
    abilityRadarComparison: {
      initial: Schema.Types.Mixed,
      final: Schema.Types.Mixed
    },
    growthCurve: [{
      date: Date,
      overallScore: Number
    }],
    projectTimeline: [{
      date: Date,
      projectTitle: String,
      projectType: {
        type: String,
        enum: ['practice', 'real']
      },
      earnings: Number
    }]
  },
  certificate: {
    certificateId: String,
    issuedAt: Date,
    level: String,
    specialization: [String]
  },
  status: {
    type: String,
    enum: ['generating', 'completed', 'failed'],
    default: 'generating'
  },
  isUnlocked: {
    type: Boolean,
    default: false
  },
  unlockedAt: Date
}, {
  timestamps: true
})

export const GraduationReport = mongoose.model<IGraduationReport>('GraduationReport', GraduationReportSchema)
