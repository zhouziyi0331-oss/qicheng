import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
  openId?: string  // 改为可选，支持纯手机号注册
  unionId?: string
  nickname: string
  avatar?: string  // 改为可选
  phone?: string
  email?: string
  wechatId?: string
  company?: string
  track?: 'content' | 'dev'
  role: 'user' | 'admin'
  level: number
  exp: number
  totalIncome: number
  totalProjects: number
  rating: number

  // 账号类型
  account_type?: 'student' | 'enterprise'  // 新增：账号类型
  hasCompletedOnboarding?: boolean  // 新增：是否完成入职流程（OPC测评）

  // 财务余额字段
  balance: number // 可用余额（实时更新）
  totalWithdrawal: number // 累计提现金额

  // OPC测评相关
  personalityTag?: string // OPC人格标签
  opcCompleted?: boolean // 是否完成OPC测评
  opcCompletedAt?: Date // OPC测评完成时间
  lifeQuestion?: string // 生命问题

  // 数据标记
  isTestData?: boolean // 标记为测试/演示数据

  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>({
  openId: { type: String, sparse: true, index: true },  // 改为sparse索引，允许null
  unionId: { type: String },
  nickname: { type: String, required: true },
  avatar: { type: String },  // 不再required
  phone: { type: String, sparse: true, index: true },  // 添加索引
  email: { type: String },
  wechatId: { type: String },
  company: { type: String },
  track: { type: String, enum: ['content', 'dev'] },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  level: { type: Number, default: 0 },  // 改为0，表示新用户
  exp: { type: Number, default: 0 },
  totalIncome: { type: Number, default: 0 },
  totalProjects: { type: Number, default: 0 },
  rating: { type: Number, default: 5.0, min: 0, max: 5 },

  // 账号类型
  account_type: { type: String, enum: ['student', 'enterprise'] },
  hasCompletedOnboarding: { type: Boolean, default: false },

  // 财务余额字段
  balance: { type: Number, default: 0, min: 0 },
  totalWithdrawal: { type: Number, default: 0, min: 0 },

  // OPC测评相关
  personalityTag: { type: String },
  opcCompleted: { type: Boolean, default: false },
  opcCompletedAt: { type: Date },
  lifeQuestion: { type: String },

  // 数据标记
  isTestData: { type: Boolean, default: false }
}, {
  timestamps: true
})

export const User = mongoose.model<IUser>('User', UserSchema)
