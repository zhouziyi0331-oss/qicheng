import mongoose, { Schema, Document } from 'mongoose'

export interface ICollaboration extends Document {
  projectId: string
  masterId: string
  studentId: string
  role: 'master' | 'student'
  status: 'ongoing' | 'completed' | 'cancelled'
  rating?: number
  review?: string
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const CollaborationSchema = new Schema<ICollaboration>({
  projectId: { type: String, required: true, index: true },
  masterId: { type: String, required: true, index: true },
  studentId: { type: String, required: true, index: true },
  role: { type: String, enum: ['master', 'student'], required: true },
  status: {
    type: String,
    enum: ['ongoing', 'completed', 'cancelled'],
    default: 'ongoing'
  },
  rating: { type: Number, min: 1, max: 5 },
  review: { type: String },
  completedAt: { type: Date }
}, {
  timestamps: true
})

// 复合索引：查询两个用户之间的合作记录
CollaborationSchema.index({ masterId: 1, studentId: 1 })
CollaborationSchema.index({ studentId: 1, masterId: 1 })

export const Collaboration = mongoose.model<ICollaboration>('Collaboration', CollaborationSchema)
