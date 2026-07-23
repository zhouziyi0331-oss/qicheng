import mongoose, { Schema, Document } from 'mongoose'

/**
 * AI导师成长记忆
 * 记录学生的关键成长时刻，用于长期对比
 */
export interface IGrowthMemory extends Document {
  userId: mongoose.Types.ObjectId
  memoryType: 'skill_breakthrough' | 'mindset_shift' | 'passion_discovery' | 'challenge_overcome' | 'milestone'
  title: string
  description: string
  relatedTaskId?: mongoose.Types.ObjectId
  relatedConversationId?: mongoose.Types.ObjectId
  beforeState?: string
  afterState?: string
  emotionalTone?: 'excited' | 'anxious' | 'confused' | 'confident' | 'frustrated' | 'proud'
  significance: number
  tags: string[]
  createdAt: Date
}

const GrowthMemorySchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  memoryType: {
    type: String,
    enum: ['skill_breakthrough', 'mindset_shift', 'passion_discovery', 'challenge_overcome', 'milestone'],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  relatedTaskId: {
    type: Schema.Types.ObjectId,
    ref: 'RealProject'
  },
  relatedConversationId: {
    type: Schema.Types.ObjectId,
    ref: 'MentorConversation'
  },
  beforeState: {
    type: String,
    maxlength: 500
  },
  afterState: {
    type: String,
    maxlength: 500
  },
  emotionalTone: {
    type: String,
    enum: ['excited', 'anxious', 'confused', 'confident', 'frustrated', 'proud']
  },
  significance: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  tags: [{
    type: String,
    maxlength: 30
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
})

GrowthMemorySchema.index({ userId: 1, createdAt: -1 })
GrowthMemorySchema.index({ userId: 1, memoryType: 1 })

export const GrowthMemory = mongoose.model<IGrowthMemory>('GrowthMemory', GrowthMemorySchema)
