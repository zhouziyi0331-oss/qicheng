import mongoose, { Schema, Document } from 'mongoose'

export interface IPracticeReport extends Document {
  projectId: string
  userId: string
  whatDid: {
    description: string
    items: string[]
  }
  problemSolved: {
    coreIssue: string
    rootCause: string
    improvement: {
      label: string
      before: number
      after: number
    }
  }
  replicability: {
    description: string
    industries: Array<{
      name: string
      icon: string
      level: 'high' | 'medium'
    }>
  }
  learned: {
    highlight: string
    items: string[]
  }
  rewards: {
    exp: number
    income: number
    cases: number
  }
  createdAt: Date
  updatedAt: Date
}

const PracticeReportSchema = new Schema<IPracticeReport>({
  projectId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  whatDid: {
    description: { type: String, required: true },
    items: [{ type: String }]
  },
  problemSolved: {
    coreIssue: { type: String, required: true },
    rootCause: { type: String, required: true },
    improvement: {
      label: { type: String, required: true },
      before: { type: Number, required: true },
      after: { type: Number, required: true }
    }
  },
  replicability: {
    description: { type: String, required: true },
    industries: [{
      name: { type: String, required: true },
      icon: { type: String, required: true },
      level: { type: String, enum: ['high', 'medium'], required: true }
    }]
  },
  learned: {
    highlight: { type: String, required: true },
    items: [{ type: String }]
  },
  rewards: {
    exp: { type: Number, required: true },
    income: { type: Number, required: true },
    cases: { type: Number, required: true }
  }
}, {
  timestamps: true
})

export const PracticeReport = mongoose.model<IPracticeReport>('PracticeReport', PracticeReportSchema)
