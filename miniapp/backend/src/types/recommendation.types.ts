/**
 * 生产级推荐系统 - 标准化类型定义
 * 统一的数据结构和接口
 */

import { RecommendationWeights } from '../constants/recommendation.constants'

// ==================== 学生能力画像 ====================

export interface StudentAbilityProfile {
  userId: string

  basicAbility: {
    level: number                    // 等级 1-10
    levelName: string                // 等级名称
    experience: number               // 经验值
    totalProjects: number            // 完成项目数
    abilityScore: number             // 综合能力分 0-100
  }

  skillProfile: {
    primarySkills: SkillItem[]       // 核心技能（权重>0.7）
    secondarySkills: SkillItem[]     // 次要技能（权重0.4-0.7）
    learningSkills: SkillItem[]      // 学习中（权重<0.4）
    skillStability: number           // 技能稳定性 0-1
    totalSkillCount: number          // 总技能数
  }

  performance: {
    completionRate: number           // 完成率 0-1
    onTimeRate: number               // 按时完成率 0-1
    averageRating: number            // 平均评分 0-5
    successRate: number              // 成功率 0-1
  }

  preferences: {
    categoryPreference: CategoryPreference[]
    difficultyPreference: DifficultyPreference
    budgetPreference: BudgetPreference
  }

  vector: {
    qdrantId: string
    dimension: number
    lastUpdated: Date
  }

  metadata: {
    createdAt: Date
    updatedAt: Date
    version: number
  }
}

export interface SkillItem {
  tagId: string
  tagName: string
  weight: number                     // 权重 0-1
  level: 'expert' | 'advanced' | 'intermediate' | 'beginner' | 'learning'
  acquiredDate: Date
  lastUsed?: Date
  projectCount: number
}

export interface CategoryPreference {
  category: string
  score: number                      // 偏好分数 0-1
  projectCount: number
  avgRating: number
}

export interface DifficultyPreference {
  preferred: 'easy' | 'medium' | 'hard' | 'expert'
  comfortableMin: number
  comfortableMax: number
  canHandleMax: number
}

export interface BudgetPreference {
  min: number
  max: number
  preferred: number
  avgAccepted: number
}

// ==================== 项目评级画像 ====================

export interface ProjectRatingProfile {
  projectId: string

  basicInfo: {
    title: string
    description: string
    category: string
    industry: string
    budget: number
    duration: number                 // 预估工时
    status: 'draft' | 'available' | 'ongoing' | 'completed'
  }

  skillRequirements: {
    requiredSkills: SkillRequirement[]
    preferredSkills: SkillRequirement[]
    totalComplexity: number          // 总复杂度 0-100
    skillCount: number
  }

  difficultyRating: {
    level: 'easy' | 'medium' | 'hard' | 'expert'
    score: number                    // 难度分 0-100
    recommendedLevel: number         // 推荐学生等级
    minimumLevel: number             // 最低学生等级
    factors: {
      technicalComplexity: number
      skillRequirements: number
      timeConstraint: number
      qualityRequirement: number
    }
  }

  qualityRequirements: {
    standard: 'basic' | 'professional' | 'premium' | 'enterprise'
    detailLevel: number
    innovationRequired: boolean
  }

  pricing: {
    budget: number
    marketAverage: number
    budgetLevel: 'low' | 'medium' | 'high' | 'premium'
    pricePerHour: number
  }

  targetStudentProfile: {
    minLevel: number
    preferredLevel: number
    requiredSkills: string[]
    minCompletionRate: number
    minRating: number
  }

  vector: {
    qdrantId: string
    dimension: number
    lastUpdated: Date
  }

  metadata: {
    createdAt: Date
    updatedAt: Date
    createdBy: string
    version: number
  }
}

export interface SkillRequirement {
  tagId: string
  tagName: string
  importance: 'required' | 'preferred' | 'optional'
  minLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  weight: number
}

// ==================== 推荐结果 ====================

export interface RecommendationResult {
  request: {
    userId: string
    requestId: string
    timestamp: Date
    filters?: RecommendationFilters
  }

  studentSnapshot: {
    level: number
    levelName: string
    abilityScore: number
    topSkills: string[]
    preferredCategories: string[]
  }

  recommendations: RecommendedProject[]

  statistics: {
    totalCandidates: number
    filteredCount: number
    recommendedCount: number
    avgMatchScore: number
    highestMatchScore: number
    lowestMatchScore: number
    processingTime: number           // ms
  }

  strategy: {
    algorithm: string
    version: string
    weights: RecommendationWeights
    personalizedFor: 'newbie' | 'intermediate' | 'advanced'
  }

