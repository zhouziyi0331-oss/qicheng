import { View, Text, ScrollView, Image, Input } from '@tarojs/components'
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
  { label: '游戏开发', value: '游戏开发', icon: '🎮' },
  { label: '区块链', value: '区块链', icon: '⛓️' },
  { label: '物联网', value: '物联网', icon: '📡' }
]

const SORT_OPTIONS = [
  { label: '最新', value: 'latest', icon: '🆕' },
  { label: '最热', value: 'popular', icon: '🔥' },
  { label: '推荐', value: 'recommended', icon: '⭐' }
]

interface StudentProject {
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
  isFeatured: boolean
  createdAt: string
  completedAt?: string
}

export default function StudentProjects() {
  const [projects, setProjects] = useState<StudentProject[]>([])
  const [loading, setLoading] = useState(false)
  const [currentDomain, setCurrentDomain] = useState('')
  const [currentSort, setCurrentSort] = useState('latest')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    loadProjects(true)
  }, [currentDomain, currentSort])

  // 加载项目列表
  const loadProjects = async (reset: boolean = false) => {
    if (loading) return

    try {
      setLoading(true)
      const currentPage = reset ? 1 : page

      const res = await companyProjectAPI.getStudentProjects({
        domain: currentDomain || undefined,
        sortBy: currentSort as any,
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

  // 切换排序
  const handleSelectSort = (sort: string) => {
    setCurrentSort(sort)
  }

  // 搜索
  const handleSearch = () => {
    if (!searchKeyword.trim()) {
      Taro.showToast({
        title: '请输入搜索关键词',
        icon: 'none'
      })
      return
    }
    // TODO: 实现搜索功能
    Taro.showToast({
      title: '搜索功能开发中',
      icon: 'none'
    })
  }

  // 查看项目详情
  const handleViewProject = (project: StudentProject) => {
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

  // 查看精选项目
  const handleViewFeatured = () => {
    Taro.navigateTo({
      url: '/pages/company-featured-projects/index'
    })
  }

  return (
    <View className='student-projects-page'>
      {/* 头部 */}
      <View className='projects-header'>
        <View className='header-title'>
          <Text className='title-icon'>🎓</Text>
          <Text className='title-text'>学生项目</Text>
        </View>
        <View className='header-action' onClick={handleViewFeatured}>
          <Text className='action-icon'>⭐</Text>
          <Text className='action-text'>精选</Text>
        </View>
      </View>

      {/* 搜索栏 */}
      <View className='search-bar'>
        <Input
          className='search-input'
          placeholder='搜索项目、技能、学生...'
          value={searchKeyword}
          onInput={(e) => setSearchKeyword(e.detail.value)}
          onConfirm={handleSearch}
        />
        <View className='search-btn' onClick={handleSearch}>
          <Text>🔍</Text>
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

      {/* 排序选项 */}
      <View className='sort-options'>
        {SORT_OPTIONS.map(option => (
          <View
            key={option.value}
            className={`sort-item ${currentSort === option.value ? 'active' : ''}`}
            onClick={() => handleSelectSort(option.value)}
          >
            <Text className='sort-icon'>{option.icon}</Text>
            <Text className='sort-label'>{option.label}</Text>
          </View>
        ))}
      </View>

      {/* 项目列表 */}
      <ScrollView
        className='projects-list'
        scrollY
        onScrollToLower={handleLoadMore}
        lowerThreshold={100}
      >
        {projects.length === 0 && !loading ? (
          <View className='empty-projects'>
            <Text className='empty-icon'>📦</Text>
            <Text className='empty-text'>暂无项目</Text>
            <Text className='empty-hint'>换个筛选条件试试</Text>
          </View>
        ) : (
          projects.map(project => (
            <View
              key={project.id}
              className='project-card'
              onClick={() => handleViewProject(project)}
            >
              {/* 封面图 */}
              {project.coverImage ? (
                <Image className='project-cover' src={project.coverImage} mode='aspectFill' />
              ) : (
                <View className='project-cover-placeholder'>
                  <Text className='placeholder-icon'>🎨</Text>
                </View>
              )}

              {/* 精选标签 */}
              {project.isFeatured && (
                <View className='featured-badge'>
                  <Text>⭐ 精选</Text>
                </View>
              )}

              {/* 项目信息 */}
              <View className='project-info'>
                <Text className='project-title'>{project.title}</Text>
                <Text className='project-description'>{project.description}</Text>

                {/* 标签 */}
                {project.tags && project.tags.length > 0 && (
                  <View className='project-tags'>
                    {project.tags.slice(0, 3).map((tag, index) => (
                      <View key={index} className='tag-item'>
                        <Text>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* 学生信息 */}
                <View className='student-info'>
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
                  <View className='stat-item'>
                    <Text className='stat-icon'>💬</Text>
                    <Text className='stat-value'>{project.stats.commentCount}</Text>
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
