import { View, Text, ScrollView } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import { mentorStageAPI } from '../../services/api'
import './index.scss'

interface DeepPattern {
  id: string
  studentId: string
  patternType: 'perfectionism' | 'fear_of_failure' | 'external_validation' | 'fixed_mindset' |
                'avoidance' | 'comparison' | 'rushing' | 'surface_learning'
  severity: 'low' | 'medium' | 'high'
  evidence: string[]
  impact: string
  suggestedApproach: string
  detectedAt: string
  lastSeenAt: string
}

interface PatternTypeInfo {
  name: string
  icon: string
  description: string
  color: string
}

const PATTERN_TYPES: Record<string, PatternTypeInfo> = {
  perfectionism: {
    name: '完美主义',
    icon: '🎯',
    description: '过度追求完美，害怕犯错',
    color: '#EF4444'
  },
  fear_of_failure: {
    name: '害怕失败',
    icon: '😰',
    description: '因害怕失败而不敢尝试',
    color: '#F59E0B'
  },
  external_validation: {
    name: '外部认可',
    icon: '👥',
    description: '过度依赖他人的认可和评价',
    color: '#3B82F6'
  },
  fixed_mindset: {
    name: '固定思维',
    icon: '🔒',
    description: '认为能力是固定的，无法改变',
    color: '#6B7280'
  },
  avoidance: {
    name: '逃避行为',
    icon: '🏃',
    description: '遇到困难就逃避或拖延',
    color: '#8B5CF6'
  },
  comparison: {
    name: '过度比较',
    icon: '⚖️',
    description: '总是和他人比较，忽视自己的进步',
    color: '#EC4899'
  },
  rushing: {
    name: '急于求成',
    icon: '⚡',
    description: '想要快速看到结果，缺乏耐心',
    color: '#F97316'
  },
  surface_learning: {
    name: '浅层学习',
    icon: '📖',
    description: '只记忆表面知识，不深入理解',
    color: '#14B8A6'
  }
}

const SEVERITY_CONFIG = {
  low: { label: '轻微', color: '#10B981' },
  medium: { label: '中等', color: '#F59E0B' },
  high: { label: '严重', color: '#EF4444' }
}

