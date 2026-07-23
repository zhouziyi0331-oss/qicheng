/**
 * 生产级推荐系统 - 标准化常量定义
 * 统一的评分标准、等级定义、匹配规则
 */

// ==================== 能力等级标准 ====================

export const ABILITY_LEVELS = {
  1: { name: '入门新手', range: [0, 10], description: '刚开始学习，掌握基础概念' },
  2: { name: '初级学徒', range: [11, 20], description: '掌握基础技能，能完成简单任务' },
  3: { name: '初级从业者', range: [21, 35], description: '能独立完成简单项目' },
  4: { name: '中级从业者', range: [36, 50], description: '熟练掌握核心技能，经验较丰富' },
  5: { name: '中高级从业者', range: [51, 65], description: '能处理复杂项目，有一定专业深度' },
  6: { name: '高级专业人士', range: [66, 75], description: '行业经验丰富，技能全面' },
  7: { name: '资深专家', range: [76, 85], description: '领域专家，深厚经验' },
  8: { name: '行业大师', range: [86, 92], description: '顶尖水平，行业标杆' },
  9: { name: '领域权威', range: [93, 97], description: '业界权威，引领方向' },
  10: { name: '传奇大师', range: [98, 100], description: '业界传奇，里程碑人物' }
} as const

/**
 * 根据能力分数获取等级
 */
export function getAbilityLevel(abilityScore: number): {
  level: number
  name: string
  description: string
} {
  for (const [level, info] of Object.entries(ABILITY_LEVELS)) {
    const [min, max] = info.range
    if (abilityScore >= min && abilityScore <= max) {
      return {
        level: parseInt(level),
        name: info.name,
        description: info.description
      }
    }
  }
  return {
    level: 1,
    name: ABILITY_LEVELS[1].name,
    description: ABILITY_LEVELS[1].description
  }
}

// ==================== 难度评级标准 ====================

export const DIFFICULTY_STANDARDS = {
  easy: {
    score: [0, 30],
    requiredLevel: [1, 3],
    complexity: '简单',
    estimatedHours: [5, 15],
    skillCount: [1, 3],
    description: '适合新手，基础技能即可完成',
    color: '#52c41a'
  },
  medium: {
    score: [31, 55],
    requiredLevel: [3, 5],
    complexity: '中等',
    estimatedHours: [15, 40],
    skillCount: [3, 6],
    description: '需要一定经验，多种技能配合',
    color: '#1890ff'
  },
  hard: {
    score: [56, 75],
    requiredLevel: [5, 7],
    complexity: '困难',
    estimatedHours: [40, 80],
    skillCount: [6, 10],
    description: '需要丰富经验，复杂技能组合',
    color: '#fa8c16'
  },
  expert: {
    score: [76, 100],
    requiredLevel: [7, 10],
    complexity: '专家级',
    estimatedHours: [80, 200],
    skillCount: [10, 20],
    description: '需要专家水平，高难度综合项目',
    color: '#f5222d'
  }
} as const

export type DifficultyLevel = keyof typeof DIFFICULTY_STANDARDS

/**
 * 根据难度分数获取等级
 */
export function getDifficultyLevel(difficultyScore: number): DifficultyLevel {
  if (difficultyScore <= 30) return 'easy'
  if (difficultyScore <= 55) return 'medium'
  if (difficultyScore <= 75) return 'hard'
  return 'expert'
}

// ==================== 匹配度评分标准 ====================

export const MATCH_SCORE_LEVELS = {
  perfect: {
    range: [90, 100],
    label: '完美匹配',
    color: '#52c41a',
    icon: '🎯',
    description: '高度匹配，强烈推荐'
  },
  excellent: {
    range: [80, 89],
    label: '优秀匹配',
    color: '#73d13d',
    icon: '⭐',
    description: '非常适合，值得尝试'
  },
  good: {
    range: [70, 79],
    label: '良好匹配',
    color: '#95de64',
    icon: '👍',
    description: '较为适合，可以考虑'
  },
  fair: {
    range: [60, 69],
    label: '尚可匹配',
    color: '#ffc53d',
    icon: '💡',
    description: '基本匹配，需要努力'
  },
  poor: {
    range: [50, 59],
    label: '较弱匹配',
    color: '#ff7a45',
    icon: '⚠️',
    description: '匹配度低，有难度'
  },
  bad: {
    range: [0, 49],
    label: '不匹配',
    color: '#ff4d4f',
    icon: '❌',
    description: '不建议接手'
  }
} as const

