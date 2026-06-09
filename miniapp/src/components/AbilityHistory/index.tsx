import { View, Text, ScrollView } from '@tarojs/components'
import { useState } from 'react'
import './index.scss'

interface AbilitySnapshot {
  id: string
  timestamp: string
  level: number
  totalScore: number
  dimensions: {
    d1: number // 学习力
    d2: number // 执行力
    d3: number // 沟通力
    d4: number // 创新力
    d5: number // 协作力
    d6: number // 抗压力
  }
  trigger: string // 触发原因：'task_completed', 'level_up', 'monthly_update'
  taskTitle?: string
}

interface AbilityHistoryProps {
  visible: boolean
  snapshots: AbilitySnapshot[]
  currentData: {
    d1: number
    d2: number
    d3: number
    d4: number
    d5: number
    d6: number
    level: number
    totalScore: number
  }
  onClose: () => void
}

export default function AbilityHistory({
  visible,
  snapshots,
  currentData,
  onClose
}: AbilityHistoryProps) {
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(null)

  if (!visible) return null

  const dimensionNames = {
    d1: '学习力',
    d2: '执行力',
    d3: '沟通力',
    d4: '创新力',
    d5: '协作力',
    d6: '抗压力'
  }

  const getTriggerText = (trigger: string, taskTitle?: string) => {
    switch (trigger) {
      case 'task_completed':
        return taskTitle ? `完成任务：${taskTitle}` : '完成任务'
      case 'level_up':
        return '等级提升'
      case 'monthly_update':
        return '月度更新'
      default:
        return '能力更新'
    }
  }

  const getTriggerIcon = (trigger: string) => {
    switch (trigger) {
      case 'task_completed':
        return '✅'
      case 'level_up':
        return '🎊'
      case 'monthly_update':
        return '📅'
      default:
        return '📊'
    }
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7) return `${days}天前`
    if (days < 30) return `${Math.floor(days / 7)}周前`
    if (days < 365) return `${Math.floor(days / 30)}个月前`
    return `${Math.floor(days / 365)}年前`
  }

  const calculateChange = (oldValue: number, newValue: number) => {
    const change = newValue - oldValue
    return {
      value: Math.abs(change),
      isPositive: change > 0,
      isNeutral: change === 0
    }
  }

  const getComparisonData = () => {
    if (!selectedSnapshot) return null
    const snapshot = snapshots.find(s => s.id === selectedSnapshot)
    if (!snapshot) return null

    return {
      snapshot,
      changes: {
        d1: calculateChange(snapshot.dimensions.d1, currentData.d1),
        d2: calculateChange(snapshot.dimensions.d2, currentData.d2),
        d3: calculateChange(snapshot.dimensions.d3, currentData.d3),
        d4: calculateChange(snapshot.dimensions.d4, currentData.d4),
        d5: calculateChange(snapshot.dimensions.d5, currentData.d5),
        d6: calculateChange(snapshot.dimensions.d6, currentData.d6)
      },
      totalChange: calculateChange(snapshot.totalScore, currentData.totalScore),
      levelChange: calculateChange(snapshot.level, currentData.level)
    }
  }

  const comparisonData = getComparisonData()

  return (
    <View className="ability-history-overlay" onClick={onClose}>
      <View className="ability-history-modal" onClick={(e) => e.stopPropagation()}>
        {/* 头部 */}
        <View className="history-header">
          <Text className="header-icon">📜</Text>
          <Text className="header-title">成长历程</Text>
          <Text className="header-subtitle">查看你的能力变化轨迹</Text>
        </View>

        {/* 时间线 */}
        <ScrollView className="timeline-scroll" scrollY>
          <View className="timeline">
            {/* 当前状态 */}
            <View className="timeline-item current">
              <View className="timeline-dot">
                <Text className="dot-icon">⭐</Text>
              </View>
              <View className="timeline-content">
                <View className="timeline-header">
                  <Text className="timeline-title">当前状态</Text>
                  <Text className="timeline-date">现在</Text>
                </View>
                <View className="timeline-stats">
                  <View className="stat-badge">
                    <Text className="stat-label">等级</Text>
                    <Text className="stat-value">Lv.{currentData.level}</Text>
                  </View>
                  <View className="stat-badge">
                    <Text className="stat-label">总分</Text>
                    <Text className="stat-value">{currentData.totalScore}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 历史快照 */}
            {snapshots.map((snapshot, index) => (
              <View
                key={snapshot.id}
                className={`timeline-item ${selectedSnapshot === snapshot.id ? 'selected' : ''}`}
                onClick={() => setSelectedSnapshot(
                  selectedSnapshot === snapshot.id ? null : snapshot.id
                )}
              >
                <View className="timeline-dot">
                  <Text className="dot-icon">{getTriggerIcon(snapshot.trigger)}</Text>
                </View>
                <View className="timeline-content">
                  <View className="timeline-header">
                    <Text className="timeline-title">
                      {getTriggerText(snapshot.trigger, snapshot.taskTitle)}
                    </Text>
                    <Text className="timeline-date">{formatDate(snapshot.timestamp)}</Text>
                  </View>
                  <View className="timeline-stats">
                    <View className="stat-badge">
                      <Text className="stat-label">等级</Text>
                      <Text className="stat-value">Lv.{snapshot.level}</Text>
                    </View>
                    <View className="stat-badge">
                      <Text className="stat-label">总分</Text>
                      <Text className="stat-value">{snapshot.totalScore}</Text>
                    </View>
                  </View>
                  {selectedSnapshot === snapshot.id && (
                    <View className="compare-hint">
                      <Text className="hint-text">👇 查看下方对比详情</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}

            {snapshots.length === 0 && (
              <View className="empty-timeline">
                <Text className="empty-icon">📊</Text>
                <Text className="empty-text">暂无历史记录</Text>
                <Text className="empty-hint">完成更多任务后会生成历史快照</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* 对比详情 */}
        {comparisonData && (
          <View className="comparison-section">
            <View className="comparison-header">
              <Text className="comparison-title">📊 能力对比</Text>
              <Text className="comparison-subtitle">
                {formatDate(comparisonData.snapshot.timestamp)} vs 现在
              </Text>
            </View>

            <View className="comparison-summary">
              <View className="summary-item">
                <Text className="summary-label">等级变化</Text>
                <View className="summary-value-row">
                  <Text className="summary-old">Lv.{comparisonData.snapshot.level}</Text>
                  <Text className="summary-arrow">→</Text>
                  <Text className="summary-new">Lv.{currentData.level}</Text>
                  {!comparisonData.levelChange.isNeutral && (
                    <Text className={`summary-change ${comparisonData.levelChange.isPositive ? 'positive' : 'negative'}`}>
                      {comparisonData.levelChange.isPositive ? '+' : '-'}{comparisonData.levelChange.value}
                    </Text>
                  )}
                </View>
              </View>

              <View className="summary-item">
                <Text className="summary-label">总分变化</Text>
                <View className="summary-value-row">
                  <Text className="summary-old">{comparisonData.snapshot.totalScore}</Text>
                  <Text className="summary-arrow">→</Text>
                  <Text className="summary-new">{currentData.totalScore}</Text>
                  {!comparisonData.totalChange.isNeutral && (
                    <Text className={`summary-change ${comparisonData.totalChange.isPositive ? 'positive' : 'negative'}`}>
                      {comparisonData.totalChange.isPositive ? '+' : '-'}{comparisonData.totalChange.value}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            <View className="dimension-comparison">
              {Object.entries(dimensionNames).map(([key, name]) => {
                const dimKey = key as keyof typeof comparisonData.changes
                const change = comparisonData.changes[dimKey]
                const oldValue = comparisonData.snapshot.dimensions[dimKey]
                const newValue = currentData[dimKey]

                return (
                  <View key={key} className="dimension-item">
                    <Text className="dimension-name">{name}</Text>
                    <View className="dimension-bars">
                      <View className="bar-container old">
                        <View className="bar-fill" style={{ width: `${oldValue}%` }} />
                        <Text className="bar-value">{oldValue}</Text>
                      </View>
                      <Text className="bar-arrow">→</Text>
                      <View className="bar-container new">
                        <View className="bar-fill" style={{ width: `${newValue}%` }} />
                        <Text className="bar-value">{newValue}</Text>
                      </View>
                    </View>
                    {!change.isNeutral && (
                      <Text className={`dimension-change ${change.isPositive ? 'positive' : 'negative'}`}>
                        {change.isPositive ? '+' : '-'}{change.value}
                      </Text>
                    )}
                  </View>
                )
              })}
            </View>
          </View>
        )}

        {/* 关闭按钮 */}
        <View className="close-btn" onClick={onClose}>
          <Text className="close-text">关闭</Text>
        </View>
      </View>
    </View>
  )
}
