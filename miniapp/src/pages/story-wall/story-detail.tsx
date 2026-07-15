import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { opcStoryAPI } from '../../services/api'
import RadarChart from '../../components/RadarChart'
import './story-detail.scss'

interface StoryDetail {
  id: string
  title: string
  type: 'job' | 'opc' | 'turn' | 'study'
  author: {
    name: string
    avatar?: string
    type: string
    experience: string
  }
  publishedAt: string
  likeCount: number
  isLiked: boolean
  content: {
    intro: string
    radarData?: {
      scores: number[]
      typeName: string
      typeNameEn: string
      typeDesc: string
    }
    journey: string
    outcomes: string[]
    finalWords: string
  }
  relatedStories: Array<{
    id: string
    title: string
    author: string
    type: string
  }>
}

export default function StoryDetail() {
  const router = useRouter()
  const { id } = router.params
  const [story, setStory] = useState<StoryDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadStoryDetail(id)
    }
  }, [id])

  const loadStoryDetail = async (storyId: string) => {
    try {
      setLoading(true)
      const response = await opcStoryAPI.getStoryDetail(storyId)
      if (response.success && response.data) {
        setStory(response.data)
        Taro.setNavigationBarTitle({ title: '故事详情' })
      }
    } catch (error) {
      console.error('加载故事详情失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!story) return
    try {
      const response = await opcStoryAPI.toggleLike(story.id)
      if (response.success) {
        setStory({
          ...story,
          isLiked: !story.isLiked,
          likeCount: story.isLiked ? story.likeCount - 1 : story.likeCount + 1
        })
      }
    } catch (error) {
      console.error('点赞失败:', error)
    }
  }

  const handleRelatedClick = (storyId: string) => {
    Taro.redirectTo({
      url: `/pages/story-wall/story-detail?id=${storyId}`
    })
  }

  const handleBack = () => {
    Taro.navigateBack()
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

  const getAvatarBg = (type: string): string => {
    const map = {
      job: 'linear-gradient(135deg, #3A8A84, #5ABFB8)',
      opc: 'linear-gradient(135deg, #C88A20, #F2CD78)',
      turn: 'linear-gradient(135deg, #BC6446, #D88760)',
      study: 'linear-gradient(135deg, #5B8FAB, #93AEC1)'
    }
    return map[type] || map.job
  }

  const getCoverBg = (type: string): string => {
    const map = {
      job: 'linear-gradient(135deg, #1A3A2A 0%, #2A5A4A 40%, #3A8A7A 100%)',
      opc: 'linear-gradient(135deg, #2A3A1A 0%, #4A6A2A 50%, #6A9A3A 100%)',
      turn: 'linear-gradient(135deg, #3D1F10 0%, #6B3520 50%, #9B5030 100%)',
      study: 'linear-gradient(135deg, #1A2A3A 0%, #2A4A5A 40%, #3A7A8A 100%)'
    }
    return map[type] || map.job
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

  if (loading || !story) {
    return (
      <View className="story-detail-page loading">
        <Text>加载中...</Text>
      </View>
    )
  }

  const typeInfo = getTypeLabel(story.type)

  return (
    <View className="story-detail-page">
      {/* 顶部英雄区 */}
      <View className="detail-hero">
        <View className="hero-bg" style={{ background: getCoverBg(story.type) }} />
        <View className="hero-overlay" />

        {/* 返回按钮 */}
        <View className="back-btn" onClick={handleBack}>
          <Text className="back-icon">←</Text>
        </View>

        {/* 分享按钮 */}
        <View className="share-btn">
          <Button className="share-button" openType="share">
            <Text className="share-icon">⋯</Text>
          </Button>
        </View>

        <View className="hero-content">
          <View className={`type-badge badge-${typeInfo.color}`}>
            <Text className="badge-icon">✓</Text>
            <Text className="badge-text">{typeInfo.text}</Text>
          </View>
          <Text className="hero-title">{story.title}</Text>
          <View className="hero-meta">
            <View className="author-avatar" style={{ background: getAvatarBg(story.type) }}>
              <Text className="avatar-text">{story.author.name.charAt(0)}</Text>
            </View>
            <View className="author-info">
              <Text className="author-name">{story.author.name}</Text>
              <Text className="author-sub">{story.author.type} · {story.author.experience} · {formatTimeAgo(story.publishedAt)}</Text>
            </View>
            <View className="like-btn" onClick={handleLike}>
              <Text className="like-icon">{story.isLiked ? '♥' : '♡'}</Text>
              <Text className="like-count">{story.likeCount}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView className="detail-scroll" scrollY>
        <View className="detail-body">
          {/* 故事正文 */}
          <View className="detail-section">
            <View className="section-label">
              <Text className="label-bar" />
              <Text className="label-text">TA的故事</Text>
            </View>
            <Text className="detail-text">{story.content.intro}</Text>

            {story.content.intro.includes('「') && (
              <View className="highlight-box">
                <Text className="highlight-text">
                  {story.content.intro.match(/「(.+?)」/)?.[1] || ''}
                </Text>
              </View>
            )}
          </View>

          {/* 雷达图 */}
          {story.content.radarData && (
            <View className="radar-section">
              <View className="radar-header">
                <Text className="radar-icon">◆</Text>
                <Text className="radar-title">{story.author.name}的六维能力雷达</Text>
              </View>
              <View className="radar-chart">
                <RadarChart
                  scores={story.content.radarData.scores}
                  size={400}
                />
              </View>
              <View className="radar-legend">
                {['信息处理', '创作驱动', '工具学习', '任务执行', '协作倾向', '风险态度'].map((dim, i) => (
                  <View key={i} className="legend-item">
                    <View className="legend-dot" style={{ background: ['#BC6446', '#D88760', '#3A8A84', '#5B8FAB', '#BF9E71', '#93AEC1'][i] }} />
                    <Text className="legend-text">{dim} {story.content.radarData!.scores[i]}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 人格类型揭示 */}
          {story.content.radarData && (
            <View className={`type-reveal reveal-${typeInfo.color}`}>
              <View className="type-icon-wrap" style={{ background: getAvatarBg(story.type) }}>
                <Text className="type-icon">○</Text>
              </View>
              <View className="type-content">
                <Text className="type-name">{story.content.radarData.typeName}</Text>
                <Text className="type-name-en">{story.content.radarData.typeNameEn}</Text>
                <Text className="type-desc">{story.content.radarData.typeDesc}</Text>
              </View>
            </View>
          )}

          {/* 转变过程 */}
          <View className="detail-section">
            <View className="section-label">
              <Text className="label-bar" />
              <Text className="label-text">转变的过程</Text>
            </View>
            <Text className="detail-text">{story.content.journey}</Text>
          </View>

          {/* 结果卡片 */}
          {story.content.outcomes.length > 0 && (
            <View className="outcome-card">
              <View className="outcome-header">
                <Text className="outcome-icon">★</Text>
                <Text className="outcome-title">TA获得了什么</Text>
              </View>
              {story.content.outcomes.map((outcome, index) => (
                <View key={index} className="outcome-item">
                  <View className="outcome-dot" />
                  <Text className="outcome-text">{outcome}</Text>
                </View>
              ))}
            </View>
          )}

          {/* TA想说的话 */}
          <View className="detail-section">
            <View className="section-label">
              <Text className="label-bar" />
              <Text className="label-text">TA想说的话</Text>
            </View>
            <Text className="detail-text">{story.content.finalWords}</Text>
          </View>

          {/* 相关故事 */}
          {story.relatedStories.length > 0 && (
            <View className="related-section">
              <View className="section-header">
                <View className="section-label">
                  <Text className="label-bar" />
                  <Text className="label-text">相关故事</Text>
                </View>
                <Text className="more-link">更多 →</Text>
              </View>
              <ScrollView className="related-scroll" scrollX>
                {story.relatedStories.map((related) => (
                  <View
                    key={related.id}
                    className="related-card"
                    onClick={() => handleRelatedClick(related.id)}
                  >
                    <View className="related-cover" style={{ background: getCoverBg(related.type) }}>
                      <Text className="related-icon">○</Text>
                    </View>
                    <View className="related-body">
                      <Text className="related-title">{related.title}</Text>
                      <Text className="related-author">{related.author} · {getTypeLabel(related.type).text}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
        <View className="bottom-space" />
      </ScrollView>
    </View>
  )
}