/**
 * 根据匹配分数获取等级
 */
export function getMatchScoreLevel(matchScore: number) {
  for (const [key, level] of Object.entries(MATCH_SCORE_LEVELS)) {
    const [min, max] = level.range
    if (matchScore >= min && matchScore <= max) {
      return {
        key,
        ...level
      }
    }
  }
  return {
    key: 'bad',
    ...MATCH_SCORE_LEVELS.bad
  }
}

// ==================== 推荐权重配置 ====================

export interface RecommendationWeights {
  skillMatch: number      // 技能匹配
  difficultyFit: number   // 难度适配
  interestMatch: number   // 兴趣匹配
  successProb: number     // 成功概率
  budgetMatch: number     // 预算匹配
  timeMatch: number       // 时间匹配
}

/**
 * 根据学生等级获取个性化权重
 */
export function getRecommendationWeights(studentLevel: number): RecommendationWeights {
  // 新手学生：更看重难度匹配
  if (studentLevel <= 2) {
    return {
      skillMatch: 0.35,
      difficultyFit: 0.35,
      interestMatch: 0.15,
      successProb: 0.10,
      budgetMatch: 0.03,
      timeMatch: 0.02
    }
  }

  // 高级学生：更看重兴趣和技能
  if (studentLevel >= 6) {
    return {
      skillMatch: 0.45,
      difficultyFit: 0.20,
      interestMatch: 0.20,
      successProb: 0.10,
      budgetMatch: 0.03,
      timeMatch: 0.02
    }
  }

  // 中级学生：平衡
  return {
    skillMatch: 0.40,
    difficultyFit: 0.25,
    interestMatch: 0.15,
    successProb: 0.10,
    budgetMatch: 0.05,
    timeMatch: 0.05
  }
}

// ==================== 挑战等级定义 ====================

export const CHALLENGE_LEVELS = {
  tooEasy: {
    label: '过于简单',
    description: '能力远超项目要求，可能缺乏挑战',
    icon: '😴',
    color: '#bfbfbf'
  },
  comfortable: {
    label: '轻松完成',
    description: '能力稍高于要求，可以轻松完成',
    icon: '😊',
    color: '#52c41a'
  },
  perfect: {
    label: '刚刚好',
    description: '能力与要求匹配，最佳挑战区',
    icon: '🎯',
    color: '#1890ff'
  },
  challenging: {
    label: '略有挑战',
    description: '稍有难度，需要努力但可以完成',
    icon: '💪',
    color: '#fa8c16'
  },
  stretch: {
    label: '高难度挑战',
    description: '有一定难度，需要学习新技能',
    icon: '🚀',
    color: '#ff7a45'
  },
  tooHard: {
    label: '超出能力',
    description: '难度过高，不建议尝试',
    icon: '⛔',
    color: '#f5222d'
  }
} as const

/**
 * 根据能力差距获取挑战等级
 */
export function getChallengeLevel(abilityGap: number) {
  if (abilityGap > 30) return CHALLENGE_LEVELS.tooEasy
  if (abilityGap > 10) return CHALLENGE_LEVELS.comfortable
  if (abilityGap >= -5 && abilityGap <= 10) return CHALLENGE_LEVELS.perfect
  if (abilityGap >= -15) return CHALLENGE_LEVELS.challenging
  if (abilityGap >= -30) return CHALLENGE_LEVELS.stretch
  return CHALLENGE_LEVELS.tooHard
}

// ==================== 技能权重等级 ====================

export const SKILL_WEIGHT_LEVELS = {
  expert: { range: [0.9, 1.0], label: '专家级', color: '#722ed1' },
  advanced: { range: [0.7, 0.89], label: '高级', color: '#1890ff' },
  intermediate: { range: [0.5, 0.69], label: '中级', color: '#52c41a' },
  beginner: { range: [0.3, 0.49], label: '初级', color: '#faad14' },
  learning: { range: [0, 0.29], label: '学习中', color: '#d9d9d9' }
} as const

