import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { opcStoryAPI } from '../../services/api'
import './story-list.scss'

interface StoryCard {
  id: string
  title: string
  excerpt: string
  author: {
    name: string
    avatar?: string
    type: string
    experience: string
  }
  type: 'job' | 'opc' | 'turn' | 'study'
  publishedAt: string
  viewCount: number
  likeCount: number
  isFeatured: boolean
}

interface StatsData {
  totalTests: number
  foundDirection: number
  becameOPC: number
}

export default function StoryList() {
  const [stories, setStories] = useState<StoryCard[]>([])
  const [stats, setStats] = useState<StatsData>({
    totalTests: 2847,
    foundDirection: 312,
    becameOPC: 89
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: '成长故事' })
    loadStories()
    loadStats()
  }, [])

  const loadStories = async () => {
    try {
      setLoading(true)
      const response = await opcStoryAPI.getPublicStories()
      if (response.success && response.data) {
        setStories(response.data)
      }
    } catch (error) {
      console.error('加载故事失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await opcStoryAPI.getStoryStats()
      if (response.success && response.data) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('加载统计失败:', error)
    }
  }

  const handleStoryClick = (storyId: string) => {
    Taro.navigateTo({
      url: `/pages/story-wall/story-detail?id=${storyId}`
    })
  }

  const getTypeLabel = (type: string): { text: string; color: string } => {
    const map = {
      job: { text: '找到工作', color: 'mist' },
      opc: { text: '成为OPC', color: 'golden' },
      turn: { text: '职业转型', color: 'rust' },
      study: { text: '重新学习', color: 'blue' }
    }
    return map[type] || { text: '成长', color: 'mist' }
  }

  const getAvatarBg = (index: number): string => {
    const colors = [
      'linear-gradient(135deg, #3A8A84, #5ABFB8)',
      'linear-gradient(135deg, #BC6446, #D88760)',
      'linear-gradient(135deg, #C88A20, #F2CD78)',
      'linear-gradient(135deg, #5B8FAB, #93AEC1)'
    ]
    return colors[index % colors.length]
  }

  const formatTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr)
    const now = new Date()
    const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (days === 0) return '今天'
    if (days === 1) return '1天前'
    if (days < 7) return `${days}天前`
    if (days < 30) return `${Math.floor(days / 7)}周前'`
    return `${Math.floor(days / 30)}个月前`
  }

  return (
    <View className="story-list-page">
      <ScrollView className="scroll-content" scrollY>
        {/* 顶部 Banner */}
        <View className="hero-banner">
          <View className="hero-decoration hero-decoration-1" />
          <View className="hero-decoration hero-decoration-2" />
          <View className="hero-badge">
            <Text className="badge-icon">★</Text>
            <Text className="badge-text">他们的故事</Text>
          </View>
          <View className="hero-title">真实的转变{'\n'}从这里开始</View>
          <View className="hero-subtitle">每一个故事，都是一次真实的能力发现之旅</View>
          <View className="hero-stats">
            <View className="stat-item">
              <Text className="stat-value" style={{ color: '#F2CD78' }}>{stats.totalTests}</Text>
              <Text className="stat-label">完成测评</Text>
            </View>
            <View className="stat-item">
              <Text className="stat-value" style={{ color: '#BED7D1' }}>{stats.foundDirection}</Text>
              <Text className="stat-label">找到方向</Text>
            </View>
            <View className="stat-item">
              <Text className="stat-value" style={{ color: '#D88760' }}>{stats.becameOPC}</Text>
              <Text className="stat-label">成为OPC</Text>
            </View>
          </View>
        </View>

        {/* 故事列表 */}
        <View className="stories-container">
          {/* 本周精选 - 大卡片 */}
          {stories.length > 0 && stories[0].isFeatured && (
            <View className="featured-section">
              <View className="section-header">
                <Text className="section-icon">★</Text>
                <Text className="section-title">本周精选</Text>
              </View>
              <View className="story-card featured" onClick={() => handleStoryClick(stories[0].id)}>
                <View className="story-cover">
                  <View className="cover-bg" />
                  <View className="cover-overlay" />
                  <View className={`type-badge ${getTypeLabel(stories[0].type).color}`}>
                    <Text className="badge-icon">✓</Text>
                    <Text className="badge-text">{getTypeLabel(stories[0].type).text}</Text>
                  </View>
                  <View className="cover-title">{stories[0].title}</View>
                </View>
                <View className="story-body">
                  <View className="story-meta">
                    <View className="author-avatar" style={{ background: getAvatarBg(0) }}>
                      <Text className="avatar-text">{stories[0].author.name.charAt(0)}</Text>
                    </View>
                    <View className="author-info">
                      <Text className="author-name">{stories[0].author.name}</Text>
                      <Text className="author-sub">{stories[0].author.type} · {stories[0].author.experience}</Text>
                    </View>
                    <Text className="story-time">{formatTimeAgo(stories[0].publishedAt)}</Text>
                  </View>
                  <Text className="story-excerpt">{stories[0].excerpt}</Text>
                  <View className="story-footer">
                    <View className={`story-tag tag-${getTypeLabel(stories[0].type).color}`}>
                      {getTypeLabel(stories[0].type).text}
                    </View>
                    <View className="story-stats">
                      <View className="stat">
                        <Text className="stat-icon">○</Text>
                        <Text className="stat-text">{stories[0].viewCount}</Text>
                      </View>
                      <View className="stat">
                        <Text className="stat-icon">♥</Text>
                        <Text className="stat-text">{stories[0].likeCount}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* 最新故事 */}
          <View className="regular-section">
            <View className="section-header">
              <Text className="section-icon">■</Text>
              <Text className="section-title">最新故事</Text>
            </View>
            {stories.slice(1).map((story, index) => {
              const typeInfo = getTypeLabel(story.type)
              return (
                <View key={story.id} className="story-card regular" onClick={() => handleStoryClick(story.id)}>
                  <View className={`card-accent accent-${typeInfo.color}`} />
                  <View className="card-content">
                    <View className="story-meta">
                      <View className="author-avatar" style={{ background: getAvatarBg(index + 1) }}>
                        <Text className="avatar-text">{story.author.name.charAt(0)}</Text>
                      </View>
                      <View className="author-info">
                        <Text className="author-name">{story.author.name}</Text>
                        <Text className="author-sub">{story.author.type} · {story.author.experience}</Text>
                      </View>
                      <Text className="story-time">{formatTimeAgo(story.publishedAt)}</Text>
                    </View>
                    <Text className="story-title">{story.title}</Text>
                    <Text className="story-excerpt">{story.excerpt}</Text>
                    <View className="story-footer">
                      <View className={`story-tag tag-${typeInfo.color}`}>{typeInfo.text}</View>
                      <View className="story-stats">
                        <View className="stat">
                          <Text className="stat-icon">○</Text>
                          <Text className="stat-text">{story.viewCount}</Text>
                        </View>
                        <View className="stat">
                          <Text className="stat-icon">♥</Text>
                          <Text className="stat-text">{story.likeCount}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              )
            })}
          </View>
        </View>

        <View className="bottom-space" />
      </ScrollView>
    </View>
  )
}
