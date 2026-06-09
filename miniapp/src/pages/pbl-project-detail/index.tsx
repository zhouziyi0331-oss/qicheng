import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import pblAPI from '../../services/pbl'
import './index.scss'

interface ProjectDetail {
  id: string
  title: string
  description: string
  status: string
  progressPercentage: number
  domain: string
  initialProblem: string
  learningGoals: string[]
  createdAt: string
  completedAt?: string

  // 成果信息
  deliverables?: Array<{
    id: string
    title: string
    deliverableType: string
    qualityScore: number
    isPublic: boolean
    isFeatured: boolean
  }>

  // 统计信息
  viewCount?: number
  likeCount?: number

  // 阶段信息
  phases?: Array<{
    id: string
    phaseNumber: number
    title: string
    status: string
  }>

  // 文件列表
  files?: Array<{
    id: string
    filename: string
    fileType: string
    createdAt: string
  }>

  // 代码执行历史
  executions?: Array<{
    id: string
    language: string
    status: string
    executionTime: number
    createdAt: string
  }>
}

const STATUS_CONFIG = {
  ideation: { label: '选主题', color: '#8B5CF6', icon: '💡' },
  planning: { label: '拆解问题', color: '#EC4899', icon: '📋' },
  executing: { label: '执行中', color: '#10B981', icon: '🚀' },
  reviewing: { label: '测试迭代', color: '#F59E0B', icon: '🔍' },
  completed: { label: '已完成', color: '#06B6D4', icon: '✅' }
}

