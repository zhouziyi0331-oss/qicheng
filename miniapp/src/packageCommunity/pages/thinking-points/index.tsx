import { View, Text, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { analyticsAPI } from '../../../services/api'
import './index.scss'

interface Activity {
  id: string
  type: string
  description: string
  createdAt: string
  metadata?: {
    points?: number
  }
}

interface HistoryItem extends Activity {
  time: string
  icon: string
  isEarned: boolean
}

export default function ThinkingPoints() {
  const [currentPoints, setCurrentPoints] = useState(0)
  const [totalEarned, setTotalEarned] = useState(0)
  const [totalSpent, setTotalSpent] = useState(0)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadThinkingPoints()
  }, [])

  const loadThinkingPoints = async () => {
    setLoading(true)
    Taro.showLoading({ title: '加载中...' })

    try {
      const [stats, activities] = await Promise.all([
        analyticsAPI.getStats(),
        analyticsAPI.getActivityLog(50)
      ])

      const pointActivities = activities.filter((a: Activity) =>
        a.type === 'thinking_points_earned' || a.type === 'thinking_points_spent'
      )

      const historyData = pointActivities.map((activity: Activity) => ({
        ...activity,
        time: formatTime(activity.createdAt),
        icon: activity.type === 'thinking_points_earned' ? '◇' : '●',
        isEarned: activity.type === 'thinking_points_earned'
      }))

      const earned = pointActivities
        .filter((a: Activity) => a.type === 'thinking_points_earned')
        .reduce((sum: number, a: Activity) => sum + (a.metadata?.points || 0), 0)

      const spent = pointActivities
        .filter((a: Activity) => a.type === 'thinking_points_spent')
        .reduce((sum: number, a: Activity) => sum + (a.metadata?.points || 0), 0)

      setCurrentPoints(stats.thinkingPoints || 0)
      setTotalEarned(earned)
      setTotalSpent(spent)
      setHistory(historyData)
    } catch (err) {
      console.error('加载思考值失败:', err)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
      Taro.hideLoading()
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) {
      return `${minutes}分钟前`
    } else if (hours < 24) {
      return `${hours}小时前`
    } else if (days < 7) {
      return `${days}天前`
    } else {
      return date.toLocaleDateString('zh-CN')
    }
  }

  const goToShop = () => {
    Taro.navigateTo({
      url: '/pages/gamification-shop/index'
    })
  }

  const showEarnRules = () => {
    Taro.showModal({
      title: '如何获得思考值？',
      content: '• 完成情境引入：+10\n• 完成问题拆解：+20\n• 完成知识学习：+15\n• 完成迭代优化：+25\n• 完成反思总结：+30\n• 连续学习奖励：+5/天',
      showCancel: false
    })
  }

  return (
    <View className="thinking-points-page">
      {/* 头部 */}
      <View className="points-header">
        <Text className="points-icon">◇</Text>
        <Text className="points-current">{currentPoints}</Text>
        <Text className="points-label">当前思考值</Text>

        <View className="points-stats">
          <View className="stat-box">
            <Text className="stat-value">{totalEarned}</Text>
            <Text className="stat-label">累计获得</Text>
          </View>
          <View className="stat-box">
            <Text className="stat-value">{totalSpent}</Text>
            <Text className="stat-label">累计消费</Text>
          </View>
        </View>
      </View>

      {/* 操作栏 */}
      <View className="actions-bar">
        <Button className="action-button primary" onClick={goToShop}>
          前往商店
        </Button>
        <Button className="action-button secondary" onClick={showEarnRules}>
          获取规则
        </Button>
      </View>

      {/* 历史记录 */}
      <View className="history-section">
        <Text className="section-title">获取记录</Text>
        {history.length > 0 ? (
          <View className="history-list">
            {history.map(item => (
              <View key={item.id} className="history-item">
                <View className="history-icon">
                  <Text>{item.icon}</Text>
                </View>
                <View className="history-content">
                  <Text className="history-desc">{item.description}</Text>
                  <Text className="history-time">{item.time}</Text>
                </View>
                <Text className={`history-points ${item.isEarned ? 'earned' : 'spent'}`}>
                  {item.isEarned ? '+' : '-'}{item.metadata?.points || 0}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View className="empty">
            <Text className="empty-icon">●</Text>
            <Text className="empty-text">还没有思考值记录</Text>
          </View>
        )}
      </View>
    </View>
  )
}
