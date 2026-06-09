import { View, Text, ScrollView } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import { mentorStageAPI } from '../../services/api'
import './index.scss'

interface DashboardData {
  overview: {
    totalTasks: number
    completedTasks: number
    totalChallenges: number
    completedChallenges: number
    averageScore: number
    growthDays: number
  }
  abilityScores: {
    communication: number
    problemSolving: number
    creativity: number
    collaboration: number
    learning: number
    resilience: number
  }
  recentAchievements: Array<{
    id: string
    type: 'task' | 'challenge' | 'belief_shift' | 'pattern_overcome'
    title: string
    description: string
    achievedAt: string
    icon: string
    color: string
  }>
  weeklyProgress: Array<{
    week: string
    tasksCompleted: number
    challengesAccepted: number
    mentorInteractions: number
  }>
  patternsSummary: {
    identified: number
    addressing: number
    overcome: number
  }
  beliefShiftsSummary: {
    total: number
    averageProgress: number
    completed: number
  }
}

const ABILITY_CONFIG = {
  communication: { name: '沟通表达', icon: '💬', color: '#3B82F6' },
  problemSolving: { name: '问题解决', icon: '🧩', color: '#8B5CF6' },
  creativity: { name: '创造创新', icon: '🎨', color: '#EC4899' },
  collaboration: { name: '团队协作', icon: '🤝', color: '#10B981' },
  learning: { name: '学习能力', icon: '📚', color: '#F59E0B' },
  resilience: { name: '抗压韧性', icon: '💪', color: '#EF4444' }
}

