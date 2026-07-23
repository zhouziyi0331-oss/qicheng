import mongoose, { Schema, Document } from 'mongoose'

export interface IPracticeProject extends Document {
  userId: string
  title: string
  company: string
  track: 'content' | 'dev'
  status: 'ongoing' | 'completed'
  tags: string[]
  budget: number
  startDate: Date
  endDate?: Date
  expectedEndDate?: Date
  progress: number
  description: string
  deliverables: string[]
  companyFeedback?: string
  processData?: {
    iterations: number
    revisionCount: number
    communicationCount: number
    toolsUsed: string[]
  }
  scores?: {
    execution: number
    problemSolving: number
    replicability: number
  }
  createdAt: Date
  updatedAt: Date
}

const PracticeProjectSchema = new Schema<IPracticeProject>({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  company: { type: String, required: true },
  track: { type: String, enum: ['content', 'dev'], required: true },
  status: { type: String, enum: ['ongoing', 'completed'], default: 'ongoing' },
  tags: [{ type: String }],
  budget: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  expectedEndDate: { type: Date },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  description: { type: String, required: true },
  deliverables: [{ type: String }],
  companyFeedback: { type: String },
  processData: {
    iterations: { type: Number },
    revisionCount: { type: Number },
    communicationCount: { type: Number },
    toolsUsed: [{ type: String }]
  },
  scores: {
    execution: { type: Number, min: 0, max: 100 },
    problemSolving: { type: Number, min: 0, max: 100 },
    replicability: { type: Number, min: 0, max: 100 }
  }
}, {
  timestamps: true
})

PracticeProjectSchema.index({ userId: 1, status: 1 })
PracticeProjectSchema.index({ track: 1, status: 1 })

export const PracticeProject = mongoose.model<IPracticeProject>('PracticeProject', PracticeProjectSchema)
