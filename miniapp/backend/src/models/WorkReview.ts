import mongoose, { Schema, Document } from 'mongoose'

/**
 * 作品审核记录
 * AI导师对学生提交作品的审核记录
 */
export interface IWorkReview extends Document {
  userId: mongoose.Types.ObjectId
  taskId: mongoose.Types.ObjectId
  submissionUrl: string
  submissionDescription: string
  reviewRound: number

  // AI审核结果
  overallScore: number
  qualityScore: number
  completenessScore: number
  creativityScore: number

  strengths: string[]
  improvements: string[]
  detailedFeedback: string

  status: 'needs_improvement' | 'good_to_submit' | 'excellent'
  suggestedActions: string[]

  studentResponse?: string
  revisedSubmissionUrl?: string

  createdAt: Date
  reviewedAt: Date
}

const WorkReviewSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  taskId: {
    type: Schema.Types.ObjectId,
    ref: 'RealProject',
    required: true,
    index: true
  },
  submissionUrl: {
    type: String,
    required: true
  },
  submissionDescription: {
    type: String,
    maxlength: 1000
  },
  reviewRound: {
    type: Number,
    default: 1
  },
  overallScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  qualityScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  completenessScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  creativityScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  strengths: [{
    type: String,
    maxlength: 200
  }],
  improvements: [{
    type: String,
    maxlength: 200
  }],
  detailedFeedback: {
    type: String,
    required: true,
    maxlength: 2000
  },
  status: {
    type: String,
    enum: ['needs_improvement', 'good_to_submit', 'excellent'],
    required: true
  },
  suggestedActions: [{
    type: String,
    maxlength: 200
  }],
  studentResponse: {
    type: String,
    maxlength: 1000
  },
  revisedSubmissionUrl: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date,
    default: Date.now
  }
})

WorkReviewSchema.index({ userId: 1, taskId: 1, createdAt: -1 })

export const WorkReview = mongoose.model<IWorkReview>('WorkReview', WorkReviewSchema)
