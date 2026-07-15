import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './progress.scss'

interface Task {
  id: string
  title: string
  company: string
  status: 'doing' | 'review' | 'overdue' | 'completed'
  progress: number
  currentDay: number
  totalDays: number
  deadline: string
  daysLeft: number
  budget: number
  hasNewMessage?: boolean
  avatar: string
  rating?: number
  completedDate?: string
}

export default function TaskProgressPage() {
  const [activeFilter, setActiveFilter] = useState('all')
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState({
    inProgress: 3,
    completed: 12,
    totalIncome: 4200
  })

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    // TODO: 替换为真实API
    const mockTasks: Task[] = [
      {
        id: '1',
        title: '为青少年AI课程设计视觉化学习路径图',
        company: '晨曦教育科技',
        status: 'doing',
        progress: 28,
        currentDay: 2,
        totalDays: 7,
        deadline: '7月19日',
        daysLeft: 7,
        budget: 800,
        hasNewMessage: true,
        avatar: '晨'
      },
      {
        id: '2',
        title: '梳理社区运营的标准化流程文档',
        company: '未来工坊创业社区',
        status: 'review',
        progress: 100,
        currentDay: 5,
        totalDays: 5,
        deadline: '已提交',
        daysLeft: 0,
        budget: 500,
        hasNewMessage: false,
        avatar: '未'
      },
      {
        id: '3',
        title: '为烘焙店设计社交媒体内容模板',
        company: '晨曦烘焙工作室',
        status: 'overdue',
        progress: 80,
        currentDay: 4,
        totalDays: 5,
        deadline: '明天 23:59',
        daysLeft: 1,
        budget: 600,
        hasNewMessage: false,
        avatar: '晨'
      },
      {
        id: '4',
        title: '为创业团队设计品牌视觉识别系统',
        company: '成功科技',
        status: 'completed',
        progress: 100,
        currentDay: 7,
        totalDays: 7,
        deadline: '7月5日完成',
        daysLeft: 0,
        budget: 1200,
        hasNewMessage: false,
        avatar: '成',
        rating: 4.8,
        completedDate: '7月5日'
      },
      {
        id: '5',
        title: '撰写产品推广文案及社交媒体内容',
        company: '云端科技',
        status: 'completed',
        progress: 100,
        currentDay: 5,
        totalDays: 5,
        deadline: '6月28日完成',
        daysLeft: 0,
        budget: 600,
        hasNewMessage: false,
        avatar: '云',
        rating: 5.0,
        completedDate: '6月28日'
      },
      {
        id: '6',
        title: '设计用户调研问卷及分析报告',
        company: '思维咨询',
        status: 'completed',
        progress: 100,
        currentDay: 4,
        totalDays: 4,
        deadline: '6月20日完成',
        daysLeft: 0,
        budget: 450,
        hasNewMessage: false,
        avatar: '思',
        rating: 4.5,
        completedDate: '6月20日'
      }
    ]
    setTasks(mockTasks)
  }

  const handleBack = () => {
    Taro.navigateBack()
  }

  const handleTaskClick = (taskId: string) => {
    Taro.navigateTo({
      url: `/packageTask/pages/tasks/plan?id=${taskId}`
    })
  }

  const handleMessageClick = (e: any, taskId: string) => {
    e.stopPropagation()
    Taro.navigateTo({
      url: `/packageTask/pages/tasks/messages?id=${taskId}`
    })
  }

  const getFilteredTasks = () => {
    if (activeFilter === 'all') return tasks
    if (activeFilter === 'doing') return tasks.filter(t => t.status === 'doing')
    if (activeFilter === 'review') return tasks.filter(t => t.status === 'review')
    if (activeFilter === 'completed') return tasks.filter(t => t.status === 'completed')
    return tasks
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'doing':
        return { text: '进行中', className: 'status-doing', icon: '●' }
      case 'review':
        return { text: '待审核', className: 'status-review', icon: '◷' }
      case 'overdue':
        return { text: '即将到期', className: 'status-overdue', icon: '⚠' }
      case 'completed':
        return { text: '已完成', className: 'status-done', icon: '✓' }
      default:
        return { text: '', className: '', icon: '' }
    }
  }

  const filteredTasks = getFilteredTasks()

  return (
    <View className="task-progress-page">
      {/* 顶部导航 */}
      <View className="progress-header">
        <View className="header-bg" />
        <View className="header-content">
          <View className="topbar">
            <View className="back-btn" onClick={handleBack}>
              <Text className="back-icon">‹</Text>
            </View>
            <Text className="topbar-title">我的任务</Text>
            <View className="back-btn" style={{ opacity: 0 }} />
          </View>

          {/* 汇总数据 */}
          <View className="stats-grid">
            <View className="stat-box">
              <Text className="stat-value highlight">{stats.inProgress}</Text>
              <Text className="stat-label">进行中</Text>
            </View>
            <View className="stat-box">
              <Text className="stat-value">{stats.completed}</Text>
              <Text className="stat-label">已完成</Text>
            </View>
            <View className="stat-box">
              <Text className="stat-value income">¥{stats.totalIncome}</Text>
              <Text className="stat-label">累计收入</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView scrollY className="progress-scroll">
        <View className="progress-content">
          {/* 筛选标签 */}
          <View className="filter-tabs">
            <View
              className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              <Text>全部</Text>
            </View>
            <View
              className={`filter-tab ${activeFilter === 'doing' ? 'active' : ''}`}
              onClick={() => setActiveFilter('doing')}
            >
              <Text>进行中</Text>
            </View>
            <View
              className={`filter-tab ${activeFilter === 'review' ? 'active' : ''}`}
              onClick={() => setActiveFilter('review')}
            >
              <Text>待审核</Text>
            </View>
            <View
              className={`filter-tab ${activeFilter === 'completed' ? 'active' : ''}`}
              onClick={() => setActiveFilter('completed')}
            >
              <Text>已完成</Text>
            </View>
          </View>

          {/* 任务列表 */}
          <View className="task-list">
            {filteredTasks.map((task) => {
              const statusInfo = getStatusInfo(task.status)
              const borderClass = task.status === 'doing' ? 'border-rust' :
                                 task.status === 'review' ? 'border-golden' :
                                 task.status === 'completed' ? 'border-sage' :
                                 'border-red'

              return (
                <View
                  key={task.id}
                  className={`task-card ${borderClass}`}
                  onClick={() => handleTaskClick(task.id)}
                >
                  <View className="task-card-body">
                    <View className="task-header">
                      <View className="task-avatar">
                        <Text className="avatar-text">{task.avatar}</Text>
                      </View>
                      <View className="task-header-info">
                        <View className="status-row">
                          <View className={`status-badge ${statusInfo.className}`}>
                            <Text className="status-icon">{statusInfo.icon}</Text>
                            <Text className="status-text">{statusInfo.text}</Text>
                          </View>
                          {task.status !== 'completed' && (
                            <Text className="day-info">Day {task.currentDay}/{task.totalDays}</Text>
                          )}
                        </View>
                        <Text className="task-title">{task.title}</Text>
                        <Text className="task-company">{task.company}</Text>
                      </View>
                      <View className="arrow-icon">›</View>
                    </View>

                    {/* 进度条 */}
                    {task.status === 'doing' && (
                      <View className="progress-section">
                        <View className="progress-header-row">
                          <Text className="progress-label">交付进度</Text>
                          <Text className={`deadline-text ${task.daysLeft <= 1 ? 'urgent' : ''}`}>
                            截止 {task.deadline} · 还剩 {task.daysLeft} 天
                          </Text>
                        </View>
                        <View className="progress-bar">
                          <View
                            className="progress-fill"
                            style={{ width: `${task.progress}%` }}
                          />
                        </View>
                      </View>
                    )}

                    {/* 已完成任务评分 */}
                    {task.status === 'completed' && task.rating && (
                      <View className="rating-section">
                        <View className="rating-display">
                          <View className="rating-circle">
                            <Text className="rating-number">{task.rating}</Text>
                          </View>
                          <View className="rating-stars">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <Text
                                key={idx}
                                className={`star ${idx < Math.floor(task.rating || 0) ? 'filled' : 'empty'}`}
                              >
                                ★
                              </Text>
                            ))}
                          </View>
                        </View>
                        <Text className="completed-date-text">{task.completedDate} 完成</Text>
                      </View>
                    )}

                    {/* 底部信息 */}
                    <View className="task-footer">
                      <Text className="budget-text">¥ {task.budget}</Text>
                      <Text className="footer-meta">
                        {task.status === 'completed' ? ' · 已到账' : ' · 完成后到账'}
                      </Text>
                      {task.hasNewMessage && (
                        <View
                          className="message-badge"
                          onClick={(e) => handleMessageClick(e, task.id)}
                        >
                          <View className="message-icon">●</View>
                          <Text className="message-text">1条新消息</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              )
            })}
          </View>

          <View style={{ height: '16rpx' }} />
        </View>
      </ScrollView>
    </View>
  )
}
