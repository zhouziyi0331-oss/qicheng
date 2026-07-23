import mongoose, { Schema, Document } from 'mongoose'

export interface IStoryLike extends Document {
  userId: mongoose.Types.ObjectId
  storyId: mongoose.Types.ObjectId
  createdAt: Date
}

const StoryLikeSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  storyId: {
    type: Schema.Types.ObjectId,
    ref: 'Story',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

StoryLikeSchema.index({ userId: 1, storyId: 1 }, { unique: true })
StoryLikeSchema.index({ storyId: 1 })

export const StoryLike = mongoose.model<IStoryLike>('StoryLike', StoryLikeSchema)
