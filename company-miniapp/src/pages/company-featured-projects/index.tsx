import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import companyProjectAPI from '../../services/project'
import './index.scss'

const DOMAINS = [
  { label: '全部', value: '', icon: '📁' },
  { label: 'AI人工智能', value: 'AI人工智能', icon: '🤖' },
  { label: 'Web开发', value: 'Web开发', icon: '🌐' },
  { label: '移动开发', value: '移动开发', icon: '📱' },
  { label: '数据分析', value: '数据分析', icon: '📊' },
  { label: '产品设计', value: '产品设计', icon: '🎨' },
  { label: '游戏开发', value: '游戏开发', icon: '🎮' }
]

interface FeaturedProject {
  id: string
  title: string
  description: string
  domain: string
  tags: string[]
  coverImage?: string
  studentName: string
  studentAvatar?: string
  stats: {
    viewCount: number
    likeCount: number
    commentCount: number
  }
  featuredReason?: string
  adminRecommendation?: string
  createdAt: string
  completedAt?: string
}

export default function FeaturedProjects() {
  const [projects, setProjects] = useState<FeaturedProject[]>([])
  const [loading, setLoading] = useState(false)
  const [currentDomain, setCurrentDomain] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    loadProjects(true)
  }, [currentDomain])

  // 加载精选项目
  const loadProjects = async (reset: boolean = false) => {
    if (loading) return

    try {
      setLoading(true)
      const currentPage = reset ? 1 : page

      const res = await companyProjectAPI.getFeaturedProjects({
        domain: currentDomain || undefined,
        page: currentPage,
        limit: 10
      })

      if (res.success && res.data) {
        if (reset) {
          setProjects(res.data.projects)
          setPage(1)
        } else {
          setProjects(prev => [...prev, ...res.data.projects])
        }
        setHasMore(res.data.hasMore)
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

  // 切换领域
  const handleSelectDomain = (domain: string) => {
    setCurrentDomain(domain)
  }

  // 查看项目详情
  const handleViewProject = (project: FeaturedProject) => {
    Taro.navigateTo({
      url: `/pages/company-project-detail/index?projectId=${project.id}`
    })
  }

  // 加载更多
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1)
      loadProjects(false)
    }
  }

  return (
    <View className='featured-projects-page'>
      {/* 头部 */}
      <View className='featured-header'>
        <View className='header-content'>
          <Text className='header-icon'>⭐</Text>
          <View className='header-text'>
            <Text className='header-title'>精选项目</Text>
            <Text className='header-subtitle'>平台推荐的优秀学生作品</Text>
          </View>
        </View>
      </View>

      {/* 领域筛选 */}
      <ScrollView className='domain-filter' scrollX>
        {DOMAINS.map(domain => (
          <View
            key={domain.value}
            className={`domain-item ${currentDomain === domain.value ? 'active' : ''}`}
            onClick={() => handleSelectDomain(domain.value)}
          >
            <Text className='domain-icon'>{domain.icon}</Text>
            <Text className='domain-label'>{domain.label}</Text>
          </View>
        ))}
      </ScrollView>

      {/* 项目列表 */}
      <ScrollView
        className='projects-list'
        scrollY
        onScrollToLower={handleLoadMore}
        lowerThreshold={100}
      >
        {projects.length === 0 && !loading ? (
          <View className='empty-projects'>
            <Text className='empty-icon'>⭐</Text>
            <Text className='empty-text'>暂无精选项目</Text>
            <Text className='empty-hint'>敬请期待更多优秀作品</Text>
          </View>
        ) : (
          projects.map((project, index) => (
            <View
              key={project.id}
              className='featured-card'
              onClick={() => handleViewProject(project)}
            >
              {/* 排名标签 */}
              <View className='rank-badge'>
                <Text className='rank-number'>#{index + 1}</Text>
              </View>

              {/* 封面图 */}
              <View className='card-cover'>
                {project.coverImage ? (
                  <Image className='cover-image' src={project.coverImage} mode='aspectFill' />
                ) : (
                  <View className='cover-placeholder'>
                    <Text className='placeholder-icon'>🎨</Text>
                  </View>
                )}
                <View className='cover-overlay'>
                  <View className='featured-star'>
                    <Text>⭐</Text>
                  </View>
                </View>
              </View>

              {/* 项目信息 */}
              <View className='card-content'>
                <Text className='project-title'>{project.title}</Text>
                <Text className='project-description'>{project.description}</Text>

                {/* 推荐理由 */}
                {project.adminRecommendation && (
                  <View className='recommendation'>
                    <View className='recommendation-header'>
                      <Text className='recommendation-icon'>💡</Text>
                      <Text className='recommendation-label'>推荐理由</Text>
                    </View>
                    <Text className='recommendation-text'>{project.adminRecommendation}</Text>
                  </View>
                )}

                {/* 标签 */}
                {project.tags && project.tags.length > 0 && (
                  <View className='project-tags'>
                    {project.tags.slice(0, 4).map((tag, idx) => (
                      <View key={idx} className='tag-item'>
                        <Text>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* 学生信息 */}
                <View className='student-info'>
                  <View className='student-profile'>
                    {project.studentAvatar ? (
                      <Image className='student-avatar' src={project.studentAvatar} />
                    ) : (
                      <View className='student-avatar-placeholder'>
                        <Text>👤</Text>
                      </View>
                    )}
                    <Text className='student-name'>{project.studentName}</Text>
                  </View>

                  {/* 统计数据 */}
                  <View className='project-stats'>
                    <View className='stat-item'>
                      <Text className='stat-icon'>👀</Text>
                      <Text className='stat-value'>{project.stats.viewCount}</Text>
                    </View>
                    <View className='stat-item'>
                      <Text className='stat-icon'>❤️</Text>
                      <Text className='stat-value'>{project.stats.likeCount}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ))
        )}

        {loading && (
          <View className='loading-more'>
            <Text>加载中...</Text>
          </View>
        )}

        {!loading && !hasMore && projects.length > 0 && (
          <View className='no-more'>
            <Text>没有更多了</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
