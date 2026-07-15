import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import './index.scss'

interface Achievement {
  id: string
  name: string
  unlocked: boolean
  progress?: string
  badge: 'done' | 'ing' | 'lock'
}

export default function CatAchievements() {
  const [stats] = useState({
    unlocked: 3,
    total: 12,
    percentage: 25
  })

  const [unlockedList] = useState<Achievement[]>([
    { id: '1', name: '初次相遇', unlocked: true, badge: 'done' },
    { id: '2', name: '连续登录7天', unlocked: true, badge: 'done' },
    { id: '3', name: '对话达人', unlocked: true, badge: 'done' }
  ])

  const [inProgressList] = useState<Achievement[]>([
    { id: '4', name: '任务新手', unlocked: false, progress: '6 / 10', badge: 'ing' },
    { id: '5', name: '深度思考者', unlocked: false, progress: '18 / 30', badge: 'ing' },
    { id: '6', name: '连续登录30天', unlocked: false, progress: '14 / 30', badge: 'ing' },
    { id: '7', name: '首次收入', unlocked: false, progress: '¥0 / ¥100', badge: 'ing' }
  ])

  const [lockedList] = useState<Achievement[]>([
    { id: '8', name: '收入大师', unlocked: false, badge: 'lock' },
    { id: '9', name: 'OPC毕业生', unlocked: false, badge: 'lock' },
    { id: '10', name: '引路人', unlocked: false, badge: 'lock' },
    { id: '11', name: '故事达人', unlocked: false, badge: 'lock' },
    { id: '12', name: '全能OPC', unlocked: false, badge: 'lock' }
  ])

  const handleBack = () => {
    Taro.navigateBack()
  }

  return (
    <View className="cat-achievements-page">
      {/* Hero */}
      <View className="ach-hero">
        <View className="top-bar">
          <View className="back-btn" onClick={handleBack}>
            <Text className="back-icon">‹</Text>
          </View>
          <Text className="top-title">全部成就</Text>
          <View style={{ width: '68rpx' }} />
        </View>
        <View className="ach-stats">
          <View className="as-item">
            <Text className="as-val">{stats.unlocked}</Text>
            <Text className="as-label">已解锁</Text>
          </View>
          <View className="as-item">
            <Text className="as-val">{stats.total}</Text>
            <Text className="as-label">全部成就</Text>
          </View>
          <View className="as-item">
            <Text className="as-val">{stats.percentage}%</Text>
            <Text className="as-label">完成度</Text>
          </View>
        </View>
      </View>

      <ScrollView className="scroll-area" scrollY>
        <View className="ach-body">
          {/* 已解锁 */}
          <View className="ach-group-title">
            <Text className="title-icon">✓</Text>
            <Text>已解锁 ({unlockedList.length})</Text>
          </View>
          <View className="ach-grid">
            {unlockedList.map((ach) => (
              <View key={ach.id} className="ach-cell unlocked">
                <View className="ach-cell-icon">
                  <Text className="icon">◆</Text>
                </View>
                <Text className="ach-cell-name">{ach.name}</Text>
                <View className="ach-cell-badge done">已获得</View>
              </View>
            ))}
          </View>

          {/* 进行中 */}
          <View className="ach-group-title">
            <Text className="title-icon">●</Text>
            <Text>进行中 ({inProgressList.length})</Text>
          </View>
          <View className="ach-grid">
            {inProgressList.map((ach) => (
              <View key={ach.id} className="ach-cell">
                <View className="ach-cell-icon">
                  <Text className="icon">◇</Text>
                </View>
                <Text className="ach-cell-name">{ach.name}</Text>
                {ach.progress && (
                  <Text className="ach-cell-prog">{ach.progress}</Text>
                )}
                <View className="ach-cell-badge ing">进行中</View>
              </View>
            ))}
          </View>

          {/* 未解锁 */}
          <View className="ach-group-title">
            <Text className="title-icon">○</Text>
            <Text>未解锁 ({lockedList.length})</Text>
          </View>
          <View className="ach-grid">
            {lockedList.map((ach) => (
              <View key={ach.id} className="ach-cell locked">
                <View className="ach-cell-icon">
                  <Text className="icon">○</Text>
                </View>
                <Text className="ach-cell-name">{ach.name}</Text>
                <View className="ach-cell-badge lock">未解锁</View>
              </View>
            ))}
          </View>

          {/* 进度总览 */}
          <View className="progress-card">
            <View className="pc-header">
              <Text className="pc-icon">●</Text>
              <Text className="pc-title">成就进度</Text>
            </View>
            <View className="pc-progress">
              <View className="pc-progress-label">
                <Text>总体完成度</Text>
                <Text className="pc-val">{stats.percentage}%</Text>
              </View>
              <View className="prog-bar">
                <View className="prog-fill" style={{ width: `${stats.percentage}%` }} />
              </View>
            </View>
            <Text className="pc-desc">
              继续完成任务、与 AI 导师对话、保持每日登录，解锁更多成就
            </Text>
          </View>

          <View className="bottom-space" />
        </View>
      </ScrollView>
    </View>
  )
}
