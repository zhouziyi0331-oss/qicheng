import { View, Text, ScrollView, Input } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { opcStoryAPI } from '../../services/api'
import Typewriter from '../../components/Typewriter'
import './index.scss'
import '../../styles/morandi-colors.scss'

interface Story {
  id: string
  studentName?: string
  personalityType: string
  title: string
  storyContent: string
  storyType: 'discovery' | 'breakthrough' | 'acceptance' | 'growth'
  emotionTags: string[]
  viewCount: number
  likeCount: number
  commentCount: number
  isFeatured: boolean
  publishedAt: string
}

export default function StoryWall() {
  const [activeTab, setActiveTab] = useState<'all' | 'discovery' | 'breakthrough' | 'acceptance' | 'growth'>('all')
  const [stories, setStories] = useState<Story[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  useLoad(() => {
    loadStories()
  })

  const loadStories = async (type?: string, search?: string) => {
    try {
      setLoading(true)
      const response = await opcStoryAPI.searchStories({
        storyType: type === 'all' ? undefined : type as any,
        search: search || undefined,
        limit: 20,
        offset: 0
      })

      if (response.success && response.data) {
        setStories(response.data.stories)
        setTotal(response.data.total)
      }
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '加载失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tab: 'all' | 'discovery' | 'breakthrough' | 'acceptance' | 'growth') => {
    setActiveTab(tab)
    loadStories(tab, searchQuery)
  }

  const handleSearch = () => {
    loadStories(activeTab, searchQuery)
  }

  const handleStoryClick = (storyId: string) => {
    Taro.navigateTo({
      url: `/pages/story-detail/index?storyId=${storyId}`
    })
  }

  const getStoryTypeLabel = (type: string): string => {
    const labels = {
      discovery: '发现自己',
      breakthrough: '突破',
      acceptance: '接纳',
      growth: '成长'
    }
    return labels[type] || type
  }

  const getDotColor = (index: number): string => {
    const colors = ['coral', 'teal', 'amber', 'blue']
    return colors[index % colors.length]
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${year}年${month}月${day}日`
  }

  if (loading && stories.length === 0) {
    return (
      <View className="story-wall">
        <View className="loading-container">
          <Typewriter text="加载中..." speed={100} />
        </View>
      </View>
    )
  }

  return (
    <ScrollView className="story-wall" scrollY>
      {/* 头部统计区 */}
      <View className="header-section">
        <Text className="header-title">OPC 故事墙</Text>
        <Text className="header-subtitle">{total}个真实故事，看到"原来还可以这样"</Text>

        <View className="timeline-stats">
          <View className="tl-stat">
            <Text className="num coral">{total}</Text>
            <Text className="lbl">总故事</Text>
          </View>
          <View className="tl-stat">
            <Text className="num teal">{stories.filter(s => s.isFeatured).length}</Text>
            <Text className="lbl">精选</Text>
          </View>
          <View className="tl-stat">
            <Text className="num amber">{stories.reduce((sum, s) => sum + s.likeCount, 0)}</Text>
            <Text className="lbl">总点赞</Text>
          </View>
        </View>
      </View>

      {/* 搜索框 */}
      <View className="search-section">
        <Input
          className="search-input"
          placeholder="搜索故事..."
          value={searchQuery}
          onInput={(e) => setSearchQuery(e.detail.value)}
          onConfirm={handleSearch}
        />
      </View>

      {/* 分类标签 */}
      <View className="tabs-section">
        <View className="tabs">
          <View
            className={`tab-item ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => handleTabChange('all')}
          >
            全部
          </View>
          <View
            className={`tab-item ${activeTab === 'discovery' ? 'active' : ''}`}
            onClick={() => handleTabChange('discovery')}
          >
            发现
          </View>
          <View
            className={`tab-item ${activeTab === 'breakthrough' ? 'active' : ''}`}
            onClick={() => handleTabChange('breakthrough')}
          >
            突破
          </View>
          <View
            className={`tab-item ${activeTab === 'acceptance' ? 'active' : ''}`}
            onClick={() => handleTabChange('acceptance')}
          >
            接纳
          </View>
          <View
            className={`tab-item ${activeTab === 'growth' ? 'active' : ''}`}
            onClick={() => handleTabChange('growth')}
          >
            成长
          </View>
        </View>
      </View>

      {/* 时间线列表 */}
      <View className="stories-list">
        {stories.length === 0 ? (
          <View className="morandi-empty">
            <View className="empty-icon-wrapper">
              <Text className="empty-icon-text">故事</Text>
            </View>
            <Text className="empty-title">暂无故事</Text>
            <Text className="empty-hint">分享你的成长故事，让更多人看到可能性</Text>
          </View>
        ) : (
          stories.map((story, index) => (
            <View
              key={story.id}
              className="timeline-entry"
              onClick={() => handleStoryClick(story.id)}
            >
              {/* 时间点圆圈 */}
              <View className={`tl-dot ${getDotColor(index)}`}>
                <svg viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </View>

              {/* 内容卡片 */}
              <View className="tl-content">
                <Text className="tl-date">{formatDate(story.publishedAt)}</Text>
                <Text style={{ display: 'block', fontSize: '28rpx', fontWeight: 700, color: '#2C2420', marginBottom: '8rpx' }}>
                  {story.title}
                </Text>
                <Text style={{ display: 'block', fontSize: '24rpx', color: '#6B5E57', lineHeight: 1.6 }}>
                  {story.storyContent.slice(0, 100)}
                  {story.storyContent.length > 100 ? '...' : ''}
                </Text>

                {story.emotionTags.length > 0 && (
                  <View className="emotion-tags">
                    {story.emotionTags.slice(0, 3).map((tag, tagIndex) => (
                      <View key={tagIndex} className="emotion-tag">
                        <Text className="emotion-text">{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {story.isFeatured && (
                  <View className="tl-reward">
                    <svg viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    精选故事
                  </View>
                )}

                <View className="story-footer">
                  <View className="stat-item">
                    <Text className="stat-icon">◯</Text>
                    <Text className="stat-text">{story.viewCount}</Text>
                  </View>
                  <View className="stat-item">
                    <Text className="stat-icon">♡</Text>
                    <Text className="stat-text">{story.likeCount}</Text>
                  </View>
                  <View className="stat-item">
                    <Text className="stat-icon">◇</Text>
                    <Text className="stat-text">{story.commentCount}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      <View className="bottom-spacing" />
    </ScrollView>
  )
}
