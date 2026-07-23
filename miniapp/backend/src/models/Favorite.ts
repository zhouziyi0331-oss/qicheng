import mongoose, { Schema, Document } from 'mongoose'

// 收藏系统 - 每个用户的收藏列表
export interface IFavorite extends Document {
  userId: mongoose.Types.ObjectId

  // 收藏类型
  itemType: 'practice_project' | 'real_project' | 'decomposition_report' | 'comparison_report' | 'growth_path' | 'achievement'

  // 收藏项目的ID
  itemId: mongoose.Types.ObjectId

  // 收藏时的快照信息（方便展示）
  snapshot: {
    title: string
    description?: string
    imageUrl?: string
    tags?: string[]
  }

  // 用户的笔记
  userNote?: string

  // 收藏分类（用户自定义）
  category?: string

  // 是否置顶
  isPinned: boolean

  createdAt: Date
  updatedAt: Date
}

const FavoriteSchema = new Schema<IFavorite>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  itemType: {
    type: String,
    enum: ['practice_project', 'real_project', 'decomposition_report', 'comparison_report', 'growth_path', 'achievement'],
    required: true
  },

  itemId: { type: Schema.Types.ObjectId, required: true },

  snapshot: {
    title: { type: String, required: true },
    description: { type: String },
    imageUrl: { type: String },
    tags: [{ type: String }]
  },

  userNote: { type: String },
  category: { type: String },
  isPinned: { type: Boolean, default: false }
}, {
  timestamps: true
})

// 复合索引：确保同一用户不会重复收藏同一项目
FavoriteSchema.index({ userId: 1, itemType: 1, itemId: 1 }, { unique: true })
FavoriteSchema.index({ userId: 1, isPinned: -1, createdAt: -1 })
FavoriteSchema.index({ userId: 1, category: 1 })

export const Favorite = mongoose.model<IFavorite>('Favorite', FavoriteSchema)