export default function PBLProjectDetail() {
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [projectId, setProjectId] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'executions' | 'deliverables'>('overview')

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params
    if (params?.projectId) {
      setProjectId(params.projectId)
      loadProjectDetail(params.projectId)
    }
  }, [])

  // 加载项目详情
  const loadProjectDetail = async (projectId: string) => {
    try {
      setLoading(true)
      const res = await pblAPI.getProjectDetail(projectId)

      if (res.success && res.data) {
        setProject(res.data.project)
      }
    } catch (error) {
      console.error('加载项目详情失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  // 继续项目
  const handleContinueProject = () => {
    if (project) {
      Taro.navigateTo({
        url: `/pages/pbl-chat/index?projectId=${project.id}&projectTitle=${project.title}`
      })
    }
  }

  // 公开项目
  const handlePublishProject = async () => {
    if (!project) return

    try {
      const res = await Taro.showModal({
        title: '公开项目',
        content: '公开后，企业和平台可以查看你的项目成果。确定要公开吗？'
      })

      if (res.confirm) {
        await pblAPI.publishProject(project.id, { isPublic: true })
        Taro.showToast({
          title: '已公开',
          icon: 'success'
        })
        loadProjectDetail(project.id)
      }
    } catch (error) {
      console.error('公开项目失败:', error)
      Taro.showToast({
        title: '操作失败',
        icon: 'none'
      })
    }
  }

  // 查看统计
  const handleViewStats = async () => {
    if (!project) return

    try {
      const res = await pblAPI.getProjectStats(project.id)
      if (res.success && res.data) {
        Taro.showModal({
          title: '项目统计',
          content: `查看次数：${res.data.viewCount}\n点赞次数：${res.data.likeCount}\n推荐次数：${res.data.recommendCount}`,
          showCancel: false
        })
      }
    } catch (error) {
      console.error('查看统计失败:', error)
    }
  }

  if (loading || !project) {
    return (
      <View className='pbl-project-detail-page'>
        <View className='loading'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='pbl-project-detail-page'>
      {/* 项目头部 */}
      <View className='project-header'>
        <View className='header-top'>
          <View className='title-row'>
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

        <Text className='project-description'>{project.description}</Text>

        {/* 项目标签 */}
        <View className='project-tags'>
          {project.domain && (
            <View className='tag domain'>
              <Text>{project.domain}</Text>
            </View>
          )}
          {project.deliverables?.some(d => d.isPublic) && (
            <View className='tag public'>
              <Text>🌐 公开</Text>
            </View>
          )}
          {project.deliverables?.some(d => d.isFeatured) && (
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

        {/* 统计信息 */}
        {(project.viewCount || project.likeCount) && (
          <View className='project-stats'>
            {project.viewCount > 0 && (
              <View className='stat-item'>
                <Text className='stat-icon'>👁️</Text>
                <Text className='stat-value'>{project.viewCount}</Text>
                <Text className='stat-label'>查看</Text>
              </View>
            )}
            {project.likeCount > 0 && (
              <View className='stat-item'>
                <Text className='stat-icon'>❤️</Text>
                <Text className='stat-value'>{project.likeCount}</Text>
                <Text className='stat-label'>点赞</Text>
              </View>
            )}
          </View>
        )}

        {/* 操作按钮 */}
        <View className='header-actions'>
          {project.status !== 'completed' && (
            <View className='action-btn primary' onClick={handleContinueProject}>
              <Text>继续项目</Text>
            </View>
          )}
          {project.status === 'completed' && !project.deliverables?.some(d => d.isPublic) && (
            <View className='action-btn primary' onClick={handlePublishProject}>
              <Text>公开展示</Text>
            </View>
          )}
          {(project.viewCount || project.likeCount) && (
            <View className='action-btn secondary' onClick={handleViewStats}>
              <Text>查看统计</Text>
            </View>
          )}
        </View>
      </View>

      {/* Tab切换 */}
      <View className='tabs'>
        <View
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Text>概览</Text>
        </View>
        <View
          className={`tab ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => setActiveTab('files')}
        >
          <Text>文件</Text>
        </View>
        <View
          className={`tab ${activeTab === 'executions' ? 'active' : ''}`}
          onClick={() => setActiveTab('executions')}
        >
          <Text>代码执行</Text>
        </View>
        <View
          className={`tab ${activeTab === 'deliverables' ? 'active' : ''}`}
          onClick={() => setActiveTab('deliverables')}
        >
          <Text>成果</Text>
        </View>
      </View>

      {/* 内容区域 */}
      <ScrollView className='content-area' scrollY>
        {/* 概览 */}
        {activeTab === 'overview' && (
          <View className='overview-content'>
            {/* 初始问题 */}
            <View className='section'>
              <Text className='section-title'>💡 初始问题</Text>
              <View className='section-card'>
                <Text className='section-text'>{project.initialProblem}</Text>
              </View>
            </View>

            {/* 学习目标 */}
            {project.learningGoals && project.learningGoals.length > 0 && (
              <View className='section'>
                <Text className='section-title'>🎯 学习目标</Text>
                <View className='section-card'>
                  {project.learningGoals.map((goal, index) => (
                    <View key={index} className='goal-item'>
                      <Text className='goal-bullet'>•</Text>
                      <Text className='goal-text'>{goal}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 项目阶段 */}
            {project.phases && project.phases.length > 0 && (
              <View className='section'>
                <Text className='section-title'>📋 项目阶段</Text>
                <View className='section-card'>
                  {project.phases.map((phase, index) => (
                    <View key={phase.id} className='phase-item'>
                      <View className='phase-number'>{phase.phaseNumber}</View>
                      <View className='phase-content'>
                        <Text className='phase-title'>{phase.title}</Text>
                        <View
                          className='phase-status'
                          style={{
                            backgroundColor:
                              phase.status === 'completed'
                                ? '#10B981'
                                : phase.status === 'in_progress'
                                ? '#F59E0B'
                                : '#E5E7EB'
                          }}
                        >
                          <Text>
                            {phase.status === 'completed'
                              ? '已完成'
                              : phase.status === 'in_progress'
                              ? '进行中'
                              : '待开始'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* 文件列表 */}
        {activeTab === 'files' && (
          <View className='files-content'>
            {project.files && project.files.length > 0 ? (
              project.files.map(file => (
                <View key={file.id} className='file-item'>
                  <Text className='file-icon'>
                    {file.fileType === 'code' ? '📄' : file.fileType === 'document' ? '📝' : '📁'}
                  </Text>
                  <View className='file-info'>
                    <Text className='file-name'>{file.filename}</Text>
                    <Text className='file-date'>
                      {new Date(file.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View className='empty'>
                <Text className='empty-text'>还没有上传文件</Text>
              </View>
            )}
          </View>
        )}

        {/* 代码执行历史 */}
        {activeTab === 'executions' && (
          <View className='executions-content'>
            {project.executions && project.executions.length > 0 ? (
              project.executions.map(execution => (
                <View key={execution.id} className='execution-item'>
                  <View className='execution-header'>
                    <Text className='execution-language'>{execution.language}</Text>
                    <View
                      className='execution-status'
                      style={{
                        backgroundColor:
                          execution.status === 'success'
                            ? '#10B981'
                            : execution.status === 'error'
                            ? '#EF4444'
                            : '#F59E0B'
                      }}
                    >
                      <Text>
                        {execution.status === 'success'
                          ? '成功'
                          : execution.status === 'error'
                          ? '失败'
                          : '超时'}
                      </Text>
                    </View>
                  </View>
                  <Text className='execution-time'>
                    执行时间: {execution.executionTime}ms
                  </Text>
                  <Text className='execution-date'>
                    {new Date(execution.createdAt).toLocaleString()}
                  </Text>
                </View>
              ))
            ) : (
              <View className='empty'>
                <Text className='empty-text'>还没有执行过代码</Text>
              </View>
            )}
          </View>
        )}

        {/* 项目成果 */}
        {activeTab === 'deliverables' && (
          <View className='deliverables-content'>
            {project.deliverables && project.deliverables.length > 0 ? (
              project.deliverables.map(deliverable => (
                <View key={deliverable.id} className='deliverable-item'>
                  <View className='deliverable-header'>
                    <Text className='deliverable-title'>{deliverable.title}</Text>
                    {deliverable.isFeatured && (
                      <View className='featured-badge'>
                        <Text>⭐ 精选</Text>
                      </View>
                    )}
                  </View>
                  <View className='deliverable-meta'>
                    <Text className='deliverable-type'>{deliverable.deliverableType}</Text>
                    <Text className='deliverable-score'>质量评分: {deliverable.qualityScore}/10</Text>
                  </View>
                  {deliverable.isPublic && (
                    <View className='public-badge'>
                      <Text>🌐 已公开</Text>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View className='empty'>
                <Text className='empty-text'>还没有项目成果</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  )
}
