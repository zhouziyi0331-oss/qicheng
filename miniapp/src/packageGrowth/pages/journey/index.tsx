import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { mentorStageAPI, abilityAPI, taskAPI, opcGrowthAPI } from '../../../services/api'
import Typewriter from '../../../components/Typewriter'
import './index.scss'
import '../../../styles/morandi-colors.scss'

interface JourneyStats {
  level: number
  exp: number
  maxExp: number
  completedTasks: number
  ongoingTasks: number
  totalStories: number
  daysActive: number
}

interface AbilityScore {
  name: string
  score: number
  progress: number
}

interface Milestone {
  id: string
  type: string
  title: string
  description: string
  achievedAt: string
  icon: string
}

interface RecentActivity {
  id: string
  type: string
  title: string
  description: string
  time: string
  icon: string
}

export default function Journey() {
  const [stats, setStats] = useState<JourneyStats>({
    level: 1,
    exp: 0,
    maxExp: 100,
    completedTasks: 0,
    ongoingTasks: 0,
    totalStories: 0,
    daysActive: 0
  })
  const [abilities, setAbilities] = useState<AbilityScore[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadJourneyData()
  }, [])

  const loadJourneyData = async () => {
    try {
      setLoading(true)
      const userInfo = Taro.getStorageSync('userInfo') || {}
      const userId = userInfo.id || Taro.getStorageSync('userId')

      if (!userId) {
        Taro.showToast({ title: '请先登录', icon: 'none' })
        return
      }

      // 并行加载多个数据
      const [radarRes, tasksRes, trajectoryRes] = await Promise.all([
        abilityAPI.getRadar().catch(() => null),
        taskAPI.getList({ status: 'all' }).catch(() => null),
        opcGrowthAPI.getGrowthTrajectory().catch(() => null)
      ])

      // 处理能力数据
      if (radarRes?.dimensions) {
        const abilityScores = Object.values(radarRes.dimensions).map((dim: any) => ({
          name: dim.name,
          score: dim.score,
          progress: dim.score
        }))
        setAbilities(abilityScores)

        setStats(prev => ({
          ...prev,
          level: radarRes.level || 1,
          exp: radarRes.exp || 0,
          maxExp: radarRes.max_exp || 100,
          completedTasks: radarRes.completed_tasks || 0,
          ongoingTasks: radarRes.ongoing_tasks || 0,
          totalStories: radarRes.stories || 0
        }))
      }

      // 处理成长轨迹数据
      if (trajectoryRes?.milestones) {
        const milestonesData = trajectoryRes.milestones.slice(0, 5).map((m: any) => ({
          id: m.id,
          type: m.type,
          title: m.title || m.description,
          description: m.description,
          achievedAt: m.achievedAt || m.createdAt,
          icon: getMilestoneIcon(m.type)
        }))
        setMilestones(milestonesData)
      }

      // 处理最近活动
      if (trajectoryRes?.recentActivities) {
        const activitiesData = trajectoryRes.recentActivities.slice(0, 10).map((a: any) => ({
          id: a.id,
          type: a.type,
          title: a.title,
          description: a.description,
          time: formatTime(a.occurredAt || a.createdAt),
          icon: getActivityIcon(a.type)
        }))
        setRecentActivities(activitiesData)
      }

      // 计算活跃天数
      if (userInfo.createdAt) {
        const days = Math.floor((Date.now() - new Date(userInfo.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        setStats(prev => ({ ...prev, daysActive: days }))
      }

    } catch (error: any) {
      console.error('加载成长旅程失败:', error)
      Taro.showToast({ title: error.message || '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const getMilestoneIcon = (type: string) => {
    const icons: Record<string, string> = {
      first_task: '目标',
      level_up: '↑',
      skill_master: '学习',
      challenge_complete: '成就',
      collaboration: '协作',
      innovation: '想法',
      persistence: '能力'
    }
    return icons[type] || '★'
  }

  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      task_completed: '✓',
      task_started: '▶',
      story_shared: '记录',
      comment_added: '评论',
      level_gained: '↑',
      ability_improved: '趋势',
      milestone_reached: '✦'
    }
    return icons[type] || '·'
  }

  const formatTime = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (hours < 1) return '刚刚'
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString('zh-CN')
  }

  const handleNavigate = (path: string) => {
    Taro.navigateTo({ url: path })
  }

  if (loading) {
    return (
      <View className="journey-page">
        <View className="loading-container">
          <Text className="loading-text">加载中...</Text>
        </View>
      </View>
    )
  }

  const expPercent = (stats.exp / stats.maxExp) * 100

  return (
    <ScrollView className="journey-page" scrollY>
      {/* 顶部等级卡片 */}
      <View className="level-card">
        <View className="level-header">
          <View className="level-badge">
            <Text className="level-badge-text">Lv.{stats.level}</Text>
          </View>
          <View className="level-info">
            <Text className="level-title">成长旅程</Text>
            <Text className="level-subtitle">持续{stats.daysActive}天</Text>
          </View>
        </View>
        <View className="exp-bar">
          <View className="exp-progress" style={{ width: `${expPercent}%` }} />
        </View>
        <Text className="exp-text">{stats.exp}/{stats.maxExp} EXP</Text>
      </View>

      {/* 统计卡片 */}
      <View className="stats-grid">
        <View className="stat-card" onClick={() => handleNavigate('/pages/my-tasks/index')}>
          <Text className="stat-icon">✓</Text>
          <Text className="stat-value">{stats.completedTasks}</Text>
          <Text className="stat-label">完成任务</Text>
        </View>
        <View className="stat-card" onClick={() => handleNavigate('/pages/my-tasks/index')}>
          <Text className="stat-icon">列表</Text>
          <Text className="stat-value">{stats.ongoingTasks}</Text>
          <Text className="stat-label">进行中</Text>
        </View>
        <View className="stat-card" onClick={() => Taro.switchTab({ url: '/pages/story/index' })}>
          <Text className="stat-icon">记录</Text>
          <Text className="stat-value">{stats.totalStories}</Text>
          <Text className="stat-label">分享故事</Text>
        </View>
        <View className="stat-card" onClick={() => handleNavigate('/pages/ability/index')}>
          <Text className="stat-icon">能力</Text>
          <Text className="stat-value">{abilities.length}</Text>
          <Text className="stat-label">能力维度</Text>
        </View>
      </View>

      {/* 六维能力 */}
      <View className="section">
        <View className="section-header">
          <Text className="section-title">六维能力</Text>
          <Text className="section-more" onClick={() => handleNavigate('/pages/ability/index')}>
            查看详情 →
          </Text>
        </View>
        <View className="abilities-list">
          {abilities.map((ability, index) => (
            <View key={index} className="ability-item">
              <Text className="ability-name">{ability.name}</Text>
              <View className="ability-bar">
                <View className="ability-fill" style={{ width: `${ability.progress}%` }} />
              </View>
              <Text className="ability-score">{ability.score}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 里程碑 */}
      {milestones.length > 0 && (
        <View className="section">
          <View className="section-header">
            <Text className="section-title">成长里程碑</Text>
            <Text className="section-more" onClick={() => handleNavigate('/pages/milestones/index')}>
              查看全部 →
            </Text>
          </View>
          <View className="milestones-list">
            {milestones.map(milestone => (
              <View key={milestone.id} className="milestone-item">
                <Text className="milestone-icon">{milestone.icon}</Text>
                <View className="milestone-content">
                  <Text className="milestone-title">{milestone.title}</Text>
                  <Text className="milestone-time">{formatTime(milestone.achievedAt)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 最近活动 */}
      {recentActivities.length > 0 && (
        <View className="section">
          <View className="section-header">
            <Text className="section-title">最近活动</Text>
            <Text className="section-more" onClick={() => handleNavigate('/pages/growth-timeline/index')}>
              查看时间线 →
            </Text>
          </View>
          <View className="activities-list">
            {recentActivities.map(activity => (
              <View key={activity.id} className="activity-item">
                <Text className="activity-icon">{activity.icon}</Text>
                <View className="activity-content">
                  <Text className="activity-title">{activity.title}</Text>
                  <Text className="activity-time">{activity.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 快速入口 */}
      <View className="section">
        <Text className="section-title">快速入口</Text>
        <View className="quick-actions">
          <View className="action-item" onClick={() => handleNavigate('/pages/growth-dashboard/index')}>
            <Text className="action-icon">数据</Text>
            <Text className="action-label">成长仪表盘</Text>
          </View>
          <View className="action-item" onClick={() => handleNavigate('/pages/growth-timeline/index')}>
            <Text className="action-icon">趋势</Text>
            <Text className="action-label">成长时间线</Text>
          </View>
          <View className="action-item" onClick={() => handleNavigate('/pages/milestones/index')}>
            <Text className="action-icon">成就</Text>
            <Text className="action-label">里程碑</Text>
          </View>
          <View className="action-item" onClick={() => handleNavigate('/pages/growth-challenges/index')}>
            <Text className="action-icon">目标</Text>
            <Text className="action-label">成长挑战</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}
