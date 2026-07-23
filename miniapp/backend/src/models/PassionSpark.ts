import mongoose, { Document, Schema } from 'mongoose'

export interface IPassionSpark extends Document {
  userId: mongoose.Types.ObjectId
  content: string
  trigger: string
  relatedProjectId?: mongoose.Types.ObjectId
  relatedActivityId?: mongoose.Types.ObjectId
  intensity: number
  tags: string[]
  isShared: boolean
  storyId?: mongoose.Types.ObjectId
  createdAt: Date
}

const PassionSparkSchema = new Schema<IPassionSpark>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  trigger: {
    type: String,
    required: true,
    maxlength: 200
  },
  relatedProjectId: {
    type: Schema.Types.ObjectId,
    ref: 'RealProject'
  },
  relatedActivityId: {
    type: Schema.Types.ObjectId
  },
  intensity: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  tags: [{
    type: String,
    maxlength: 20
  }],
  isShared: {
    type: Boolean,
    default: false
  },
  storyId: {
    type: Schema.Types.ObjectId,
    ref: 'Story'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
})

PassionSparkSchema.index({ userId: 1, createdAt: -1 })

export const PassionSpark = mongoose.model<IPassionSpark>('PassionSpark', PassionSparkSchema)
