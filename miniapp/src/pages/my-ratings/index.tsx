import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { ratingAPI } from '../../services/api'
import './index.scss'

interface Rating {
  id: string
  task_id: string
  rater_id: string
  ratee_id: string
  rating: number
  comment?: string
  tags: string[]
  is_anonymous: boolean
  response?: string
  created_at: string
  rater_name?: string
  task_title?: string
}

interface RatingStats {
  average_rating: number
  total_ratings: number
  rating_distribution: Record<string, number>
}

export default function MyRatingsPage() {
  const [ratings, setRatings] = useState<Rating[]>([])
  const [stats, setStats] = useState<RatingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'received' | 'given'>('received')

  useEffect(() => {
    fetchRatings()
  }, [activeTab])

  const fetchRatings = async () => {
    setLoading(true)
    try {
      const [ratingsRes, statsRes] = await Promise.all([
        ratingAPI.getMyRatings(),
        ratingAPI.getMyStats()
      ])

      setRatings(ratingsRes.data || [])
      setStats(statsRes.data)
    } catch (err) {
      console.error('获取评价失败:', err)
      Taro.showToast({ title: '获取评价失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number) => {
    return (
      <View className='rating-stars'>
        {[1, 2, 3, 4, 5].map(star => (
          <Text key={star} className={`star ${star <= rating ? 'filled' : 'empty'}`}>
            ★
          </Text>
        ))}
      </View>
    )
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  return (
    <View className='my-ratings-page'>
      <Text className='page-title'>我的评价</Text>

      {/* 统计卡片 */}
      {stats && (
        <View className='stats-section'>
          <View className='stats-grid'>
            <View className='stat-item'>
              <Text className='stat-label'>平均评分</Text>
              <Text className='stat-value rating'>{stats.average_rating.toFixed(1)}</Text>
              <View className='stars'>
                {[1, 2, 3, 4, 5].map(star => (
                  <Text key={star} className='star' style={{ color: star <= Math.round(stats.average_rating) ? '#FFB74D' : '#95A5A6' }}>
                    ★
                  </Text>
                ))}
              </View>
            </View>

            <View className='stat-item'>
              <Text className='stat-label'>总评价数</Text>
              <Text className='stat-value'>{stats.total_ratings}</Text>
            </View>

            <View className='stat-item'>
              <Text className='stat-label'>5星评价</Text>
              <Text className='stat-value'>{stats.rating_distribution['5'] || 0}</Text>
            </View>
          </View>
        </View>
      )}

      {/* 标签页 */}
      <View className='tabs'>
        <View className={`tab-btn ${activeTab === 'received' ? 'active' : ''}`} onClick={() => setActiveTab('received')}>
          收到的评价
        </View>
        <View className={`tab-btn ${activeTab === 'given' ? 'active' : ''}`} onClick={() => setActiveTab('given')}>
          给出的评价
        </View>
      </View>

      {/* 评价列表 */}
      <ScrollView scrollY className='ratings-list' style={{ height: 'calc(100vh - 500rpx)' }}>
        {loading ? (
          <View className='loading'>加载中...</View>
        ) : ratings.length === 0 ? (
          <View className='empty'>
            <Text className='empty-icon'>⭐</Text>
            <Text className='empty-text'>暂无评价</Text>
          </View>
        ) : (
          ratings.map(rating => (
            <View key={rating.id} className='rating-card'>
              {/* 头部 */}
              <View className='card-header'>
                <View className='user-info'>
                  <Text className='user-name'>
                    {rating.is_anonymous ? '匿名用户' : rating.rater_name || '用户'}
                  </Text>
                  {rating.task_title && (
                    <Text className='task-title'>任务：{rating.task_title}</Text>
                  )}
                </View>
                <Text className='rating-time'>{formatDate(rating.created_at)}</Text>
              </View>

              {/* 星级 */}
              {renderStars(rating.rating)}

              {/* 评价内容 */}
              {rating.comment && (
                <Text className='rating-comment'>{rating.comment}</Text>
              )}

              {/* 标签 */}
              {rating.tags && rating.tags.length > 0 && (
                <View className='rating-tags'>
                  {rating.tags.map((tag, idx) => (
                    <View key={idx} className='tag'>{tag}</View>
                  ))}
                </View>
              )}

              {/* 回复 */}
              {rating.response && (
                <View className='rating-response'>
                  <Text className='response-label'>对方回复：</Text>
                  <Text className='response-text'>{rating.response}</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}
