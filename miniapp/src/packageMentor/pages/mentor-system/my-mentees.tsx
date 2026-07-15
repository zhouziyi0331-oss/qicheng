import { View, Text } from '@tarojs/components'
import { tokenManager } from '../../../utils/token'
import { getApiUrl } from '../../../config'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import Loading from '../../../components/Loading'
import './my-mentees.scss'

interface Mentee {
  id: string
  name: string
  level: number
  ordersCompleted: number
  firstOrderCompleted: boolean
  rewardReceived: boolean
  rewardAmount: number
  joinedAt: string
}

interface MenteesData {
  mentees: Mentee[]
  totalMentees: number
  totalRewards: number
}

export default function MyMentees() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<MenteesData | null>(null)

  useEffect(() => {
    loadMentees()
  }, [])

  const loadMentees = async () => {
    try {
      setLoading(true)
      const token = tokenManager.getAccessToken()
      const res = await Taro.request({
        url: getApiUrl('/api/v1/student/my-mentees'),
        method: 'GET',
        header: { 'Authorization': `Bearer ${token}` }
      })

      if (res.data.success) {
        setData(res.data.data)
      }
    } catch (err) {
      console.error('加载学员列表失败:', err)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  if (loading || !data) {
    return <Loading text="正在加载学员列表..." />
  }

  return (
    <View className="my-mentees-page">
      <View className="page-header">
        <Text className="page-title">我的学员</Text>
        <Text className="page-subtitle">{data.totalMentees}人</Text>
      </View>

      <View className="rewards-card">
        <View className="rewards-row">
          <View className="rewards-item">
            <Text className="rewards-label">累计奖励</Text>
            <Text className="rewards-value">¥{data.totalRewards}</Text>
          </View>
          <View className="rewards-item">
            <Text className="rewards-label">学员总数</Text>
            <Text className="rewards-value">{data.totalMentees}</Text>
          </View>
        </View>
      </View>

      <View className="mentees-list">
        {data.mentees.map((mentee) => (
          <View key={mentee.id} className="mentee-card">
            <View className="mentee-header">
              <Text className="mentee-name">{mentee.name}</Text>
              <Text className="mentee-level">Lv.{mentee.level}</Text>
            </View>

            <View className="mentee-stats">
              <Text className="stat-text">完成{mentee.ordersCompleted}单</Text>
              {mentee.firstOrderCompleted && (
                <Text className="stat-text">• 首单已完成</Text>
              )}
            </View>

            <View className="mentee-footer">
              <Text className="joined-text">加入于 {formatDate(mentee.joinedAt)}</Text>
              {mentee.rewardReceived ? (
                <View className="reward-badge received">
                  <Text className="reward-text">✓ 奖励已到账</Text>
                </View>
              ) : mentee.firstOrderCompleted ? (
                <View className="reward-badge pending">
                  <Text className="reward-text">⏳ 奖励待发放</Text>
                </View>
              ) : (
                <View className="reward-badge waiting">
                  <Text className="reward-text">⏳ 等待完成首单</Text>
                </View>
              )}
            </View>
          </View>
        ))}

        {data.mentees.length === 0 && (
          <View className="empty-state">
            <Text className="empty-icon">●</Text>
            <Text className="empty-text">还没有学员</Text>
            <Text className="empty-hint">分享你的邀请码，邀请朋友加入</Text>
          </View>
        )}
      </View>
    </View>
  )
}
