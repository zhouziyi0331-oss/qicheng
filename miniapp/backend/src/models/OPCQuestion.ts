import mongoose, { Document, Schema } from 'mongoose'

/**
 * OPC测试题库
 * 36道工作场景测试题
 */

export interface IOPCQuestion extends Document {
  questionId: number
  questionText: string
  dimension: 'visual' | 'systematic' | 'creative' | 'logical' | 'stable' | 'exploratory' | 'execution' | 'communication' | 'learning'
  options: {
    label: string
    value: string
    score: number
  }[]
  createdAt: Date
}

const OPCQuestionSchema = new Schema<IOPCQuestion>({
  questionId: {
    type: Number,
    required: true,
    unique: true
  },
  questionText: {
    type: String,
    required: true
  },
  dimension: {
    type: String,
    enum: ['visual', 'systematic', 'creative', 'logical', 'stable', 'exploratory', 'execution', 'communication', 'learning'],
    required: true
  },
  options: [{
    label: String,
    value: String,
    score: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

OPCQuestionSchema.index({ questionId: 1 })

export const OPCQuestion = mongoose.model<IOPCQuestion>('OPCQuestion', OPCQuestionSchema)
