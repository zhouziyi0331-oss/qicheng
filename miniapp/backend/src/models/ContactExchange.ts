import mongoose, { Schema, Document } from 'mongoose'

export interface IContactExchange extends Document {
  requesterId: string
  partnerId: string
  status: 'pending' | 'confirmed' | 'rejected'
  requesterConfirmed: boolean
  partnerConfirmed: boolean
  collaborationCount: number
  requestedAt: Date
  confirmedAt?: Date
  exchangedContact?: {
    requesterContact: string
    partnerContact: string
  }
  createdAt: Date
  updatedAt: Date
}

const ContactExchangeSchema = new Schema<IContactExchange>({
  requesterId: { type: String, required: true, index: true },
  partnerId: { type: String, required: true, index: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected'],
    default: 'pending'
  },
  requesterConfirmed: { type: Boolean, default: false },
  partnerConfirmed: { type: Boolean, default: false },
  collaborationCount: { type: Number, required: true },
  requestedAt: { type: Date, default: Date.now },
  confirmedAt: { type: Date },
  exchangedContact: {
    requesterContact: { type: String },
    partnerContact: { type: String }
  }
}, {
  timestamps: true
})

// 复合索引：确保同一对用户只有一条交换记录
ContactExchangeSchema.index({ requesterId: 1, partnerId: 1 }, { unique: true })

export const ContactExchange = mongoose.model<IContactExchange>('ContactExchange', ContactExchangeSchema)
