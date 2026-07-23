import mongoose, { Document, Schema } from 'mongoose'

/**
 * AI导师对话记录
 * 记录学生和导师的所有对话
 */

export interface IMentorConversation extends Document {
  userId: mongoose.Types.ObjectId
  taskId?: mongoose.Types.ObjectId
  studentMessage: string
  mentorResponse: string
  context: 'task' | 'working' | 'stuck' | 'rejected' | 'milestone' | 'general'

  // 自动检测标记
  detectedPassionSpark: boolean // 是否检测到热情火花
  detectedFlowMoment: boolean // 是否检测到穿越感时刻

  createdAt: Date
}

const MentorConversationSchema = new Schema<IMentorConversation>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  taskId: {
    type: Schema.Types.ObjectId,
    ref: 'RealProject'
  },
  studentMessage: {
    type: String,
    required: true
  },
  mentorResponse: {
    type: String,
    required: true
  },
  context: {
    type: String,
    enum: ['task', 'working', 'stuck', 'rejected', 'milestone', 'general'],
    default: 'general'
  },
  detectedPassionSpark: {
    type: Boolean,
    default: false
  },
  detectedFlowMoment: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

MentorConversationSchema.index({ userId: 1, taskId: 1, createdAt: -1 })
MentorConversationSchema.index({ userId: 1, createdAt: -1 })

export const MentorConversation = mongoose.model<IMentorConversation>('MentorConversation', MentorConversationSchema)
