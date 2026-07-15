import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { abilityAPI } from '../../../services/api'
import './index.scss'

export default function GrowthDashboard() {
  const [loading, setLoading] = useState(true)

  const [checkInDays, setCheckInDays] = useState(0)
  const [achievements, setAchievements] = useState(0)
  const [growthTrend, setGrowthTrend] = useState(0)

  const [recentActivities, setRecentActivities] = useState([])
  const [milestones, setMilestones] = useState([])

  useEffect(() => {
    loadGrowthDashboard()
  }, [])

  const loadGrowthDashboard = async () => {
    try {
      setLoading(true)
      const res = await abilityAPI.getGrowthDashboard()
      if (res && res.success && res.data) {
        const { checkInDays, achievements, growthTrend, recentActivities, milestones } = res.data

        setCheckInDays(checkInDays || 0)
        setAchievements(achievements || 0)
        setGrowthTrend(growthTrend || 0)

        if (recentActivities && recentActivities.length > 0) {
          setRecentActivities(recentActivities.slice(0, 3))
        }

        if (milestones && milestones.length > 0) {
          setMilestones(milestones.slice(0, 3))
        }
      }
    } catch (error) {
      console.error('加载成长仪表盘数据失败:', error)
      Taro.showToast({
        title: '加载数据失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    Taro.navigateBack()
  }

  // 格式化日期显示
  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return '今天'
    if (diffDays === 1) return '昨天'
    if (diffDays < 7) return `${diffDays}天前`
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  return (
    <View className="growth-dashboard">
      {/* 顶部栏 */}
      <View className="dashboard-header">
        <View className="back-btn" onClick={handleBack}>
          <Text className="back-icon">‹</Text>
        </View>
        <Text className="header-title">成长仪表盘</Text>
        <View style={{ width: '68rpx' }} />
      </View>

      {loading ? (
        <View style={{ padding: '100rpx', textAlign: 'center' }}>
          <Text>加载中...</Text>
        </View>
      ) : (
        <>
          {/* Hero区 - 打卡天数 */}
          <View className="hero-stats">
            <View className="hero-main">
              <Text className="hero-number">{checkInDays}</Text>
              <Text className="hero-label">加入天数</Text>
            </View>
          </View>

          {/* 统计卡片 */}
          <View className="stats-grid">
            <View className="stat-card">
              <Text className="stat-value">{achievements}</Text>
              <Text className="stat-label">成就数量</Text>
            </View>
            <View className="stat-card">
              <Text className="stat-value">{growthTrend.toFixed(1)}</Text>
              <Text className="stat-label">成长趋势</Text>
            </View>
          </View>

          {/* 最近活动 */}
          {recentActivities.length > 0 && (
            <View className="achievements-section">
              <View className="section-header">
                <Text className="section-title">最近活动</Text>
              </View>
              <View className="achievements-list">
                {recentActivities.map((activity, index) => (
                  <View key={index} className="achievement-item">
                    <View className="achievement-icon">
                      <Text className="icon">◆</Text>
                    </View>
                    <View className="achievement-content">
                      <Text className="achievement-name">{activity.activity}</Text>
                      <Text className="achievement-desc">{activity.description}</Text>
                    </View>
                    <Text className="achievement-time">{formatTime(activity.date)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 成长里程碑 */}
          {milestones.length > 0 && (
            <View className="achievements-section">
              <View className="section-header">
                <Text className="section-title">成长里程碑</Text>
              </View>
              <View className="achievements-list">
                {milestones.map((milestone, index) => (
                  <View key={index} className="achievement-item">
                    <View className="achievement-icon">
                      <Text className="icon">{milestone.icon || '★'}</Text>
                    </View>
                    <View className="achievement-content">
                      <Text className="achievement-name">{milestone.name}</Text>
                      <Text className="achievement-desc">{formatTime(milestone.date)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 底部间距 */}
          <View className="bottom-space" />
        </>
      )}
    </View>
  )
}
