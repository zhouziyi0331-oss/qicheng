import { View, Text, ScrollView, Image, Switch } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import pblAPI from '../../services/pbl'
import './index.scss'

interface ProjectShowcase {
  projectId: string
  title: string
  description: string
  domain?: string
  tags: string[]
  isPublic: boolean
  showcaseUrl?: string
  coverImage?: string
  stats: {
    viewCount: number
    likeCount: number
    commentCount: number
  }
  deliverables: Array<{
    id: string
    title: string
    description: string
    fileUrl?: string
    demoUrl?: string
    createdAt: string
  }>
  learningGoals: string[]
  reflectionSummary?: string
  createdAt: string
  completedAt?: string
}

export default function PBLProjectShowcase() {
  const [projectId, setProjectId] = useState('')
  const [showcase, setShowcase] = useState<ProjectShowcase | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPublic, setIsPublic] = useState(false)
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params
    if (params?.projectId) {
      setProjectId(params.projectId)
      loadShowcase(params.projectId)
    }
  }, [])

  // 加载展示数据
  const loadShowcase = async (projectId: string) => {
    try {
      setLoading(true)
      const res = await pblAPI.getProjectDetail(projectId)
      if (res.success && res.data) {
        setShowcase(res.data)
        setIsPublic(res.data.isPublic || false)
      }
    } catch (error) {
      console.error('加载失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  // 切换公开状态
  const handleTogglePublic = async (value: boolean) => {
    try {
      setPublishing(true)
      const res = await pblAPI.publishProject(projectId, {
        isPublic: value,
        showcaseUrl: showcase?.showcaseUrl
      })

      if (res.success) {
        setIsPublic(value)
        Taro.showToast({
          title: value ? '已公开' : '已设为私密',
          icon: 'success'
        })
        loadShowcase(projectId)
      }
    } catch (error) {
      console.error('操作失败:', error)
      Taro.showToast({
        title: '操作失败',
        icon: 'none'
      })
    } finally {
      setPublishing(false)
    }
  }

  // 分享项目
  const handleShare = () => {
    if (!isPublic) {
      Taro.showToast({
        title: '请先公开项目',
        icon: 'none'
      })
      return
    }

    Taro.showShareMenu({
      withShareTicket: true
    })
  }

  // 查看统计
  const handleViewStats = async () => {
    try {
      const res = await pblAPI.getProjectStats(projectId)
      if (res.success && res.data) {
        const stats = res.data
        Taro.showModal({
          title: '项目统计',
          content: `浏览量: ${stats.viewCount}\n点赞数: ${stats.likeCount}\n评论数: ${stats.commentCount}`,
          showCancel: false
        })
      }
    } catch (error) {
      console.error('获取统计失败:', error)
    }
  }

  // 预览成果
  const handlePreviewDeliverable = (deliverable: any) => {
    if (deliverable.demoUrl) {
      Taro.navigateTo({
        url: `/pages/webview/index?url=${encodeURIComponent(deliverable.demoUrl)}`
      })
    } else if (deliverable.fileUrl) {
      Taro.downloadFile({
        url: deliverable.fileUrl,
        success: (res) => {
          Taro.openDocument({
            filePath: res.tempFilePath
          })
        }
      })
    }
  }

  if (loading) {
    return (
      <View className='pbl-project-showcase-page'>
        <View className='loading-container'>
          <Text className='loading-text'>加载中...</Text>
        </View>
      </View>
    )
  }

  if (!showcase) {
    return (
      <View className='pbl-project-showcase-page'>
        <View className='error-container'>
          <Text className='error-icon'>😢</Text>
          <Text className='error-text'>项目不存在</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='pbl-project-showcase-page'>
      {/* 头部 */}
      <View className='showcase-header'>
        <View className='header-cover'>
          {showcase.coverImage ? (
            <Image className='cover-image' src={showcase.coverImage} mode='aspectFill' />
          ) : (
            <View className='cover-placeholder'>
              <Text className='placeholder-icon'>🎨</Text>
            </View>
          )}
        </View>
        <View className='header-info'>
          <Text className='project-title'>{showcase.title}</Text>
          {showcase.domain && (
            <View className='project-domain'>
              <Text>{showcase.domain}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView className='showcase-content' scrollY>
        {/* 公开设置 */}
        <View className='public-section'>
          <View className='section-header'>
            <View className='header-left'>
              <Text className='section-icon'>🌐</Text>
              <View className='header-text'>
                <Text className='section-title'>公开展示</Text>
                <Text className='section-hint'>
                  {isPublic ? '企业可以看到你的项目' : '仅自己可见'}
                </Text>
              </View>
            </View>
            <Switch
              checked={isPublic}
              onChange={(e) => handleTogglePublic(e.detail.value)}
              disabled={publishing}
              color='#8B5CF6'
            />
          </View>
        </View>

        {/* 统计数据 */}
        {isPublic && (
          <View className='stats-section'>
            <View className='stats-grid'>
              <View className='stat-item'>
                <Text className='stat-icon'>👀</Text>
                <Text className='stat-value'>{showcase.stats.viewCount}</Text>
                <Text className='stat-label'>浏览</Text>
              </View>
              <View className='stat-item'>
                <Text className='stat-icon'>❤️</Text>
                <Text className='stat-value'>{showcase.stats.likeCount}</Text>
                <Text className='stat-label'>点赞</Text>
              </View>
              <View className='stat-item'>
                <Text className='stat-icon'>💬</Text>
                <Text className='stat-value'>{showcase.stats.commentCount}</Text>
                <Text className='stat-label'>评论</Text>
              </View>
            </View>
          </View>
        )}

        {/* 项目描述 */}
        <View className='description-section'>
          <View className='section-header'>
            <Text className='section-icon'>📝</Text>
            <Text className='section-title'>项目介绍</Text>
          </View>
          <Text className='description-text'>{showcase.description}</Text>
        </View>

        {/* 学习目标 */}
        {showcase.learningGoals && showcase.learningGoals.length > 0 && (
          <View className='goals-section'>
            <View className='section-header'>
              <Text className='section-icon'>🎯</Text>
              <Text className='section-title'>学习目标</Text>
            </View>
            {showcase.learningGoals.map((goal, index) => (
              <View key={index} className='goal-item'>
                <Text className='goal-bullet'>•</Text>
                <Text className='goal-text'>{goal}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 项目标签 */}
        {showcase.tags && showcase.tags.length > 0 && (
          <View className='tags-section'>
            <View className='section-header'>
              <Text className='section-icon'>🏷️</Text>
              <Text className='section-title'>技术标签</Text>
            </View>
            <View className='tags-list'>
              {showcase.tags.map((tag, index) => (
                <View key={index} className='tag-item'>
                  <Text>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 项目成果 */}
        {showcase.deliverables && showcase.deliverables.length > 0 && (
          <View className='deliverables-section'>
            <View className='section-header'>
              <Text className='section-icon'>🎁</Text>
              <Text className='section-title'>项目成果</Text>
            </View>
            {showcase.deliverables.map(deliverable => (
              <View
                key={deliverable.id}
                className='deliverable-card'
                onClick={() => handlePreviewDeliverable(deliverable)}
              >
                <View className='deliverable-header'>
                  <Text className='deliverable-title'>{deliverable.title}</Text>
                  {(deliverable.demoUrl || deliverable.fileUrl) && (
                    <Text className='deliverable-arrow'>›</Text>
                  )}
                </View>
                <Text className='deliverable-description'>{deliverable.description}</Text>
                <Text className='deliverable-time'>
                  {new Date(deliverable.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 反思总结 */}
        {showcase.reflectionSummary && (
          <View className='reflection-section'>
            <View className='section-header'>
              <Text className='section-icon'>✨</Text>
              <Text className='section-title'>项目反思</Text>
            </View>
            <Text className='reflection-text'>{showcase.reflectionSummary}</Text>
          </View>
        )}

        {/* 项目时间 */}
        <View className='timeline-section'>
          <View className='timeline-item'>
            <Text className='timeline-label'>创建时间</Text>
            <Text className='timeline-value'>
              {new Date(showcase.createdAt).toLocaleDateString()}
            </Text>
          </View>
          {showcase.completedAt && (
            <View className='timeline-item'>
              <Text className='timeline-label'>完成时间</Text>
              <Text className='timeline-value'>
                {new Date(showcase.completedAt).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 底部操作 */}
      <View className='showcase-actions'>
        <View className='action-btn secondary' onClick={handleViewStats}>
          <Text className='action-icon'>📊</Text>
          <Text className='action-text'>查看统计</Text>
        </View>
        <View className='action-btn primary' onClick={handleShare}>
          <Text className='action-icon'>📤</Text>
          <Text className='action-text'>分享项目</Text>
        </View>
      </View>
    </View>
  )
}
