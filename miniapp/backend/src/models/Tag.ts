import mongoose, { Document, Schema } from 'mongoose'

/**
 * 标签系统 - 核心模型
 * 用于向量化匹配：学生标签、项目标签、行业标签
 */

// ========== 标签类型枚举 ==========

export type TagCategory =
  | 'skill'           // 技能标签（如：Figma设计、React开发）
  | 'industry'        // 行业标签（如：电商、教育、金融）
  | 'personality'     // 人格特质标签（如：细心、创新）
  | 'interest'        // 兴趣标签（如：游戏、时尚、科技）
  | 'tool'            // 工具标签（如：Photoshop、VSCode）
  | 'domain'          // 领域标签（如：短视频、品牌设计）
  | 'soft_skill'      // 软技能标签（如：沟通、时间管理）
  | 'project_type'    // 项目类型标签（如：落地页设计、小程序开发）

// ========== 通用标签库 ==========

export interface ITag extends Document {
  name: string                    // 标签名称
  category: TagCategory           // 标签类型
  description?: string            // 标签描述
  embedding?: number[]            // 向量表示（OpenAI Embeddings）
  parentTagId?: mongoose.Types.ObjectId // 父标签ID（支持标签层级）
  relatedTags: mongoose.Types.ObjectId[] // 相关标签
  weight: number                  // 标签权重（用于计算匹配分数）
  usageCount: number              // 使用次数
  isActive: boolean               // 是否启用
  createdAt: Date
  updatedAt: Date
}