/**
 * 根据权重获取技能等级
 */
export function getSkillLevel(weight: number) {
  if (weight >= 0.9) return 'expert'
  if (weight >= 0.7) return 'advanced'
  if (weight >= 0.5) return 'intermediate'
  if (weight >= 0.3) return 'beginner'
  return 'learning'
}

// ==================== 成功率置信度 ====================

export const SUCCESS_CONFIDENCE_LEVELS = {
  high: { range: [0.8, 1.0], label: '高', color: '#52c41a', icon: '✓' },
  medium: { range: [0.6, 0.79], label: '中', color: '#1890ff', icon: '~' },
  low: { range: [0, 0.59], label: '低', color: '#ff7a45', icon: '!' }
} as const

/**
 * 根据成功概率获取置信度
 */
export function getSuccessConfidence(successProb: number): 'high' | 'medium' | 'low' {
  if (successProb >= 0.8) return 'high'
  if (successProb >= 0.6) return 'medium'
  return 'low'
}

// ==================== 推荐标签 ====================

export const RECOMMENDATION_TAGS = {
  perfect_match: { label: '完美匹配', icon: '🎯', color: '#52c41a' },
  high_success: { label: '高成功率', icon: '⭐', color: '#1890ff' },
  good_pay: { label: '高薪资', icon: '💰', color: '#fa8c16' },
  skill_match: { label: '技能匹配', icon: '✓', color: '#52c41a' },
  challenge: { label: '有挑战', icon: '💪', color: '#ff7a45' },
  growth: { label: '成长机会', icon: '📈', color: '#722ed1' },
  trending: { label: '热门', icon: '🔥', color: '#f5222d' },
  recommended: { label: '推荐', icon: '👍', color: '#1890ff' }
} as const

// ==================== 能力分数计算公式 ====================

/**
 * 计算学生综合能力分数
 */
export function calculateAbilityScore(params: {
  level: number
  experience: number
  totalProjects: number
  completionRate: number
  averageRating: number
}): number {
  const {
    level,
    experience,
    totalProjects,
    completionRate,
    averageRating
  } = params

  // 基础分数（等级最重要）
  const baseScore = level * 10

  // 经验加成（最多+5分）
  const expBonus = Math.min(experience / 200, 5)

  // 项目数量加成（最多+5分）
  const projectBonus = Math.min(totalProjects * 0.5, 5)

  // 完成率加成（最多+3分）
  const completionBonus = completionRate * 3

  // 评分加成（最多+2分）
  const ratingBonus = (averageRating / 5) * 2

  const totalScore = baseScore + expBonus + projectBonus + completionBonus + ratingBonus

  return Math.min(Math.max(totalScore, 0), 100)
}

/**
 * 计算项目难度分数
 */
export function calculateDifficultyScore(params: {
  difficulty: DifficultyLevel
  skillCount: number
  estimatedHours: number
  qualityRequirement: 'basic' | 'professional' | 'premium' | 'enterprise'
}): number {
  const { difficulty, skillCount, estimatedHours, qualityRequirement } = params

  // 基础难度分数
  const baseScore = DIFFICULTY_STANDARDS[difficulty].score[0]

  // 技能数量影响（最多+10分）
  const skillBonus = Math.min(skillCount * 2, 10)

  // 时间要求影响（最多+10分）
  const timeBonus = Math.min(estimatedHours / 10, 10)

  // 质量要求影响
  const qualityBonus = {
    basic: 0,
    professional: 5,
    premium: 10,
    enterprise: 15
  }[qualityRequirement]

  const totalScore = baseScore + skillBonus + timeBonus + qualityBonus

  return Math.min(Math.max(totalScore, 0), 100)
}

// ==================== 导出类型 ====================

export type MatchScoreLevel = keyof typeof MATCH_SCORE_LEVELS
export type ChallengeLevel = keyof typeof CHALLENGE_LEVELS
export type SkillLevel = 'expert' | 'advanced' | 'intermediate' | 'beginner' | 'learning'
export type SuccessConfidence = 'high' | 'medium' | 'low'
export type RecommendationTag = keyof typeof RECOMMENDATION_TAGS
