import Taro from '@tarojs/taro'

/**
 * 情绪状态检测算法
 * 基于用户行为和对话内容分析情绪状态
 */

export interface EmotionState {
  type: 'positive' | 'neutral' | 'negative' | 'stuck' | 'confused'
  score: number // 0-100
  keywords: string[]
  suggestion: string
}

// 情绪关键词库
const EMOTION_KEYWORDS = {
  positive: ['太好了', '成功', '完成', '搞定', '解决', '明白', '懂了', '谢谢', '棒', '厉害'],
  negative: ['失败', '错误', '不行', '不会', '难', '烦', '累', '放弃', '算了'],
  stuck: ['卡住', '不知道', '怎么办', '不懂', '看不懂', '不理解', '迷茫', '困惑'],
  confused: ['为什么', '怎么', '什么意思', '不明白', '搞不清', '不确定']
}

// 行为模式分析
interface BehaviorPattern {
  taskStartTime?: number
  lastActiveTime?: number
  messageCount: number
  taskSwitchCount: number
  helpRequestCount: number
  errorCount: number
}

/**
 * 分析文本情绪
 */
export function analyzeTextEmotion(text: string): EmotionState {
  const lowerText = text.toLowerCase()
  const scores = {
    positive: 0,
    negative: 0,
    stuck: 0,
    confused: 0
  }

  // 关键词匹配
  const matchedKeywords: string[] = []

  Object.entries(EMOTION_KEYWORDS).forEach(([emotion, keywords]) => {
    keywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        scores[emotion] += 10
        matchedKeywords.push(keyword)
      }
    })
  })

  // 问号数量（表示困惑）
  const questionMarks = (text.match(/[?？]/g) || []).length
  scores.confused += questionMarks * 5

  // 感叹号数量（表示情绪强烈）
  const exclamationMarks = (text.match(/[!！]/g) || []).length
  if (exclamationMarks > 0) {
    scores.positive += exclamationMarks * 3
  }

  // 确定主导情绪
  const maxScore = Math.max(...Object.values(scores))
  const dominantEmotion = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] || 'neutral'

  // 生成建议
  const suggestions = {
    positive: '很好！保持这个状态，继续加油！',
    negative: '遇到困难了吗？别担心，我来帮你分析一下。',
    stuck: '看起来你遇到了瓶颈。让我们一起梳理一下思路。',
    confused: '有些地方不太明白？我来详细解释一下。',
    neutral: '有什么我可以帮你的吗？'
  }

  return {
    type: dominantEmotion as EmotionState['type'],
    score: maxScore,
    keywords: matchedKeywords,
    suggestion: suggestions[dominantEmotion] || suggestions.neutral
  }
}

/**
 * 分析用户行为模式
 */
export function analyzeBehaviorPattern(pattern: BehaviorPattern): EmotionState {
  const now = Date.now()
  let score = 50 // 基础分数

  // 任务停滞时间过长（超过10分钟无活动）
  if (pattern.lastActiveTime && now - pattern.lastActiveTime > 10 * 60 * 1000) {
    score -= 20
    return {
      type: 'stuck',
      score: 30,
      keywords: ['长时间无活动'],
      suggestion: '好久没看到你了，遇到什么困难了吗？'
    }
  }

  // 频繁切换任务（可能迷茫）
  if (pattern.taskSwitchCount > 3) {
    score -= 15
    return {
      type: 'confused',
      score: 35,
      keywords: ['频繁切换任务'],
      suggestion: '我注意到你在多个任务间切换，需要帮你理清思路吗？'
    }
  }

  // 频繁求助（可能遇到困难）
  if (pattern.helpRequestCount > 5) {
    score -= 10
    return {
      type: 'stuck',
      score: 40,
      keywords: ['频繁求助'],
      suggestion: '看起来这个任务有点挑战性，让我们一步步来解决。'
    }
  }

  // 错误次数多（可能受挫）
  if (pattern.errorCount > 3) {
    score -= 15
    return {
      type: 'negative',
      score: 35,
      keywords: ['多次错误'],
      suggestion: '别灰心，错误是学习的一部分。我们一起找出问题所在。'
    }
  }

  // 活跃且顺利
  if (pattern.messageCount > 5 && pattern.errorCount === 0) {
    score += 20
    return {
      type: 'positive',
      score: 70,
      keywords: ['活跃', '顺利'],
      suggestion: '进展很顺利！继续保持这个节奏。'
    }
  }

  return {
    type: 'neutral',
    score,
    keywords: [],
    suggestion: '有什么需要帮助的吗？'
  }
}

/**
 * 综合分析情绪状态
 */
export function detectEmotionState(
  text?: string,
  behavior?: BehaviorPattern
): EmotionState {
  let textEmotion: EmotionState | null = null
  let behaviorEmotion: EmotionState | null = null

  if (text) {
    textEmotion = analyzeTextEmotion(text)
  }

  if (behavior) {
    behaviorEmotion = analyzeBehaviorPattern(behavior)
  }

  // 如果两者都有，取分数更高的
  if (textEmotion && behaviorEmotion) {
    return textEmotion.score > behaviorEmotion.score ? textEmotion : behaviorEmotion
  }

  return textEmotion || behaviorEmotion || {
    type: 'neutral',
    score: 50,
    keywords: [],
    suggestion: '有什么我可以帮你的吗？'
  }
}

/**
 * 保存情绪状态到本地
 */
export function saveEmotionState(userId: string, emotion: EmotionState) {
  const key = `emotion_${userId}`
  const history = Taro.getStorageSync(key) || []

  history.push({
    ...emotion,
    timestamp: Date.now()
  })

  // 只保留最近20条记录
  if (history.length > 20) {
    history.shift()
  }

  Taro.setStorageSync(key, history)
}

/**
 * 获取情绪历史
 */
export function getEmotionHistory(userId: string): Array<EmotionState & { timestamp: number }> {
  const key = `emotion_${userId}`
  return Taro.getStorageSync(key) || []
}

/**
 * 分析情绪趋势
 */
export function analyzeEmotionTrend(userId: string): {
  trend: 'improving' | 'stable' | 'declining'
  avgScore: number
} {
  const history = getEmotionHistory(userId)

  if (history.length < 3) {
    return { trend: 'stable', avgScore: 50 }
  }

  // 计算平均分
  const avgScore = history.reduce((sum, item) => sum + item.score, 0) / history.length

  // 比较最近3条和之前的记录
  const recent = history.slice(-3)
  const previous = history.slice(-6, -3)

  if (previous.length === 0) {
    return { trend: 'stable', avgScore }
  }

  const recentAvg = recent.reduce((sum, item) => sum + item.score, 0) / recent.length
  const previousAvg = previous.reduce((sum, item) => sum + item.score, 0) / previous.length

  const diff = recentAvg - previousAvg

  if (diff > 10) {
    return { trend: 'improving', avgScore }
  } else if (diff < -10) {
    return { trend: 'declining', avgScore }
  } else {
    return { trend: 'stable', avgScore }
  }
}
