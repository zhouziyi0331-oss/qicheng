import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import pblAPI from '../../services/pbl'
import './index.scss'

interface Project {
  id: string
  title: string
  description: string
  status: string
  progressPercentage: number
  domain: string
  createdAt: string
  isPublic?: boolean
  isFeatured?: boolean
  viewCount?: number
  likeCount?: number
}

const STATUS_CONFIG = {
  ideation: { label: '选主题', color: '#8B5CF6', icon: '💡' },
  planning: { label: '拆解问题', color: '#EC4899', icon: '📋' },
  executing: { label: '执行中', color: '#10B981', icon: '🚀' },
  reviewing: { label: '测试迭代', color: '#F59E0B', icon: '🔍' },
  completed: { label: '已完成', color: '#06B6D4', icon: '✅' }
}

export default function MyProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'in_progress' | 'completed'>('all')
  const [stats, setStats] = useState({
    totalProjects: 0,
    completedProjects: 0,
    publicProjects: 0,
    featuredProjects: 0
  })

  useEffect(() => {
    loadProjects()
    loadStats()
  }, [activeTab])

  // 加载项目列表
  const loadProjects = async () => {
    try {
      setLoading(true)
      const statusFilter = activeTab === 'in_progress'
        ? 'ideation,planning,executing,reviewing'
        : activeTab === 'completed'
        ? 'completed'
        : undefined

      const res = await pblAPI.getMyProjects(statusFilter)

      if (res.success && res.data) {
        setProjects(res.data.projects || [])
      }
    } catch (error) {
      console.error('加载项目失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  // 加载统计数据
  const loadStats = async () => {
    try {
      const res = await pblAPI.getStats()
      if (res.success && res.data) {
        setStats({
          totalProjects: res.data.totalProjects || 0,
          completedProjects: res.data.completedProjects || 0,
          publicProjects: res.data.publicProjects || 0,
          featuredProjects: res.data.featuredProjects || 0
        })
      }
    } catch (error) {
      console.error('加载统计失败:', error)
    }
  }

  // 创建新项目
  const handleCreateProject = () => {
    Taro.navigateTo({
      url: '/pages/pbl-create-project/index'
    })
  }

  // 查看项目详情
  const handleViewProject = (projectId: string) => {
    Taro.navigateTo({
      url: `/pages/pbl-project-detail/index?projectId=${projectId}`
    })
  }

  // 继续项目
  const handleContinueProject = (projectId: string, projectTitle: string) => {
    Taro.navigateTo({
      url: `/pages/pbl-chat/index?projectId=${projectId}&projectTitle=${projectTitle}`
    })
  }

  return (
    <View className='my-projects-page'>
      {/* 头部统计 */}
      <View className='stats-header'>
        <View className='stats-card'>
          <Text className='stats-number'>{stats.totalProjects}</Text>
          <Text className='stats-label'>总项目</Text>
        </View>
        <View className='stats-card'>
          <Text className='stats-number'>{stats.completedProjects}</Text>
          <Text className='stats-label'>已完成</Text>
        </View>
        <View className='stats-card'>
          <Text className='stats-number'>{stats.publicProjects}</Text>
          <Text className='stats-label'>公开展示</Text>
        </View>
        <View className='stats-card featured'>
          <Text className='stats-number'>{stats.featuredProjects}</Text>
          <Text className='stats-label'>精选项目</Text>
        </View>
      </View>

      {/* Tab切换 */}
      <View className='tabs'>
        <View
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <Text>全部</Text>
        </View>
        <View
          className={`tab ${activeTab === 'in_progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('in_progress')}
        >
          <Text>进行中</Text>
        </View>
        <View
          className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          <Text>已完成</Text>
        </View>
      </View>

      {/* 项目列表 */}
      <ScrollView
        className='projects-list'
        scrollY
        enableBackToTop
      >
        {loading ? (
          <View className='loading'>
            <Text>加载中...</Text>
          </View>
        ) : projects.length === 0 ? (
          <View className='empty'>
            <Text className='empty-icon'>📦</Text>
            <Text className='empty-text'>还没有项目</Text>
            <Text className='empty-hint'>和启程小猫一起开始第一个项目吧！</Text>
            <View className='create-btn' onClick={handleCreateProject}>
              <Text>创建项目</Text>
            </View>
          </View>
        ) : (
          projects.map(project => (
            <View
              key={project.id}
              className='project-card'
              onClick={() => handleViewProject(project.id)}
            >
              {/* 项目头部 */}
              <View className='project-header'>
                <View className='project-title-row'>
                  <Text className='project-icon'>
                    {STATUS_CONFIG[project.status]?.icon || '📁'}
                  </Text>
                  <Text className='project-title'>{project.title}</Text>
                </View>
                <View
                  className='project-status'
                  style={{ backgroundColor: STATUS_CONFIG[project.status]?.color }}
                >
                  <Text>{STATUS_CONFIG[project.status]?.label}</Text>
                </View>
              </View>

              {/* 项目描述 */}
              <Text className='project-description'>{project.description}</Text>

              {/* 项目标签 */}
              <View className='project-tags'>
                {project.domain && (
                  <View className='tag domain'>
                    <Text>{project.domain}</Text>
                  </View>
                )}
                {project.isPublic && (
                  <View className='tag public'>
                    <Text>🌐 公开</Text>
                  </View>
                )}
                {project.isFeatured && (
                  <View className='tag featured'>
                    <Text>⭐ 精选</Text>
                  </View>
                )}
              </View>

              {/* 进度条 */}
              <View className='progress-section'>
                <View className='progress-bar'>
                  <View
                    className='progress-fill'
                    style={{
                      width: `${project.progressPercentage}%`,
                      backgroundColor: STATUS_CONFIG[project.status]?.color
                    }}
                  />
                </View>
                <Text className='progress-text'>{project.progressPercentage}%</Text>
              </View>

              {/* 项目统计 */}
              {(project.viewCount || project.likeCount) && (
                <View className='project-stats'>
                  {project.viewCount > 0 && (
                    <View className='stat-item'>
                      <Text className='stat-icon'>👁️</Text>
                      <Text className='stat-value'>{project.viewCount}</Text>
                    </View>
                  )}
                  {project.likeCount > 0 && (
                    <View className='stat-item'>
                      <Text className='stat-icon'>❤️</Text>
                      <Text className='stat-value'>{project.likeCount}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* 操作按钮 */}
              <View className='project-actions'>
                {project.status !== 'completed' && (
                  <View
                    className='action-btn primary'
                    onClick={(e) => {
                      e.stopPropagation()
                      handleContinueProject(project.id, project.title)
                    }}
                  >
                    <Text>继续项目</Text>
                  </View>
                )}
                <View
                  className='action-btn secondary'
                  onClick={(e) => {
                    e.stopPropagation()
                    handleViewProject(project.id)
                  }}
                >
                  <Text>查看详情</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* 底部创建按钮 */}
      {projects.length > 0 && (
        <View className='fab' onClick={handleCreateProject}>
          <Text className='fab-icon'>+</Text>
        </View>
      )}
    </View>
  )
}
