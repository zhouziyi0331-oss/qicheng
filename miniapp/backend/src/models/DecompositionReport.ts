import mongoose, { Schema, Document } from 'mongoose'

export interface IDecompositionReport extends Document {
  projectId: string
  userId: string
  status: 'generating' | 'pending_review' | 'completed' | 'failed'
  isUnlocked: boolean
  unlockedAt?: Date
  paymentAmount?: number

  // AI生成的5大模块
  abilityBreakdown: {
    abilities: Array<{
      name: string
      description: string
      evidence: string[]
      marketValue: string
    }>
  }

  problemValue: {
    painPoint: string
    rootCause: string
    impact: string
    metrics: Array<{
      label: string
      before: string
      after: string
    }>
  }

  targetCustomers: {
    types: Array<{
      type: string
      description: string
      painPoints: string[]
      applicability: 'high' | 'medium' | 'low'
      priceRange: string
    }>
  }

  acquisitionChannels: {
    channels: Array<{
      name: string
      difficulty: 'easy' | 'medium' | 'hard'
      timeToResult: string
      tactics: string[]
      expectedConversion: string
    }>
  }

  growthPath: {
    foundation: {
      phase: string
      duration: string
      goals: string[]
      expectedValue: string
    }
    advanced: {
      phase: string
      duration: string
      goals: string[]
      expectedValue: string
    }
    breakthrough: {
      phase: string
      duration: string
      goals: string[]
      expectedValue: string
    }
  }

  generationMetadata: {
    aiModel: string
    promptVersion: string
    tokensUsed: number
    generatedAt: Date
    reviewedBy?: string
    reviewedAt?: Date
    qualityScore?: number
  }

  createdAt: Date
  updatedAt: Date
}

const DecompositionReportSchema = new Schema<IDecompositionReport>({
  projectId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  status: {
    type: String,
    enum: ['generating', 'pending_review', 'completed', 'failed'],
    default: 'generating'
  },
  isUnlocked: { type: Boolean, default: false },
  unlockedAt: { type: Date },
  paymentAmount: { type: Number },

  abilityBreakdown: {
    abilities: [{
      name: { type: String },
      description: { type: String },
      evidence: [{ type: String }],
      marketValue: { type: String }
    }]
  },

  problemValue: {
    painPoint: { type: String },
    rootCause: { type: String },
    impact: { type: String },
    metrics: [{
      label: { type: String },
      before: { type: String },
      after: { type: String }
    }]
  },

  targetCustomers: {
    types: [{
      type: { type: String },
      description: { type: String },
      painPoints: [{ type: String }],
      applicability: { type: String, enum: ['high', 'medium', 'low'] },
      priceRange: { type: String }
    }]
  },

  acquisitionChannels: {
    channels: [{
      name: { type: String },
      difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
      timeToResult: { type: String },
      tactics: [{ type: String }],
      expectedConversion: { type: String }
    }]
  },

  growthPath: {
    foundation: {
      phase: { type: String },
      duration: { type: String },
      goals: [{ type: String }],
      expectedValue: { type: String }
    },
    advanced: {
      phase: { type: String },
      duration: { type: String },
      goals: [{ type: String }],
      expectedValue: { type: String }
    },
    breakthrough: {
      phase: { type: String },
      duration: { type: String },
      goals: [{ type: String }],
      expectedValue: { type: String }
    }
  },

  generationMetadata: {
    aiModel: { type: String },
    promptVersion: { type: String },
    tokensUsed: { type: Number },
    generatedAt: { type: Date },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
    qualityScore: { type: Number, min: 0, max: 100 }
  }
}, {
  timestamps: true
})

DecompositionReportSchema.index({ userId: 1, isUnlocked: 1 })
DecompositionReportSchema.index({ status: 1 })

export const DecompositionReport = mongoose.model<IDecompositionReport>('DecompositionReport', DecompositionReportSchema)
