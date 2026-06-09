import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import companyProjectAPI from '../../services/project'
import './index.scss'

interface ProjectDetail {
  id: string
  title: string
  description: string
  domain: string
  tags: string[]
  coverImage?: string
  studentName: string
  studentAvatar?: string
  studentId: string
  stats: {
    viewCount: number
    likeCount: number
    commentCount: number
  }
  learningGoals: string[]
  deliverables: Array<{
    id: string
    title: string
    description: string
    fileUrl?: string
    demoUrl?: string
    createdAt: string
  }>
  reflectionSummary?: string
  isFeatured: boolean
  adminRecommendation?: string
  isLiked: boolean
  isFavorited: boolean
  createdAt: string
  completedAt?: string
}

export default function CompanyProjectDetail() {
  const [projectId, setProjectId] = useState('')
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params
    if (params?.projectId) {
      setProjectId(params.projectId)
      loadProject(params.projectId)
    }
  }, [])

  // 加载项目详情
  const loadProject = async (projectId: string) => {
    try {
      setLoading(true)

      // 记录浏览
      await companyProjectAPI.logProjectView(projectId)

      const res = await companyProjectAPI.getProjectDetail(projectId)
      if (res.success && res.data) {
        setProject(res.data)
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

  // 点赞/取消点赞
  const handleToggleLike = async () => {
    if (!project || actionLoading) return

    try {
      setActionLoading(true)

      if (project.isLiked) {
        await companyProjectAPI.unlikeProject(projectId)
      } else {
        await companyProjectAPI.likeProject(projectId)
      }

      setProject({
        ...project,
        isLiked: !project.isLiked,
        stats: {
          ...project.stats,
          likeCount: project.isLiked ? project.stats.likeCount - 1 : project.stats.likeCount + 1
        }
      })

      Taro.showToast({
        title: project.isLiked ? '已取消点赞' : '点赞成功',
        icon: 'success'
      })
    } catch (error) {
      console.error('操作失败:', error)
      Taro.showToast({
        title: '操作失败',
        icon: 'none'
      })
    } finally {
      setActionLoading(false)
    }
  }

  // 收藏/取消收藏
  const handleToggleFavorite = async () => {
    if (!project || actionLoading) return

    try {
      setActionLoading(true)

      if (project.isFavorited) {
        await companyProjectAPI.unfavoriteProject(projectId)
      } else {
        await companyProjectAPI.favoriteProject(projectId)
      }

      setProject({
        ...project,
        isFavorited: !project.isFavorited
      })

      Taro.showToast({
        title: project.isFavorited ? '已取消收藏' : '收藏成功',
        icon: 'success'
      })
    } catch (error) {
      console.error('操作失败:', error)
      Taro.showToast({
        title: '操作失败',
        icon: 'none'
      })
    } finally {
      setActionLoading(false)
    }
  }

  // 联系学生
  const handleContact = async () => {
    if (!project) return

    const res = await Taro.showModal({
      title: '联系学生',
      content: '确定要联系这位学生吗？',
      confirmText: '确定',
      cancelText: '取消'
    })

    if (res.confirm) {
      try {
        await companyProjectAPI.contactStudent(projectId, '我对你的项目很感兴趣，希望能进一步了解。')
        Taro.showToast({
          title: '已发送联系请求',
          icon: 'success'
        })
      } catch (error) {
        console.error('发送失败:', error)
        Taro.showToast({
          title: '发送失败',
          icon: 'none'
        })
      }
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

  // 分享项目
  const handleShare = () => {
    Taro.showShareMenu({
      withShareTicket: true
    })
  }

  if (loading) {
    return (
      <View className='company-project-detail-page'>
        <View className='loading-container'>
          <Text className='loading-text'>加载中...</Text>
        </View>
      </View>
    )
  }

  if (!project) {
    return (
      <View className='company-project-detail-page'>
        <View className='error-container'>
          <Text className='error-icon'>😢</Text>
          <Text className='error-text'>项目不存在</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='company-project-detail-page'>
      {/* 头部封面 */}
      <View className='detail-header'>
        {project.coverImage ? (
          <Image className='header-cover' src={project.coverImage} mode='aspectFill' />
        ) : (
          <View className='header-cover-placeholder'>
            <Text className='placeholder-icon'>🎨</Text>
          </View>
        )}

        {project.isFeatured && (
          <View className='featured-badge'>
            <Text>⭐ 精选项目</Text>
          </View>
        )}

        <View className='header-overlay'>
          <Text className='project-title'>{project.title}</Text>
          {project.domain && (
            <View className='project-domain'>
              <Text>{project.domain}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView className='detail-content' scrollY>
        {/* 统计数据 */}
        <View className='stats-section'>
          <View className='stat-item'>
            <Text className='stat-icon'>👀</Text>
            <Text className='stat-value'>{project.stats.viewCount}</Text>
            <Text className='stat-label'>浏览</Text>
          </View>
          <View className='stat-item'>
            <Text className='stat-icon'>❤️</Text>
            <Text className='stat-value'>{project.stats.likeCount}</Text>
            <Text className='stat-label'>点赞</Text>
          </View>
          <View className='stat-item'>
            <Text className='stat-icon'>💬</Text>
            <Text className='stat-value'>{project.stats.commentCount}</Text>
            <Text className='stat-label'>评论</Text>
          </View>
        </View>

        {/* 学生信息 */}
        <View className='student-section'>
          <View className='section-header'>
            <Text className='section-icon'>👤</Text>
            <Text className='section-title'>项目作者</Text>
          </View>
          <View className='student-card'>
            {project.studentAvatar ? (
              <Image className='student-avatar' src={project.studentAvatar} />
            ) : (
              <View className='student-avatar-placeholder'>
                <Text>👤</Text>
              </View>
            )}
            <View className='student-info'>
              <Text className='student-name'>{project.studentName}</Text>
              <Text className='student-label'>学生开发者</Text>
            </View>
            <View className='contact-btn' onClick={handleContact}>
              <Text>联系</Text>
            </View>
          </View>
        </View>

        {/* 平台推荐 */}
        {project.adminRecommendation && (
          <View className='recommendation-section'>
            <View className='section-header'>
              <Text className='section-icon'>💡</Text>
              <Text className='section-title'>平台推荐</Text>
            </View>
            <Text className='recommendation-text'>{project.adminRecommendation}</Text>
          </View>
        )}

        {/* 项目描述 */}
        <View className='description-section'>
          <View className='section-header'>
            <Text className='section-icon'>📝</Text>
            <Text className='section-title'>项目介绍</Text>
          </View>
          <Text className='description-text'>{project.description}</Text>
        </View>

        {/* 学习目标 */}
        {project.learningGoals && project.learningGoals.length > 0 && (
          <View className='goals-section'>
            <View className='section-header'>
              <Text className='section-icon'>🎯</Text>
              <Text className='section-title'>学习目标</Text>
            </View>
            {project.learningGoals.map((goal, index) => (
              <View key={index} className='goal-item'>
                <Text className='goal-bullet'>•</Text>
                <Text className='goal-text'>{goal}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 技术标签 */}
        {project.tags && project.tags.length > 0 && (
          <View className='tags-section'>
            <View className='section-header'>
              <Text className='section-icon'>🏷️</Text>
              <Text className='section-title'>技术栈</Text>
            </View>
            <View className='tags-list'>
              {project.tags.map((tag, index) => (
                <View key={index} className='tag-item'>
                  <Text>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 项目成果 */}
        {project.deliverables && project.deliverables.length > 0 && (
          <View className='deliverables-section'>
            <View className='section-header'>
              <Text className='section-icon'>🎁</Text>
              <Text className='section-title'>项目成果</Text>
            </View>
            {project.deliverables.map(deliverable => (
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
              </View>
            ))}
          </View>
        )}

        {/* 项目反思 */}
        {project.reflectionSummary && (
          <View className='reflection-section'>
            <View className='section-header'>
              <Text className='section-icon'>✨</Text>
              <Text className='section-title'>项目总结</Text>
            </View>
            <Text className='reflection-text'>{project.reflectionSummary}</Text>
          </View>
        )}
      </ScrollView>

      {/* 底部操作栏 */}
      <View className='detail-actions'>
        <View
          className={`action-btn ${project.isLiked ? 'active' : ''}`}
          onClick={handleToggleLike}
        >
          <Text className='action-icon'>{project.isLiked ? '❤️' : '🤍'}</Text>
          <Text className='action-text'>点赞</Text>
        </View>
        <View
          className={`action-btn ${project.isFavorited ? 'active' : ''}`}
          onClick={handleToggleFavorite}
        >
          <Text className='action-icon'>{project.isFavorited ? '⭐' : '☆'}</Text>
          <Text className='action-text'>收藏</Text>
        </View>
        <View className='action-btn' onClick={handleShare}>
          <Text className='action-icon'>📤</Text>
          <Text className='action-text'>分享</Text>
        </View>
      </View>
    </View>
  )
}
