import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { opcStoryAPI } from '../../../services/api'
import './StoryList.scss'

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
    loadStories()
    loadStats()
  }, [])

  const loadStories = async () => {
    try {
      setLoading(true)

      // 暂时直接使用模拟数据，不请求 API
      // const response = await opcStoryAPI.getPublicStories({ limit: 20 })
      // if (response.success && response.data) {
      //   setStories(response.data)
      //   return
      // }

      // 使用文档中的真实案例数据
      setStories([
        {
          id: '1',
          title: '从迷茫的大三生到找到真正适合的方向',
          excerpt: '毕业前投了200多份简历，每次面试都不知道自己能做什么。直到完成OPC测评，我第一次看清自己的能力样貌……',
          author: {
            name: '顾晓晨',
            type: '探索整合者',
            experience: '毕业1年'
          },
          type: 'job',
          publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          viewCount: 2400,
          likeCount: 186,
          isFeatured: true
        },
        {
          id: '2',
          title: '从销售转向产品经理，OPC帮我看见了系统思维',
          excerpt: '做了5年销售，一直觉得自己只是在重复。测评结果让我意识到，我其实有很强的系统搭建能力……',
          author: {
            name: '林建国',
            type: '系统搭建者',
            experience: '工作5年'
          },
          type: 'turn',
          publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          viewCount: 1800,
          likeCount: 143,
          isFeatured: false
        },
        {
          id: '3',
          title: '我成为了一名OPC，帮助100+人发现自己的能力',
          excerpt: '我自己就是在迷茫中找到方向的人。现在我用同样的方式，帮助更多人看见自己……',
          author: {
            name: '白璟远',
            type: '创意执行者',
            experience: '自由职业'
          },
          type: 'opc',
          publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          viewCount: 3100,
          likeCount: 267,
          isFeatured: false
        },
        {
          id: '4',
          title: '大三迷茫期，OPC测评让我找到了研究方向',
          excerpt: '一直不知道读研还是工作，测评结果显示我的信息处理能力最强，这让我重新思考了自己的路……',
          author: {
            name: '张晨轩',
            type: '逻辑解析者',
            experience: '在校学生'
          },
          type: 'study',
          publishedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
          viewCount: 1200,
          likeCount: 98,
          isFeatured: false
        },
        {
          id: '5',
          title: '我以为自己没有优势，直到看见了那张雷达图',
          excerpt: '周围人都说我太普通，但测评结果告诉我，稳妥交付是一种真正稀缺的能力……',
          author: {
            name: '刘静婷',
            type: '稳妥交付者',
            experience: '工作3年'
          },
          type: 'job',
          publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          viewCount: 2000,
          likeCount: 154,
          isFeatured: false
        }
      ])
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
      url: `/pages/story-detail/index?id=${storyId}`
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
    if (days < 30) return `${Math.floor(days / 7)}周前`
    return `${Math.floor(days / 30)}个月前`
  }

  return (
    <ScrollView className="story-list-container" scrollY>
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
        {/* 本周精选 */}
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
                <View className={`type-badge badge-${getTypeLabel(stories[0].type).color}`}>
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
  )
}
