import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { communityAPI } from '../../services/api'
import './index.scss'

interface Post {
  id: string
  type: 'recruit' | 'share' | 'help'
  title: string
  content: string
  author: {
    id: string
    name: string
    avatar: string
    level: number
    levelName: string
    tags: string[]
  }
  createdAt: string
  viewCount: number
  commentCount: number
  likeCount: number
  recruitInfo?: {
    mySkills: string[]
    neededSkills: Array<{ skill: string; required: boolean }>
    currentMembers: number
    totalMembers: number
    duration: string
    profitShare: string
    status: 'recruiting' | 'full'
  }
  shareInfo?: {
    track: string
    levelRange: string
    skillTags: string[]
  }
  helpInfo?: {
    track: string
    skillTags: string[]
  }
}

export default function Community() {
  const [activeTab, setActiveTab] = useState<'discover' | 'recruit' | 'share'>('discover')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [userLevel, setUserLevel] = useState(0)

  useEffect(() => {
    loadUserLevel()
    loadPosts()
  }, [activeTab])

  const loadUserLevel = async () => {
    try {
      const userInfo = Taro.getStorageSync('userInfo')
      if (userInfo?.level) {
        setUserLevel(userInfo.level)
      } else {
        setUserLevel(4) // 默认等级
      }
    } catch (error) {
      console.error('加载用户等级失败:', error)
      setUserLevel(4)
    }
  }

  const loadPosts = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (activeTab !== 'discover') {
        params.type = activeTab
      }

      const result = await communityAPI.getPosts(params)

      if (result.success && result.data) {
        setPosts(result.data)
      } else {
        throw new Error(result.error?.message || '加载失败')
      }
    } catch (error: any) {
      console.error('加载帖子失败:', error)

      // 使用模拟数据作为降级方案
      const mockPosts: Post[] = [
        {
          id: '1',
          type: 'recruit',
          title: '招募前端开发，一起做电商小程序',
          content: '我有一个电商小程序项目，需要一位前端开发伙伴...',
          author: {
            id: 'u1',
            name: '张小明',
            avatar: 'https://via.placeholder.com/100',
            level: 5,
            levelName: '河行者',
            tags: ['UI设计', '产品思维']
          },
          createdAt: '2026-05-27T10:30:00Z',
          viewCount: 128,
          commentCount: 15,
          likeCount: 23,
          recruitInfo: {
            mySkills: ['UI设计', '产品规划'],
            neededSkills: [
              { skill: 'React', required: true },
              { skill: 'Taro', required: true },
              { skill: 'TypeScript', required: false }
            ],
            currentMembers: 1,
            totalMembers: 2,
            duration: '2周',
            profitShare: '5:5分润',
            status: 'recruiting'
          }
        }
      ]

      setPosts(mockPosts)

      // 只在非网络错误时显示toast
      if (!error.message?.includes('网络')) {
        Taro.showToast({
          title: error.message || '加载失败',
          icon: 'none',
          duration: 2000
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePostClick = (postId: string) => {
    Taro.navigateTo({
      url: `/pages/community/post-detail?id=${postId}`
    })
  }

  const handleCreatePost = () => {
    if (userLevel < 2) {
      Taro.showToast({
        title: '达到Lv.2后解锁发帖',
        icon: 'none'
      })
      return
    }

    Taro.navigateTo({
      url: '/pages/community/create-post'
    })
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'recruit':
        return { text: '招募队友', icon: '👥', color: '#3B82F6' }
      case 'share':
        return { text: '技能分享', icon: '💡', color: '#10B981' }
      case 'help':
        return { text: '问题求助', icon: '❓', color: '#F59E0B' }
      default:
        return { text: '帖子', icon: '📝', color: '#6B7280' }
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString('zh-CN')
  }

  return (
    <View className="community-page">
      <View className="tab-bar">
        <View
          className={`tab-item ${activeTab === 'discover' ? 'active' : ''}`}
          onClick={() => setActiveTab('discover')}
        >
          <Text className="tab-text">发现</Text>
        </View>
        <View
          className={`tab-item ${activeTab === 'recruit' ? 'active' : ''}`}
          onClick={() => setActiveTab('recruit')}
        >
          <Text className="tab-text">招募</Text>
        </View>
        <View
          className={`tab-item ${activeTab === 'share' ? 'active' : ''}`}
          onClick={() => setActiveTab('share')}
        >
          <Text className="tab-text">分享</Text>
        </View>
      </View>

      <ScrollView className="posts-scroll" scrollY>
        {loading ? (
          <View className="loading-state">
            <Text className="loading-text">加载中...</Text>
          </View>
        ) : posts.length === 0 ? (
          <View className="empty-state">
            <Text className="empty-icon">📭</Text>
            <Text className="empty-text">暂无帖子</Text>
            <Text className="empty-hint">成为第一个发帖的人吧</Text>
          </View>
        ) : (
          <View className="posts-list">
            {posts.map(post => {
              const typeInfo = getTypeLabel(post.type)

              return (
                <View
                  key={post.id}
                  className={`post-card ${post.type}`}
                  onClick={() => handlePostClick(post.id)}
                >
                  <View className="post-header">
                    <Image className="author-avatar" src={post.author.avatar} />
                    <View className="author-info">
                      <View className="author-name-row">
                        <Text className="author-name">{post.author.name}</Text>
                        <Text className="author-level">Lv.{post.author.level}</Text>
                      </View>
                      <View className="author-tags">
                        {post.author.tags.map((tag, index) => (
                          <Text key={index} className="author-tag">{tag}</Text>
                        ))}
                      </View>
                    </View>
                    <View className="type-badge" style={{ background: typeInfo.color }}>
                      <Text className="type-icon">{typeInfo.icon}</Text>
                    </View>
                  </View>

                  <Text className="post-title">{post.title}</Text>

                  {post.recruitInfo && (
                    <View className="recruit-info">
                      <View className="recruit-meta">
                        <Text className="meta-item">
                          👥 {post.recruitInfo.currentMembers}/{post.recruitInfo.totalMembers}人
                        </Text>
                        <Text className="meta-item">⏱️ {post.recruitInfo.duration}</Text>
                        <Text className="meta-item">💰 {post.recruitInfo.profitShare}</Text>
                      </View>
                    </View>
                  )}

                  <View className="post-footer">
                    <Text className="footer-time">{formatTime(post.createdAt)}</Text>
                    <View className="footer-stats">
                      <Text className="stat-item">👁️ {post.viewCount}</Text>
                      <Text className="stat-item">💬 {post.commentCount}</Text>
                      <Text className="stat-item">👍 {post.likeCount}</Text>
                    </View>
                  </View>
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>

      {userLevel >= 2 && (
        <View className="create-button" onClick={handleCreatePost}>
          <Text className="create-icon">+</Text>
        </View>
      )}
    </View>
  )
}
