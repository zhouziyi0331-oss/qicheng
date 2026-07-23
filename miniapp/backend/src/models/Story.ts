import mongoose, { Schema, Document } from 'mongoose'

export interface IStory extends Document {
  userId: mongoose.Types.ObjectId
  type: 'growth_story' | 'passion_spark' | 'flow_moment' | 'life_question'
  title: string
  content: string
  relatedProjectId?: mongoose.Types.ObjectId
  relatedOPCResultId?: mongoose.Types.ObjectId
  tags: string[]
  isPublic: boolean
  likeCount: number
  viewCount: number
  metadata?: {
    beforeLevel?: number
    afterLevel?: number
    achievement?: string
    emotion?: string
    insight?: string
  }
  createdAt: Date
  publishedAt?: Date
}

const StorySchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['growth_story', 'passion_spark', 'flow_moment', 'life_question'],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  relatedProjectId: {
    type: Schema.Types.ObjectId,
    ref: 'RealProject'
  },
  relatedOPCResultId: {
    type: Schema.Types.ObjectId,
    ref: 'OPCResult'
  },
  tags: [{
    type: String,
    maxlength: 20
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  likeCount: {
    type: Number,
    default: 0,
    index: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  metadata: {
    beforeLevel: Number,
    afterLevel: Number,
    achievement: String,
    emotion: String,
    insight: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  publishedAt: {
    type: Date
  }
})

StorySchema.index({ isPublic: 1, createdAt: -1 })
StorySchema.index({ userId: 1, type: 1 })

export const Story = mongoose.model<IStory>('Story', StorySchema)
