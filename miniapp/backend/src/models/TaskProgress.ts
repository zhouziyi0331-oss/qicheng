import mongoose, { Schema, Document } from 'mongoose'

// 任务进度系统 - 每个项目的任务拆解和进度追踪
// 真正根据项目内容来拆解，每个用户每个项目都不同
export interface ITaskProgress extends Document {
  userId: mongoose.Types.ObjectId

  // 关联的项目（可以是实践项目或真实项目）
  projectType: 'practice' | 'real'
  projectId: mongoose.Types.ObjectId

  // 项目基本信息快照
  projectSnapshot: {
    title: string
    description: string
    difficulty: string
  }

  // AI生成的任务拆解（真正根据项目内容拆解）
  tasks: Array<{
    taskNumber: number
    title: string
    description: string

    // 思路和步骤（AI根据项目具体分析）
    approach: string // 做这个任务的思路
    steps: Array<{
      stepNumber: number
      content: string
      estimatedTime: string
      tips?: string[]
    }>

    // 任务状态
    status: 'pending' | 'in_progress' | 'completed' | 'blocked'

    // 进度
    progress: number // 0-100

    // 时间记录
    startedAt?: Date
    completedAt?: Date
    estimatedDuration: string
    actualDuration?: string

    // 任务产出
    deliverables: Array<{
      name: string
      description: string
      url?: string
      completed: boolean
    }>

    // 遇到的问题和解决方案
    challenges?: Array<{
      problem: string
      solution: string
      recordedAt: Date
    }>

    // 用户反思
    reflection?: {
      whatWorked: string[] // 做得好的地方
      whatToImprove: string[] // 需要改进的
      lessonsLearned: string[] // 学到的经验
    }
  }>

  // 整体项目进度
  overallProgress: number // 0-100

  // 项目状态
  status: 'planning' | 'in_progress' | 'completed' | 'paused'

  // AI生成的项目建议
  aiRecommendations?: Array<{
    type: 'task_order' | 'time_management' | 'quality_improvement' | 'resource'
    content: string
    priority: 'high' | 'medium' | 'low'
    createdAt: Date
  }>

  // 项目总结（完成后生成）
  projectSummary?: {
    totalTimeSpent: string
    tasksCompleted: number
    challengesFaced: number
    keyAchievements: string[]
    skillsImproved: string[]
    nextSteps: string[]
  }

  createdAt: Date
  updatedAt: Date
}

const TaskProgressSchema = new Schema<ITaskProgress>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  projectType: {
    type: String,
    enum: ['practice', 'real'],
    required: true
  },

  projectId: { type: Schema.Types.ObjectId, required: true, index: true },

  projectSnapshot: {
    title: { type: String, required: true },
    description: { type: String, required: true },
    difficulty: { type: String, required: true }
  },

  tasks: [{
    taskNumber: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },

    approach: { type: String, required: true },
    steps: [{
      stepNumber: { type: Number, required: true },
      content: { type: String, required: true },
      estimatedTime: { type: String, required: true },
      tips: [{ type: String }]
    }],

    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'blocked'],
      default: 'pending'
    },

    progress: { type: Number, default: 0, min: 0, max: 100 },

    startedAt: { type: Date },
    completedAt: { type: Date },
    estimatedDuration: { type: String, required: true },
    actualDuration: { type: String },

    deliverables: [{
      name: { type: String, required: true },
      description: { type: String, required: true },
      url: { type: String },
      completed: { type: Boolean, default: false }
    }],

    challenges: [{
      problem: { type: String, required: true },
      solution: { type: String, required: true },
      recordedAt: { type: Date, default: Date.now }
    }],

    reflection: {
      whatWorked: [{ type: String }],
      whatToImprove: [{ type: String }],
      lessonsLearned: [{ type: String }]
    }
  }],

  overallProgress: { type: Number, default: 0, min: 0, max: 100 },

  status: {
    type: String,
    enum: ['planning', 'in_progress', 'completed', 'paused'],
    default: 'planning'
  },

  aiRecommendations: [{
    type: {
      type: String,
      enum: ['task_order', 'time_management', 'quality_improvement', 'resource'],
      required: true
    },
    content: { type: String, required: true },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    createdAt: { type: Date, default: Date.now }
  }],

  projectSummary: {
    totalTimeSpent: { type: String },
    tasksCompleted: { type: Number },
    challengesFaced: { type: Number },
    keyAchievements: [{ type: String }],
    skillsImproved: [{ type: String }],
    nextSteps: [{ type: String }]
  }
}, {
  timestamps: true
})

// 复合索引：确保每个项目只有一个任务进度记录
TaskProgressSchema.index({ userId: 1, projectType: 1, projectId: 1 }, { unique: true })
TaskProgressSchema.index({ userId: 1, status: 1 })

export const TaskProgress = mongoose.model<ITaskProgress>('TaskProgress', TaskProgressSchema)
