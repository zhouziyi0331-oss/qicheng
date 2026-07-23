import mongoose, { Document, Schema } from 'mongoose'

/**
 * 支付记录模型
 * 记录所有支付交易，包括真实支付和模拟支付
 */

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId

  // 订单信息
  orderId: string // 平台订单号
  outTradeNo?: string // 外部交易号（如微信订单号）

  // 支付内容
  itemType: 'decomposition_report' | 'graduation_report' | 'practice_unlock' | 'other'
  itemId: string // 关联的内容ID
  itemTitle: string // 内容标题

  // 金额信息
  amount: number // 支付金额（元）
  currency: string // 货币类型

  // 支付状态
  status: 'pending' | 'success' | 'failed' | 'refunded' | 'cancelled'

  // 支付方式
  paymentMethod: 'wechat' | 'alipay' | 'mock' | 'admin_grant' // mock=模拟支付, admin_grant=管理员赠送

  // 时间记录
  createdAt: Date
  paidAt?: Date // 支付完成时间
  expiredAt?: Date // 订单过期时间

  // 备注
  remark?: string
  metadata?: any // 额外元数据
}

const PaymentSchema = new Schema<IPayment>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  outTradeNo: String,
  itemType: {
    type: String,
    enum: ['decomposition_report', 'graduation_report', 'practice_unlock', 'other'],
    required: true,
    index: true
  },
  itemId: {
    type: String,
    required: true,
    index: true
  },
  itemTitle: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'CNY'
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'refunded', 'cancelled'],
    default: 'pending',
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['wechat', 'alipay', 'mock', 'admin_grant'],
    required: true
  },
  paidAt: Date,
  expiredAt: Date,
  remark: String,
  metadata: Schema.Types.Mixed
}, {
  timestamps: true
})

// 复合索引
PaymentSchema.index({ userId: 1, status: 1 })
PaymentSchema.index({ userId: 1, itemType: 1, itemId: 1 })
PaymentSchema.index({ status: 1, createdAt: -1 })

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema)
