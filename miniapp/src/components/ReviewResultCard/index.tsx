import { View, Text } from '@tarojs/components'
import './index.scss'

interface ReviewResult {
  passed: boolean
  score: number
  dimensions: {
    requirement: number
    quality: number
    completeness: number
  }
  suggestions: string[]
  feedback: string
}

interface ReviewResultCardProps {
  result: ReviewResult
}

export default function ReviewResultCard({ result }: ReviewResultCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981'
    if (score >= 60) return '#F59E0B'
    return '#EF4444'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return '优秀'
    if (score >= 80) return '良好'
    if (score >= 70) return '中等'
    if (score >= 60) return '及格'
    return '需改进'
  }

  return (
    <View className="review-result-card">
      {/* 总体结果 */}
      <View className={`result-header ${result.passed ? 'passed' : 'failed'}`}>
        <View className="result-icon">
          <Text className="icon-text">{result.passed ? '✓' : '✗'}</Text>
        </View>
        <View className="result-info">
          <Text className="result-status">
            {result.passed ? '审核通过' : '需要改进'}
          </Text>
          <Text className="result-hint">
            {result.passed ? '恭喜！任务质量达标' : '请根据建议进行优化'}
          </Text>
        </View>
      </View>

      {/* 总分 */}
      <View className="score-section">
        <View className="score-circle" style={{ borderColor: getScoreColor(result.score) }}>
          <Text className="score-value" style={{ color: getScoreColor(result.score) }}>
            {result.score}
          </Text>
          <Text className="score-label">分</Text>
        </View>
        <Text className="score-grade" style={{ color: getScoreColor(result.score) }}>
          {getScoreLabel(result.score)}
        </Text>
      </View>

      {/* 维度评分 */}
      <View className="dimensions-section">
        <Text className="section-title">评分详情</Text>

        <View className="dimension-item">
          <View className="dimension-header">
            <Text className="dimension-label">需求理解</Text>
            <Text className="dimension-score">{result.dimensions.requirement}分</Text>
          </View>
          <View className="dimension-bar">
            <View
              className="dimension-fill"
              style={{
                width: `${result.dimensions.requirement}%`,
                backgroundColor: getScoreColor(result.dimensions.requirement)
              }}
            />
          </View>
        </View>

        <View className="dimension-item">
          <View className="dimension-header">
            <Text className="dimension-label">完成质量</Text>
            <Text className="dimension-score">{result.dimensions.quality}分</Text>
          </View>
          <View className="dimension-bar">
            <View
              className="dimension-fill"
              style={{
                width: `${result.dimensions.quality}%`,
                backgroundColor: getScoreColor(result.dimensions.quality)
              }}
            />
          </View>
        </View>

        <View className="dimension-item">
          <View className="dimension-header">
            <Text className="dimension-label">完整性</Text>
            <Text className="dimension-score">{result.dimensions.completeness}分</Text>
          </View>
          <View className="dimension-bar">
            <View
              className="dimension-fill"
              style={{
                width: `${result.dimensions.completeness}%`,
                backgroundColor: getScoreColor(result.dimensions.completeness)
              }}
            />
          </View>
        </View>
      </View>

      {/* 改进建议 */}
      {result.suggestions && result.suggestions.length > 0 && (
        <View className="suggestions-section">
          <Text className="section-title">改进建议</Text>
          {result.suggestions.map((suggestion, index) => (
            <View key={index} className="suggestion-item">
              <Text className="suggestion-bullet">•</Text>
              <Text className="suggestion-text">{suggestion}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 详细反馈 */}
      {result.feedback && (
        <View className="feedback-section">
          <Text className="section-title">详细反馈</Text>
          <Text className="feedback-text">{result.feedback}</Text>
        </View>
      )}
    </View>
  )
}