export default function DeepPatterns() {
  const [patterns, setPatterns] = useState<DeepPattern[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPattern, setSelectedPattern] = useState<DeepPattern | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  useEffect(() => {
    loadPatterns()
  }, [])

  const loadPatterns = async () => {
    try {
      setLoading(true)
      const userInfo = Taro.getStorageSync('userInfo')
      if (!userInfo?.id) {
        Taro.showToast({ title: '请先登录', icon: 'none' })
        return
      }

      const response = await mentorStageAPI.getDeepPatterns(userInfo.id)
      if (response.success) {
        setPatterns(response.data || [])
      }
    } catch (error: any) {
      console.error('加载深度模式失败:', error)
      Taro.showToast({ title: error.message || '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handlePatternClick = (pattern: DeepPattern) => {
    setSelectedPattern(pattern)
    setShowDetail(true)
  }

  const handleCloseDetail = () => {
    setShowDetail(false)
    setSelectedPattern(null)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7) return `${days}天前`
    if (days < 30) return `${Math.floor(days / 7)}周前`
    return `${Math.floor(days / 30)}个月前`
  }

  const getPatternStats = () => {
    const total = patterns.length
    const highSeverity = patterns.filter(p => p.severity === 'high').length
    const mediumSeverity = patterns.filter(p => p.severity === 'medium').length
    const lowSeverity = patterns.filter(p => p.severity === 'low').length

    return { total, highSeverity, mediumSeverity, lowSeverity }
  }

  const stats = getPatternStats()

  if (loading) {
    return (
      <View className='deep-patterns-page'>
        <View className='loading'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='deep-patterns-page'>
      {/* 顶部统计 */}
      <View className='stats-header'>
        <View className='stat-item'>
          <Text className='stat-value'>{stats.total}</Text>
          <Text className='stat-label'>识别模式</Text>
        </View>
        <View className='stat-item'>
          <Text className='stat-value' style={{ color: '#EF4444' }}>{stats.highSeverity}</Text>
          <Text className='stat-label'>需要关注</Text>
        </View>
        <View className='stat-item'>
          <Text className='stat-value' style={{ color: '#F59E0B' }}>{stats.mediumSeverity}</Text>
          <Text className='stat-label'>中等影响</Text>
        </View>
        <View className='stat-item'>
          <Text className='stat-value' style={{ color: '#10B981' }}>{stats.lowSeverity}</Text>
          <Text className='stat-label'>轻微影响</Text>
        </View>
      </View>

      {/* 模式列表 */}
      <ScrollView className='patterns-scroll' scrollY>
        {patterns.length === 0 ? (
          <View className='empty-state'>
            <Text className='empty-icon'>🎉</Text>
            <Text className='empty-text'>暂未发现深层模式</Text>
            <Text className='empty-hint'>继续和导师对话，我会帮你识别学习中的深层模式</Text>
          </View>
        ) : (
          <View className='patterns-list'>
            {patterns.map(pattern => {
              const typeInfo = PATTERN_TYPES[pattern.patternType]
              const severityInfo = SEVERITY_CONFIG[pattern.severity]

              return (
                <View
                  key={pattern.id}
                  className='pattern-card'
                  onClick={() => handlePatternClick(pattern)}
                >
                  <View className='pattern-header'>
                    <View className='pattern-icon' style={{ backgroundColor: typeInfo.color + '20' }}>
                      <Text className='icon-text'>{typeInfo.icon}</Text>
                    </View>
                    <View className='pattern-info'>
                      <Text className='pattern-name'>{typeInfo.name}</Text>
                      <Text className='pattern-desc'>{typeInfo.description}</Text>
                    </View>
                    <View
                      className='severity-badge'
                      style={{ backgroundColor: severityInfo.color }}
                    >
                      <Text className='severity-text'>{severityInfo.label}</Text>
                    </View>
                  </View>

                  <View className='pattern-impact'>
                    <Text className='impact-label'>影响：</Text>
                    <Text className='impact-text'>{pattern.impact}</Text>
                  </View>

                  <View className='pattern-footer'>
                    <Text className='detected-time'>首次发现：{formatDate(pattern.detectedAt)}</Text>
                    <Text className='last-seen'>最近出现：{formatDate(pattern.lastSeenAt)}</Text>
                  </View>
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* 详情弹窗 */}
      {showDetail && selectedPattern && (
        <View className='detail-modal' onClick={handleCloseDetail}>
          <View className='detail-content' onClick={(e) => e.stopPropagation()}>
            <View className='detail-header'>
              <Text className='detail-icon'>
                {PATTERN_TYPES[selectedPattern.patternType].icon}
              </Text>
              <Text className='detail-title'>
                {PATTERN_TYPES[selectedPattern.patternType].name}
              </Text>
              <View
                className='detail-severity'
                style={{ backgroundColor: SEVERITY_CONFIG[selectedPattern.severity].color }}
              >
                <Text className='severity-text'>
                  {SEVERITY_CONFIG[selectedPattern.severity].label}
                </Text>
              </View>
            </View>

            <View className='detail-section'>
              <Text className='section-title'>📋 模式描述</Text>
              <Text className='section-text'>
                {PATTERN_TYPES[selectedPattern.patternType].description}
              </Text>
            </View>

            <View className='detail-section'>
              <Text className='section-title'>💡 影响分析</Text>
              <Text className='section-text'>{selectedPattern.impact}</Text>
            </View>

            <View className='detail-section'>
              <Text className='section-title'>🔍 观察到的证据</Text>
              {selectedPattern.evidence.map((item, index) => (
                <View key={index} className='evidence-item'>
                  <Text className='evidence-bullet'>•</Text>
                  <Text className='evidence-text'>{item}</Text>
                </View>
              ))}
            </View>

            <View className='detail-section'>
              <Text className='section-title'>🎯 建议方法</Text>
              <Text className='section-text'>{selectedPattern.suggestedApproach}</Text>
            </View>

            <View className='detail-footer'>
              <View
                className='close-button'
                onClick={handleCloseDetail}
              >
                <Text className='button-text'>知道了</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