const TagSchema = new Schema<ITag>({
  name: {
    type: String,
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['skill', 'industry', 'personality', 'interest', 'tool', 'domain', 'soft_skill', 'project_type'],
    required: true,
    index: true
  },
  description: { type: String },
  embedding: { type: [Number] }, // 1536维向量（OpenAI text-embedding-3-small）
  parentTagId: {
    type: Schema.Types.ObjectId,
    ref: 'Tag'
  },
  relatedTags: [{
    type: Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  weight: {
    type: Number,
    default: 1.0,
    min: 0,
    max: 10
  },
  usageCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
})

// 复合索引：快速查找某类标签
TagSchema.index({ category: 1, isActive: 1, usageCount: -1 })

export const Tag = mongoose.model<ITag>('Tag', TagSchema)

// ========== 学生标签画像 ==========

export interface IStudentTagProfile extends Document {
  userId: mongoose.Types.ObjectId

  // 标签集合（每个标签有权重）
  tags: {
    tagId: mongoose.Types.ObjectId
    weight: number              // 0-1之间，表示该标签对学生的重要程度
    source: 'opc' | 'project' | 'self' | 'system' // 标签来源
    confidence: number          // 置信度 0-1
    addedAt: Date
  }[]

  // 综合向量表示（加权平均所有标签的embedding）
  profileEmbedding?: number[]

  // 技能等级
  skillLevels: {
    tagId: mongoose.Types.ObjectId
    level: number               // 1-5级
    experienceProjects: number  // 相关项目数
    lastUpdated: Date
  }[]

  // 兴趣强度
  interests: {
    tagId: mongoose.Types.ObjectId
    intensity: number           // 0-10
    discoveredAt: Date
  }[]

  lastUpdated: Date
  createdAt: Date
}

const StudentTagProfileSchema = new Schema<IStudentTagProfile>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  tags: [{
    tagId: {
      type: Schema.Types.ObjectId,
      ref: 'Tag',
      required: true
    },
    weight: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    source: {
      type: String,
      enum: ['opc', 'project', 'self', 'system'],
      required: true
    },
    confidence: {
      type: Number,
      default: 0.5,
      min: 0,
      max: 1
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  profileEmbedding: { type: [Number] },
  skillLevels: [{
    tagId: {
      type: Schema.Types.ObjectId,
      ref: 'Tag'
    },
    level: {
      type: Number,
      min: 1,
      max: 5,
      default: 1
    },
    experienceProjects: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }],
  interests: [{
    tagId: {
      type: Schema.Types.ObjectId,
      ref: 'Tag'
    },
    intensity: {
      type: Number,
      min: 0,
      max: 10,
      default: 5
    },
    discoveredAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

export const StudentTagProfile = mongoose.model<IStudentTagProfile>('StudentTagProfile', StudentTagProfileSchema)

// ========== 项目标签画像 ==========

export interface IProjectTagProfile extends Document {
  projectId: mongoose.Types.ObjectId
  projectType: 'real' | 'practice' // 真实项目或实践项目

  // 项目标签集合
  tags: {
    tagId: mongoose.Types.ObjectId
    importance: number          // 0-1之间，该标签对项目的重要性
    isRequired: boolean         // 是否必需
    addedAt: Date
  }[]

  // 综合向量表示
  projectEmbedding?: number[]

  // 行业标签
  industries: mongoose.Types.ObjectId[] // Tag IDs

  // 所需技能（带优先级）
  requiredSkills: {
    tagId: mongoose.Types.ObjectId
    priority: 'must' | 'important' | 'nice-to-have'
    minLevel: number            // 最低技能等级 1-5
  }[]

  // 适合的人格特质
  suitablePersonalities: mongoose.Types.ObjectId[] // Tag IDs

  lastUpdated: Date
  createdAt: Date
}

const ProjectTagProfileSchema = new Schema<IProjectTagProfile>({
  projectId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true
  },
  projectType: {
    type: String,
    enum: ['real', 'practice'],
    required: true
  },
  tags: [{
    tagId: {
      type: Schema.Types.ObjectId,
      ref: 'Tag',
      required: true
    },
    importance: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    isRequired: {
      type: Boolean,
      default: false
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  projectEmbedding: { type: [Number] },
  industries: [{
    type: Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  requiredSkills: [{
    tagId: {
      type: Schema.Types.ObjectId,
      ref: 'Tag'
    },
    priority: {
      type: String,
      enum: ['must', 'important', 'nice-to-have'],
      required: true
    },
    minLevel: {
      type: Number,
      min: 1,
      max: 5,
      default: 1
    }
  }],
  suitablePersonalities: [{
    type: Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// 复合索引
ProjectTagProfileSchema.index({ projectId: 1, projectType: 1 }, { unique: true })

export const ProjectTagProfile = mongoose.model<IProjectTagProfile>('ProjectTagProfile', ProjectTagProfileSchema)

// ========== 匹配记录 ==========

export interface IMatchRecord extends Document {
  userId: mongoose.Types.ObjectId
  projectId: mongoose.Types.ObjectId
  projectType: 'real' | 'practice'

  // 匹配分数
  overallScore: number          // 总分 0-100
  vectorSimilarity: number      // 向量相似度 0-1
  skillMatchScore: number       // 技能匹配分 0-100
  personalityMatchScore: number // 人格匹配分 0-100
  interestMatchScore: number    // 兴趣匹配分 0-100

  // 匹配详情
  matchedTags: {
    tagId: mongoose.Types.ObjectId
    studentWeight: number
    projectImportance: number
    contribution: number        // 该标签对总分的贡献
  }[]

  // 缺失的必需技能
  missingRequiredSkills: mongoose.Types.ObjectId[]

  // 匹配理由（AI生成）
  matchReason?: string

  // 是否为冒险项目
  isStretchProject: boolean

  matchedAt: Date
  createdAt: Date
}

const MatchRecordSchema = new Schema<IMatchRecord>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  projectId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true
  },
  projectType: {
    type: String,
    enum: ['real', 'practice'],
    required: true
  },
  overallScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  vectorSimilarity: {
    type: Number,
    min: 0,
    max: 1
  },
  skillMatchScore: {
    type: Number,
    min: 0,
    max: 100
  },
  personalityMatchScore: {
    type: Number,
    min: 0,
    max: 100
  },
  interestMatchScore: {
    type: Number,
    min: 0,
    max: 100
  },
  matchedTags: [{
    tagId: {
      type: Schema.Types.ObjectId,
      ref: 'Tag'
    },
    studentWeight: Number,
    projectImportance: Number,
    contribution: Number
  }],
  missingRequiredSkills: [{
    type: Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  matchReason: { type: String },
  isStretchProject: {
    type: Boolean,
    default: false
  },
  matchedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// 复合索引：查询用户的匹配历史
MatchRecordSchema.index({ userId: 1, matchedAt: -1 })
MatchRecordSchema.index({ projectId: 1, overallScore: -1 })

export const MatchRecord = mongoose.model<IMatchRecord>('MatchRecord', MatchRecordSchema)