export default function GrowthDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week')

  useEffect(() => {
    loadDashboard()
  }, [selectedPeriod])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const userInfo = Taro.getStorageSync('userInfo')
      if (!userInfo?.id) {
        Taro.showToast({ title: '请先登录', icon: 'none' })
        return
      }

      const response = await mentorStageAPI.getGrowthDashboard(userInfo.id, selectedPeriod)
      if (response.success) {
        setData(response.data)
      }
    } catch (error: any) {
      console.error('加载仪表盘失败:', error)
      Taro.showToast({ title: error.message || '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (hours < 1) return '刚刚'
    if (hours < 24) return `${hours}小时前`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}天前`
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  const getCompletionRate = (completed: number, total: number) => {
    if (total === 0) return 0
    return Math.round((completed / total) * 100)
  }

  const navigateToDetail = (type: string) => {
    const routes = {
      patterns: '/pages/deep-patterns/index',
      beliefs: '/pages/belief-shifts/index',
      challenges: '/pages/growth-challenges/index',
      tasks: '/pages/my-tasks/index'
    }
    if (routes[type]) {
      Taro.navigateTo({ url: routes[type] })
    }
  }

  if (loading) {
    return (
      <View className='growth-dashboard-page'>
        <View className='loading'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  if (!data) {
    return (
      <View className='growth-dashboard-page'>
        <View className='empty-state'>
          <Text className='empty-icon'>📊</Text>
          <Text className='empty-text'>暂无数据</Text>
        </View>
      </View>
    )
  }

  const { overview, abilityScores, recentAchievements, weeklyProgress, patternsSummary, beliefShiftsSummary } = data

  return (
    <View className='growth-dashboard-page'>
      {/* 时间段选择 */}
      <View className='period-selector'>
        <View
          className={`period-item ${selectedPeriod === 'week' ? 'active' : ''}`}
          onClick={() => setSelectedPeriod('week')}
        >
          <Text className='period-text'>本周</Text>
        </View>
        <View
          className={`period-item ${selectedPeriod === 'month' ? 'active' : ''}`}
          onClick={() => setSelectedPeriod('month')}
        >
          <Text className='period-text'>本月</Text>
        </View>
        <View
          className={`period-item ${selectedPeriod === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedPeriod('all')}
        >
          <Text className='period-text'>全部</Text>
        </View>
      </View>

      <ScrollView className='dashboard-scroll' scrollY>
        {/* 核心指标卡片 */}
        <View className='metrics-grid'>
          <View className='metric-card'>
            <Text className='metric-icon'>📋</Text>
            <Text className='metric-value'>{overview.completedTasks}/{overview.totalTasks}</Text>
            <Text className='metric-label'>任务完成</Text>
            <View className='metric-progress'>
              <View
                className='metric-progress-fill'
                style={{ width: `${getCompletionRate(overview.completedTasks, overview.totalTasks)}%` }}
              />
            </View>
          </View>

          <View className='metric-card'>
            <Text className='metric-icon'>🎯</Text>
            <Text className='metric-value'>{overview.completedChallenges}/{overview.totalChallenges}</Text>
            <Text className='metric-label'>挑战完成</Text>
            <View className='metric-progress'>
              <View
                className='metric-progress-fill'
                style={{ width: `${getCompletionRate(overview.completedChallenges, overview.totalChallenges)}%` }}
              />
            </View>
          </View>

          <View className='metric-card'>
            <Text className='metric-icon'>⭐</Text>
            <Text className='metric-value'>{overview.averageScore}</Text>
            <Text className='metric-label'>平均评分</Text>
            <View className='metric-progress'>
              <View
                className='metric-progress-fill'
                style={{ width: `${overview.averageScore}%` }}
              />
            </View>
          </View>

          <View className='metric-card'>
            <Text className='metric-icon'>📅</Text>
            <Text className='metric-value'>{overview.growthDays}</Text>
            <Text className='metric-label'>成长天数</Text>
          </View>
        </View>

        {/* 六维能力雷达图（简化版） */}
        <View className='section-card'>
          <View className='section-header'>
            <Text className='section-title'>六维能力</Text>
            <Text className='section-subtitle'>综合评估</Text>
          </View>
          <View className='abilities-grid'>
            {Object.entries(abilityScores).map(([key, score]) => {
              const config = ABILITY_CONFIG[key]
              return (
                <View key={key} className='ability-item'>
                  <View className='ability-header'>
                    <Text className='ability-icon'>{config.icon}</Text>
                    <Text className='ability-name'>{config.name}</Text>
                  </View>
                  <View className='ability-bar'>
                    <View
                      className='ability-bar-fill'
                      style={{
                        width: `${score}%`,
                        backgroundColor: config.color
                      }}
                    />
                  </View>
                  <Text className='ability-score'>{score}分</Text>
                </View>
              )
            })}
          </View>
        </View>

        {/* 深度洞察 */}
        <View className='section-card'>
          <View className='section-header'>
            <Text className='section-title'>深度洞察</Text>
            <Text className='section-subtitle'>模式与信念</Text>
          </View>
          <View className='insights-grid'>
            <View className='insight-item' onClick={() => navigateToDetail('patterns')}>
              <View className='insight-icon-wrapper' style={{ backgroundColor: '#FEF3C7' }}>
                <Text className='insight-icon'>🔍</Text>
              </View>
              <View className='insight-content'>
                <Text className='insight-title'>深度模式</Text>
                <Text className='insight-stats'>
                  识别 {patternsSummary.identified} · 改善中 {patternsSummary.addressing} · 已克服 {patternsSummary.overcome}
                </Text>
              </View>
              <Text className='insight-arrow'>›</Text>
            </View>

            <View className='insight-item' onClick={() => navigateToDetail('beliefs')}>
              <View className='insight-icon-wrapper' style={{ backgroundColor: '#DBEAFE' }}>
                <Text className='insight-icon'>🧠</Text>
              </View>
              <View className='insight-content'>
                <Text className='insight-title'>信念转变</Text>
                <Text className='insight-stats'>
                  {beliefShiftsSummary.total} 个转变 · 平均进度 {beliefShiftsSummary.averageProgress}%
                </Text>
              </View>
              <Text className='insight-arrow'>›</Text>
            </View>
          </View>
        </View>

        {/* 近期成就 */}
        <View className='section-card'>
          <View className='section-header'>
            <Text className='section-title'>近期成就</Text>
            <Text className='section-subtitle'>最新突破</Text>
          </View>
          {recentAchievements.length === 0 ? (
            <View className='empty-achievements'>
              <Text className='empty-text'>暂无成就记录</Text>
            </View>
          ) : (
            <View className='achievements-list'>
              {recentAchievements.map(achievement => (
                <View key={achievement.id} className='achievement-item'>
                  <View
                    className='achievement-icon-wrapper'
                    style={{ backgroundColor: achievement.color + '20' }}
                  >
                    <Text className='achievement-icon'>{achievement.icon}</Text>
                  </View>
                  <View className='achievement-content'>
                    <Text className='achievement-title'>{achievement.title}</Text>
                    <Text className='achievement-desc'>{achievement.description}</Text>
                    <Text className='achievement-time'>{formatDate(achievement.achievedAt)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 周进度趋势 */}
        {weeklyProgress.length > 0 && (
          <View className='section-card'>
            <View className='section-header'>
              <Text className='section-title'>活跃趋势</Text>
              <Text className='section-subtitle'>每周数据</Text>
            </View>
            <View className='weekly-chart'>
              {weeklyProgress.map((week, index) => {
                const maxValue = Math.max(
                  ...weeklyProgress.map(w => Math.max(w.tasksCompleted, w.challengesAccepted, w.mentorInteractions))
                )
                return (
                  <View key={index} className='week-column'>
                    <View className='week-bars'>
                      <View
                        className='week-bar tasks'
                        style={{ height: `${(week.tasksCompleted / maxValue) * 100}%` }}
                      />
                      <View
                        className='week-bar challenges'
                        style={{ height: `${(week.challengesAccepted / maxValue) * 100}%` }}
                      />
                      <View
                        className='week-bar interactions'
                        style={{ height: `${(week.mentorInteractions / maxValue) * 100}%` }}
                      />
                    </View>
                    <Text className='week-label'>{week.week}</Text>
                  </View>
                )
              })}
            </View>
            <View className='chart-legend'>
              <View className='legend-item'>
                <View className='legend-color tasks' />
                <Text className='legend-text'>任务</Text>
              </View>
              <View className='legend-item'>
                <View className='legend-color challenges' />
                <Text className='legend-text'>挑战</Text>
              </View>
              <View className='legend-item'>
                <View className='legend-color interactions' />
                <Text className='legend-text'>互动</Text>
              </View>
            </View>
          </View>
        )}

        {/* 快捷入口 */}
        <View className='section-card'>
          <View className='section-header'>
            <Text className='section-title'>快捷入口</Text>
          </View>
          <View className='quick-actions'>
            <View className='action-item' onClick={() => navigateToDetail('challenges')}>
              <Text className='action-icon'>🎯</Text>
              <Text className='action-text'>成长挑战</Text>
            </View>
            <View className='action-item' onClick={() => navigateToDetail('patterns')}>
              <Text className='action-icon'>🔍</Text>
              <Text className='action-text'>深度模式</Text>
            </View>
            <View className='action-item' onClick={() => navigateToDetail('beliefs')}>
              <Text className='action-icon'>🧠</Text>
              <Text className='action-text'>信念转变</Text>
            </View>
            <View className='action-item' onClick={() => navigateToDetail('tasks')}>
              <Text className='action-icon'>📋</Text>
              <Text className='action-text'>我的任务</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
