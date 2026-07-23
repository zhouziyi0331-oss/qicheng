import mongoose, { Document, Schema } from 'mongoose'

/**
 * OC测评记录
 * 每个用户可以进行多次测评，记录能力成长
 */

export interface IAssessment extends Document {
  userId: mongoose.Types.ObjectId
  assessmentNumber: number // 第几次测评
  answers: {
    questionId: string
    answer: string | number | string[]
  }[]
  result: {
    identityTags: string[] // 身份标签：如"创新者"、"执行者"、"协调者"
    abilityScores: {
      dimension: string // 能力维度：如"沟通力"、"执行力"、"创新力"
      score: number // 0-100分
      level: string // "初级"、"中级"、"高级"、"专家"
    }[]
    personalityType: string // 性格类型：如"INTJ"、"ENFP"
    strengthAreas: string[] // 优势领域
    improvementAreas: string[] // 待提升领域
  }
  createdAt: Date
  completedAt?: Date
}

const AssessmentSchema = new Schema<IAssessment>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  assessmentNumber: {
    type: Number,
    required: true,
    default: 1
  },
  answers: [{
    questionId: String,
    answer: Schema.Types.Mixed
  }],
  result: {
    identityTags: [String],
    abilityScores: [{
      dimension: String,
      score: Number,
      level: String
    }],
    personalityType: String,
    strengthAreas: [String],
    improvementAreas: [String]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
}, {
  timestamps: true
})

// 复合索引：用户ID + 测评次数
AssessmentSchema.index({ userId: 1, assessmentNumber: 1 }, { unique: true })

export const Assessment = mongoose.model<IAssessment>('Assessment', AssessmentSchema)