  metadata: {
    generatedAt: Date
    expiresAt: Date
  }
}

export interface RecommendedProject {
  project: {
    projectId: string
    title: string
    description: string
    category: string
    industry: string
    budget: number
    duration: number
    difficulty: string
    requiredSkills: string[]
    tags: string[]
  }

  overallScore: number               // 0-100
  matchLevel: string                 // 完美匹配/优秀匹配...
  rank: number

  scores: {
    skillMatch: SkillMatchScore
    difficultyFit: DifficultyFitScore
    interestMatch: InterestMatchScore
    successProbability: SuccessProbScore
    budgetFit: BudgetFitScore
    timeFit: TimeFitScore
  }

  recommendation: {
    reasons: string[]
    highlights: string[]
    considerations: string[]
    tags: string[]
  }

  predictions: {
    completionProbability: number
    estimatedCompletionTime: number
    expectedRating: number
    earnPotential: number
  }

  actionGuide?: {
    preparation: string[]
    learningResources: string[]
    similarProjects: string[]
  }
}

export interface SkillMatchScore {
  score: number
  weight: number
  matchedSkills: string[]
  missingSkills: string[]
  coverageRate: number               // 技能覆盖率
  strengthLevel: 'expert' | 'advanced' | 'intermediate' | 'beginner'
}

export interface DifficultyFitScore {
  score: number
  weight: number
  studentAbility: number
  projectDifficulty: number
  gap: number
  challengeLevel: string
  recommendation: string
}

export interface InterestMatchScore {
  score: number
  weight: number
  categoryMatch: boolean
  industryMatch: boolean
  historyMatch: number
}

export interface SuccessProbScore {
  score: number
  weight: number
  confidence: 'high' | 'medium' | 'low'
  factors: {
    historicalSuccess: number
    skillReadiness: number
    difficultyFit: number
  }
}

export interface BudgetFitScore {
  score: number
  weight: number
  projectBudget: number
  studentPreference: number
  marketComparison: 'below' | 'average' | 'above'
}

export interface TimeFitScore {
  score: number
  weight: number
  estimatedHours: number
  availableHours: number
  feasibility: boolean
}

export interface RecommendationFilters {
  categories?: string[]
  industries?: string[]
  difficultyRange?: {
    min: 'easy' | 'medium' | 'hard' | 'expert'
    max: 'easy' | 'medium' | 'hard' | 'expert'
  }
  budgetRange?: {
    min: number
    max: number
  }
  durationRange?: {
    min: number
    max: number
  }
  requiredSkills?: string[]
  excludeSkills?: string[]
  onlyPerfectMatch?: boolean
  minMatchScore?: number
}

// ==================== 推荐报告 ====================

export interface RecommendationReport {
  header: {
    reportId: string
    userId: string
    userName: string
    generatedAt: Date
    reportType: 'detailed' | 'summary'
  }

  abilityAnalysis: {
    currentLevel: {
      level: number
      levelName: string
      abilityScore: number
      percentile: number
    }

    skillBreakdown: {
      core: SkillAnalysis[]
      secondary: SkillAnalysis[]
      learning: SkillAnalysis[]
    }

    strengths: string[]
    weaknesses: string[]

    growthTrajectory: {
      trend: 'rising' | 'stable' | 'declining'
      recentImprovement: string[]
      nextMilestones: string[]
    }
  }

  recommendedProjects: {
    perfect: RecommendedProject[]
    good: RecommendedProject[]
    challenging: RecommendedProject[]
    exploration: RecommendedProject[]
  }

  matchAnalysis: {
    overallFit: number
    bestCategories: string[]
    strongestSkills: string[]
    marketPosition: string
  }

  growthAdvice: {
    shortTerm: string[]
    midTerm: string[]
    longTerm: string[]
    skillsToLearn: string[]
    projectsToTry: string[]
  }

  metadata: {
    algorithmVersion: string
    dataVersion: string
    confidence: number
  }
}

export interface SkillAnalysis {
  skillName: string
  level: string
  weight: number
  projectCount: number
  marketDemand: 'high' | 'medium' | 'low'
  recommendation: string
}

// ==================== API响应格式 ====================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  timestamp: Date
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// ==================== 内部使用类型 ====================

export interface RecommendationContext {
  student: StudentAbilityProfile
  weights: RecommendationWeights
  filters?: RecommendationFilters
  candidateProjects: any[]
  requestTime: Date
}

export interface ScoringContext {
  studentAbility: StudentAbilityProfile['basicAbility']
  studentSkills: SkillItem[]
  studentPreferences: StudentAbilityProfile['preferences']
  studentPerformance: StudentAbilityProfile['performance']
}
