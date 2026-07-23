import mongoose, { Document, Schema } from 'mongoose'

/**
 * OPC测评结果
 * 存储用户的测评答案和生成的人格标签
 */

export interface IOPCResult extends Document {
  userId: mongoose.Types.ObjectId
  answers: {
    questionId: number
    answer: string
    score: number
  }[]
  result: {
    personalityTag: string // 7种人格标签之一
    dimensionScores: {
      dimension: string
      score: number
    }[]
    strengths: string[] // 优势领域
    suggestions: string[] // 发展建议
  }
  completedAt: Date
}

const OPCResultSchema = new Schema<IOPCResult>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  answers: [{
    questionId: Number,
    answer: String,
    score: Number
  }],
  result: {
    personalityTag: {
      type: String,
      enum: ['视觉叙事者', '系统构建者', '创意执行者', '逻辑拆解者', '稳健交付者', '探索整合者', '混合型']
    },
    dimensionScores: [{
      dimension: String,
      score: Number
    }],
    strengths: [String],
    suggestions: [String]
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

OPCResultSchema.index({ userId: 1, completedAt: -1 })

export const OPCResult = mongoose.model<IOPCResult>('OPCResult', OPCResultSchema)
